export interface Observable<T> {
	watch(next: Listener<T>): Disposable;
	pipe<R> (operator: Operator<T, R>): Observable<R>;
}

export interface Disposable {
	dispose(): void;
}

export type Listener<T> = (value: T) => void;
export type Subscriber<T> = (listener: Listener<T>) => Disposable;
export type Operator<T, R = T> = (source: Observable<T>) => Observable<R>;