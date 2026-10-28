import type { ReactNode } from "react";

/** Cartão branco centralizado sobre fundo cinza-claro, usado por todas as telas de autenticação. */
export function AuthPage({ children, width = "max-w-md" }: { children: ReactNode; width?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6f8] px-4 py-8">
      <section className={`w-full ${width} rounded-2xl border border-gray-100 bg-white px-6 py-8 shadow-sm sm:px-10`}>
        {children}
      </section>
    </main>
  );
}
