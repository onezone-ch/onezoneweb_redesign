/**
 * Validator del form automation — port 1:1 da automation-form.component.ts.
 * Tutte funzioni pure: (valore, contesto) → codice errore | null.
 * Codici: required | pattern | email | emailPlus | plzNotFound | areaNotFound |
 * addressNotFromApi | obviousSerial | minAge | minArrayLength
 */

export const DATE_RE = /^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.(19\d{2}|20[0-2]\d)$/;
export const MONTH_YEAR_RE = /^(0[1-9]|1[0-2])\.(19\d{2}|20[0-2]\d)$/;
export const N_CERT_RE = /^\d[A-Za-z]{2}\d{3}$/;
export const SERIAL_RE = /^\d{9}$/;
export const PHONE_RE = /^\d{9,10}$/;
export const PLZ_RE = /^\d{4}$/;
// Validators.email di Angular (semplificato equivalente)
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseDdMmYyyy(value: string): Date | null {
  if (!value) return null;
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  if (!match) return null;
  const dd = Number(match[1]);
  const mm = Number(match[2]);
  const yyyy = Number(match[3]);
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return d;
}

export function noPlusEmail(value: string): boolean {
  return !value || !value.includes("+");
}

/** true = seriale "ovvio" (tutte cifre uguali o sequenza cresc./decresc.) */
export function isObviousSerial(value: string): boolean {
  const digits = (value ?? "").toString();
  if (digits.length < 2) return false;
  if (new Set(digits).size === 1) return true;
  const diffs = new Set<number>();
  for (let i = 0; i < digits.length - 1; i++) {
    const a = digits.charCodeAt(i) - 48;
    const b = digits.charCodeAt(i + 1) - 48;
    if (a < 0 || a > 9 || b < 0 || b > 9) return false;
    diffs.add((b - a + 10) % 10);
  }
  return diffs.size === 1 && (diffs.has(1) || diffs.has(9));
}

/** Età (in anni compiuti) alla data di riferimento. */
function ageAt(birth: Date, at: Date): number {
  let age = at.getFullYear() - birth.getFullYear();
  const monthDiff = at.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && at.getDate() < birth.getDate())) age--;
  return age;
}

/** minAgeFromTodayValidator(18): età di birth_date a oggi ≥ 18. */
export function violatesMinAgeFromToday(birthValue: string, minAge = 18): boolean {
  const birthDate = parseDdMmYyyy(birthValue);
  if (!birthDate) return false;
  return ageAt(birthDate, new Date()) < minAge;
}

/** minAgeValidator(18): età alla data patente rispetto a birth_date ≥ 18. */
export function violatesMinAgeAtLicense(
  licenseValue: string,
  birthValue: string,
  minAge = 18,
): boolean {
  const licenseDate = parseDdMmYyyy(licenseValue);
  const birthDate = parseDdMmYyyy(birthValue);
  if (!licenseDate || !birthDate) return false;
  return ageAt(birthDate, licenseDate) < minAge;
}

/** Formattazione live gg.mm.aaaa (port di onDateInput). */
export function formatDateInput(raw: string, isBackspace: boolean): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length > 8) digits = digits.substring(0, 8);
  let formatted = "";
  for (let i = 0; i < digits.length; i++) {
    if (i === 2 || i === 4) formatted += ".";
    formatted += digits[i];
  }
  if (!isBackspace && (digits.length === 2 || digits.length === 4)) formatted += ".";
  return formatted;
}

/** Formattazione live mm.aaaa (port di onMonthYearInput). */
export function formatMonthYearInput(raw: string, isBackspace: boolean): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length > 6) digits = digits.substring(0, 6);
  let formatted = "";
  for (let i = 0; i < digits.length; i++) {
    if (i === 2) formatted += ".";
    formatted += digits[i];
  }
  if (!isBackspace && digits.length === 2) formatted += ".";
  return formatted;
}
