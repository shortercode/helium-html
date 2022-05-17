export interface Ref<T> {
  deref(): T | undefined;
  clear?(): void;
}

let use_weak_ref = typeof WeakRef == 'function';

export function set_use_weak_ref(state: boolean) {
  use_weak_ref = state;
}

export class StrongRef<T extends object> {
  private value?: T;
  constructor(value: T) {
    this.value = value;
  }
  deref() {
    return this.value;
  }
  clear() {
    delete this.value;
  }
}

export function create_ref<T extends object> (value: T): Ref<T> {
  return use_weak_ref ? new WeakRef<T>(value) : new StrongRef<T>(value); 
}