import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  href: string;
  title: string;
  description?: string;
  icon: ReactNode;
  badge?: string;     // 
  disabled?: boolean; //
};

export default function ToolCard({ href, title, description, icon, badge, disabled }: Props) {
  const inner = (
    <div
      className={[
        "group relative h-full rounded-xl border border-[#e5e7eb] bg-white p-5",
        "shadow-sm transition-all duration-200 ease-out",
        "hover:shadow-md hover:-translate-y-0.5", // leve slide up
        disabled ? "opacity-60 pointer-events-none" : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="grid place-items-center w-11 h-11 rounded-lg bg-[#F5F5F5] border border-[#eee] text-[#D17C22]">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-[#111827] truncate">{title}</h3>
          {description && <p className="text-[13px] text-[#6b7280] line-clamp-2 mt-0.5">{description}</p>}
        </div>
        {badge && (
          <span className="ml-2 shrink-0 rounded-full bg-[#8E8D29]/10 text-[#44500f] px-2 py-0.5 text-[11px] font-medium">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="h-1 w-24 rounded bg-[#F5F5F5] group-hover:w-28 transition-[width]" />
        {!disabled && (
          <span className="text-[12px] text-[#8E8D29] opacity-0 group-hover:opacity-100 transition">Abrir →</span>
        )}
      </div>
    </div>
  );

  if (disabled) return inner;
  return (
    <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-[#D17C22]/30 rounded-xl">
      {inner}
    </Link>
  );
}
