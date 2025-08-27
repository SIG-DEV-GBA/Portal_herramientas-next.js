import { NextResponse } from "next/server";
import { fetchFichasFromSelf } from "@/lib/fetch-internal";
import { getOnline, getPortalPrincipal } from "@/lib/stats-mappers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { items } = await fetchFichasFromSelf(req, "page=1&pageSize=10000");

    const init = () => ({ directo: 0, si: 0, no: 0, total: 0 });
    const out: Record<string, ReturnType<typeof init>> = {
      mayores: init(), discapacidad: init(), familia: init(), mujer: init(), salud: init(),
    };

    for (const row of items as any[]) {
      const p = getPortalPrincipal(row);
      const o = getOnline(row);
      if (!p || !o) continue;
      (out[p] as any)[o] += 1;
      out[p].total += 1;
    }

    const global = Object.values(out).reduce(
      (acc, v) => ({ directo: acc.directo + v.directo, si: acc.si + v.si, no: acc.no + v.no, total: acc.total + v.total }),
      { directo: 0, si: 0, no: 0, total: 0 }
    );

    return NextResponse.json({ por_portal: out, total: global });
  } catch (e: any) {
    return NextResponse.json(
      { error: "stats/tramite-online failed", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}
