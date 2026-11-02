package br.com.edu.ifpe.mobifix.api.veiculo.domain.model;

import java.time.Year;
import java.util.Locale;
import java.util.UUID;

public record Veiculo(UUID id, UUID clienteId, Long tipoVeiculoId, String marca, String modelo, int ano, String placa) {
    public Veiculo {
        if (id == null || clienteId == null) throw new IllegalArgumentException("Os identificadores do veículo e do cliente são obrigatórios.");
        if (tipoVeiculoId == null || tipoVeiculoId <= 0) throw new IllegalArgumentException("Informe um tipo de veículo válido.");
        marca = validarTexto(marca, "Marca");
        modelo = validarTexto(modelo, "Modelo");
        if (ano < 1886 || ano > Year.now().getValue() + 1) throw new IllegalArgumentException("Ano do veículo inválido.");
        if (placa != null) {
            placa = placa.strip().toUpperCase(Locale.ROOT).replace("-", "");
            if (placa.isEmpty()) placa = null;
            else if (!placa.matches("[A-Z]{3}[0-9][A-Z0-9][0-9]{2}")) throw new IllegalArgumentException("Informe uma placa brasileira válida.");
        }
    }
    private static String validarTexto(String valor, String campo) {
        if (valor == null || valor.isBlank() || valor.strip().length() > 100) throw new IllegalArgumentException(campo + " deve conter de 1 a 100 caracteres.");
        return valor.strip();
    }
}
