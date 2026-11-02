package br.com.edu.ifpe.mobifix.api.prestador.application.busca;

import java.util.UUID;

public class BuscarPrestadores {
    private final PrestadorPublicoConsulta consulta;
    public BuscarPrestadores(PrestadorPublicoConsulta consulta) {
        this.consulta = consulta;
    }
    public PaginaPrestadores executar(FiltroPrestadores filtro) {
        return consulta.buscar(filtro);
    }
    public PrestadorPublico consultar(UUID id) {
        return consulta.buscarPorId(id).orElseThrow(PrestadorPublicoNaoEncontradoException::new);
    }
}
