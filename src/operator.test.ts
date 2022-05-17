import { Emitter } from './Observable';
import { distinct } from './operators';

describe('distinct', () => {
  test('default equality', () => {
    const emitter = new Emitter<number>();
    const values: number[] = []; 

    emitter.pipe(distinct()).watch(v => values.push(v));

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
  test('custom equality', () => {
    const emitter = new Emitter<number>();
    const values: number[] = []; 

    // eslint-disable-next-line @typescript-eslint/naming-convention
    emitter.pipe(distinct((_old, v) => values.includes(v))).watch(v => values.push(v));

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
  });
});