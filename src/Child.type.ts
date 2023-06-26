import type { Nullish, Primitive } from 'ts-runtime-typecheck';
import type { Observable } from './Observable/Observable.type';

type BasicValue = Nullish | Primitive | EventListener | Nodelike;

export type Nodelike = ChildNode | DocumentFragment;
export type StaticValue = BasicValue | BasicValue[];
export type DynamicValue = Observable<StaticValue>;
export type ListValue = (StaticValue | DynamicValue)[];

export type Value = StaticValue | DynamicValue | ListValue;