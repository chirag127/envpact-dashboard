/**
 * Dual-render timestamp helper (SHARED_SPEC §1.5).
 *
 * Vault `_modified_at` values are canonical ISO-8601 UTC strings
 * (Z-suffix). Every UI surface that asks the user to compare two
 * timestamps (e.g. conflict prompts) must show BOTH the canonical
 * UTC and the Asia/Kolkata (IST) equivalent.
 *
 * IST rendering is host-TZ independent: we always pin
 * `timeZone: 'Asia/Kolkata'` via Intl.DateTimeFormat('en-IN', …),
 * regardless of the browser's local timezone.
 *
 * Returned shape:
 *   {
 *     utc: "2026-06-19T07:30:00.000Z",      // canonical, exactly as stored
 *     ist: "2026-06-19 13:00:00 IST",       // formatted IST
 *   }
 *
 * The dashboard does not surface conflict prompts (no local `.env`),
 * so `recommendedSide` from the spec helper signature is intentionally
 * not produced here — it is determined at the prompt site.
 */

const IST_TZ = 'Asia/Kolkata';
const IST_LOCALE = 'en-IN';

const istDateFormatter = new Intl.DateTimeFormat(IST_LOCALE, {
  timeZone: IST_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

/**
 * Format an ISO-8601 UTC timestamp as both UTC and IST strings.
 * Returns null when the input is not a parseable ISO string —
 * callers decide how to render the missing case.
 */
export function formatTimestamp(iso) {
  if (typeof iso !== 'string' || iso === '') return null;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  const d = new Date(ms);

  // UTC: keep the canonical ISO string verbatim — it's what the vault
  // stores and what consumers use for conflict comparison.
  const utc = iso;

  // IST: forced to Asia/Kolkata regardless of host TZ.
  const parts = istDateFormatter.formatToParts(d).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  let hour = parts.hour;
  // Some Intl runtimes emit "24" for midnight in hour12:false mode.
  if (hour === '24') hour = '00';
  const ist = `${parts.year}-${parts.month}-${parts.day} ${hour}:${parts.minute}:${parts.second} IST`;

  return { utc, ist };
}
