import { Store } from './Store';

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