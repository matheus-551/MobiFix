package br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record RemarcarAgendamentoRequest(@NotNull UUID horarioId) {}
