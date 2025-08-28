"use client";
import React, { useState } from "react";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

type Slide = { key: string; node: React.ReactNode };

export default function ChartCarousel({ slides }: { slides: Slide[] }) {
  const [idx, setIdx] = useState(0);
  const total = slides.length;

  const go = (n: number) => setIdx((i) => (i + n + total) % total);
  const goto = (n: number) => setIdx(n);

  return (
    <div className="relative w-full min-w-0">
      <div className="overflow-hidden rounded-2xl min-w-0">
        <div
          className="flex transition-transform duration-500 ease-in-out min-w-0"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {slides.map((s) => (
            <div key={s.key} className="w-full flex-shrink-0 min-w-0">
              {s.node}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex gap-2">
          {slides.map((s, i) => (
            <button
              key={s.key}
              onClick={() => goto(i)}
              className={cx(
                "h-2.5 w-2.5 rounded-full transition",
                i === idx ? "bg-gray-800" : "bg-gray-300 hover:bg-gray-400"
              )}
              aria-label={`Ir a ${s.key}`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => go(-1)}
            className="rounded-lg p-1 text-gray-600 hover:bg-gray-100"
            aria-label="Anterior"
          >
            ◀
          </button>
          <button
            onClick={() => go(1)}
            className="rounded-lg p-1 text-gray-600 hover:bg-gray-100"
            aria-label="Siguiente"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}
