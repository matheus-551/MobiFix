package br.com.ifpe.mobfix.api.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "especialidade")
@Getter
@Setter
@NoArgsConstructor
public class Especialidade extends EntidadeNegocio {

    @Column(name = "nome", length = 100, nullable = false, unique = true)
    private String nome;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo;
}
