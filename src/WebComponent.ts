import { invariant } from 'ts-runtime-typecheck';

export function web_component<T extends HTMLElement>(ctor: { new(): T }): void {
  let tagname = to_kebab_case(ctor.name);
  if (tagname.endsWith('-element')) {
    tagname = tagname.slice(0, -8);
  }
  if (tagname.split('-').length < 2) {
    throw new Error(`Name ${tagname} is not a valid custom element name.`);
  }
  window.customElements.define(tagname, ctor);
}

const KEBAB_REGEX = /[A-Z]?[a-z0-9]+|[A-Z0-9]{1,}(?=[A-Z][a-z][a-z0-9]+|\b)|[A-Z]/g;

export function to_kebab_case(str: string): string {
  const words = str.match(KEBAB_REGEX);
  invariant(words !== null, `Invalid component name "${str}"`);
  return words.map(word => word.toLowerCase()).join('-');
}