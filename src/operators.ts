import { SimpleObservable } from './Observable';
import type { Operator } from './Observable.type';

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