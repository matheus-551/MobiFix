import Link from "next/link";
import { routes } from "@/routes";

/** Alternância Cliente / Prestador do protótipo: cada aba é uma rota (cadastros distintos). */
export function RoleTabs({ active }: { active: "client" | "provider" }) {
  const base = "flex-1 rounded-md px-3 py-2 text-center text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400";
  const on = "bg-white text-orange-500 shadow-sm";
  const off = "text-gray-500 hover:text-gray-700";
  return (
    <nav aria-label="Tipo de conta" className="mb-6 flex rounded-lg bg-gray-100 p-1">
      <Link href={routes.signup} aria-current={active === "client" ? "page" : undefined} className={`${base} ${active === "client" ? on : off}`}>
        Cliente
      </Link>
      <Link href={routes.providerSignup} aria-current={active === "provider" ? "page" : undefined} className={`${base} ${active === "provider" ? on : off}`}>
        Prestador
      </Link>
    </nav>
  );
}