import { invariant, isDefined, isNullish, isPrimitive, makeString, Primitive } from 'ts-runtime-typecheck';
import { zip } from './zip';
import { FRAGMENT_TAG } from './Template.constants';
import { is_observable } from './Observable/Observable';

import type { Template } from './Template.type';
import type { Disposable } from './Observable/Observable.type';
import type { DynamicValue, Value } from './Child.type';
import type { Namespace } from './Namespace.type';
import { create_ref, Ref } from './Ref';

const AUTOMATED_DISPOSER = new FinalizationRegistry<Disposable>(disposable => disposable.dispose());

export function add_ref_to_disposer(ref: Ref<object>, disposable: Disposable) {
  const value = ref.deref();
  if (value) {
    AUTOMATED_DISPOSER.register(value, disposable);
  }
}

export function render_template (template: Template, parts: Value[], namespace: Namespace): Element | DocumentFragment {	
  const node = template.tag === FRAGMENT_TAG ? document.createDocumentFragment() : document.createElementNS(namespace, template.tag);

  if (template.children) {
    render_children(node, template.children, parts, namespace);
  }

  if (template.attributes) {
    if (node instanceof DocumentFragment) {
      throw new Error('Unable to add attributes to a DocumentFragment.');
    }
    apply_attributes(node, template.attributes, parts);
  }

  return node;
}

export function render_children(node: Node, children: NonNullable<Template['children']>, parts: Value[], namespace: Namespace): void {
  const ref = create_ref(node);
  const is_fragment = node instanceof DocumentFragment;
  for (const child_template of children) {
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
          invariant(is_fragment === false, 'Cannot bind Observable child list to Fragment.');
          bind_store_to_node(ref, sub, stub);
        } else if (isDefined(sub)){
          invariant(typeof sub !== 'function', 'Expected Primitive value and received a function');
          node.appendChild(document.createTextNode(makeString(sub)));
        }
      }
    } else {
      node.appendChild(render_template(child_template, parts, namespace));
    }
  }
}

export function apply_attributes(node: Element, attrs: NonNullable<Template['attributes']>, parts: Value[]): void {
  const ref = create_ref(node);

  for (const [key, value] of Object.entries(attrs)) {
    if (typeof value === 'number') {
      const part = parts[value];
      if (typeof part === 'function') {
        if (!key.startsWith('on')) { 
          throw new TypeError(`Invalid event listener ${key}.`);
        }
        const event_name = key.slice(2);
        node.addEventListener(event_name, part);
      } else if (is_observable(part)) {
        bind_store_to_attribute(part, ref, key);
      } else {
        node.setAttribute(key, makeString(part));
      }
    } else {
      node.setAttribute(key, value);
    }
  }
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

export function bind_store_to_node(ref: Ref<Node>, store: DynamicValue, stub: ChildNode): void {
  let current: ChildNode[] = [stub];
  const disposable = store.watch(value => {
    if (!ref.deref()) {
      disposable.dispose();
      return;
    }
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
  add_ref_to_disposer(ref, disposable);
}

export function bind_store_to_attribute(store: DynamicValue, ref: Ref<Element>, attribute_name: string): void {
  const disposable = store.watch(value => {
    const node = ref.deref();
    if (!node) {
      disposable.dispose();
      return;
    }
    if (isNullish(value)) {
      node.removeAttribute(attribute_name);
    } else {
      if (!isPrimitive(value)) {
        throw new TypeError('Invalid attribute value.');
      }
      node.setAttribute(attribute_name, makeString(value));
    }
  });
  add_ref_to_disposer(ref, disposable);
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
    const last = output[output.length - 1];

    invariant(last !== undefined, 'Expected an adjacent node.');

    const additional = to.slice(output.length).map(value => typeof value === 'string' ? new Text(value) : value);
    output.push(...additional);
    last.after(...additional);
  }

  return output;
}