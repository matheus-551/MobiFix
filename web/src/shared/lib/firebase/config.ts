import type { FirebaseOptions } from "firebase/app";

/**
 * As variáveis precisam ser referenciadas literalmente (process.env.NEXT_PUBLIC_X)
 * para que o Next.js as substitua no bundle do navegador.
 */
const rawConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const;

const ENV_NAMES: Record<keyof typeof rawConfig, string> = {
  apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "NEXT_PUBLIC_FIREBASE_APP_ID",
};

export class FirebaseConfigError extends Error {
  constructor(public readonly missing: string[]) {
    super(
      `Configuração do Firebase incompleta. Defina em .env.local: ${missing.join(", ")}. ` +
        "Use .env.example como modelo e reinicie o servidor de desenvolvimento.",
    );
    this.name = "FirebaseConfigError";
  }
}

/** Valida as variáveis obrigatórias e devolve a configuração do SDK web. */
export function getFirebaseConfig(): FirebaseOptions {
  const missing = (Object.keys(rawConfig) as Array<keyof typeof rawConfig>)
    .filter((key) => !rawConfig[key])
    .map((key) => ENV_NAMES[key]);

  if (missing.length > 0) {
    throw new FirebaseConfigError(missing);
  }

  return { ...rawConfig };
}
