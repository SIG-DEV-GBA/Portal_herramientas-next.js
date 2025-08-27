import { NextResponse } from "next/server";
import { fetchFichasFromSelf } from "@/lib/fetch-internal";
import { getMonthIndex, getPortalPrincipal } from "@/lib/stats-mappers";

export const dynamic = "force-dynamic";
const PORTALES = ["mayores","discapacidad","familia","mujer","salud"] as const;

export async function GET(req: Request) {
  try {
    const { items } = await fetchFichasFromSelf(req, "page=1&pageSize=10000");

    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const out = months.map((m) => ({
      mes: m,
      mayores: 0, discapacidad: 0, familia: 0, mujer: 0, salud: 0,
      total_mes: 0,
    }));

    for (const row of items as any[]) {
      const mes = getMonthIndex(row);
      if (mes < 1 || mes > 12) continue;
      const portal = getPortalPrincipal(row);
      if (!portal) continue;

      (out[mes - 1] as any)[portal] += 1;
      out[mes - 1].total_mes += 1;
    }

    const totales = PORTALES.reduce((acc, p) => ({ ...acc, [p]: out.reduce((s, r) => s + (r as any)[p], 0) }), {} as any);
    const total_global = out.reduce((s, r) => s + r.total_mes, 0);

    return NextResponse.json({ items: out, totales, total_global });
  } catch (e: any) {
    return NextResponse.json(
      { error: "stats/portales-por-mes failed", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}
