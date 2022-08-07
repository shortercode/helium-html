import { SimpleObservable } from "./Observable";
import type { Disposable, Listener, Observable, Operator } from "./Observable.type";

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
  }