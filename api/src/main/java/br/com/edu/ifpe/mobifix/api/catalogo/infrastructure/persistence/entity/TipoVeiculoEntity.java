package br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "TipoVeiculo")
public class TipoVeiculoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome", nullable = false, unique = true, length = 50)
    private String nome;

    @Builder
    public TipoVeiculoEntity(String nome) {
        this.nome = nome;
    }
}
