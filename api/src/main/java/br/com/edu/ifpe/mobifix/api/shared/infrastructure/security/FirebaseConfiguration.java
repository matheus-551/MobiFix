package br.com.edu.ifpe.mobifix.api.shared.infrastructure.security;

import java.io.IOException;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;

@Configuration
public class FirebaseConfiguration {
    // Inicialização adiada: rotas públicas não dependem de credenciais disponíveis.
    @Bean(destroyMethod = "delete")
    @Lazy
    FirebaseApp firebaseApp(@Value("${app.firebase.project-id}") String projectId) throws IOException {
        if (projectId.isBlank()) throw new IllegalStateException("Configure FIREBASE_PROJECT_ID.");
        if (System.getenv("FIREBASE_AUTH_EMULATOR_HOST") != null) {
            throw new IllegalStateException("O emulador Firebase não é permitido nesta configuração.");
        }
        return FirebaseApp.initializeApp(FirebaseOptions.builder()
                .setProjectId(projectId)
                .setCredentials(GoogleCredentials.getApplicationDefault())
                .build(), "mobifix-api");
    }

    @Bean
    @Lazy
    FirebaseAuth firebaseAuth(FirebaseApp app) { return FirebaseAuth.getInstance(app); }
}
