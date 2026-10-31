package br.com.edu.ifpe.mobifix.api.prestador.application.busca;

import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class FiltroPrestadoresTest {
    @Test
    void normalizaLocalizacao() {
        var filtro = new FiltroPrestadores(null, null, " pe ", " Recife ", 0, 20);
        assertEquals("PE", filtro.uf());
        assertEquals("Recife", filtro.cidade());
    }
    @ParameterizedTest
    @ValueSource(strings = {"uf", "cidade", "cidadeLonga", "tipo", "especialidade", "page", "sizeZero", "sizeGrande", "overflow"})
    void rejeitaFiltrosInvalidos(String campo) {
        assertThrows(IllegalArgumentException.class, () -> new FiltroPrestadores(
                campo.equals("tipo") ? -1L : null, campo.equals("especialidade") ? 0L : null,
                campo.equals("uf") ? "XX" : null,
                campo.equals("cidade") ? " " : campo.equals("cidadeLonga") ? "a".repeat(101) : null,
                campo.equals("page") ? -1 : campo.equals("overflow") ? Integer.MAX_VALUE : 0,
                campo.equals("sizeZero") ? 0 : campo.equals("sizeGrande") ? 101 : 20));
    }
    @Test
    void detalheInexistenteProduzExcecaoPublica() {
        PrestadorPublicoConsulta consulta = mock(PrestadorPublicoConsulta.class);
        UUID id = UUID.randomUUID();
        when(consulta.buscarPorId(id)).thenReturn(Optional.empty());
        assertThrows(PrestadorPublicoNaoEncontradoException.class, () -> new BuscarPrestadores(consulta).consultar(id));
    }
}
