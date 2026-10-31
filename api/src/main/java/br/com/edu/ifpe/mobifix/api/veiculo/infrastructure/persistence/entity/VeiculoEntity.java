package br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.persistence.entity;

import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.persistence.entity.TipoVeiculoEntity;
import br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence.entity.UsuarioEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "veiculo")
public class VeiculoEntity {
    @Id
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private UsuarioEntity cliente;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tipo_veiculo_id", nullable = false)
    private TipoVeiculoEntity tipoVeiculo;
    @Column(nullable = false, length = 100)
    private String marca;
    @Column(nullable = false, length = 100)
    private String modelo;
    @Column(nullable = false)
    private int ano;
    @Column(length = 7)
    private String placa;
    // DEFAULT true preserva os registros anteriores ao adicionar a coluna pelo Hibernate.
    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean ativo = true;

    public void atualizarDados(TipoVeiculoEntity tipoVeiculo, String marca, String modelo, int ano, String placa) {
        this.tipoVeiculo = tipoVeiculo;
        this.marca = marca;
        this.modelo = modelo;
        this.ano = ano;
        this.placa = placa;
    }

    public void desativar() {
        this.ativo = false;
    }

    public VeiculoEntity(UUID id, UsuarioEntity cliente, TipoVeiculoEntity tipoVeiculo, String marca, String modelo, int ano, String placa) {
        this.id = id;
        this.cliente = cliente;
        this.tipoVeiculo = tipoVeiculo;
        this.marca = marca;
        this.modelo = modelo;
        this.ano = ano;
        this.placa = placa;
    }
}
