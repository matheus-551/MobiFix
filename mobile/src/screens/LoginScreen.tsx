import React, { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Botao from '../components/Botao';
import Campo from '../components/Campo';
import Logo from '../components/Logo';
import Tela from '../components/Tela';
import { entrar, mensagemErro } from '../services/authService';
import { colors } from '../theme/colors';
import { emailValido } from '../utils/validators';

type Props = {
  onCadastro?: () => void;
  onEsqueciSenha?: (email: string) => void;
};

export default function LoginScreen({ onCadastro, onEsqueciSenha }: Props) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const senhaRef = useRef<TextInput>(null);

  async function aoEntrar() {
    if (!emailValido(email)) return setErro('Digite um e-mail válido.');
    if (!senha) return setErro('Digite sua senha.');
    setErro('');
    setCarregando(true);
    try {
      await entrar(email, senha);
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Tela centralizar>
      <Logo />
      <Text style={styles.marca}>
        Mobi<Text style={{ color: colors.primary }}>Fix</Text>
      </Text>
      <Text style={styles.sub}>Entre na sua conta</Text>

      <View style={{ marginTop: 28 }}>
        <Campo
          placeholder="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          returnKeyType="next"
          onSubmitEditing={() => senhaRef.current?.focus()}
        />
        <Campo
          ref={senhaRef}
          placeholder="Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          autoComplete="password"
          returnKeyType="done"
          onSubmitEditing={aoEntrar}
        />

        <Pressable style={styles.esqueci} onPress={() => onEsqueciSenha?.(email)}>
          <Text style={styles.esqueciTexto}>Esqueci a senha</Text>
        </Pressable>

        {erro !== '' && <Text style={styles.erro}>{erro}</Text>}

        <Botao titulo="Entrar" onPress={aoEntrar} carregando={carregando} />
        <Botao
          titulo="Continuar com Google"
          variante="contorno"
          desabilitado={carregando}
          onPress={() => Alert.alert('Google', 'Será ativado em uma próxima etapa.')}
        />

        <Text style={styles.cadastro}>
          Não tem conta?{' '}
          <Text style={styles.link} onPress={onCadastro}>
            Cadastre-se
          </Text>
        </Text>
      </View>
    </Tela>
  );
}

const styles = StyleSheet.create({
  marca: { fontSize: 24, fontWeight: '700', color: colors.ink, textAlign: 'center', marginTop: 12 },
  sub: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 2 },
  esqueci: { alignSelf: 'flex-end', paddingVertical: 4 },
  esqueciTexto: { fontSize: 11, color: colors.muted },
  erro: { color: colors.error, fontSize: 12, textAlign: 'center', marginTop: 8 },
  cadastro: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 22 },
  link: { color: colors.primary, fontWeight: '500' },
});
