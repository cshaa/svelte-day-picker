export const yeet = (err: unknown = new Error('Assertion error.')) => { throw err; };
export const assertSome = <T,>(value: T | undefined | null): T => value ?? yeet(`Expected a value, found ${value}`);
