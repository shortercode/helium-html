import type { MatchFunction, MatchResult } from 'path-to-regexp';

export interface RenderRoute {
  pattern: MatchFunction;
  label: string;
  render(match: MatchResult): Promise<Node>;
}

export interface StaticRedirectRoute {
  pattern: MatchFunction;
  label: string;
  url: URL;
}

export interface DynamicRedirectRoute {
  pattern: MatchFunction;
  label: string;
  route: RedirectRoute;
}

export type RedirectRoute = (match: MatchResult) => URL | string;

export type Route = RenderRoute | StaticRedirectRoute | DynamicRedirectRoute;