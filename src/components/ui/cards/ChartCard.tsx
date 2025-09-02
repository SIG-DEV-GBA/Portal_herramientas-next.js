"use client";
import React from "react";

export default function ChartCard({ title, hint, loading, children }: { title: string; hint?: string; loading?: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-end justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {hint && <p className="text-xs text-gray-500">{hint}</p>}
        </div>
        <div className="text-xs text-gray-500">{loading ? "Cargando…" : null}</div>
      </div>
      {children}
    </div>
  );
}
