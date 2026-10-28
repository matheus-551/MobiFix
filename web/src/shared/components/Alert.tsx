import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

const TONES = {
  error: { box: "border-red-200 bg-red-50 text-red-800", Icon: AlertCircle, role: "alert" },
  success: { box: "border-green-200 bg-green-50 text-green-800", Icon: CheckCircle2, role: "status" },
  info: { box: "border-orange-200 bg-orange-50 text-orange-900", Icon: Info, role: "status" },
} as const;

export function Alert({ tone, children }: { tone: keyof typeof TONES; children: ReactNode }) {
  const { box, Icon, role } = TONES[tone];
  return (
    <div role={role} className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${box}`}>
      <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
