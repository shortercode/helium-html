export interface FoundationObservable<T> {
  watch(next: Listener<T>): Disposable;
}

export interface Observable<T> extends FoundationObservable<T> {
  pipe<R> (operator: Operator<T, R>): Observable<R>;
  map<R> (mapper: (value: T) => R): Observable<R>;
  filter<R extends T> (predicate: (value: T) => value is R): Observable<R>;
  filter(predicate: (value: T) => boolean): Observable<T>;
}

export interface Disposable {
  dispose(): void;
}

export type Listener<T> = (value: T) => void;
export type Subscriber<T> = (listener: Listener<T>) => Disposable;
export type Operator<T, R = T> = (source: FoundationObservable<T>) => Observable<R>;