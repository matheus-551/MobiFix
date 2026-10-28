import { Loader2 } from "lucide-react";

export function LoadingScreen({ label = "Carregando..." }: { label?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6f8]">
      <p role="status" className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 aria-hidden className="h-4 w-4 animate-spin text-orange-500" />
        {label}
      </p>
    </main>
  );
}
