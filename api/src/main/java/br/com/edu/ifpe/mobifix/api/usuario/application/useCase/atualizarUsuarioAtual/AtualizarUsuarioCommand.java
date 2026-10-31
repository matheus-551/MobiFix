package br.com.edu.ifpe.mobifix.api.usuario.application.useCase.atualizarUsuarioAtual;

public record AtualizarUsuarioCommand(String nome, String sobrenome, String telefone, String uf) {
}
