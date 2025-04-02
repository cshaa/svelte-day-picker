import type { Temporal } from '@js-temporal/polyfill';
import { PlainDate, toPlainDate, type DayOfWeek } from './date';

type D = PlainDate | Date;

export type Matcher =
  | boolean
  | D
  | { dayOfWeek: DayOfWeek }
  | { after: D }
  | { before: D }
  | {
      after: D;
      before: D;
      dayOfWeek?: DayOfWeek;
    }
  | { from: D }
  | { to: D }
  | {
      from: D;
      to: D;
      dayOfWeek?: DayOfWeek;
    }
  | ((day: PlainDate) => boolean);

export function dayMatches(
  day: D,
  matchers: Matcher[],
  timeZone: Temporal.TimeZoneLike,
  calendar: Temporal.CalendarLike
): boolean {
  const t = (date: D) => (date instanceof Date ? toPlainDate(date, timeZone, calendar) : date);
  const d = t(day);

  function check(matcher: Matcher): boolean {
    if (typeof matcher === 'boolean') return matcher;
    if (typeof matcher === 'function') return matcher(d);
    if ('dayOfWeek' in matcher && d.dayOfWeek !== matcher.dayOfWeek) return false;
    if ('from' in matcher && PlainDate.lt(d, t(matcher.from))) return false;
    if ('after' in matcher && PlainDate.lte(d, t(matcher.after))) return false;
    if ('to' in matcher && PlainDate.gt(d, t(matcher.to))) return false;
    if ('before' in matcher && PlainDate.gte(d, t(matcher.before))) return false;
    return true;
  }

  return matchers.some(check);
}
