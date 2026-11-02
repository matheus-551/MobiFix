package br.com.edu.ifpe.mobifix.api.prestador.application.busca;

import java.util.Locale;

public record FiltroPrestadores(Long tipoVeiculoId, Long especialidadeId, String uf, String cidade, int page, int size) {
    public FiltroPrestadores {
        if (tipoVeiculoId != null && tipoVeiculoId <= 0 || especialidadeId != null && especialidadeId <= 0) {
            throw new IllegalArgumentException("Os identificadores dos filtros devem ser positivos.");
        }
        if (page < 0 || size < 1 || size > 100 || (long) page * size > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("Informe page a partir de zero e size entre 1 e 100, dentro do limite de paginação.");
        }
        if (uf != null) {
            uf = uf.strip().toUpperCase(Locale.ROOT);
            if (!uf.matches("AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO")) {
                throw new IllegalArgumentException("Informe uma UF brasileira válida.");
            }
        }
        if (cidade != null) {
            cidade = cidade.strip();
            if (cidade.isEmpty() || cidade.length() > 100) {
                throw new IllegalArgumentException("Cidade deve conter de 1 a 100 caracteres.");
            }
        }
    }
}
