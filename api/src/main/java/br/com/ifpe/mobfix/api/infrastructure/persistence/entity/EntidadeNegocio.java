package br.com.ifpe.mobfix.api.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.UUID;

@Getter
@Setter
@MappedSuperclass
public abstract class EntidadeNegocio extends EntidadeAuditavel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
}
