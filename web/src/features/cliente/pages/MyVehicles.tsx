"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { useAsync } from "@/shared/hooks/useAsync";
import { getFriendlyError } from "@/shared/lib/api/http";
import { NewVehicleForm } from "../components/booking/VehicleStep";
import { Modal } from "../components/Modal";
import { EmptyState, ErrorState, LoadingBlock } from "../components/StateViews";
import { useClient } from "../context/ClientContext";
import { listVehicleTypes } from "../services/catalogService";
import { deactivateVehicle, listMyVehicles } from "../services/vehicleService";
import type { ApiVehicle } from "../types";
import { VehicleTypeIcon } from "../utils/vehicleIcons";

export default function MyVehicles() {
  const { email, profile } = useClient();
  const [adding, setAdding] = useState(false);
  const [toRemove, setToRemove] = useState<ApiVehicle | null>(null);
  const [removing, setRemoving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const vehicles = useAsync(() => listMyVehicles(profile, email), `my-vehicles:${profile ? "p" : "n"}`, profile !== null);
  const types = useAsync(listVehicleTypes, "catalog-types");
  const typeName = (id: number) => types.data?.find((item) => item.id === id)?.nome ?? "Veículo";

  async function handleRemove() {
    if (!toRemove || removing) return;
    setRemoving(true);
    try {
      await deactivateVehicle(toRemove.id);
      setFeedback({ tone: "success", message: `${toRemove.marca} ${toRemove.modelo} removido.` });
      vehicles.reload();
    } catch (error) {
      setFeedback({ tone: "error", message: getFriendlyError(error) });
    } finally {
      setRemoving(false);
      setToRemove(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Veículos</h1>
          <p className="mt-1 text-sm text-gray-500">Veículos cadastrados para usar nos agendamentos.</p>
        </div>
        {!adding && (
          <div className="w-full sm:w-52">
            <Button onClick={() => setAdding(true)}>Cadastrar Novo Veículo</Button>
          </div>
        )}
      </header>

      {feedback && <Alert tone={feedback.tone}>{feedback.message}</Alert>}

      {adding && (
        <NewVehicleForm
          vehicleTypes={types.data ?? []}
          onCancel={() => setAdding(false)}
          onCreated={(vehicle) => {
            setAdding(false);
            setFeedback({ tone: "success", message: `${vehicle.marca} ${vehicle.modelo} cadastrado.` });
            vehicles.reload();
          }}
        />
      )}

      {vehicles.loading ? (
        <LoadingBlock label="Carregando veículos..." />
      ) : vehicles.error !== null ? (
        <ErrorState message={getFriendlyError(vehicles.error)} onRetry={vehicles.reload} />
      ) : (vehicles.data ?? []).length === 0 ? (
        <EmptyState title="Nenhum veículo cadastrado">Cadastre seu primeiro veículo para agendar serviços.</EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(vehicles.data ?? []).map((vehicle) => (
            <li key={vehicle.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                <VehicleTypeIcon name={typeName(vehicle.tipoVeiculoId)} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900">
                  {vehicle.marca} {vehicle.modelo}
                </p>
                <p className="text-xs text-gray-500">
                  {vehicle.ano} • {typeName(vehicle.tipoVeiculoId)} • {vehicle.placa || "sem placa"}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Remover ${vehicle.marca} ${vehicle.modelo}`}
                onClick={() => setToRemove(vehicle)}
                className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
              >
                <Trash2 aria-hidden className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {toRemove && (
        <Modal title="Remover veículo?" onClose={() => !removing && setToRemove(null)}>
          <p className="text-sm text-gray-600">
            {toRemove.marca} {toRemove.modelo} ({toRemove.ano}) deixará de aparecer nos seus agendamentos futuros.
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <div className="sm:w-32">
              <Button variant="secondary" onClick={() => setToRemove(null)} disabled={removing}>
                Voltar
              </Button>
            </div>
            <div className="sm:w-36">
              <Button onClick={handleRemove} loading={removing} loadingLabel="Removendo...">
                Remover
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
