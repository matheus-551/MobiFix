"use client";

import { useState } from "react";
import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { getFriendlyError } from "@/shared/lib/api/http";
import { rescheduleAppointment } from "../services/appointmentService";
import type { ClientAppointment } from "../types";
import { formatRelativeDate } from "../utils/dates";
import { DateTimeStep } from "./booking/DateTimeStep";
import { Modal } from "./Modal";

/** Remarcação de um agendamento pendente (`PATCH /agendamentos/{id}/remarcar`) para outro horário do mesmo prestador. */
export function RescheduleModal({
  appointment,
  onClose,
  onDone,
}: {
  appointment: ClientAppointment;
  onClose: () => void;
  onDone: () => void;
}) {
  const [date, setDate] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [slotError, setSlotError] = useState<string | undefined>();
  const [dateError, setDateError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (saving) return;
    setDateError(undefined);
    setSlotError(undefined);
    setSubmitError(null);
    if (!date) return setDateError("Selecione uma data disponível.");
    if (!slotId) return setSlotError("Selecione um horário.");
    setSaving(true);
    try {
      await rescheduleAppointment(appointment.id, slotId);
      onDone();
    } catch (error) {
      setSubmitError(getFriendlyError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Remarcar agendamento" onClose={() => !saving && onClose()} wide>
      <p className="mb-4 text-sm text-gray-600">
        Atendimento com <strong>{appointment.providerName}</strong>, atualmente em {formatRelativeDate(appointment.date)} às{" "}
        {appointment.time}. Escolha o novo horário.
      </p>
      <DateTimeStep
        providerId={appointment.providerId}
        date={date}
        slotId={slotId}
        showDescription={false}
        onDateChange={(value) => {
          setDate(value);
          setSlotId(null);
          setDateError(undefined);
        }}
        onSlotChange={(value) => {
          setSlotId(value);
          setSlotError(undefined);
        }}
        dateError={dateError}
        slotError={slotError}
      />
      {submitError && (
        <div className="mt-4">
          <Alert tone="error">{submitError}</Alert>
        </div>
      )}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <div className="sm:w-32">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Voltar
          </Button>
        </div>
        <div className="sm:w-44">
          <Button onClick={() => void handleSubmit()} loading={saving} loadingLabel="Remarcando...">
            Confirmar nova data
          </Button>
        </div>
      </div>
    </Modal>
  );
}
