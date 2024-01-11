// Adopted from https://www.npmjs.com/package/@iter-tools/queue
// Created by Conrad Buck, published under the MIT license


class QueueItem<T> {
  value: T | null
  next: QueueItem<T> | null;

  constructor(value: T | null) {
    this.value = value;
    this.next = null;
  }
}

const _ = Symbol.for('_');
const flag = Symbol.for('@iter-tools/queue');

export default class Queue<T> {
  // @ts-expect-error there IS initialization in the constructor behind clear() function call
  [_]: { size: number, cleared: boolean, head: QueueItem<T>, tail: QueueItem<T> }

  constructor(values?: Iterable<T>) {
    this.clear();

    // Mirrors the behavior of Map and Set
    if (values != null) {
      for (const value of values) {
        this.push(value);
      }
    }
  }

  static isQueue(inst: unknown): inst is Queue<unknown> {
    return inst != null && Boolean((inst as { [key: symbol]: unknown })[flag]);
  }

  get [flag]() {
    return true;
  }

  get size() {
    return this[_].size;
  }

  clear() {
    const emptyItem = new QueueItem<T>(null);

    if (this[_]) this[_].cleared = true;
    this[_] = { size: 0, cleared: false, head: emptyItem, tail: emptyItem };
  }

  peek() {
    if (this.size === 0) return undefined;
    return this[_].head.next!.value;
  }

  shift() {
    if (this.size === 0) return undefined;
    const { head } = this[_];
    const { value, next } = head.next!;
    if (next === null) {
      this[_].tail = head;
    }
    head.next = next;
    this[_].size--;

    return value;
  }

  push(value: T) {
    const { tail } = this[_];
    tail.next = this[_].tail = new QueueItem(value);
    this[_].size++;
  }

  [Symbol.iterator]() {
    return this.values();
  }

  *keys() {
    const __ = this[_];
    let item: QueueItem<T> | null = __.head;
    let i = 0;
    while ((item = item.next) !== null && !__.cleared) {
      yield i++;
    }
  }

  *values(): Generator<T> {
    const __ = this[_];
    let item: QueueItem<T> | null = __.head;
    while ((item = item.next) !== null && !__.cleared) {
      yield item.value!;
    }
  }

  *entries(): Generator<[number, T]> {
    const __ = this[_];
    let item: QueueItem<T> | null = __.head;
    let i = 0;
    while ((item = item.next) !== null && !__.cleared) {
      yield [i, item.value!];
      i++;
    }
  }

  forEach(cb: (value: T, index: number, queue: Queue<T>) => unknown, thisArg: unknown) {
    if (thisArg != null) {
      cb = cb.bind(thisArg);
    }
    for (const [key, value] of this.entries()) cb(value, key, this);
  }
}
