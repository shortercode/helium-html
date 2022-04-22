import { zip } from './zip';

test('zip', () => {
	expect([...zip([1, 2, 3], ['a', 'b', 'c'])]).toEqual([
		[1, 'a'],
		[2, 'b'],
		[3, 'c']
	]);

	expect([...zip([1], ['a', 'b', 'c'])]).toEqual([
		[1, 'a'],
	]);

	expect([...zip([1, 2, 3], ['a', 'b'])]).toEqual([
		[1, 'a'],
		[2, 'b'],
	]);
});