import { isDictionary } from 'ts-runtime-typecheck';
import type { Listener, Observable, Disposable, Operator, Subscriber } from './Observable.type';

abstract class Pipe<T> implements Observable<T> {
	abstract watch(next: Listener<T>): Disposable;
	pipe<R> (operator: Operator<T, R>): Observable<R> {
		return operator(this);
	}
}

export class SimpleObservable<T> extends Pipe<T> {
	constructor(public watch: Subscriber<T>){ super(); }
}

export class Emitter<T> extends Pipe<T> {
	private listeners = new Set<Listener<T>>();
	get inactive (): boolean { 
		return this.listeners.size === 0;
	}
	watch(listener: Listener<T>): Disposable {
		this.listeners.add(listener);
		const dispose = () => this.listeners.delete(listener);
		return { dispose };	
	}
	emit(value: T) {
		for (const listener of this.listeners) {
			listener(value);
		}
	}
}

export class Store<T> extends Pipe<T> {
	private emitter = new Emitter<T>();
	constructor(private value: T) { super(); }

	watch(next: Listener<T>): Disposable {
		const disposer = this.emitter.watch(next);
		next(this.value);
		return disposer;
	}
	update(value: T) {
		this.value = value;
		this.emitter.emit(value);
	}
}

export function is_observable(value: unknown): value is Observable<unknown> {
	return isDictionary(value) && typeof value['watch'] === 'function';
}