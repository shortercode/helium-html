import { SimpleObservable } from './Observable';
import type { Operator } from './Observable.type';

export function map<T, R> (mapper: (value: T) => R): Operator<T, R> {
	return source => new SimpleObservable(
		listener => source.watch(
			value => listener(mapper(value))
		)
	);
}

export function filter<T, R extends T> (predicate: (value: T) => value is R): Operator<T, R>;
export function filter<T> (predicate: (value: T) => boolean): Operator<T> {
	return source => new SimpleObservable(
		listener => source.watch(value => {
			if (predicate(value)) {
				listener(value);	
			}
		})
	);
}

export function distinct<T> (predicate: (a: T, b: T) => boolean = (a, b) => a === b): Operator<T> {
	return source => new SimpleObservable(
		listener => {
			const hold: { value?: T } = {};
			return source.watch(value => {
				if ('value' in hold && !predicate(hold.value, value)) {
					hold.value = value;
					listener(value);	
				}
			});
		}
	);
}

export function view<T, K extends keyof T> (key: K): Operator<T, T[K]> {
	return source => new SimpleObservable(
		listener => source.watch(
			value => listener(value[key])
		)
	);
}
