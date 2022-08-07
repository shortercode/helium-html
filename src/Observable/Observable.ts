import { isDictionary } from 'ts-runtime-typecheck';
import { AbstractObservable } from './AbstractObservable';
import type { Listener, Observable, Disposable, Subscriber } from './Observable.type';

/**
 * Takes a subscriber and automatically subscribes/disposes based
 * on the 
 */
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