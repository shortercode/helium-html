import { Emitter } from './Emitter';

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