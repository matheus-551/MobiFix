package br.com.ifpe.mobfix.api.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "usuario")
@Getter
@Setter
@NoArgsConstructor
public class Usuario extends EntidadeNegocio {

    @Column(name = "firebase_uid", length = 128, nullable = false, unique = true)
    private String firebaseUid;

    @Column(name = "email", length = 255, nullable = false, unique = true)
    private String email;

    @Column(name = "papel", length = 50, nullable = false)
    private String papel;

    @Column(name = "status", length = 50, nullable = false)
    private String status;

    @Column(name = "email_verificado", nullable = false)
    private Boolean emailVerificado;

}
