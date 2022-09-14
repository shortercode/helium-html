import { SimpleObservable } from './Observable';
import type { Disposable, FoundationObservable, Listener, Operator } from './Observable.type';

export function filter<T, R extends T> (predicate: (value: T) => value is R): Operator<T, R>;
export function filter<T> (predicate: (value: T) => boolean): Operator<T>;
export function filter<T> (predicate: (value: T) => boolean): Operator<T> {
  return source => new SimpleObservable(
    listener => source.watch(value => {
      if (predicate(value)) {
        listener(value);	
      }
    })
  );
}

export function map<T,R>(mapper: (value: T) => R): Operator<T, R> {
  return source => new SimpleObservable(
    listener => source.watch(
      value => listener(mapper(value))
    )
  );
}

export function distinct<T> (predicate: (a: T, b: T) => boolean = (a, b) => a === b): Operator<T> {
  return source => new SimpleObservable(
    listener => {
      const hold: { value?: T } = {};
      return source.watch(value => {
        if ('value' in hold) {
          if (!predicate(hold.value, value)) {
            hold.value = value;
            listener(value);	
          }
        } else {
          hold.value = value;
          listener(value);
        }
      });
    }
  );
}

export function until<T> (signal: FoundationObservable<unknown>): Operator<T> {
  return source => new SimpleObservable(
    listener => {
      const disposer_source = source.watch(listener);
      const disposer_signal = signal.watch(() => {
        dispose();
      });
      const dispose = () => {
        disposer_source.dispose();
        disposer_signal.dispose();
      };
      return { dispose };
    }
  );
}

export function take<T> (count: number): Operator<T> {
  return source => new SimpleObservable(
    listener => {
      let counter = 0;
      const disposer = source.watch(value => {
        counter += 1;
        if (counter > count) {
          disposer.dispose();
          return;
        }
        listener(value);
      });
      return disposer;
    }
  );
}

export function tap<T> (tap: Listener<T>): Operator<T> {
  return source => new SimpleObservable(
    listener => source.watch(
      value => {
        tap(value);
        listener(value);
      }
    )
  );
}

export function combine<T1, T2> (additional: FoundationObservable<T2>): Operator<T1, [T1, T2]> {
  return source => new SimpleObservable(
    listener => {
      const hold: { value1?: T1, value2?: T2 } = {};
      const disposer_additional = additional.watch(value2 => {
        // NOTE we don't trigger updates based on the secondary subscription
        // but in the situation at the start of the subscription where additional
        // hasnt emitted a value but source has we should trigger the listener
        const secondary_exists = 'value2' in hold;
        hold.value2 = value2;

        if ('value1' in hold && !secondary_exists) {
          listener([hold.value1, value2]);
        }
      });
      const disposer_source = source.watch(value1 => {
        // NOTE source will _always_ trigger an update, provided additional has
        // emitted a value at least once
        hold.value1 = value1;
        if ('value2' in hold) {
          listener([value1, hold.value2]);
        }
      });

      const dispose = () => {
        disposer_source.dispose();
        disposer_additional.dispose();
      };
      return { dispose };
    }
  );
}

export function share<T> (): Operator<T> {
  return source => {
    const listeners = new Set<Listener<T>>();
    let core_disposer: Disposable | null = null;

    const last: { value?: T } = {};
    function emit (val: T) {
      last.value = val;
      for (const listener of listeners) {
        listener(val);
      }
    }

    return new SimpleObservable(
      listener => {
        listeners.add(listener);
        if (core_disposer === null) {
          core_disposer = source.watch(emit);
        }
        else if ('value' in last) {
          listener(last.value);
        }
        const dispose = () => {
          listeners.delete(listener);
          if (listeners.size === 0 && core_disposer) {
            core_disposer.dispose();
            core_disposer = null;
          }
        };
        return { dispose };
      }
    );
  };
}