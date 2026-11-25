"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAsync } from "@/shared/hooks/useAsync";
import { listClientAppointments } from "../services/appointmentService";
import { listReviewedAppointmentIds } from "../services/reviewService";
import { buildNotifications, type ClientNotification } from "../utils/notifications";
import { useClient } from "./ClientContext";

export interface NotificationsContextValue {
  notifications: readonly ClientNotification[];
  readIds: ReadonlySet<string>;
  unreadCount: number;
  /** Só é verdadeiro até a PRIMEIRA carga terminar (recargas ao navegar não piscam a tela). */
  loading: boolean;
  error: unknown;
  reload: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function useNotifications(): NotificationsContextValue {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("useNotifications deve ser usado dentro de <ClientArea>.");
  return context;
}

/** "Lida" é um estado só deste navegador (a API não tem o recurso); fica no localStorage, por usuário. */
const storageKeyFor = (uid: string) => `mobifix:notifications-read:${uid}`;

function loadReadIds(uid: string): ReadonlySet<string> {
  try {
    const raw = window.localStorage.getItem(storageKeyFor(uid));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []);
  } catch {
    return new Set();
  }
}

function saveReadIds(uid: string, ids: ReadonlySet<string>) {
  try {
    window.localStorage.setItem(storageKeyFor(uid), JSON.stringify([...ids]));
  } catch {
    /* armazenamento indisponível (modo privado/cota): o estado vale só nesta sessão */
  }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { uid } = useClient();
  const pathname = usePathname();
  const [readIds, setReadIds] = useState<ReadonlySet<string>>(() =>
    typeof window === "undefined" || !uid ? new Set() : loadReadIds(uid),
  );
  const [lastData, setLastData] = useState<ClientNotification[] | null>(null);

  // A chave inclui a rota: navegar (ex.: depois de agendar ou cancelar) busca os avisos de novo.
  const { data, error, loading, reload } = useAsync(
    async () => {
      const [appointments, reviewed] = await Promise.all([listClientAppointments(uid), listReviewedAppointmentIds(uid)]);
      return buildNotifications(appointments, new Set(reviewed));
    },
    `notifications:${uid}:${pathname}`,
    uid !== "",
  );

  // Guarda a última carga boa para o selo do sino não sumir enquanto a próxima carga acontece.
  if (data !== null && data !== lastData) setLastData(data);
  const notifications = useMemo(() => data ?? lastData ?? [], [data, lastData]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !readIds.has(item.id)).length,
    [notifications, readIds],
  );

  const markRead = useCallback(
    (id: string) => {
      if (readIds.has(id)) return;
      const next = new Set<string>(readIds).add(id);
      setReadIds(next);
      saveReadIds(uid, next);
    },
    [readIds, uid],
  );

  const markAllRead = useCallback(() => {
    const next = new Set<string>([...readIds, ...notifications.map((item) => item.id)]);
    setReadIds(next);
    saveReadIds(uid, next);
  }, [readIds, notifications, uid]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      readIds,
      unreadCount,
      loading: loading && lastData === null,
      error,
      reload,
      markRead,
      markAllRead,
    }),
    [notifications, readIds, unreadCount, loading, lastData, error, reload, markRead, markAllRead],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
