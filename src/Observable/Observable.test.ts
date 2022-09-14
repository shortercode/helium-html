import { Index, isString } from 'ts-runtime-typecheck';
import { Emitter } from './Emitter';
import { is_observable } from './Observable';
import { SimpleObservable } from './Observable';
import type { Operator } from './Observable.type';
import { Store } from './Store';

describe('SimpleObservable', () => {
  test('listeners passed to watch are called', () => {
    const listener_stub = jest.fn();

    const observable = new SimpleObservable<null>(listener => {
      listener(null);
      return { dispose: () => null };
    });

    observable.watch(listener_stub);

    expect(listener_stub).toBeCalledWith(null);
  });

  test('disposing a subscription removes it', () => {
    const dispose_stub = jest.fn();

    const observable = new SimpleObservable<null>(() => {
      return { dispose: dispose_stub };
    });

    const disposable = observable.watch(() => null);

    disposable.dispose();

    expect(dispose_stub).toBeCalled();
  });

  test('disposing a subscription a second time does nothing', () => {
    const dispose_stub = jest.fn();

    const observable = new SimpleObservable<null>(() => {
      return { dispose: dispose_stub };
    });

    const disposable = observable.watch(() => null);

    disposable.dispose();
    disposable.dispose();

    expect(dispose_stub).toBeCalledTimes(1);
  });

  test('disposing the observable removes disposes all subscriptions', () => {
    const dispose_stub = jest.fn();

    const observable = new SimpleObservable<null>(() => {
      return { dispose: dispose_stub };
    });

    observable.watch(() => null);

    observable.dispose();

    expect(dispose_stub).toBeCalled();
  });

  test('watching after disposing the observable throws an error', () => {
    const observable = new SimpleObservable<null>(() => {
      return { dispose: () => null };
    });

    observable.dispose();

    expect(() => observable.watch(() => null)).toThrow('Unable to watch, Observable has been closed.');
  });

  test('subscriber is called for each watch call', () => {
    const subscriber = jest.fn();
    const observable = new SimpleObservable(subscriber);

    observable.watch(() => null);

    expect(subscriber).toBeCalledTimes(1);

    observable.watch(() => null);

    expect(subscriber).toBeCalledTimes(2);
  });
});

describe('AbstractObservable', () => {
  test('map transforms a value', () => {
    const emitter = new Emitter<number>();
    const values: number[] = [];
    
    emitter.watch(v => values.push(v));
    emitter.map(v => v * 2).watch(v => values.push(v));

    expect(values).toStrictEqual([]);

    emitter.emit(1);

    expect(values).toStrictEqual([1, 2]);

    emitter.emit(2);

    expect(values).toStrictEqual([1, 2, 2, 4]);

    emitter.emit(3);

    expect(values).toStrictEqual([1, 2, 2, 4, 3, 6]);
  });

  test('filter omits values that fail the predicate', () => {
    const emitter = new Emitter<number>();
    const values: number[] = [];
    
    emitter.watch(v => values.push(v));
    emitter.filter(v => (v % 2 === 0)).watch(v => values.push(v));

    expect(values).toStrictEqual([]);

    emitter.emit(1);

    expect(values).toStrictEqual([1]);

    emitter.emit(2);

    expect(values).toStrictEqual([1, 2, 2]);

    emitter.emit(3);

    expect(values).toStrictEqual([1, 2, 2, 3]);

    emitter.emit(4);

    expect(values).toStrictEqual([1, 2, 2, 3, 4, 4]);
  });

  test('filter omits values that fail the predicate and can be used to filter types', () => {
    const emitter = new Emitter<Index>();
    const values: Index[] = [];
    
    emitter.watch(v => values.push(v));
    emitter.filter(isString).watch((v: string) => values.push(v));

    expect(values).toStrictEqual([]);

    emitter.emit(1);

    expect(values).toStrictEqual([1]);

    emitter.emit('2');

    expect(values).toStrictEqual([1, '2', '2']);

    emitter.emit(3);

    expect(values).toStrictEqual([1, '2', '2', 3]);

    emitter.emit('4');

    expect(values).toStrictEqual([1, '2', '2', 3, '4', '4']);
  });

  test('pipe accepts an operator', () => {
    const distinct: Operator<number> = source => new SimpleObservable(
      listener => {
        let previous: number | null = null;
        return source.watch(value => {
          if (previous !== value) {
            previous = value;
            listener(value);	
          }
        });
      }
    );

    const emitter = new Emitter<number>();
    const values: number[] = []; 

    emitter.pipe(distinct).watch(v => values.push(v));

    expect(values).toStrictEqual([]);

    emitter.emit(0);

    expect(values).toStrictEqual([0]);

    emitter.emit(0);

    expect(values).toStrictEqual([0]);

    emitter.emit(1);

    expect(values).toStrictEqual([0, 1]);

    emitter.emit(0);

    expect(values).toStrictEqual([0, 1, 0]);
  });

  test('once emits a single value', async () => {
    const store = new Store(42);

    expect(await store.once()).toBe(42);
    
    expect(await store.once()).toBe(42);
  });
});

describe('is_observable', () => {
  test('Store is observable', () => {
    const store = new Store(null);
    expect(is_observable(store)).toBe(true);
  });
  test('Emitter is observable', () => {
    const emitter = new Emitter();
    expect(is_observable(emitter)).toBe(true);
  });
  test('SimpleObservable is observable', () => {
    const observable = new SimpleObservable(() => ({
      dispose () {
        // nothing to do
      }
    }));
    expect(is_observable(observable)).toBe(true);
  });
  test('empty object is not observable', () => {
    expect(is_observable({})).toBe(false);
  });
});