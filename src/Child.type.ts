import type { Nullish, Primitive } from 'ts-runtime-typecheck';
import type { Observable } from './Observable.type';

// TODO rename some of these...
export type SimplePart = Nullish | Primitive | EventListener | ChildNode | DocumentFragment;
export type Part = SimplePart | Array<SimplePart>;
export type ObservableOrPart = SimplePart | Observable<Part> | Array<SimplePart | Observable<Part>>;
