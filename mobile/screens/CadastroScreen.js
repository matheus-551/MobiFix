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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { colors, radius } from '../theme';
import { Input, Button, Banner } from '../components/ui';

function traduzErro(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado.';
    case 'auth/invalid-email':
      return 'E-mail inválido.';
    case 'auth/weak-password':
      return 'A senha precisa ter pelo menos 6 caracteres.';
    case 'auth/network-request-failed':
      return 'Sem conexão com a internet.';
    default:
      return 'Não foi possível criar a conta. Tente novamente.';
  }
}

export default function CadastroScreen({ navigation }) {
  const [tipo, setTipo] = useState('cliente'); // 'cliente' ou 'profissional'
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [aviso, setAviso] = useState(null);

  async function criarConta() {
    if (!nome.trim() || !email.trim() || !telefone.trim() || !senha) {
      setAviso({ type: 'error', message: 'Preencha todos os campos.' });
      return;
    }
    if (senha !== confirmar) {
      setAviso({ type: 'error', message: 'As senhas não conferem.' });
      return;
    }
    try {
      setAviso(null);
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), senha);
      await updateProfile(cred.user, { displayName: nome.trim() });

      // Guarda os dados extras no Firestore: coleção "usuarios", documento = uid
      await setDoc(doc(db, 'usuarios', cred.user.uid), {
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        tipo,
        criadoEm: serverTimestamp(),
      });
      // O App.js detecta o login e troca de tela sozinho
    } catch (e) {
      setAviso({ type: 'error', message: traduzErro(e.code) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={18} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Criar conta</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Banner type={aviso?.type} message={aviso?.message} />

          <View style={styles.toggleRow}>
            <TipoButton
              label="Cliente"
              ativo={tipo === 'cliente'}
              onPress={() => setTipo('cliente')}
            />
            <TipoButton
              label="Profissional"
              ativo={tipo === 'profissional'}
              onPress={() => setTipo('profissional')}
            />
          </View>

          <Input
            placeholder="Nome completo"
            value={nome}
            onChangeText={setNome}
            autoCapitalize="words"
          />
          <Input
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={styles.field}
          />
          <Input
            placeholder="Telefone"
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
            style={styles.field}
          />
          <Input
            placeholder="Senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            style={styles.field}
          />
          <Input
            placeholder="Confirmar senha"
            value={confirmar}
            onChangeText={setConfirmar}
            secureTextEntry
            style={styles.field}
          />

          <Button
            title="Criar conta"
            onPress={criarConta}
            loading={loading}
            style={{ marginTop: 24 }}
          />

          <View style={styles.footer}>
            <Text style={styles.small}>Já tem conta? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.small}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TipoButton({ label, ativo, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected: ativo }}
      style={[styles.tipo, ativo ? styles.tipoAtivo : styles.tipoInativo]}
    >
      <Text style={[styles.tipoText, { color: ativo ? '#fff' : colors.primary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topTitle: { fontSize: 13, fontWeight: '700', color: colors.dark },
  container: { padding: 16, width: '100%', maxWidth: 480, alignSelf: 'center' },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tipo: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  tipoAtivo: { backgroundColor: colors.primary },
  tipoInativo: { backgroundColor: '#fff' },
  tipoText: { fontSize: 12, fontWeight: '700' },
  field: { marginTop: 12 },
  small: { fontSize: 11, color: colors.muted },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
});