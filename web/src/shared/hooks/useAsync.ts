"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Settled<T> {
  key: string;
  data: T | null;
  error: unknown;
}

/**
 * Executa `loader` sempre que `key` mudar (ou `reload()` for chamado) e descarta respostas atrasadas.
 * `loading` é derivado: fica verdadeiro enquanto o resultado em mãos não corresponde à chave atual.
 */
export function useAsync<T>(loader: () => Promise<T>, key: string, enabled = true) {
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const [token, setToken] = useState(0);
  const loaderRef = useRef(loader);
  const fullKey = `${key}#${token}`;

  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    loaderRef.current().then(
      (data) => {
        if (!cancelled) setSettled({ key: fullKey, data, error: null });
      },
      (error: unknown) => {
        if (!cancelled) setSettled({ key: fullKey, data: null, error });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [fullKey, enabled]);

  const reload = useCallback(() => setToken((current) => current + 1), []);
  const ready = settled !== null && settled.key === fullKey;

  return {
    data: ready ? settled.data : null,
    error: ready ? settled.error : null,
    loading: enabled && !ready,
    reload,
  };
}
