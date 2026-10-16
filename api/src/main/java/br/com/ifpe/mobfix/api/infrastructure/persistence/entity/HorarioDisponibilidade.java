package br.com.ifpe.mobfix.api.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "horario_disponibilidade")
@Getter
@Setter
@NoArgsConstructor
public class HorarioDisponibilidade extends EntidadeNegocio {

    @Column(name = "inicio_em", nullable = false)
    private LocalDateTime inicioEm;

    @Column(name = "fim_em", nullable = false)
    private LocalDateTime fimEm;

    @Column(name = "status", length = 50, nullable = false)
    private String status;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "prestador_id", nullable = false)
    private PerfilPrestador prestador;
}
