package br.com.edu.ifpe.mobifix.api.agenda.infrastructure.persistence.entity;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.prestador.infrastructure.persistence.entity.PerfilPrestadorEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "horario_atendimento", uniqueConstraints = @UniqueConstraint(name = "uk_horario_prestador_data_hora", columnNames = {"prestador_id", "data", "hora_inicio"}))
public class HorarioAtendimentoEntity {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "prestador_id", nullable = false)
    private PerfilPrestadorEntity prestador;
    @Column(nullable = false) private LocalDate data;
    @Column(name = "hora_inicio", nullable = false) private LocalTime horaInicio;
    @Column(name = "capacidade_total", nullable = false) private int capacidadeTotal;
    @Column(nullable = false) private boolean bloqueado;

    public HorarioAtendimentoEntity(UUID id, PerfilPrestadorEntity prestador, LocalDate data, LocalTime horaInicio, int capacidadeTotal, boolean bloqueado) {
        this.id = id;
        this.prestador = prestador;
        this.data = data;
        this.horaInicio = horaInicio;
        this.capacidadeTotal = capacidadeTotal;
        this.bloqueado = bloqueado;
    }
    public void atualizarDisponibilidade(int capacidadeTotal, boolean bloqueado) {
        if (capacidadeTotal < 0) throw new IllegalArgumentException("A capacidade não pode ser negativa.");
        this.capacidadeTotal = capacidadeTotal;
        this.bloqueado = bloqueado;
    }
}
