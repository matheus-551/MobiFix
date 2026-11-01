package br.com.edu.ifpe.mobifix.api.shared.infrastructure.web.hal;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import br.com.edu.ifpe.mobifix.api.usuario.infrastructure.web.dto.UsuarioResponse;
import br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.web.dto.VeiculoResponse;
import br.com.edu.ifpe.mobifix.api.prestador.infrastructure.web.dto.*;
import br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.web.dto.*;
import br.com.edu.ifpe.mobifix.api.agenda.infrastructure.web.dto.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ResolvableType;
import org.springframework.hateoas.*;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@Component
public class ApiHalAssembler {
    private final Clock clock;
    public ApiHalAssembler(@Qualifier("agendaClock") Clock clock) { this.clock = clock; }

    public EntityModel<Object> recurso(Object dados) {
        EntityModel<Object> model = EntityModel.of(dados);
        if (dados instanceof UsuarioResponse usuario) {
            model.add(link("/api/v1/usuarios/me", "self"));
            if (usuario.ativo()) {
                model.add(link("/api/v1/usuarios/me", "editar"), link("/api/v1/usuarios/me", "desativar"));
                if ("CLIENTE".equals(usuario.tipo())) model.add(link("/api/v1/veiculos/me", "veiculos"));
                else model.add(link("/api/v1/prestadores/me/perfil", "perfil"));
            }
        } else if (dados instanceof VeiculoResponse veiculo) {
            model.add(link("/api/v1/veiculos/" + veiculo.id(), "self"), link("/api/v1/veiculos/me", "collection"),
                    link("/api/v1/veiculos/" + veiculo.id(), "editar"), link("/api/v1/veiculos/" + veiculo.id(), "desativar"));
        } else if (dados instanceof PerfilPrestadorResponse perfil) {
            model.add(link("/api/v1/prestadores/me/perfil", "self"), link("/api/v1/prestadores/me/perfil", "editar"),
                    link("/api/v1/prestadores/" + perfil.id(), "publico"), link("/api/v1/prestadores/me/horarios", "horarios"),
                    link("/api/v1/tipos-veiculo", "tiposVeiculo"), link("/api/v1/especialidades", "especialidades"));
        } else if (dados instanceof PrestadorPublicoResponse perfil) {
            model.add(link("/api/v1/prestadores/" + perfil.id(), "self"), link("/api/v1/prestadores", "collection"),
                    link("/api/v1/prestadores/" + perfil.id() + "/horarios", "horarios"));
        } else if (dados instanceof HorarioResponse horario) {
            model.add(link("/api/v1/prestadores/me/horarios", "agenda"));
            if (LocalDateTime.of(horario.data(), horario.horaInicio()).isAfter(LocalDateTime.now(clock))) {
                model.add(link("/api/v1/prestadores/me/horarios/" + horario.id(), "editar"));
            }
            model.add(link("/api/v1/prestadores/" + horario.prestadorId() + "/horarios", "disponibilidade"));
        } else if (dados instanceof HorarioDisponivelResponse) {
            model.add(Link.of(atual(), "agenda"));
        } else if (dados instanceof TipoVeiculoResponse) {
            model.add(link("/api/v1/tipos-veiculo", "catalogo"));
        } else if (dados instanceof EspecialidadeResponse) {
            model.add(link("/api/v1/especialidades", "catalogo"));
        } else {
            throw new IllegalArgumentException("Representação HAL não suportada.");
        }
        return model;
    }

    public CollectionModel<?> colecao(List<?> dados, Class<?> tipo) {
        if (dados.isEmpty()) return CollectionModel.of(List.of(new org.springframework.hateoas.server.core.EmbeddedWrappers(false).emptyCollectionOf(tipo)), Link.of(atual(), "self"));
        return CollectionModel.of(dados.stream().map(this::recurso).toList(), Link.of(atual(), "self"))
                .withFallbackType(ResolvableType.forClassWithGenerics(EntityModel.class, tipo));
    }

    public PagedModel<?> pagina(BuscaPrestadoresResponse dados) {
        var metadata = new PagedModel.PageMetadata(dados.size(), dados.page(), dados.totalElements(), dados.totalPages());
        List<?> elementos = dados.content().isEmpty() ? List.of(new org.springframework.hateoas.server.core.EmbeddedWrappers(false).emptyCollectionOf(PrestadorPublicoResponse.class)) : dados.content().stream().map(this::recurso).toList();
        var model = PagedModel.of(elementos, metadata)
                .withFallbackType(ResolvableType.forClassWithGenerics(EntityModel.class, PrestadorPublicoResponse.class));
        model.add(Link.of(paginaUrl(dados.page(), dados.size()), "self"));
        if (dados.totalPages() > 0) {
            model.add(Link.of(paginaUrl(0, dados.size()), "first"), Link.of(paginaUrl(dados.totalPages() - 1, dados.size()), "last"));
            if (dados.page() > 0) model.add(Link.of(paginaUrl(Math.min(dados.page() - 1, dados.totalPages() - 1), dados.size()), "prev"));
            if (dados.page() < dados.totalPages() - 1) model.add(Link.of(paginaUrl(dados.page() + 1, dados.size()), "next"));
        }
        return model;
    }

    private Link link(String path, String rel) {
        return Link.of(ServletUriComponentsBuilder.fromCurrentContextPath().path(path).build().toUriString(), rel);
    }
    private String atual() { return ServletUriComponentsBuilder.fromCurrentRequest().build(true).toUriString(); }
    private String paginaUrl(int page, int size) {
        return ServletUriComponentsBuilder.fromCurrentRequest().replaceQueryParam("page", page)
                .replaceQueryParam("size", size).build(true).toUriString();
    }
}
