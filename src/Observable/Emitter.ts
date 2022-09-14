import { AbstractObservable } from './Observable';
import type { Disposable, Listener } from './Observable.type';

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