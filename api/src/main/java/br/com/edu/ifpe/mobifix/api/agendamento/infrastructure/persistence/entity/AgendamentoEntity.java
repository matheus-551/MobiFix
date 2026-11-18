package br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.persistence.entity;

import br.com.edu.ifpe.mobifix.api.agenda.infrastructure.persistence.entity.HorarioAtendimentoEntity;
import br.com.edu.ifpe.mobifix.api.agendamento.domain.model.StatusAgendamento;
import br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.persistence.entity.EspecialidadeEntity;
import br.com.edu.ifpe.mobifix.api.prestador.infrastructure.persistence.entity.PerfilPrestadorEntity;
import br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence.entity.UsuarioEntity;
import br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.persistence.entity.VeiculoEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
        name = "agendamento",
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uk_agendamento_veiculo_data_hora",
                        columnNames = {"veiculo_id", "data", "hora_inicio"}),
        indexes = {
            @Index(name = "ix_agendamento_horario", columnList = "horario_id"),
            @Index(
                    name = "ix_agendamento_cliente_data",
                    columnList = "cliente_id,data,hora_inicio,id"),
            @Index(
                    name = "ix_agendamento_prestador_data",
                    columnList = "prestador_id,data,hora_inicio,id")
        })
public class AgendamentoEntity {

    @Id private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private UsuarioEntity cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "prestador_id", nullable = false)
    private PerfilPrestadorEntity prestador;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "veiculo_id", nullable = false)
    private VeiculoEntity veiculo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "horario_id", nullable = false)
    private HorarioAtendimentoEntity horario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "especialidade_id", nullable = false)
    private EspecialidadeEntity especialidade;

    @Column(nullable = false)
    private LocalDate data;

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusAgendamento status;

    @Column(name = "criado_em", nullable = false)
    private Instant criadoEm;

    public AgendamentoEntity(
            UUID id,
            UsuarioEntity cliente,
            PerfilPrestadorEntity prestador,
            VeiculoEntity veiculo,
            HorarioAtendimentoEntity horario,
            EspecialidadeEntity especialidade,
            LocalDate data,
            LocalTime horaInicio,
            StatusAgendamento status,
            Instant criadoEm) {
        this.id = id;
        this.cliente = cliente;
        this.prestador = prestador;
        this.veiculo = veiculo;
        this.horario = horario;
        this.especialidade = especialidade;
        this.data = data;
        this.horaInicio = horaInicio;
        this.status = status;
        this.criadoEm = criadoEm;
    }
}
