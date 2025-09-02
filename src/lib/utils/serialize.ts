import { Prisma } from "@prisma/client";

export function serialize<T>(data: T): T {
  return deep(data) as T;
}

function deep(v: any): any {
  if (v === null || v === undefined) return v;

  // ✅ números grandes y decimales
  if (typeof v === "bigint") return v.toString();
  if (v instanceof Prisma.Decimal) return v.toString();

  // ✅ fechas (conserva el ISO)
  if (v instanceof Date) return v.toISOString();

  if (Array.isArray(v)) return v.map(deep);

  if (typeof v === "object") {
    // Si el objeto sabe serializarse, respétalo
    if (typeof (v as any).toJSON === "function") return (v as any).toJSON();
    const out: any = {};
    for (const [k, val] of Object.entries(v)) out[k] = deep(val);
    return out;
  }
  return v;
}
