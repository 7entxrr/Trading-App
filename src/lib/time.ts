/**
 * Centralised time handling.
 *
 * The trading system runs on IST (Asia/Kolkata, UTC+05:30, no DST). All
 * business logic must go through these helpers — never through the browser's
 * local timezone, because the phone running this dashboard may be anywhere.
 */

export const IST_OFFSET_MINUTES = 330;
export const MINUTES_PER_DAY = 1440;

/** Minutes elapsed since IST midnight for the given instant. */
export function istMinuteOfDay(date: Date): number {
  const shifted = new Date(date.getTime() + IST_OFFSET_MINUTES * 60_000);
  return shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
}

/** IST hour (0-23) for the given instant. */
export function istHour(date: Date): number {
  return Math.floor(istMinuteOfDay(date) / 60);
}

/**
 * Build the instant corresponding to an IST wall-clock time on the IST calendar
 * day of `reference`, optionally offset by whole days.
 */
export function istDateAt(reference: Date, minuteOfDay: number, dayOffset = 0): Date {
  const shifted = new Date(reference.getTime() + IST_OFFSET_MINUTES * 60_000);
  const istMidnightUtcMs = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
  );
  const targetMs = istMidnightUtcMs + (dayOffset * MINUTES_PER_DAY + minuteOfDay) * 60_000;
  return new Date(targetMs - IST_OFFSET_MINUTES * 60_000);
}

/** `1050` -> `"17:30"` */
export function formatMinuteOfDay(minuteOfDay: number): string {
  const normalised = ((minuteOfDay % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(normalised / 60);
  const minutes = normalised % 60;
  return `${pad(hours)}:${pad(minutes)}`;
}

/** `"17:30"` in IST. */
export function formatIstTime(input: Date | string): string {
  return formatMinuteOfDay(istMinuteOfDay(toDate(input)));
}

/** `"14 Sep, 17:30"` in IST. */
export function formatIstDateTime(input: Date | string): string {
  const date = toDate(input);
  const shifted = new Date(date.getTime() + IST_OFFSET_MINUTES * 60_000);
  const month = MONTHS[shifted.getUTCMonth()] ?? '';
  return `${shifted.getUTCDate()} ${month}, ${formatIstTime(date)}`;
}

/** Short relative label: `"now"`, `"4m ago"`, `"2h ago"`, `"3d ago"`. */
export function formatRelativeTime(input: Date | string, now: Date = new Date()): string {
  const diffSeconds = Math.round((now.getTime() - toDate(input).getTime()) / 1000);
  if (diffSeconds < 45) return 'now';
  if (diffSeconds < 3600) return `${Math.round(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86_400) return `${Math.round(diffSeconds / 3600)}h ago`;
  return `${Math.round(diffSeconds / 86_400)}d ago`;
}

/** `"in 2h 15m"` / `"in 40m"` — used for the next trading session countdown. */
export function formatDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** Time-of-day greeting, based on IST rather than device time. */
export function greetingForIst(date: Date = new Date()): string {
  const hour = istHour(date);
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

function toDate(input: Date | string): Date {
  return input instanceof Date ? input : new Date(input);
}
