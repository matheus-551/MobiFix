#!/usr/bin/env node
/**
 * Sincroniza `firebase/firestore.rules` com a chave NEXT_PUBLIC_EMAIL_VERIFICATION_ENABLED.
 *
 *   npm run rules:email                      → lê o valor de process.env ou de .env.local / .env
 *   node geradores/aplicarVerificacaoEmail.mjs true|false   → força o valor
 *
 * Só reescreve a função `emailVerified()` (entre os marcadores EMAIL_VERIFICATION:BEGIN/END).
 * Depois de rodar, publique as regras: `firebase deploy --only firestore:rules`.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rulesPath = join(root, "firebase", "firestore.rules");
const KEY = "NEXT_PUBLIC_EMAIL_VERIFICATION_ENABLED";

function parseFlag(value, fallback) {
  const v = String(value ?? "").trim().toLowerCase();
  if (["true", "1", "yes", "on", "sim"].includes(v)) return true;
  if (["false", "0", "no", "off", "nao", "não"].includes(v)) return false;
  return fallback;
}

function readFromEnvFiles() {
  for (const name of [".env.local", ".env"]) {
    const file = join(root, name);
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = line.match(new RegExp(`^\\s*${KEY}\\s*=\\s*(.*?)\\s*$`));
      if (match) return match[1].replace(/^["']|["']$/g, "");
    }
  }
  return undefined;
}

const enabled = parseFlag(process.argv[2] ?? process.env[KEY] ?? readFromEnvFiles(), true);

const body = enabled
  ? "return signedIn() && request.auth.token.email_verified == true;"
  : "return signedIn();";

const note = enabled
  ? "// Verificação ATIVA: exige o claim email_verified do ID Token."
  : "// Verificação DESATIVADA: basta estar autenticado (NEXT_PUBLIC_EMAIL_VERIFICATION_ENABLED=false).";

const pattern = /([ \t]*)\/\/ \[EMAIL_VERIFICATION:BEGIN\][\s\S]*?\/\/ \[EMAIL_VERIFICATION:END\]/;
const original = readFileSync(rulesPath, "utf8");
const eol = original.includes("\r\n") ? "\r\n" : "\n";

if (!pattern.test(original)) {
  console.error("Marcadores [EMAIL_VERIFICATION:BEGIN/END] não encontrados em firebase/firestore.rules.");
  process.exit(1);
}

const updated = original.replace(pattern, (_all, indent) =>
  [
    `${indent}// [EMAIL_VERIFICATION:BEGIN] gerenciado por geradores/aplicarVerificacaoEmail.mjs (npm run rules:email)`,
    `${indent}${note}`,
    `${indent}function emailVerified() {`,
    `${indent}  ${body}`,
    `${indent}}`,
    `${indent}// [EMAIL_VERIFICATION:END]`,
  ].join(eol),
);

if (updated !== original) writeFileSync(rulesPath, updated);
console.log(
  `firestore.rules → verificação de e-mail ${enabled ? "ATIVADA" : "DESATIVADA"}` +
    (updated === original ? " (já estava assim)." : " (arquivo atualizado). Publique: firebase deploy --only firestore:rules"),
);
