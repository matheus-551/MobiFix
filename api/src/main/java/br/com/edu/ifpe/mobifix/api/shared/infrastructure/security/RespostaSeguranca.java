package br.com.edu.ifpe.mobifix.api.shared.infrastructure.security;

import java.io.IOException;
import jakarta.servlet.http.HttpServletResponse;

final class RespostaSeguranca {
    private RespostaSeguranca() {}
    static void escrever(HttpServletResponse response, int status) throws IOException {
        response.setStatus(status);
        response.setContentType("application/problem+json");
        response.setCharacterEncoding("UTF-8");
        if (status == 401) response.setHeader("WWW-Authenticate", "Bearer");
        String title = status == 401 ? "Unauthorized" : status == 403 ? "Forbidden" : "Service Unavailable";
        String detail = status == 401 ? "Envie um ID token Firebase válido no header Authorization: Bearer <token>."
                : status == 403 ? "Acesso não permitido." : "Serviço de autenticação indisponível. Tente novamente mais tarde.";
        response.getWriter().write("{\"type\":\"about:blank\",\"title\":\"" + title
                + "\",\"status\":" + status + ",\"detail\":\"" + detail + "\"}");
    }
}
