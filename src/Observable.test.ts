import { Index, isString } from 'ts-runtime-typecheck';
import { Emitter, is_observable, SimpleObservable, Store } from './Observable/Observable';
import type { Operator } from './Observable/Observable.type';

describe('SimpleObservable', () => {
  test('listeners passed to watch are called', () => {
    const listener_stub = jest.fn();

    const observable = new SimpleObservable<null>(listener => {
      listener(null);
      return { dispose: () => null };
    });

    observable.watch(listener_stub);

    expect(listener_stub).toBeCalledWith(null);
  });

  test('disposing a subscription removes it', () => {
    const dispose_stub = jest.fn();

    const observable = new SimpleObservable<null>(() => {
      return { dispose: dispose_stub };
    });

    const disposable = observable.watch(() => null);

    disposable.dispose();

    expect(dispose_stub).toBeCalled();
  });

  test('disposing a subscription a second time does nothing', () => {
    const dispose_stub = jest.fn();

    const observable = new SimpleObservable<null>(() => {
      return { dispose: dispose_stub };
    });

    const disposable = observable.watch(() => null);

    disposable.dispose();
    disposable.dispose();

    expect(dispose_stub).toBeCalledTimes(1);
  });

  test('disposing the observable removes disposes all subscriptions', () => {
    const dispose_stub = jest.fn();

    const observable = new SimpleObservable<null>(() => {
      return { dispose: dispose_stub };
    });

    observable.watch(() => null);

    observable.dispose();

    expect(dispose_stub).toBeCalled();
  });

  test('watching after disposing the observable throws an error', () => {
    const observable = new SimpleObservable<null>(() => {
      return { dispose: () => null };
    });

    observable.dispose();

    expect(() => observable.watch(() => null)).toThrow('Unable to watch, Observable has been closed.');
  });

  test('subscriber is called for each watch call', () => {
    const subscriber = jest.fn();
    const observable = new SimpleObservable(subscriber);

    observable.watch(() => null);

    expect(subscriber).toBeCalledTimes(1);

    observable.watch(() => null);

    expect(subscriber).toBeCalledTimes(2);
  });
});

describe('AbstractObservable', () => {
  test('map transforms a value', () => {
    const emitter = new Emitter<number>();
    const values: number[] = [];
    
    emitter.watch(v => values.push(v));
    emitter.map(v => v * 2).watch(v => values.push(v));

    expect(values).toStrictEqual([]);

    emitter.emit(1);

    expect(values).toStrictEqual([1, 2]);

    emitter.emit(2);

    expect(values).toStrictEqual([1, 2, 2, 4]);

    emitter.emit(3);

    expect(values).toStrictEqual([1, 2, 2, 4, 3, 6]);
  });

  test('filter omits values that fail the predicate', () => {
    const emitter = new Emitter<number>();
    const values: number[] = [];
    
    emitter.watch(v => values.push(v));
    emitter.filter(v => (v % 2 === 0)).watch(v => values.push(v));

    expect(values).toStrictEqual([]);

    emitter.emit(1);

    expect(values).toStrictEqual([1]);

    emitter.emit(2);

    expect(values).toStrictEqual([1, 2, 2]);

    emitter.emit(3);

    expect(values).toStrictEqual([1, 2, 2, 3]);

    emitter.emit(4);

    expect(values).toStrictEqual([1, 2, 2, 3, 4, 4]);
  });

  test('filter omits values that fail the predicate and can be used to filter types', () => {
    const emitter = new Emitter<Index>();
    const values: Index[] = [];
    
    emitter.watch(v => values.push(v));
    emitter.filter(isString).watch((v: string) => values.push(v));

    expect(values).toStrictEqual([]);

    emitter.emit(1);

    expect(values).toStrictEqual([1]);

    emitter.emit('2');

    expect(values).toStrictEqual([1, '2', '2']);

    emitter.emit(3);

    expect(values).toStrictEqual([1, '2', '2', 3]);

    emitter.emit('4');

    expect(values).toStrictEqual([1, '2', '2', 3, '4', '4']);
  });

  test('view extracts a member of a record', () => {
    interface Fruit {
      name: string;
      sweetness: number;
    }
    const emitter = new Emitter<Fruit>();
    const values: string[] = [];

    emitter.view('name').watch(v => values.push(v));

    expect(values).toStrictEqual([]);

    emitter.emit({ name: 'Lemon', sweetness: 0 });

    expect(values).toStrictEqual([ 'Lemon' ]);

    emitter.emit({ name: 'Strawberry', sweetness: 5 });

    expect(values).toStrictEqual([ 'Lemon', 'Strawberry' ]);
  });

  test('pipe accepts an operator', () => {
    const distinct: Operator<number> = source => new SimpleObservable(
      listener => {
        let previous: number | null = null;
        return source.watch(value => {
          if (previous !== value) {
            previous = value;
            listener(value);	
          }
        });
      }
    );

    const emitter = new Emitter<number>();
    const values: number[] = []; 

    emitter.pipe(distinct).watch(v => values.push(v));

    expect(values).toStrictEqual([]);

    emitter.emit(0);

    expect(values).toStrictEqual([0]);

    emitter.emit(0);

    expect(values).toStrictEqual([0]);

    emitter.emit(1);

    expect(values).toStrictEqual([0, 1]);

    emitter.emit(0);

    expect(values).toStrictEqual([0, 1, 0]);
  });
});

test('Emitter', () => {
  const values: string[] = [];
  const emitter = new Emitter<string>();
  const new_watcher = (id: string) => (value: string) => values.push(`${id}:${value}`);

  expect(emitter.inactive).toBe(true);

  const disposer_a = emitter.watch(new_watcher('a'));

  expect(emitter.inactive).toBe(false);
  expect(values).toStrictEqual([]);

  emitter.emit('1');

  expect(emitter.inactive).toBe(false);
  expect(values).toStrictEqual(['a:1']);

  emitter.watch(new_watcher('b'));

  expect(emitter.inactive).toBe(false);
  expect(values).toStrictEqual(['a:1']);

  emitter.emit('2');

  expect(emitter.inactive).toBe(false);
  expect(values).toStrictEqual(['a:1','a:2', 'b:2']);

  disposer_a.dispose();

  expect(emitter.inactive).toBe(false);
  expect(values).toStrictEqual(['a:1','a:2', 'b:2']);

  emitter.emit('3');

  expect(emitter.inactive).toBe(false);
  expect(values).toStrictEqual(['a:1','a:2', 'b:2', 'b:3']);

  emitter.dispose();

  expect(emitter.inactive).toBe(true);
  expect(values).toStrictEqual(['a:1','a:2', 'b:2', 'b:3']);

  emitter.emit('4');

  expect(emitter.inactive).toBe(true);
  expect(values).toStrictEqual(['a:1','a:2', 'b:2', 'b:3']);
});

test('Store', () => {
  const values: string[] = [];
  const store = new Store('0');
  const new_watcher = (id: string) => (value: string) => values.push(`${id}:${value}`);

  const disposer_a = store.watch(new_watcher('a'));

  expect(values).toStrictEqual(['a:0']);

  store.update('1');

  expect(values).toStrictEqual(['a:0', 'a:1']);

  store.watch(new_watcher('b'));

  expect(values).toStrictEqual(['a:0', 'a:1', 'b:1']);

  store.update('2');

  expect(values).toStrictEqual(['a:0', 'a:1', 'b:1', 'a:2', 'b:2']);

  store.modify(v => `${parseInt(v, 10) + 1}`);

  expect(values).toStrictEqual(['a:0', 'a:1', 'b:1', 'a:2', 'b:2', 'a:3', 'b:3']);

  disposer_a.dispose();

  expect(values).toStrictEqual(['a:0', 'a:1', 'b:1', 'a:2', 'b:2', 'a:3', 'b:3']);

  store.update('4');

  expect(values).toStrictEqual(['a:0', 'a:1', 'b:1', 'a:2', 'b:2', 'a:3', 'b:3', 'b:4']);

  store.dispose();

  expect(values).toStrictEqual(['a:0', 'a:1', 'b:1', 'a:2', 'b:2', 'a:3', 'b:3', 'b:4']);

  store.update('5');

  expect(values).toStrictEqual(['a:0', 'a:1', 'b:1', 'a:2', 'b:2', 'a:3', 'b:3', 'b:4']);
});

describe('is_observable', () => {
  test('Store is observable', () => {
    const store = new Store(null);
    expect(is_observable(store)).toBe(true);
  });
  test('Emitter is observable', () => {
    const emitter = new Emitter();
    expect(is_observable(emitter)).toBe(true);
  });
  test('SimpleObservable is observable', () => {
    const observable = new SimpleObservable(() => ({
      dispose () {
        // nothing to do
      }
    }));
    expect(is_observable(observable)).toBe(true);
  });
  test('empty object is not observable', () => {
    expect(is_observable({})).toBe(false);
  });
});