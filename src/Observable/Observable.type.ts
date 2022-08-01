export interface Observable<T> {
  watch(next: Listener<T>): Disposable;
  pipe<R> (operator: Operator<T, R>): Observable<R>;
  map<R> (mapper: (value: T) => R): Observable<R>;
  filter<R extends T> (predicate: (value: T) => value is R): Observable<R>;
  filter(predicate: (value: T) => boolean): Observable<T>;
  view<K extends keyof T> (key: K): Observable<T[K]>
}

export interface Disposable {
  dispose(): void;
}

export type Listener<T> = (value: T) => void;
export type Subscriber<T> = (listener: Listener<T>) => Disposable;
export type Operator<T, R = T> = (source: Observable<T>) => Observable<R>;