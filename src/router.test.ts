import type { MatchResult } from 'path-to-regexp';
import { Dictionary, invariant } from 'ts-runtime-typecheck';
import { is_external_url, link, navigate, normalise_url, redirect, render_route, route } from './router';

const location_assign = jest.fn();
const location_replace = jest.fn();
const history_pushstate = jest.fn();

const LOCATION = window.location;

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: strictNullChecks
  delete window.location;

  Object.defineProperty(window, 'location', {
    value: {
      href: LOCATION.href,
      origin: LOCATION.origin,
      assign: location_assign,
      replace: location_replace,
      pathname: LOCATION.pathname,
    },
    writable: true,
  });
});

afterAll(() => {
  Object.defineProperty(window, 'location', {
    value: LOCATION,
  });
});

describe('route', () => {
  test('matches simple path', () => {
    const r = route('/hello', jest.fn());
    expect(r.pattern('/hello')).toMatchObject({
      index: 0,
      params: {},
      path: '/hello'
    });
  });
  test('does not match sub path', () => {
    const r = route('/hello', jest.fn());
    expect(r.pattern('/hello/world')).toBe(false);
  });
  test('does not match against absolute path with incorrect origin', () => {
    const r = route('/hello', jest.fn());
    expect(r.pattern('https://example.com/hello')).toBe(false);
  });
});

describe('render route', () => {
  test('render passes combined arguments', async () => {
    const render = jest.fn();
    render.mockReturnValue('12');
    const r = route('/hello/:id', render, 'test_a', 'test_b');
    const match = r.pattern('/hello/charles');
    expect(match).toMatchObject({
      index: 0,
      params: {
        id: 'charles'
      },
      path: '/hello/charles'
    });
    expect(await r.render(match as MatchResult)).toBe('12');
    expect(render).toBeCalledWith(match, 'test_a', 'test_b');
  });
});

describe('static redirect route', () => {
  test('static relative path', () => {
    const r = redirect('/hello', '/goodbye');
    expect(r.url.href).toBe('http://localhost/goodbye');
  });
  test('static absolute path', () => {
    const r = redirect('/hello', 'https://another.com/goodbye');
    expect(r.url.href).toBe('https://another.com/goodbye');
  });
  test('static absolute path ( using URL object )', () => {
    const r = redirect('/hello', new URL('https://another.com/goodbye'));
    expect(r.url.href).toBe('https://another.com/goodbye');
  });
});

describe('dynamic redirect route', () => {
  test('calls route function', () => {
    const get_route = jest.fn();
    get_route.mockImplementation(({ params }: MatchResult<Dictionary<string>>) => `/goodbye/${params['id'] ?? ''}`);
    const r = redirect('/hello/:id', get_route);
    const match = r.pattern('/hello/charles');
    expect(match).toMatchObject({
      index: 0,
      params: {
        id: 'charles'
      },
      path: '/hello/charles'
    });
    expect(r.route(match as MatchResult)).toBe('/goodbye/charles');
    expect(get_route).toBeCalledWith(match);
  });
});

describe('router', () => {

  test.todo('');
});

describe('render_route', () => {
  const console_error_real = console.error;
  const console_error = jest.fn();
  beforeAll(() => {
    console.error = console_error;
  });
  afterAll(() => {
    console.error = console_error_real;
  });
  test('calls render and passes result to listener', async () => {
    const r = route('/hello', jest.fn((): Node => new Text('hi')));
    const listener = jest.fn();
    await render_route(r, r.pattern('/hello') as MatchResult, listener);
    const call = listener.mock.calls[0] as unknown[];
    expect(call[0]).toBeInstanceOf(Text);
    expect((call[0] as Text).textContent).toBe('hi');
  });
  test('prints log message when render throws', async () =>{
    const r = route('/hello', () => { throw 'failed'; });
    const listener = jest.fn();
    await render_route(r, r.pattern('/hello') as MatchResult, listener);
    
    expect(listener).toBeCalledTimes(0);
    expect(console_error).toBeCalledWith('Failed to render route /hello: failed');
  });
});

describe('normalise_url', () => {
  test('relative path', () => {
    expect(normalise_url('/hello').href).toBe('http://localhost/hello');
  });
  test('absolute path', () => {
    expect(normalise_url('https://example.com/hello').href).toBe('https://example.com/hello');
  });
  test('absolute path ( URL object )', () => {
    expect(normalise_url(new URL('https://example.com/hello')).href).toBe('https://example.com/hello');
  });
});

describe('is_external_url', () => {
  test('local path', () => {
    const url = normalise_url('/hello');
    expect(is_external_url(url)).toBe(false);
  });
  test('absolute local path', () => {
    const url = normalise_url('http://localhost/hello');
    expect(is_external_url(url)).toBe(false);
  });
  test('external path', () => {
    const url = normalise_url('https://example.com/hello');
    expect(is_external_url(url)).toBe(true);
  });
});

describe('navigate', () => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const history_pushstate_real = history.pushState;
  beforeAll(() => {
    Object.defineProperty(history, 'pushState', {
      value: history_pushstate,
      writable: true,
    });
  });
  afterAll(() => {
    Object.defineProperty(history, 'pushState', {
      value: history_pushstate_real
    });
  });
  afterEach(() => {
    history_pushstate.mockReset();
    location_assign.mockReset();
  });
  test('local path uses pushState', () => {
    navigate('/hello');
    expect(history_pushstate).toBeCalledWith('/hello', '', '/hello');
  });
  test('absolute local path uses pushState', () => {
    navigate('http://localhost/hello');
    expect(history_pushstate).toBeCalledWith('/hello', '', '/hello');
  });
  test('external path uses location.assign', () => {
    navigate('http://example.com/hello');
    const call = location_assign.mock.calls[0] as unknown[];
    expect(call[0]).toEqual(new URL('http://example.com/hello'));
  });
});

describe('link', () => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const history_pushstate_real = history.pushState;
  beforeAll(() => {
    Object.defineProperty(history, 'pushState', {
      value: history_pushstate,
      writable: true,
    });
  });
  afterAll(() => {
    Object.defineProperty(history, 'pushState', {
      value: history_pushstate_real
    });
  });
  afterEach(() => {
    history_pushstate.mockReset();
    location_assign.mockReset();
  });
  test('creates an anchor element with a given child value', () => {
    const el = link('/hello', 'hello');
    invariant(el instanceof Element, 'Expect element to be type Element');
    expect(el.tagName).toBe('A');
    expect(el.getAttribute('href')).toBe('/hello');
    expect(el.textContent).toBe('hello');
  });
  test('link handler calls navigate with url', () => {
    const el = link('/hello', 'hello');
    (el as HTMLAnchorElement).click();
    expect(history_pushstate).toBeCalledWith('/hello', '', '/hello');
  });
});