import { NextResponse } from "next/server";
import { fetchFichasFromSelf } from "@/lib/fetch-internal";
import { getAmbito, getPortalPrincipal } from "@/lib/stats-mappers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { items } = await fetchFichasFromSelf(req, "page=1&pageSize=10000");

    const init = () => ({ estado: 0, ccaa: 0, provincia: 0, municipal: 0, total: 0 });
    const out: Record<string, ReturnType<typeof init>> = {
      mayores: init(), discapacidad: init(), familia: init(), mujer: init(), salud: init(),
    };

    for (const row of items as any[]) {
      const p = getPortalPrincipal(row);
      const a = getAmbito(row);
      if (!p || !a) continue;
      out[p][a] += 1;
      out[p].total += 1;
    }

    return NextResponse.json({ por_portal: out });
  } catch (e: any) {
    return NextResponse.json(
      { error: "stats/ambitos-por-portal failed", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}
