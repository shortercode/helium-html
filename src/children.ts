import type { Observable } from './Observable.type';

export function children<T, R extends ChildNode> (source: Observable<Iterable<T>>, transform: (value: T) => R, identity: (value: T, index: number) => unknown = (a) => a) {
  let old_cache = new Map<unknown, R>();
  return source.map((elements: Iterable<T>) => {
    const new_cache = new Map<unknown, R>();

    const nodes = Array.from(elements).map((item, index) => {
      const id = identity(item, index);
      const result = old_cache.get(id) ?? transform(item);
      if (new_cache.has(id)) {
        // HACK forces template literal stringify for `id`
        throw new Error(`Duplicate entry with ID ${id as string} at index ${index}`);
      }
      new_cache.set(id, result);
      return result;
    });

    old_cache = new_cache;

    return nodes;
  });
}