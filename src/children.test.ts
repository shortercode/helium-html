import { invariant } from 'ts-runtime-typecheck';
import { children } from './children';
import { html } from './html';
import { Store } from './Observable/Observable';

describe('children', () => {
  test('renders additions to a list', () => {
    const source = new Store([0]);
    const child_render = jest.fn(v => html`<li>${v}</li>`);
    const parent = html`<ul>${children(source, child_render)}`;
    expect(parent).toBeInstanceOf(HTMLUListElement);
    invariant(parent instanceof Element, 'Node should be Element');

    expect(parent.outerHTML).toBe('<ul><li>0</li></ul>');
    expect(child_render).toBeCalledTimes(1);

    source.modify(list => list.concat(1));
    expect(parent.outerHTML).toBe('<ul><li>0</li><li>1</li></ul>');
    expect(child_render).toBeCalledTimes(2);

    source.modify(list => list.concat(2, 3));
    expect(parent.outerHTML).toBe('<ul><li>0</li><li>1</li><li>2</li><li>3</li></ul>');
    expect(child_render).toBeCalledTimes(4);
  });

  test('removes subtractions from a list', () => {
    const source = new Store([0, 1, 2, 3]);
    const child_render = jest.fn(v => html`<li>${v}</li>`);
    const parent = html`<ul>${children(source, child_render)}`;
    expect(parent).toBeInstanceOf(HTMLUListElement);
    invariant(parent instanceof Element, 'Node should be Element');

    expect(parent.outerHTML).toBe('<ul><li>0</li><li>1</li><li>2</li><li>3</li></ul>');
    expect(child_render).toBeCalledTimes(4);

    source.update([1,2,3]);

    expect(parent.outerHTML).toBe('<ul><li>1</li><li>2</li><li>3</li></ul>');
    expect(child_render).toBeCalledTimes(4);

    source.update([2, 3]);

    expect(parent.outerHTML).toBe('<ul><li>2</li><li>3</li></ul>');
    expect(child_render).toBeCalledTimes(4);

    source.update([]);

    expect(parent.outerHTML).toBe('<ul><!--content placeholder--></ul>');
    expect(child_render).toBeCalledTimes(4);
  });

  test('re-order without render', () => {
    const source = new Store([0, 1, 2]);
    const child_render = jest.fn(v => html`<li>${v}</li>`);
    const parent = html`<ul>${children(source, child_render)}`;
    expect(parent).toBeInstanceOf(HTMLUListElement);
    invariant(parent instanceof Element, 'Node should be Element');

    expect(parent.outerHTML).toBe('<ul><li>0</li><li>1</li><li>2</li></ul>');
    expect(child_render).toBeCalledTimes(3);

    source.update([2, 1, 0]);
    expect(parent.outerHTML).toBe('<ul><li>2</li><li>1</li><li>0</li></ul>');
    expect(child_render).toBeCalledTimes(3);

    source.update([1, 0, 2]);
    expect(parent.outerHTML).toBe('<ul><li>1</li><li>0</li><li>2</li></ul>');
    expect(child_render).toBeCalledTimes(3);
  });

  test('remove and reinsert causes render', () => {
    const source = new Store([0, 1]);
    const child_render = jest.fn(v => html`<li>${v}</li>`);
    const parent = html`<ul>${children(source, child_render)}`;
    expect(parent).toBeInstanceOf(HTMLUListElement);
    invariant(parent instanceof Element, 'Node should be Element');

    expect(parent.outerHTML).toBe('<ul><li>0</li><li>1</li></ul>');
    expect(child_render).toBeCalledTimes(2);

    source.update([0]);

    expect(parent.outerHTML).toBe('<ul><li>0</li></ul>');
    expect(child_render).toBeCalledTimes(2);

    source.update([0, 1]);

    expect(parent.outerHTML).toBe('<ul><li>0</li><li>1</li></ul>');
    expect(child_render).toBeCalledTimes(3);
  });
  test('duplicate item', () => {
    const source = new Store([0, 0]);
    const child_render = jest.fn(v => html`<li>${v}</li>`);
    expect(() => html`<ul>${children(source, child_render)}`).toThrow('Duplicate entry with ID 0 at index 1.');
  });
  test('custom id function', () => {
    const source = new Store([ {id: 1, value: 0}, {id: 0, value: 0}]);
    const child_render = jest.fn((v: { value: number }) => html`<li>${v.value}</li>`);
    const child_id = jest.fn((v: { id: number }) => v.id);
    const parent = html`<ul>${children(source, child_render, child_id)}`;
    expect(parent).toBeInstanceOf(HTMLUListElement);
    invariant(parent instanceof Element, 'Node should be Element');

    expect(parent.outerHTML).toBe('<ul><li>0</li><li>0</li></ul>');
    expect(child_render).toBeCalledTimes(2);
    expect(child_id).toBeCalledTimes(2);

    source.modify(v => v.concat({ id: 2, value: 1}));

    expect(parent.outerHTML).toBe('<ul><li>0</li><li>0</li><li>1</li></ul>');
    expect(child_render).toBeCalledTimes(3);
    expect(child_id).toBeCalledTimes(5);
  });
});