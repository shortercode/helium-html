import type { Dictionary } from 'ts-runtime-typecheck';

/**
 * `tag` will always be set and is a static value.
 * 
 * `attributes` are optional, they are either a static value or reference.
 * 
 * `children` are optional, they are either a static template value, a static
 * text string or a reference to an actual element.
 * 
 * References are stored as an index, when the template is rendered an array of
 * values are included, which _must_ include the same number of items that the
 * template expects.
 * 
 * In practice the templates are always created from tagged template literals,
 * so we know the exact number of items/slots and there is always the correct
 * amount.
 */
export interface Template {
	tag: string;
  attributes?: Dictionary<string | number>;
	children?: Array<Template | string | number>;
}