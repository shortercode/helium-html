import { to_kebab_case, web_component } from './WebComponent';

test('to_kebab_case', () => {
  expect(to_kebab_case('HelloWorld')).toBe('hello-world');
  expect(to_kebab_case('Hello')).toBe('hello');
  expect(to_kebab_case('HIWorld')).toBe('hi-world');
  expect(to_kebab_case('ABC')).toBe('abc');
  expect(to_kebab_case('ABetaC')).toBe('a-beta-c');
  expect(to_kebab_case('alphaBetaCharlieDelta')).toBe('alpha-beta-charlie-delta');
  expect(to_kebab_case('h1')).toBe('h1');
});

describe('web_component', () => {
  test('short name is invalid', () => {
    expect(() => web_component(class ExampleElement extends HTMLElement {})).toThrow();
  });
	
  test('with element suffix', () => {
    web_component(class MyExampleElement extends HTMLElement {});
    expect(window.customElements.get('my-example')).toBeDefined(); 
  });
	
  test('without element suffix', () => {
    web_component(class AnotherExample extends HTMLElement {});
    expect(window.customElements.get('another-example')).toBeDefined(); 
  });
});
