import { isDictionary } from 'ts-runtime-typecheck';
import type { Disposable, Listener, Observable, Operator, Subscriber } from './Observable.type';

/**
 * Takes a subscriber and automatically subscribes/disposes based
 * on the 
 */
export abstract class AbstractObservable<T> implements Observable<T>, Disposable {
  abstract watch(next: Listener<T>): Disposable;
  abstract dispose(): void;
  pipe<R> (operator: Operator<T, R>): Observable<R> {
    return operator(this);
  }
 
  map<R> (mapper: (value: T) => R): Observable<R> {
    return  new SimpleObservable(
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

  once(): Promise<T> {
    return new Promise(resolve => {
      const disp = this.watch(value => 
        setTimeout(() => {
          disp.dispose();
          resolve(value);
        }, 0)
      );
    });
  }
}
 
export class SimpleObservable<T> extends AbstractObservable<T> {
  private subscriptions = new Set<Disposable>();
  private closed = false;
  constructor(private subscriber: Subscriber<T>){ super(); }
 
  watch(next: Listener<T>): Disposable {
    if (this.closed) {
      throw new Error('Unable to watch, Observable has been closed.');
    }
    const parent_disposable = this.subscriber(next);
    this.subscriptions.add(parent_disposable);

    let disposed = false;
    const dispose = () => {
      if (disposed) {
        return;
      }
      disposed = true;
      parent_disposable.dispose();
    };

    return { dispose };
  }
  dispose(): void {
    this.closed = true;
    for (const disposer of this.subscriptions) {
      disposer.dispose();
    }
    this.subscriptions.clear();
  }
}

export function is_observable(value: unknown): value is Observable<unknown> {
  return isDictionary(value) && typeof value['watch'] === 'function';
}