import type { Template } from './Template.type';

export interface Parser {
	part_index: number;
	stack: Template[];
	attribute_mode: boolean;
}