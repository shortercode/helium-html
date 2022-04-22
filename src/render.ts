import { invariant, isDefined } from 'ts-runtime-typecheck';
import { zip } from './zip';
import { FRAGMENT_TAG } from './Template.constants';
import type { Template } from './Template.type';
import type { Observable } from './Observable.type';
import { is_observable } from './Observable';

export function render_template (template: Template, parts: unknown[]): HTMLElement | DocumentFragment {	
	const node = template.tag === FRAGMENT_TAG ? document.createDocumentFragment() : document.createElement(template.tag);

	if (template.children) {
		for (const child_template of template.children) {
			if (typeof child_template === 'string') {
				node.appendChild(document.createTextNode(child_template));
			} else if (typeof child_template === 'number') {
				const part = parts[child_template];
				const subparts = Array.isArray(part) ? part : [part];
				for (const sub of subparts) {
					if (part instanceof Node) {
						node.appendChild(part);
					} else if (is_observable(part)) {
						const stub = create_placeholder_node();
						node.appendChild(stub);
						bind_store_to_node(part, stub);
					} else {
						const text = typeof sub === 'string' ? sub : JSON.stringify(part);
						node.appendChild(document.createTextNode(text));
					}
				}
			} else {
				node.appendChild(render_template(child_template, parts));
			}
		}
	}

	if (template.attributes) {
		if (node instanceof DocumentFragment) {
			// TODO write error message
			throw new Error('');
		}
		for (const [key, value] of Object.entries(template.attributes)) {
			if (typeof value === 'number') {
				const part = parts[value];
				if (key.startsWith('on')) {
					if (typeof part !== 'function') {
						// TODO write error message
						throw new Error('');
					}
					// TODO we need a way to clean these up automatically
					node.addEventListener(key.slice(2), part as EventListener);
				} else {
					node.setAttribute(key, typeof value === 'string' ? value : JSON.stringify(value));
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

export function render_node(value: unknown): ChildNode {
	if (value instanceof Element) {
		return value;
	}
	const text = typeof value === 'string' ? value : JSON.stringify(value);
	return document.createTextNode(text);
}

export function bind_store_to_node(store: Observable<unknown>, stub: ChildNode) {
	let current: ChildNode[] = [stub];
	store.watch(value => {
		let values: unknown[] = Array.isArray(value) ? value : [value];
		// removed any Nullish values from the list
		values = values.filter(isDefined);

		// Target _must always_ contain at least 1 element so that we can reliably
		// reference the position
		if (values.length === 0) {
			values.push(stub);
		}
		current = element_swap(current, values.map(render_node));
	});
}

export function element_swap (from: ChildNode[], to: (ChildNode | string)[]): ChildNode[] {
	const output: ChildNode[] = [];
	if (from.length >= to.length) {
		// reducing in size; swap `0...to`, then remove `to...from`
		const moved = new Set();
		for(const pair of zip(from, to)) {
			const old_node = pair[0];
			let new_node = pair[1];

			if (typeof new_node === 'string') {
				new_node = old_node.textContent !== new_node ? new Text(new_node) : old_node;
			}

			// don't bother swapping if it's the same node
			if (old_node !== new_node) {
				old_node.replaceWith(new_node);
				moved.add(new_node);
			}

			output.push(new_node);
		}
		// any nodes we insert may exist in `a`, hence they are removed as part of
		// the replace operation. so we must not remove them afterwards
		for(const a of from.slice(to.length)) {
			if (!moved.has(a)) {
				a.remove();
			}
		}
	} else {
		// increasing in size; swap all but the last, then use the last node for 
		// a one to many replace
		for(const pair of zip(from.slice(0, -1), to)) {
			const old_node = pair[0];
			let new_node = pair[1];
			
			if (typeof new_node === 'string') {
				new_node = old_node.textContent !== new_node ? new Text(new_node) : old_node;
			}

			if (old_node !== new_node) {
				old_node.replaceWith(new_node);
			}

			output.push(new_node);
		}
		const current_index = from.length - 1;
		const last = from[current_index];

		// TODO write error
		invariant(last !== undefined, '');

		const additional = to.slice(current_index).map(value => typeof value === 'string' ? new Text(value) : value);
		output.push(...additional);
		last.replaceWith(...additional);
	}

	return output;
}