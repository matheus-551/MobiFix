package br.com.edu.ifpe.mobifix.api.prestador.application.busca;

import java.util.Optional;
import java.util.UUID;

public interface PrestadorPublicoConsulta {
    PaginaPrestadores buscar(FiltroPrestadores filtro);
    Optional<PrestadorPublico> buscarPorId(UUID id);
}
