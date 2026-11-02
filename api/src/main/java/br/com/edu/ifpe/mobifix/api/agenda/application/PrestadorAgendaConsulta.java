package br.com.edu.ifpe.mobifix.api.agenda.application;
import java.util.UUID;
public interface PrestadorAgendaConsulta {
    boolean estaDisponivel(UUID prestadorId);
}
