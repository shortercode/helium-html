import { invariant, isDefined, isNullish, isPrimitive, makeString, Primitive } from 'ts-runtime-typecheck';
import { zip } from './zip';
import { FRAGMENT_TAG } from './Template.constants';
import { is_observable } from './Observable';

import type { Template } from './Template.type';
import type { Disposable, Observable } from './Observable.type';
import type { ObservableOrPart, Part } from './Child.type';

export function render_template (template: Template, parts: ObservableOrPart[], namespace: 'http://www.w3.org/2000/svg' | 'http://www.w3.org/1999/xhtml' = 'http://www.w3.org/1999/xhtml'): Element | DocumentFragment {	
  const node = template.tag === FRAGMENT_TAG ? document.createDocumentFragment() : document.createElementNS(namespace, template.tag);

  if (template.children) {
    for (const child_template of template.children) {
      if (typeof child_template === 'string') {
        node.appendChild(document.createTextNode(child_template));
      } else if (typeof child_template === 'number') {
        const part = parts[child_template];
        const subparts = Array.isArray(part) ? part : [part];
        for (const sub of subparts) {
          if (sub instanceof Node) {
            node.appendChild(sub);
          } else if (is_observable(sub)) {
            const stub = create_placeholder_node();
            node.appendChild(stub);
            // TODO we need a way to clean these up automatically
            bind_store_to_node(sub, stub);
          } else if (isDefined(sub)){
            // TODO insert error if subpart is a function & add test
            node.appendChild(document.createTextNode(makeString(sub)));
          }
        }
      } else {
        node.appendChild(render_template(child_template, parts, namespace));
      }
    }
  }

  if (template.attributes) {
    if (node instanceof DocumentFragment) {
      throw new Error('Unable to add attributes to a DocumentFragment.');
    }
    for (const [key, value] of Object.entries(template.attributes)) {
      if (typeof value === 'number') {
        const part = parts[value];
        if (typeof part === 'function') {
          if (!key.startsWith('on')) { 
            throw new TypeError(`Invalid event listener ${key}.`);
          }
          // TODO we need a way to clean these up automatically
          const event_name = key.slice(2);
          node.addEventListener(event_name, part);
          // const disposable = { dispose: () => node.removeEventListener(event_name, part) };
        } else if (is_observable(part)) {
          // TODO we need a way to clean these up automatically
          bind_store_to_attribute(part, node, key);
        } else {
          node.setAttribute(key, makeString(part));
        }
      } else {
        node.setAttribute(key, value);
      }
    }
  }

  return node;
}

export function create_placeholder_node(): ChildNode {
  return new Comment('content placeholder');
}

export function render_node(value: ChildNode | DocumentFragment | Primitive | EventListener): ChildNode | string | ChildNode[] {
  if (typeof value === 'function') {
    throw new TypeError('Received a function where a Node or Primitive was expected.');
  }
  if (value instanceof DocumentFragment) {
    return Array.from(value.childNodes);
  }
  return value instanceof Node ? value : makeString(value);
}

export function bind_store_to_node(store: Observable<Part>, stub: ChildNode): Disposable {
  let current: ChildNode[] = [stub];
  return store.watch(value => {
    const values = Array.isArray(value) ? value : [value];
    // removed any Nullish values from the list
    const filtered_values = values.filter(isDefined);

    // Target _must always_ contain at least 1 element so that we can reliably
    // reference the position
    if (filtered_values.length === 0) {
      filtered_values.push(stub);
    }
    current = element_swap(current, filtered_values.map(v => render_node(v)).flat());
  });
}

export function bind_store_to_attribute(store: Observable<Part>, node: Element, attribute_name: string): Disposable {
  return store.watch(value => {
    if (isNullish(value)) {
      node.removeAttribute(attribute_name);
    } else {
      if (!isPrimitive(value)) {
        throw new TypeError('Invalid attribute value.');
      }
      node.setAttribute(attribute_name, makeString(value));
    }
  });
}

export function element_swap (from: ChildNode[], to: (ChildNode | string)[]): ChildNode[] {
  const output: ChildNode[] = [];

  let previous: ChildNode | null = null;

  for (const pair of zip(from, to)) {
    const old_node = pair[0];
    let new_node = pair[1];

    if (typeof new_node === 'string') {
      new_node = old_node.textContent !== new_node ? new Text(new_node) : old_node;
    }

    // don't bother swapping if it's the same node
    if (old_node !== new_node) {
      if (previous) {
        previous.after(new_node);
      } else {
        old_node.replaceWith(new_node);
      }
    }

    previous = new_node;
    output.push(new_node);
  }

  if (from.length >= to.length) {
    // reducing in size; swap `0...to`, then remove `to...from`
    
    // any nodes we insert may exist in `a`, hence they are removed as part of
    // the replace operation. so we must not remove them afterwards
    for (const a of from.slice(to.length)) {
      if (!output.includes(a)) {
        a.remove();
      }
    }
  } else {
    // increasing in size; append all the new ones after the last
    const last = output.at(-1);

    // TODO write error
    invariant(last !== undefined, '');

    const additional = to.slice(output.length).map(value => typeof value === 'string' ? new Text(value) : value);
    output.push(...additional);
    last.after(...additional);
  }

  return output;
}