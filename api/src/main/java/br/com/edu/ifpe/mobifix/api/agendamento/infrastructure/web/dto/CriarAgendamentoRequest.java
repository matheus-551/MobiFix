package br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record CriarAgendamentoRequest(
        @NotNull UUID veiculoId,
        @NotNull UUID horarioId,
        @NotNull @Positive Long especialidadeId) {}
