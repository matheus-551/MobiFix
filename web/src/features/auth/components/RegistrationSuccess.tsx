"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/shared/components/Button";

interface RegistrationSuccessProps {
  title: string;
  message: string;
  /** Redireciona sozinho após alguns segundos; o botão permite ir na hora. */
  onContinue: () => void;
  continueLabel: string;
}

export function RegistrationSuccess({ title, message, onContinue, continueLabel }: RegistrationSuccessProps) {
  const delay = 2500;
  useEffect(() => {
    const timer = setTimeout(onContinue, delay);
    return () => clearTimeout(timer);
  }, [onContinue, delay]);

  return (
    <div className="space-y-5 text-center" role="status">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
        <CheckCircle2 aria-hidden className="h-7 w-7" />
      </span>
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        <p className="mt-1 text-sm text-gray-600">{message}</p>
      </div>
      <Button onClick={onContinue}>{continueLabel}</Button>
    </div>
  );
}
