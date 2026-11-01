"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { routes } from "@/routes";
import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { useAsync } from "@/shared/hooks/useAsync";
import { getFriendlyError } from "@/shared/lib/api/http";
import { StarInput } from "../components/StarRating";
import { EmptyState, ErrorState, LINK_BUTTON, LoadingBlock } from "../components/StateViews";
import { useClient } from "../context/ClientContext";
import { getClientAppointment } from "../services/appointmentService";
import { hasReview, submitReview } from "../services/reviewService";
import type { ClientAppointment } from "../types";
import { formatDateBr } from "../utils/dates";

const COMMENT_LIMIT = 1000;

function ReviewForm({ appointment }: { appointment: ClientAppointment }) {
  const router = useRouter();
  const { fullName, firstName, profile } = useClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  // Nome público na avaliação: primeiro nome + inicial do sobrenome.
  const publicName = profile ? `${profile.firstName} ${profile.lastName.charAt(0)}.` : firstName || fullName || "Cliente";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (rating < 1) {
      setRatingError("Toque nas estrelas para dar sua nota.");
      return;
    }
    setRatingError(null);
    setFormError(null);
    setSaving(true);
    try {
      await submitReview({ appointment, clientName: publicName, rating, comment });
      setSent(true);
    } catch (error) {
      setFormError(getFriendlyError(error));
    } finally {
      setSaving(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
        <span aria-hidden className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <h2 className="text-lg font-bold text-gray-900">Avaliação enviada com sucesso!</h2>
        <p role="status" className="mt-1 text-sm text-gray-500">
          Obrigado por ajudar a manter nossa qualidade.
        </p>
        <button
          type="button"
          onClick={() => router.push(routes.clientAppointments)}
          className="mt-6 h-11 w-full rounded-lg bg-gray-900 text-sm font-semibold text-white hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
        >
          Fechar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto max-w-md space-y-5 rounded-xl bg-white p-6 shadow-sm">
      <div className="text-center">
        <h2 className="text-lg font-bold text-gray-900">Como foi o seu atendimento?</h2>
        <p className="mt-1 text-xs text-gray-500">Sua avaliação ajuda outros clientes.</p>
      </div>

      <dl className="space-y-1.5 rounded-lg bg-gray-50 p-3 text-xs">
        {(
          [
            ["Prestador", appointment.providerName],
            ["Serviço", appointment.specialtyNames.join(", ")],
            ["Data", formatDateBr(appointment.date)],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-gray-500">{label}</dt>
            <dd className="text-right font-semibold text-gray-900">{value}</dd>
          </div>
        ))}
      </dl>

      <div>
        <p className="mb-2 text-center text-xs font-semibold text-gray-700">Toque para avaliar com estrelas</p>
        <StarInput
          value={rating}
          onChange={(value) => {
            setRating(value);
            setRatingError(null);
          }}
          disabled={saving}
        />
        {ratingError && (
          <p role="alert" className="mt-2 text-center text-xs text-red-600">
            {ratingError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="comentario" className="mb-1.5 block text-xs font-semibold text-gray-700">
          Comentário (opcional)
        </label>
        <textarea
          id="comentario"
          rows={4}
          maxLength={COMMENT_LIMIT}
          value={comment}
          disabled={saving}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Conte como foi o atendimento..."
          className="w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
        />
        <p className="mt-1 text-right text-[11px] text-gray-400">
          {comment.length}/{COMMENT_LIMIT}
        </p>
      </div>

      {formError && <Alert tone="error">{formError}</Alert>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button variant="secondary" onClick={() => router.push(routes.clientAppointments)} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving} loadingLabel="Enviando...">
          Enviar Avaliação
        </Button>
      </div>
    </form>
  );
}

export default function ReviewPage() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const loaded = useAsync(
    async () => ({ appointment: await getClientAppointment(id), reviewed: await hasReview(id) }),
    `review:${id}`,
    id !== "",
  );

  const back = (
    <Link href={routes.clientAppointments} className={LINK_BUTTON}>
      Voltar aos agendamentos
    </Link>
  );

  let body;
  if (!id) body = <EmptyState title="Nenhum atendimento selecionado" action={back} />;
  else if (loaded.loading) body = <LoadingBlock label="Carregando atendimento..." />;
  else if (loaded.error !== null) body = <ErrorState message={getFriendlyError(loaded.error)} onRetry={loaded.reload} />;
  else if (!loaded.data?.appointment) body = <EmptyState title="Atendimento não encontrado" action={back} />;
  else if (loaded.data.appointment.status !== "completed")
    body = (
      <EmptyState title="Este atendimento ainda não foi concluído" action={back}>
        Você poderá avaliar assim que o prestador concluir o serviço.
      </EmptyState>
    );
  else if (loaded.data.reviewed)
    body = (
      <EmptyState title="Você já avaliou este atendimento" action={back}>
        Cada atendimento pode ser avaliado uma única vez.
      </EmptyState>
    );
  else body = <ReviewForm appointment={loaded.data.appointment} />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Avaliação de Serviços</h1>
        <p className="mt-1 text-sm text-gray-500">Sua opinião ajuda a comunidade MobiFix a encontrar os melhores profissionais.</p>
      </header>
      {body}
    </div>
  );
}
