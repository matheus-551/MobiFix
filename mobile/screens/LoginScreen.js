import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { colors } from '../theme';
import { LogoMark, Input, Button, Banner } from '../components/ui';

function traduzErro(code) {
  switch (code) {
    case 'auth/invalid-email':
      return 'E-mail inválido.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Tente novamente em alguns minutos.';
    case 'auth/network-request-failed':
      return 'Sem conexão com a internet.';
    default:
      return 'Não foi possível entrar. Tente novamente.';
  }
}

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [aviso, setAviso] = useState(null); // { type: 'error' | 'success', message }

  async function entrar() {
    if (!email.trim() || !senha) {
      setAviso({ type: 'error', message: 'Informe e-mail e senha.' });
      return;
    }
    try {
      setAviso(null);
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), senha);
      // O App.js detecta o login e troca de tela sozinho
    } catch (e) {
      setAviso({ type: 'error', message: traduzErro(e.code) });
    } finally {
      setLoading(false);
    }
  }

  async function esqueciSenha() {
    if (!email.trim()) {
      setAviso({ type: 'error', message: 'Digite seu e-mail para receber o link de redefinição.' });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setAviso({ type: 'success', message: 'Enviamos um link de redefinição para o seu e-mail.' });
    } catch (e) {
      setAviso({ type: 'error', message: traduzErro(e.code) });
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <LogoMark size={76} />
          <Text style={styles.brand}>
            Mobi<Text style={{ color: colors.primary }}>Fix</Text>
          </Text>
          <Text style={styles.subtitle}>Entre na sua conta</Text>
        </View>

        <Banner type={aviso?.type} message={aviso?.message} />

        <Input
          placeholder="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
        />
        <Input
          placeholder="Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          style={{ marginTop: 12 }}
        />

        <TouchableOpacity
          onPress={esqueciSenha}
          style={styles.forgot}
          accessibilityRole="button"
          accessibilityLabel="Esqueci a senha"
        >
          <Text style={styles.small}>Esqueci a senha</Text>
        </TouchableOpacity>

        <Button title="Entrar" onPress={entrar} loading={loading} style={{ marginTop: 20 }} />
        <Button
          title="Continuar com Google"
          variant="outline"
          disabled
          style={{ marginTop: 12 }}
        />

        <View style={styles.footer}>
          <Text style={styles.small}>Não tem conta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
            <Text style={[styles.small, { color: colors.primary }]}>Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  header: { alignItems: 'center', marginBottom: 28 },
  brand: { fontSize: 24, fontWeight: '800', color: colors.dark, marginTop: 12 },
  subtitle: { fontSize: 11, color: colors.muted, marginTop: 4 },
  forgot: { alignSelf: 'flex-end', marginTop: 8, minHeight: 32, justifyContent: 'center' },
  small: { fontSize: 11, color: colors.muted },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
});