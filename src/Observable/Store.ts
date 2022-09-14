import { AbstractObservable } from './Observable';
import { Emitter } from './Emitter';
import type { Disposable, Listener } from './Observable.type';

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