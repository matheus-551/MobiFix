import Link from "next/link";
import { Wrench } from "lucide-react";
import { routes } from "@/routes";

export function BrandLogo({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <Link
      href={routes.home}
      aria-label="MobiFix - página inicial"
      className="inline-flex items-center justify-center gap-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
    >
      <Wrench aria-hidden className={size === "lg" ? "h-7 w-7 text-orange-500" : "h-6 w-6 text-orange-500"} />
      <span className={`${size === "lg" ? "text-3xl" : "text-2xl"} font-extrabold text-orange-500`}>MobiFix</span>
    </Link>
  );
}
