import type { ReactNode } from "react";
import { BrandLogo } from "./BrandLogo";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f5f6f8] px-4 py-10">
      <article className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <BrandLogo />
        </div>
        <h1 className="mb-4 text-xl font-bold text-gray-900">{title}</h1>
        <div className="space-y-3 text-sm text-gray-600">{children}</div>
      </article>
    </main>
  );
}
