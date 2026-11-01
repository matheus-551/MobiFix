"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { routes } from "@/routes";
import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { useAsync } from "@/shared/hooks/useAsync";
import { ApiError, getFriendlyError } from "@/shared/lib/api/http";
import { BookingStepper } from "../components/booking/BookingStepper";
import { ConfirmStep } from "../components/booking/ConfirmStep";
import { DateTimeStep } from "../components/booking/DateTimeStep";
import { ServiceStep } from "../components/booking/ServiceStep";
import { VehicleStep } from "../components/booking/VehicleStep";
import { EmptyState, ErrorState, LINK_BUTTON, LINK_BUTTON_SECONDARY, LoadingBlock } from "../components/StateViews";
import { useClient } from "../context/ClientContext";
import { createAppointment, DuplicateAppointmentError } from "../services/appointmentService";
import { listVehicleTypes } from "../services/catalogService";
import { getProvider, listAvailableSlots } from "../services/providerService";
import { listMyVehicles } from "../services/vehicleService";
import type { AvailableSlot, PublicProvider } from "../types";
import { formatDateBr, formatTime } from "../utils/dates";
import { vehicleLabel } from "../utils/format";

type Stage = "veiculo-servico" | "data-horario" | "confirmacao";
type Errors = Partial<Record<"vehicle" | "services" | "date" | "slot", string>>;

/** Garante, consultando a API de novo, que o horário continua aberto antes de avançar/confirmar. */
async function fetchOpenSlot(providerId: string, date: string, slotId: string): Promise<AvailableSlot | null> {
  const slots = await listAvailableSlots(providerId, date, date);
  return slots.find((slot) => slot.id === slotId && slot.vagasDisponiveis > 0) ?? null;
}

function Wizard({ provider }: { provider: PublicProvider }) {
  const params = useSearchParams();
  const { uid, email, profile } = useClient();

  const preselected = (params.get("esp") ?? "")
    .split(",")
    .map(Number)
    .filter((id) => provider.especialidades.some((item) => item.id === id));

  // O estado fica neste componente, então é preservado ao navegar entre as etapas.
  const [stage, setStage] = useState<Stage>("veiculo-servico");
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [serviceIds, setServiceIds] = useState<number[]>(preselected);
  const [date, setDate] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [slotTime, setSlotTime] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const submitLock = useRef(false);

  const vehicles = useAsync(() => listMyVehicles(profile, email), `booking-vehicles:${uid}`, profile !== null);
  const types = useAsync(listVehicleTypes, "catalog-types");

  const vehicle = vehicles.data?.find((item) => item.id === vehicleId) ?? null;
  const services = provider.especialidades.filter((item) => serviceIds.includes(item.id));
  const currentStep = stage === "confirmacao" ? 5 : stage === "data-horario" ? (date ? 4 : 3) : vehicleId ? 2 : 1;

  function toggleService(id: number) {
    setServiceIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
    setErrors((current) => ({ ...current, services: undefined }));
  }

  function goToDateStage() {
    const found: Errors = {};
    if (!vehicle) found.vehicle = "Selecione um veículo para continuar.";
    if (services.length === 0) found.services = "Selecione ao menos um serviço.";
    setErrors(found);
    if (Object.keys(found).length === 0) setStage("data-horario");
  }

  async function goToConfirmation() {
    const found: Errors = {};
    if (!date) found.date = "Selecione uma data disponível.";
    else if (!slotId) found.slot = "Selecione um horário.";
    setErrors(found);
    if (Object.keys(found).length > 0 || !date || !slotId) return;

    setChecking(true);
    try {
      const open = await fetchOpenSlot(provider.id, date, slotId);
      if (!open) {
        setSlotId(null);
        setErrors({ slot: "Este horário acabou de ficar indisponível. Escolha outro." });
        return;
      }
      setSlotTime(formatTime(open.horaInicio));
      setStage("confirmacao");
    } catch (error) {
      setErrors({ slot: getFriendlyError(error) });
    } finally {
      setChecking(false);
    }
  }

  async function confirm() {
    if (submitLock.current || !vehicle || !date || !slotId || !slotTime) return;
    submitLock.current = true; // bloqueia cliques repetidos antes mesmo do re-render
    setSubmitting(true);
    setSubmitError(null);
    try {
      const open = await fetchOpenSlot(provider.id, date, slotId);
      if (!open) {
        setSlotId(null);
        setErrors({ slot: "Este horário não está mais disponível. Escolha outro." });
        setStage("data-horario");
        return;
      }
      await createAppointment({
        clientId: uid,
        providerId: provider.id,
        providerName: provider.nome,
        vehicleId: vehicle.id,
        vehicleLabel: vehicleLabel(vehicle),
        specialtyIds: services.map((item) => item.id),
        specialtyNames: services.map((item) => item.nome),
        slotId,
        date,
        time: slotTime,
        description,
      });
      setDone(true);
    } catch (error) {
      if (error instanceof ApiError || error instanceof DuplicateAppointmentError) setSubmitError(error.message);
      else setSubmitError(getFriendlyError(error));
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <span aria-hidden className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h1 className="text-lg font-bold text-gray-900">Solicitação enviada!</h1>
        <p role="status" className="mt-2 text-sm text-gray-500">
          Seu agendamento com <strong>{provider.nome}</strong> para {date && formatDateBr(date)} às {slotTime} foi registrado e aguarda confirmação.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href={routes.clientAppointments} className={LINK_BUTTON}>
            Ver meus agendamentos
          </Link>
          <Link href={routes.clientHome} className={LINK_BUTTON_SECONDARY}>
            Ir ao dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Novo Agendamento</h1>
        <p className="mt-1 text-sm text-gray-500">
          {provider.nome} • {provider.cidade}, {provider.uf}
        </p>
      </header>

      <BookingStepper current={currentStep} />

      {stage === "veiculo-servico" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <VehicleStep
            vehicles={vehicles}
            vehicleTypes={types.data ?? []}
            servedTypeIds={provider.tiposVeiculo.map((item) => item.id)}
            selectedId={vehicleId}
            onSelect={(id) => {
              setVehicleId(id);
              setErrors((current) => ({ ...current, vehicle: undefined }));
            }}
            error={errors.vehicle}
          />
          <div className="space-y-4">
            <ServiceStep services={provider.especialidades} selectedIds={serviceIds} onToggle={toggleService} error={errors.services} />
            <Button onClick={goToDateStage}>Próximo Passo</Button>
          </div>
        </div>
      )}

      {stage === "data-horario" && (
        <>
          <DateTimeStep
            providerId={provider.id}
            date={date}
            slotId={slotId}
            description={description}
            onDateChange={(value) => {
              setDate(value);
              setSlotId(null);
              setErrors({});
            }}
            onSlotChange={(value) => {
              setSlotId(value);
              setErrors((current) => ({ ...current, slot: undefined }));
            }}
            onDescriptionChange={setDescription}
            dateError={errors.date}
            slotError={errors.slot}
          />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <div className="sm:w-40">
              <Button variant="secondary" onClick={() => setStage("veiculo-servico")} disabled={checking}>
                Voltar
              </Button>
            </div>
            <div className="sm:w-56">
              <Button onClick={goToConfirmation} loading={checking} loadingLabel="Verificando...">
                Próximo Passo
              </Button>
            </div>
          </div>
        </>
      )}

      {stage === "confirmacao" && vehicle && date && slotTime && (
        <div className="space-y-4">
          <ConfirmStep
            summary={{
              providerName: provider.nome,
              vehicle: vehicleLabel(vehicle),
              services: services.map((item) => item.nome),
              dateLabel: formatDateBr(date),
              time: slotTime,
              description,
            }}
          />
          {submitError && <Alert tone="error">{submitError}</Alert>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <div className="sm:w-40">
              <Button variant="secondary" onClick={() => setStage("data-horario")} disabled={submitting}>
                Voltar
              </Button>
            </div>
            <div className="sm:w-56">
              <Button onClick={confirm} loading={submitting} loadingLabel="Enviando...">
                Confirmar Agendamento
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingFlow() {
  const params = useSearchParams();
  const id = params.get("prestador") ?? "";
  const provider = useAsync(() => getProvider(id), `provider:${id}`, id !== "");

  if (!id) {
    return (
      <EmptyState title="Escolha um prestador para agendar" action={<Link href={routes.clientSearch} className={LINK_BUTTON}>Buscar prestadores</Link>} />
    );
  }
  if (provider.loading) return <LoadingBlock label="Carregando prestador..." />;
  if (provider.error !== null) return <ErrorState message={getFriendlyError(provider.error)} onRetry={provider.reload} />;
  return provider.data ? <Wizard provider={provider.data} /> : null;
}
