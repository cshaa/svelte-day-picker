import Queue from '@iter-tools/queue';

/** Only take first k elements of an iterable, not computing the rest */
export function* takeFirst<T>(iterable: Iterable<T>, items: number) {
  const iterator = iterable[Symbol.iterator]();

  let next: IteratorResult<T, undefined>;
  for (let i = 0; i < items; i++) {
    next = iterator.next();
    if (next.done) throw new RangeError('Trying to take more items than present in the iterable.');
    yield next.value;
  }
}

/** Iterate through the iterable until the end, remembering the last k elements; then yield them. */
export function* takeLast<T>(iterable: Iterable<T>, items: number) {
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

/**
 * Wrap an iterator (possibly partially consumed) into an iterable.
 * Also, prevent the iterable from being closed.
 */
export function wrap<T>(iterator: Iterator<T>): Iterable<T> {
  return { [Symbol.iterator]: () => iterator };
}

/** Get an iterator from the iterable. */
export function unwrap<T>(iterable: Iterable<T>) {
  return iterable[Symbol.iterator]();
}

/** Get the first element of an iterable, then return the partially consumed iterator, wrapped in an iterable. */
export function firstAndRest<T>(iterable: Iterable<T>): [T, Iterable<T>] {
  const iterator = iterable[Symbol.iterator]();
  const next = iterator.next();
  if (next.done) throw new RangeError('Trying to get the first element of an empty iterable.');
  return [next.value, wrap(iterator)];
}

/**
 * Turn an iterable of values into an iterable of arrays – each array will contain
 * adjacent elements of the same group. Always consumes one element more than what
 * is yielded.
 */
export function* group<T, G>(iterable: Iterable<T>, getGroup: (element: T) => G) {
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
) {
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
) {
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

/** Yield the iterables' elements in order. */
export function* join<T>(...iterables: Iterable<T>[]) {
  for (const iterable of iterables) {
    yield* iterable;
  }
}

/** Create an iterable from one element */
export function* once<T>(item: T) {
  yield item;
}

/**
 * Yield all the elements of the iterable returned by the callback.
 * Once it's done, call the callback again.
 */
export function* build<T>(fn: () => Iterable<T> | undefined) {
  while (true) {
    const iterable = fn();
    if (iterable === undefined) return;
    yield* iterable;
  }
}
