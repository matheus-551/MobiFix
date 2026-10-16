package br.com.ifpe.mobfix.api.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tipo_veiculo")
@Getter
@Setter
@NoArgsConstructor
public class TipoVeiculo extends EntidadeNegocio {

    @Column(name = "nome", length = 100, nullable = false, unique = true)
    private String nome;
}
