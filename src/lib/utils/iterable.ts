import Queue from './queue';
const { floor } = Math;

// #region [ rgba(255, 0, 100, 0.08) ] Type Utilities

export type IterableValue<I> = I extends Iterable<infer V> ? V : never;
export type IteratorValue<I> = I extends Iterator<infer V> ? V : never;

type G<T> = Generator<T, void, undefined>;

// #endregion
// #region [ rgba(100, 255, 0, 0.03) ] Creating Iterables

/** Create an iterable from one element */
export function* once<T>(item: T): G<T> {
  yield item;
}

/**
 * Yield all the elements of the iterable returned by the callback.
 * Once it's done, call the callback again.
 */
export function* build<T>(fn: () => Iterable<T> | undefined): G<T> {
  while (true) {
    const iterable = fn();
    if (iterable === undefined) return;
    yield* iterable;
  }
}

/**
 * Yield values in an interval [a, b), or [0, a) if you ommit the second
 * argument. Values are taken a `step` apart, the default value of `step`
 * is 1. If either the start of the interval or the step are not integers,
 * pr the end of the interval is outside of the safe range of integers,
 * a different algorithm is used to make sure the total error is minimized.
 */
export function* range(a: number, b?: number, step: number = 1): G<number> {
  if (b === undefined) [a, b] = [0, a];

  if (areIntegers(a, step) && b === clamp(b, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)) {
    for (let i = a; i < b; i += step) yield i;
  } else {
    const diff = a - b;
    const steps = floor(diff / step);
    for (let i = 0; i < steps; i++) {
      yield a + diff * (i / steps);
    }
  }
}

function areIntegers(...args: number[]): boolean {
  return args.every(n => n === (n | 0));
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

// #endregion
// #region [ rgba(255, 100, 0, 0.03) ] Standard Functions

/** Yield the iterables' elements in order. */
export function* concat<T>(...iterables: Iterable<T>[]): G<T> {
  for (const iterable of iterables) {
    yield* iterable;
  }
}

/** Only take first k elements of an iterable, not computing the rest */
export function* takeFirst<T>(iterable: Iterable<T>, items: number): G<T> {
  const iterator = iterable[Symbol.iterator]();

  let next: IteratorResult<T, undefined>;
  for (let i = 0; i < items; i++) {
    next = iterator.next();
    if (next.done) throw new RangeError('Trying to take more items than present in the iterable.');
    yield next.value;
  }
}

/**
 * Iterate through the iterable until the end,
 * remembering the last k elements; then yield them.
 */
export function* takeLast<T>(iterable: Iterable<T>, items: number): G<T> {
  if (items === 0) return;

  const queue = new Queue<T>();
  const iterator = iterable[Symbol.iterator]();
  let next: IteratorResult<T, undefined>;

  for (let i = 0; i < items; i++) {
    next = iterator.next();
    if (next.done) throw new RangeError('Trying to take more items than present in the iterable.');
    queue.push(next.value);
  }

  while (((next = iterator.next()), !next.done)) {
    queue.shift();
    queue.push(next.value);
  }

  yield* queue;
}

/** Get the first element of an iterable, then return the partially consumed iterator, wrapped in an iterable. */
export function firstAndRest<T>(iterable: Iterable<T>): [T, Iterable<T>] {
  const iterator = iterable[Symbol.iterator]();
  const next = iterator.next();
  if (next.done) throw new RangeError('Trying to get the first element of an empty iterable.');
  return [next.value, wrap(iterator)];
}

/**
 * Lazily evaluate `fn` for every value of the iterable and return
 * a new iterable containing the return values of `fn`.
 */
export function* map<
  I extends Iterable<unknown> = Iterable<unknown>,
  T extends IterableValue<I> = IterableValue<I>,
  R = T
>(iterable: I, fn: (value: T, iterable: I) => R): G<R> {
  for (const x of iterable as Iterable<T>) {
    yield fn(x, iterable);
  }
}

/**
 * Lazily evaluate `fn` for every value of the iterable and
 * if `fn` returns true, re-yield the value.
 */
export function* filter<
  I extends Iterable<unknown> = Iterable<unknown>,
  T extends IterableValue<I> = IterableValue<I>
>(iterable: I, fn: (value: T, iterable: I) => boolean): G<T> {
  for (const x of iterable as Iterable<T>) {
    if (fn(x, iterable)) yield x;
  }
}

/**
 * Lazily evaluate `fn` for every value of the iterable.
 * The return value of `fn` is the accumulated result, and
 * is provided as an argument in the next call to the callback function.
 */
export function reduce<
  I extends Iterable<unknown> = Iterable<unknown>,
  T extends IterableValue<I> = IterableValue<I>
>(iterable: I, fn: (previousValue: T, currentValue: T, iterable: I) => T, initialValue?: T): T;

export function reduce<
  I extends Iterable<unknown> = Iterable<unknown>,
  T extends IterableValue<I> = IterableValue<I>,
  R = T
>(iterable: I, fn: (previousValue: R, currentValue: T, iterable: I) => T, initialValue: R): R;

export function reduce<
  I extends Iterable<unknown> = Iterable<unknown>,
  T extends IterableValue<I> = IterableValue<I>,
  R = T
>(iterable: I, fn: (previousValue: R, currentValue: T, iterable: I) => R, initialValue?: R): R {
  let initialized = arguments.length < 3;
  for (const currentValue of iterable as Iterable<T>) {
    if (!initialized) {
      initialValue = currentValue as never as R;
      initialized = true;
      continue;
    }

    initialValue = fn(initialValue!, currentValue, iterable);
  }

  return initialValue!;
}

/**
 * Iterate through every value of the iterable and return how many there were.
 * The optional parameter `failAt` allows you to stop counting once the count
 * exceeds the specified limit and throw a RangeError instead.
 */
export function count<T>(iterable: Iterable<T>, failAt: number = Number.MAX_SAFE_INTEGER): number {
  let l = 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const _key in iterable) {
    l++;
    if (l >= failAt)
      throw new RangeError('The iterable was longer than the specified limit (possibly infinite).');
  }
  return l;
}

export interface EnumerateItem<I, T> {
  value: T;
  iterable: I;
  index: number;
  odd: boolean;
  even: boolean;
  first: boolean;
}

export interface EnumerateItemWithLast<I, T> extends EnumerateItem<I, T> {
  last: boolean;
}

/**
 * Enrich the iterable values by useful information like their index,
 * whether they're odd or even and whether they're first or last in the iterable.
 * Useful for writing one-liners.
 */
export function enumerate<
  I extends Iterable<unknown> = Iterable<unknown>,
  T extends IterableValue<I> = IterableValue<I>
>(iterable: I, indicateLast?: false): G<EnumerateItem<I, T>>;

export function enumerate<
  I extends Iterable<unknown> = Iterable<unknown>,
  T extends IterableValue<I> = IterableValue<I>
>(iterable: I, indicateLast: true): G<EnumerateItemWithLast<I, T>>;

export function enumerate<
  I extends Iterable<unknown> = Iterable<unknown>,
  T extends IterableValue<I> = IterableValue<I>
>(
  iterable: I,
  indicateLast?: boolean
): G<EnumerateItem<I, T> & Partial<EnumerateItemWithLast<I, T>>>;

export function* enumerate<
  I extends Iterable<unknown> = Iterable<unknown>,
  T extends IterableValue<I> = IterableValue<I>
>(
  iterable: I,
  indicateLast: boolean = false
): G<EnumerateItem<I, T> & Partial<EnumerateItemWithLast<I, T>>> {
  if (indicateLast) {
    const iterator = unwrap(iterable as Iterable<T>);
    let current = iterator.next();
    let previous: IteratorResult<T>;

    for (let index = 0; true; index++) {
      [previous, current] = [current, iterator.next()];
      if (previous.done) return;

      yield {
        value: previous.value,
        iterable,
        index,
        first: index === 0,
        even: index % 2 === 0,
        odd: index % 2 === 1,
        last: current.done
      };
    }
  } else {
    let index = 0;
    for (const value of iterable as Iterable<T>) {
      yield {
        value,
        iterable,
        index,
        first: index === 0,
        even: index % 2 === 0,
        odd: index % 2 === 1
      };

      index += 1;
    }
  }
}

// #endregion
// #region [ rgba(0, 0, 255, 0.02) ] Extra Functions

/**
 * Wrap an iterator (possibly partially consumed) into an iterable.
 * Also, prevent the iterable from being closed.
 */
export function wrap<T>(iterator: Iterator<T>): Iterable<T> {
  return { [Symbol.iterator]: () => iterator };
}

/** Get an iterator from the iterable. */
export function unwrap<T>(iterable: Iterable<T>): Iterator<T> {
  return iterable[Symbol.iterator]();
}

/**
 * Turn an iterable of values into an iterable of arrays – each array will contain
 * adjacent elements of the same group. Always consumes one element more than what
 * is yielded.
 */
export function* group<T, L>(iterable: Iterable<T>, getGroup: (element: T) => L): G<T[]> {
  const [first, rest] = firstAndRest(iterable);

  let currentGroup = getGroup(first);
  let arr = [first];

  for (const el of rest) {
    const group = getGroup(el);
    if (group !== currentGroup) {
      yield arr;
      currentGroup = group;
      arr = [];
    }
    arr.push(el);
  }

  yield arr;
}

/**
 * Collect elements until the callback returns true, then yield the collected
 * elements as an array, clear the collectlion and continue. The elements for
 * which you returned true will be at the end of each array. Does not consume
 * more elements than those yielded.
 */
export function* groupByLastElement<T>(
  iterable: Iterable<T>,
  isLastElement: (element: T) => boolean
): G<T[]> {
  let arr: T[] = [];
  for (const el of iterable) {
    arr.push(el);
    if (isLastElement(el)) {
      yield arr;
      arr = [];
    }
  }
  yield arr;
}

/**
 * Collect elements until the callback returns true, then yield the collected
 * elements as an array, clear the collectlion and continue. The elements for
 * which you returned true will be at the start of each array. Always consumes
 * one element more than what is yielded.
 */
export function* groupByFirstElement<T>(
  iterable: Iterable<T>,
  isFirstElement: (element: T) => boolean
): G<T[]> {
  const [first, rest] = firstAndRest(iterable);

  let arr = [first];

  for (const el of rest) {
    if (isFirstElement(el)) {
      yield arr;
      arr = [];
    }
    arr.push(el);
  }

  yield arr;
}

// #endregion
