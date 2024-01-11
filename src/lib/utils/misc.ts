export const noop = (..._a: unknown[]) => void 0 as void;
export const ignoreUnusedProp = noop;
export const yeet = (err: unknown = new Error('Assertion error.')) => { throw err; };
export const assertSome = <T,>(value: T | undefined | null): T => value ?? yeet(`Expected a value, found ${value}`);
