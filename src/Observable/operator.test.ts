import { Index, isString } from 'ts-runtime-typecheck';
import { Emitter } from './Emitter';
import { SimpleObservable } from './Observable';
import { distinct, filter, map, until, take, tap, combine, share } from './operators';

describe('distinct', () => {
  test('default equality', () => {
    const emitter = new Emitter<number>();
    const values: number[] = []; 

    const disp = emitter.pipe(distinct()).watch(v => values.push(v));

    expect(values).toStrictEqual([]);

    emitter.emit(0);

    expect(values).toStrictEqual([0]);

    emitter.emit(0);

    expect(values).toStrictEqual([0]);

    emitter.emit(1);

    expect(values).toStrictEqual([0, 1]);

    emitter.emit(0);

    expect(values).toStrictEqual([0, 1, 0]);

    disp.dispose();

    emitter.emit(1);

    expect(values).toStrictEqual([0, 1, 0]);
  });
  test('custom equality', () => {
    const emitter = new Emitter<number>();
    const values: number[] = []; 

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const disp = emitter.pipe(distinct((_old, v) => values.includes(v))).watch(v => values.push(v));

    expect(values).toStrictEqual([]);

    emitter.emit(0);

    expect(values).toStrictEqual([0]);

    emitter.emit(0);

    expect(values).toStrictEqual([0]);

    emitter.emit(1);

    expect(values).toStrictEqual([0, 1]);

    emitter.emit(0);

    expect(values).toStrictEqual([0, 1]);

    emitter.emit(2);

    expect(values).toStrictEqual([0, 1, 2]);

    values.pop();

    emitter.emit(2);

    expect(values).toStrictEqual([0, 1, 2]);

    disp.dispose();

    emitter.emit(3);
  
    expect(values).toStrictEqual([0, 1, 2]);
  });
});

test('filter omits values that fail the predicate', () => {
  const emitter = new Emitter<number>();
  const values: number[] = [];
    
  const disp_a = emitter.watch(v => values.push(v));
  const disp_b = emitter.pipe(filter(v => (v % 2 === 0))).watch(v => values.push(v));

  expect(values).toStrictEqual([]);

  emitter.emit(1);

  expect(values).toStrictEqual([1]);

  emitter.emit(2);

  expect(values).toStrictEqual([1, 2, 2]);

  emitter.emit(3);

  expect(values).toStrictEqual([1, 2, 2, 3]);

  emitter.emit(4);

  expect(values).toStrictEqual([1, 2, 2, 3, 4, 4]);

  disp_a.dispose();
  emitter.emit(5);
  emitter.emit(6);

  expect(values).toStrictEqual([1, 2, 2, 3, 4, 4, 6]);

  disp_b.dispose();
  emitter.emit(7);
  emitter.emit(8);

  expect(values).toStrictEqual([1, 2, 2, 3, 4, 4, 6]);
});

test('filter omits values that fail the predicate and can be used to filter types', () => {
  const emitter = new Emitter<Index>();
  const values: Index[] = [];
  
  const disp_a = emitter.watch(v => values.push(v));
  const disp_b = emitter.pipe(filter(isString)).watch((v: string) => values.push(v));

  expect(values).toStrictEqual([]);

  emitter.emit(1);

  expect(values).toStrictEqual([1]);

  emitter.emit('2');

  expect(values).toStrictEqual([1, '2', '2']);

  emitter.emit(3);

  expect(values).toStrictEqual([1, '2', '2', 3]);

  emitter.emit('4');

  expect(values).toStrictEqual([1, '2', '2', 3, '4', '4']);

  disp_a.dispose();
  disp_b.dispose();

  emitter.emit(1);
  emitter.emit('1');

  expect(values).toStrictEqual([1, '2', '2', 3, '4', '4']);
});

test('map transforms a value', () => {
  const emitter = new Emitter<number>();
  const values: number[] = [];
  
  const disp_a = emitter.watch(v => values.push(v));
  const disp_b = emitter.pipe(map(v => v * 2)).watch(v => values.push(v));

  expect(values).toStrictEqual([]);

  emitter.emit(1);

  expect(values).toStrictEqual([1, 2]);

  emitter.emit(2);

  expect(values).toStrictEqual([1, 2, 2, 4]);

  emitter.emit(3);

  expect(values).toStrictEqual([1, 2, 2, 4, 3, 6]);

  disp_a.dispose();
  disp_b.dispose();

  emitter.emit(4);

  expect(values).toStrictEqual([1, 2, 2, 4, 3, 6]);
});

test('until unsubscribes when the signal is emitted', () => {
  const source = new Emitter<number>();
  const destroy = new Emitter<void>();
  const values: number[] = [];

  source.pipe(until(destroy)).watch(value => values.push(value));

  expect(values).toStrictEqual([]);

  source.emit(1);

  expect(values).toStrictEqual([1]);

  destroy.emit();
  source.emit(2);

  expect(values).toStrictEqual([1]);
});

test('test disposing subscription when using destroy signal', () => {
  const source = new Emitter<number>();
  const destroy = new Emitter<void>();
  const values: number[] = [];

  const disp = source.pipe(until(destroy)).watch(value => values.push(value));

  expect(values).toStrictEqual([]);

  disp.dispose();

  source.emit(1);

  expect(values).toStrictEqual([]);
});

test('take unsubscribes once limit has been reached', () => {
  const source = new Emitter<number>();
  const values: number[] = [];

  source.pipe(take(3)).watch(value => values.push(value));

  expect(values).toStrictEqual([]);

  source.emit(1);

  expect(values).toStrictEqual([1]);

  source.emit(2);
  source.emit(3);
  source.emit(4);

  expect(values).toStrictEqual([1,2,3]);
});

test('test disposing subscription when using take operator', () => {
  const source = new Emitter<number>();
  const values: number[] = [];

  const disp = source.pipe(take(3)).watch(value => values.push(value));

  expect(values).toStrictEqual([]);

  source.emit(1);

  expect(values).toStrictEqual([1]);

  disp.dispose();

  source.emit(2);

  expect(values).toStrictEqual([1]);
});

test('tap is called for each value, but does not modify the output', () => {
  const emitter = new Emitter<number>();
  const values: number[] = [];
  
  const disp = emitter.pipe(tap(v => {
    const vv = v * v;
    values.push(vv);
    return vv;
  })).watch(v => values.push(v));

  expect(values).toStrictEqual([]);

  emitter.emit(1);

  expect(values).toStrictEqual([1, 1]);

  emitter.emit(2);

  expect(values).toStrictEqual([1, 1, 4, 2]);

  emitter.emit(3);

  expect(values).toStrictEqual([1, 1, 4, 2, 9, 3]);

  disp.dispose();

  emitter.emit(4);

  expect(values).toStrictEqual([1, 1, 4, 2, 9, 3]);
});

test('combine', () => {
  const source = new Emitter<number>();
  const other = new Emitter<string>();

  const values: [number, string][] = [];

  const disp = source.pipe(combine(other)).watch(val => {
    values.push(val);
  });

  source.emit(10);

  expect(values).toStrictEqual([]);

  other.emit('10');

  expect(values).toStrictEqual([ [10, '10'] ]);

  source.emit(20);

  expect(values).toStrictEqual([ [10, '10'], [20, '10'] ]);

  other.emit('20');

  expect(values).toStrictEqual([ [10, '10'], [20, '10'] ]);

  disp.dispose();

  source.emit(30);

  expect(values).toStrictEqual([ [10, '10'], [20, '10'] ]);
});

test('share', () => {
  let count = 0;
  const values: number[] = [];
  const source = new SimpleObservable<number>(listener => {
    listener(++count);
    return { dispose() {
      // de nada
    } };
  }).pipe(share());

  const disp_a = source.watch(value => values.push(value));

  expect(values).toStrictEqual([1]);

  const disp_b = source.watch(value => values.push(value));

  expect(values).toStrictEqual([1, 1]);

  const disp_c = source.watch(value => values.push(value));

  expect(values).toStrictEqual([1, 1, 1]);

  disp_a.dispose();
  disp_b.dispose();
  disp_c.dispose();

  source.watch(value => values.push(value));

  expect(values).toStrictEqual([1, 1, 1, 2]);
});