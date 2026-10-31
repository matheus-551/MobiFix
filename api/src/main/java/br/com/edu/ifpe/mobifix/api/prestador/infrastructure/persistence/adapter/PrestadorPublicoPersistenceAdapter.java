package br.com.edu.ifpe.mobifix.api.prestador.infrastructure.persistence.adapter;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import br.com.edu.ifpe.mobifix.api.prestador.application.busca.*;
import br.com.edu.ifpe.mobifix.api.prestador.infrastructure.persistence.entity.PerfilPrestadorEntity;
import br.com.edu.ifpe.mobifix.api.prestador.infrastructure.persistence.repository.PrestadorPublicoJpaRepository;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.TipoUsuario;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Transactional(readOnly = true)
public class PrestadorPublicoPersistenceAdapter implements PrestadorPublicoConsulta {
    private final PrestadorPublicoJpaRepository repository;
    public PrestadorPublicoPersistenceAdapter(PrestadorPublicoJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public PaginaPrestadores buscar(FiltroPrestadores filtro) {
        Specification<PerfilPrestadorEntity> specification = (root, query, cb) -> {
            if (query != null) query.distinct(true);
            var usuario = root.join("usuario");
            var condicoes = new ArrayList<Predicate>();
            condicoes.add(cb.isTrue(usuario.get("ativo")));
            condicoes.add(cb.equal(usuario.get("tipo"), TipoUsuario.PRESTADOR));
            if (filtro.tipoVeiculoId() != null) condicoes.add(cb.equal(root.join("tiposVeiculo").get("id"), filtro.tipoVeiculoId()));
            if (filtro.especialidadeId() != null) condicoes.add(cb.equal(root.join("especialidades").get("id"), filtro.especialidadeId()));
            if (filtro.uf() != null) condicoes.add(cb.equal(root.get("endereco").get("uf"), filtro.uf()));
            if (filtro.cidade() != null) condicoes.add(cb.equal(cb.lower(root.get("endereco").get("cidade")), filtro.cidade().toLowerCase(Locale.ROOT)));
            return cb.and(condicoes.toArray(Predicate[]::new));
        };
        var page = repository.findAll(specification, PageRequest.of(filtro.page(), filtro.size(), Sort.by("nomeFantasia", "id")));
        if (page.isEmpty()) return new PaginaPrestadores(java.util.List.of(), filtro.page(), filtro.size(), page.getTotalElements(), page.getTotalPages());

        // Primeiro pagina os perfis; depois carrega as colecoes da pagina em lote.
        // Evita paginacao em memoria causada por fetch de colecoes na consulta paginada.
        var ids = page.getContent().stream().map(PerfilPrestadorEntity::getId).toList();
        var perfis = repository.findAllByIdInAndUsuario_AtivoTrueAndUsuario_Tipo(ids, TipoUsuario.PRESTADOR)
                .stream().collect(Collectors.toMap(PerfilPrestadorEntity::getId, Function.identity(), (primeiro, outro) -> primeiro));
        var content = ids.stream().filter(perfis::containsKey).map(id -> toPublico(perfis.get(id))).toList();
        return new PaginaPrestadores(content, filtro.page(), filtro.size(), page.getTotalElements(), page.getTotalPages());
    }

    @Override
    public Optional<PrestadorPublico> buscarPorId(UUID id) {
        return repository.findByIdAndUsuario_AtivoTrueAndUsuario_Tipo(id, TipoUsuario.PRESTADOR).map(this::toPublico);
    }

    private PrestadorPublico toPublico(PerfilPrestadorEntity perfil) {
        String nome = perfil.getNomeFantasia();
        if (nome == null || nome.isBlank()) nome = perfil.getUsuario().getNome() + " " + perfil.getUsuario().getSobrenome();
        var tipos = perfil.getTiposVeiculo().stream()
                .map(tipo -> new PrestadorPublico.ItemCatalogo(tipo.getId(), tipo.getNome()))
                .sorted(Comparator.comparing(PrestadorPublico.ItemCatalogo::nome).thenComparing(PrestadorPublico.ItemCatalogo::id)).toList();
        var especialidades = perfil.getEspecialidades().stream()
                .map(item -> new PrestadorPublico.ItemCatalogo(item.getId(), item.getNome()))
                .sorted(Comparator.comparing(PrestadorPublico.ItemCatalogo::nome).thenComparing(PrestadorPublico.ItemCatalogo::id)).toList();
        return new PrestadorPublico(perfil.getId(), nome, perfil.getDescricao(), perfil.getEndereco().getCidade(), perfil.getEndereco().getUf(), tipos, especialidades);
    }
}
