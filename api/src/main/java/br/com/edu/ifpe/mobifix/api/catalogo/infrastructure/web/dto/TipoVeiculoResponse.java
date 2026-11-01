package br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.web.dto;

@org.springframework.hateoas.server.core.Relation(value = "tipoVeiculo", collectionRelation = "tiposVeiculo")
public record TipoVeiculoResponse(Long id, String nome) {
}
