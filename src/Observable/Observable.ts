import { isDictionary } from 'ts-runtime-typecheck';
import type { Listener, Observable, Disposable, Operator, Subscriber } from './Observable.type';

export abstract class AbstractObservable<T> implements Observable<T>, Disposable {
  abstract watch(next: Listener<T>): Disposable;
  abstract dispose(): void;
  pipe<R> (operator: Operator<T, R>): Observable<R> {
    return operator(this);
  }

  map<R> (mapper: (value: T) => R): Observable<R> {
    return new SimpleObservable(
      listener => this.watch(
        value => listener(mapper(value))
      )
    );
  }
  
  filter<R extends T> (predicate: (value: T) => value is R): Observable<R>;
  filter(predicate: (value: T) => boolean): Observable<T>;
  filter(predicate: (value: T) => boolean): Observable<T> {
    return new SimpleObservable(
      listener => this.watch(value => {
        if (predicate(value)) {
          listener(value);	
        }
      })
    );
  }

  view<K extends keyof T> (key: K): Observable<T[K]> {
    return new SimpleObservable(
      listener => this.watch(
        value => listener(value[key])
      )
    );
  }
}

export class SimpleObservable<T> extends AbstractObservable<T> {
  private subscriptions = new Set<() => void>();
  private closed = false; 
  constructor(private subscriber: Subscriber<T>){ super(); }

  watch(next: Listener<T>): Disposable {
    if (this.closed) {
      throw new Error('Unable to watch, Observable has been closed.');
    }
    const inner_dispose = this.subscriber(next);
    const dispose = () => {
      const removed = this.subscriptions.delete(dispose);
      if (removed) {
        inner_dispose.dispose();
      }
    };
    this.subscriptions.add(dispose);
    return { dispose };
  }
  dispose(): void {
    for (const sub of this.subscriptions) {
      sub();
    }
    this.subscriptions.clear();
    this.closed = true;
  }
}

export class Emitter<T> extends AbstractObservable<T> {
  private listeners = new Set<Listener<T>>();
  get inactive (): boolean { 
    return this.listeners.size === 0;
  }
  dispose(): void {
    this.listeners.clear();
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

export class Store<T> extends AbstractObservable<T> {
  private emitter = new Emitter<T>();
  constructor(private value: T) { super(); }
  dispose(): void {
    this.emitter.dispose();
  }
  watch(next: Listener<T>): Disposable {
    const disposer = this.emitter.watch(next);
    next(this.value);
    return disposer;
  }
  update(value: T): void {
    this.value = value;
    this.emitter.emit(value);
  }
  modify(updater: (value: T) => T) {
    this.value = updater(this.value);
    this.emitter.emit(this.value);
  }
}

export function is_observable(value: unknown): value is Observable<unknown> {
  return isDictionary(value) && typeof value['watch'] === 'function';
}