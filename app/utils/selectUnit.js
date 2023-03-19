
const MS_PER_SECOND = 1e3;
const SECS_PER_MIN = 60;
const SECS_PER_HOUR = SECS_PER_MIN * 60;
const SECS_PER_DAY = SECS_PER_HOUR * 24;
const SECS_PER_WEEK = SECS_PER_DAY * 7;
const SECS_PER_MONTH = SECS_PER_DAY * 31;
const SECS_PER_YEAR = SECS_PER_DAY * 366;

const DEFAULT_THRESHOLDS = {
  second: 55, // seconds to minute
  minute: 55, // minutes to hour
  hour: 23, // hour to day
  day: 6 // day to week
};

export function selectUnit(
  from,
  to = Date.now(),
  thresholds = {}
) {
  const resolvedThresholds = {
    ...DEFAULT_THRESHOLDS,
    ...(thresholds || {}),
  };
  const secs = (+from - +to) / MS_PER_SECOND;
  if (Math.abs(secs) < resolvedThresholds.second) {
    return {
      value: Math.round(secs),
      unit: 'second',
    };
  }
  const mins = secs / SECS_PER_MIN;
  if (Math.abs(mins) < resolvedThresholds.minute) {
    return {
      value: Math.round(mins),
      unit: 'minute',
    };
  }
  const hours = secs / SECS_PER_HOUR;
  if (Math.abs(hours) < resolvedThresholds.hour) {
    return {
      value: Math.round(hours),
      unit: 'hour',
    };
  }

  const days = secs / SECS_PER_DAY;
  if (Math.abs(days) < resolvedThresholds.day) {
    return {
      value: Math.round(days),
      unit: 'day',
    };
  }

  const years = secs / SECS_PER_YEAR
  if (Math.abs(years) >= 1) {
    return {
      value: Math.round(years),
      unit: 'year',
    };
  }

  let months = secs / SECS_PER_MONTH
  if (Math.abs(months) >= 1) {
    months = Math.round(months)
    if (months > 11) months = 11
    if (months < -11) months = -11
    return {
      value: months,
      unit: 'month',
    };
  }

  const weeks = secs / SECS_PER_WEEK;

  return {
    value: Math.round(weeks),
    unit: 'week',
  };
}
