import { html } from './html';

describe('html', () => {
  test('simple', () => {
    const node = html`<div>Hello World</div>`;

    expect(node).toBeInstanceOf(DocumentFragment);
    expect(node.children.length).toBe(1);
    expect(node.firstElementChild?.tagName).toBe('DIV');
    expect(node.firstElementChild?.textContent).toBe('Hello World');
  });

  test('value insertion', () => {
    const node = html`<div>Hello ${'James'}</div>`;

    expect(node).toBeInstanceOf(DocumentFragment);
    expect(node.children.length).toBe(1);
    expect(node.firstElementChild?.tagName).toBe('DIV');
    expect(node.firstElementChild?.textContent).toBe('Hello James');
  });

  test('attribute insertion', () => {
    const node = html`<div title="Hello World">Hello World</div>`;

    expect(node).toBeInstanceOf(DocumentFragment);
    expect(node.children.length).toBe(1);
    expect(node.firstElementChild?.tagName).toBe('DIV');
    expect(node.firstElementChild?.attributes.getNamedItem('title')).toBe('Hello World');
    expect(node.firstElementChild?.textContent).toBe('Hello World');
  });
});