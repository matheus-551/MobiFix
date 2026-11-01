package br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.web.dto;

@org.springframework.hateoas.server.core.Relation(value = "especialidade", collectionRelation = "especialidades")
public record EspecialidadeResponse(Long id, String nome) {
}
