/**
 * Port di src/app/helper.ts dall'app Angular (onezoneweb_20251219).
 * Semantica identica: queste funzioni sono usate ovunque nei payload e nei check.
 */

export function isString(oItem: unknown): boolean {
  return typeof oItem === "string";
}

export function isset(val: unknown, bLengthCheck: boolean = false): boolean {
  if (val !== undefined && val !== null && val !== "undefined" && val !== "null") {
    if (
      bLengthCheck &&
      // Strings dürfen nicht leer sein
      ((isString(val) && (val as string).length === 0) ||
        // Objekte müssen Keys besitzen
        (val !== null &&
          typeof val === "object" &&
          Object.keys(val as object).length === 0) ||
        // Arrays müssen Elemente enthalten
        (Array.isArray(val) && (val as unknown[]).length === 0))
    ) {
      return false;
    }
    return true;
  }
  return false;
}

export function isTrue(oValue: unknown): boolean {
  return oValue === "true" || oValue === "1" || oValue === true || oValue === 1;
}

export function trim<T>(oItem: T): T {
  if (isString(oItem)) {
    return (oItem as unknown as string).trim() as unknown as T;
  }
  return oItem;
}

export function convertStringToJSON<T>(sJSON: string, oDefault: T): T {
  try {
    if (isset(sJSON) && sJSON.length > 0) {
      sJSON = sJSON.replace(/(?:\r\n|\r|\n)/g, "");
      return JSON.parse(sJSON) as T;
    }
    return oDefault;
  } catch (error) {
    console.log(error);
    return oDefault;
  }
}

export function clone<T>(oItem: T): T {
  return JSON.parse(JSON.stringify(oItem)) as T;
}

export function normalizeTimestamp(iValue: number): number {
  if (isNaN(iValue)) {
    return iValue;
  }
  if (iValue > 9999999999) {
    return Math.trunc(iValue / 1000);
  }
  return Math.trunc(iValue);
}

export function padStart<T>(sString: T, iLength: number, sPad: string): string {
  let sOutput: string = String(sString);
  while (sOutput.length < iLength) {
    sOutput = sPad + sOutput;
  }
  return sOutput;
}

export function getDatetimeFromTimestamp(
  iTimestamp: number,
  bTime: boolean = true,
  bDate: boolean = true,
  bWeekday: boolean = false,
): string {
  let sDate: string = "";
  let sTime: string = "";
  const dtDate: Date = new Date(normalizeTimestamp(iTimestamp) * 1000);
  if (bDate) {
    if (bWeekday) {
      const aWeekdayShort: string[] = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
      sDate += aWeekdayShort[dtDate.getDay()] + " ";
    }
    sDate += padStart(String(dtDate.getDate()), 2, "0") + ".";
    sDate +=
      padStart(String(dtDate.getMonth() + 1), 2, "0") + "." + String(dtDate.getFullYear());
  }
  if (bTime) {
    sTime += " ";
    sTime += padStart(String(dtDate.getHours()), 2, "0") + ":";
    sTime += padStart(String(dtDate.getMinutes()), 2, "0") + ":";
    sTime += padStart(String(dtDate.getSeconds()), 2, "0");
  }
  return (sDate + sTime).trim();
}

export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
