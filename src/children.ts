import type { Observable } from './Observable.type';
import { map } from './operators';

export function children<T, R extends ChildNode> (store: Observable<Iterable<T>>, key: (value: T) => unknown, transform: (value: T) => R) {
	const cache = new Map<unknown, R>();
	return store.pipe(
		map((elements: Iterable<T>) => 
			Array.from(elements).map(item => {
				const id = key(item);
				if (cache.has(id)) {
					return cache.get(id);
				}
				const result = transform(item);
				cache.set(id, result);
				return result;
			})
		)
	);
}