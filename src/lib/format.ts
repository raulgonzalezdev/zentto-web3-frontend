import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";

dayjs.extend(relativeTime);
dayjs.locale("es");

/** Acorta una address/hash: 0x1234…abcd */
export function shortHash(value?: string | null, head = 8, tail = 6): string {
  if (!value) return "—";
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

/** Formatea un monto en la unidad nativa (ZW3). */
export function formatAmount(n?: number | null): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "0";
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 8 }).format(n);
}

/** Convierte timestamp (segundos, ms o ISO) a fecha legible. */
function toDate(ts?: number | string | null) {
  if (ts === null || ts === undefined) return null;
  if (typeof ts === "number") {
    // heuristica: < 10^12 lo tratamos como segundos
    return dayjs(ts < 1e12 ? ts * 1000 : ts);
  }
  return dayjs(ts);
}

export function formatDate(ts?: number | string | null): string {
  const d = toDate(ts);
  return d && d.isValid() ? d.format("DD/MM/YYYY HH:mm:ss") : "—";
}

export function fromNow(ts?: number | string | null): string {
  const d = toDate(ts);
  return d && d.isValid() ? d.fromNow() : "—";
}
