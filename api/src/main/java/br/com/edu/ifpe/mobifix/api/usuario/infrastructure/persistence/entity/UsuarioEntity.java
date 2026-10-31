package br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence.entity;

import java.util.UUID;

import br.com.edu.ifpe.mobifix.api.usuario.domain.model.TipoUsuario;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "usuario")
public class UsuarioEntity {

    @Id
    private UUID id;

    @Column(name = "firebase_id", nullable = false, unique = true)
    private String firebaseId;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, length = 100)
    private String sobrenome;

    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Column(nullable = false, length = 20)
    private String telefone;

    @Column(nullable = false, length = 2)
    private String uf;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoUsuario tipo;

    @Column(nullable = false)
    private boolean ativo;

    @Builder
    public UsuarioEntity(UUID id, String firebaseId, String nome, String sobrenome, String email, String telefone,
                         String uf, TipoUsuario tipo, boolean ativo) {
        this.id = id;
        this.firebaseId = firebaseId;
        this.nome = nome;
        this.sobrenome = sobrenome;
        this.email = email;
        this.telefone = telefone;
        this.uf = uf;
        this.tipo = tipo;
        this.ativo = ativo;
    }
}