"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { applyActionCode } from "firebase/auth";
import { CheckCircle2, Loader2 } from "lucide-react";
import { routes } from "@/routes";
import { Alert } from "@/shared/components/Alert";
import { getFirebaseAuth } from "@/shared/lib/firebase/client";
import { getErrorMessage } from "@/shared/utils/firebaseErrors";
import { useAuth } from "../hooks/useAuth";
import { notifyEmailVerified } from "../utils/authChannel";
import { homeForRole } from "../utils/homeFor";

type Phase = { name: "working" } | { name: "done" } | { name: "error"; message: string };

/** Link "verifyEmail" do Firebase: `applyActionCode` confirma o endereço no Authentication. */
export function VerifyEmailAction({ oobCode }: { oobCode: string }) {
  const { user, account, refresh } = useAuth();
  const [phase, setPhase] = useState<Phase>({ name: "working" });
  // applyActionCode é de uso único: protege contra a dupla execução de efeitos do React em desenvolvimento.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    applyActionCode(getFirebaseAuth(), oobCode)
      .then(() => {
        notifyEmailVerified();
        setPhase({ name: "done" });
      })
      .catch((error) => setPhase({ name: "error", message: getErrorMessage(error) }));
  }, [oobCode]);

  // Mesmo navegador logado: atualiza o estado local e renova o ID Token para liberar o acesso na hora.
  useEffect(() => {
    if (phase.name === "done" && user) void refresh().catch(() => undefined);
  }, [phase.name, user, refresh]);

  if (phase.name === "working") {
    return (
      <p role="status" className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Loader2 aria-hidden className="h-4 w-4 animate-spin text-orange-500" />
        Confirmando seu e-mail...
      </p>
    );
  }

  if (phase.name === "error") {
    return (
      <div className="space-y-5">
        <Alert tone="error">{phase.message}</Alert>
        <p className="text-center text-sm text-gray-500">
          Se você já confirmou, basta entrar. Caso contrário, entre para solicitar um novo link.
        </p>
        <Link href={routes.login} className="block text-center text-sm font-semibold text-orange-500 hover:underline">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-center" role="status">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
        <CheckCircle2 aria-hidden className="h-7 w-7" />
      </span>
      <div>
        <h1 className="text-lg font-bold text-gray-900">E-mail verificado!</h1>
        <p className="mt-1 text-sm text-gray-600">Seu endereço foi confirmado e sua conta está liberada.</p>
      </div>
      <Link
        href={user ? homeForRole(account?.role ?? "client") : routes.login}
        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-orange-500 px-5 text-sm font-semibold text-white hover:bg-orange-600"
      >
        {user ? "Continuar" : "Entrar"}
      </Link>
    </div>
  );
}
