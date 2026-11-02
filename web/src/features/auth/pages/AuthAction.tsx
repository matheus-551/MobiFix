"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { routes } from "@/routes";
import { Alert } from "@/shared/components/Alert";
import { AuthPage } from "@/shared/components/AuthCard";
import { BrandLogo } from "@/shared/components/BrandLogo";
import { ResetPasswordAction } from "../components/ResetPasswordAction";
import { VerifyEmailAction } from "../components/VerifyEmailAction";
import { parseAuthActionParams } from "../utils/authActionParams";

/**
 * Página própria das ações do Firebase (URL de ação dos modelos de e-mail no Console):
 * `/auth/acao?mode=verifyEmail|resetPassword&oobCode=...`.
 * O `continueUrl` enviado pelo Firebase é ignorado de propósito (evita redirecionamento aberto).
 */
export default function AuthAction() {
  const params = parseAuthActionParams(useSearchParams());

  return (
    <AuthPage>
      <div className="mb-5 text-center">
        <BrandLogo />
      </div>
      {!params ? (
        <div className="space-y-5">
          <Alert tone="error">Este link é inválido ou está incompleto. Solicite um novo e-mail.</Alert>
          <Link href={routes.login} className="block text-center text-sm font-semibold text-orange-500 hover:underline">
            Ir para o login
          </Link>
        </div>
      ) : params.mode === "verifyEmail" ? (
        <VerifyEmailAction oobCode={params.oobCode} />
      ) : (
        <ResetPasswordAction oobCode={params.oobCode} />
      )}
    </AuthPage>
  );
}
