import { NextResponse } from "next/server";
import { fetchFichasFromSelf } from "@/lib/fetch-internal";
import { getMonthIndex, getExclusiva, isVariosPortales } from "@/lib/stats-mappers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { items } = await fetchFichasFromSelf(req, "page=1&pageSize=10000");

    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const out = months.map((m) => ({
      mes: m,
      total: 0,
      exclusivas: { mayores: 0, discapacidad: 0, familia: 0, mujer: 0, salud: 0 },
      varios_portales: 0,
    }));

    for (const row of items as any[]) {
      const mes = getMonthIndex(row);
      if (mes < 1 || mes > 12) continue;
      const acc = out[mes - 1];
      acc.total += 1;

      const exc = getExclusiva(row);
      if (exc && exc !== "varios") {
        (acc.exclusivas as any)[exc] += 1;
      } else if (isVariosPortales(row)) {
        acc.varios_portales += 1;
      }
    }

    const total_anual = out.reduce((s, r) => s + r.total, 0);
    return NextResponse.json({ items: out, total_anual });
  } catch (e: any) {
    return NextResponse.json(
      { error: "stats/fichas-por-mes failed", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}
