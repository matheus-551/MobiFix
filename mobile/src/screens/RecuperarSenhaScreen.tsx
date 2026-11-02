import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Botao from '../components/Botao';
import Campo from '../components/Campo';
import Tela from '../components/Tela';
import { mensagemErro, recuperarSenha } from '../services/authService';
import { colors } from '../theme/colors';
import { emailValido } from '../utils/validators';

type Props = { emailInicial?: string; onVoltar: () => void };

export default function RecuperarSenhaScreen({ emailInicial = '', onVoltar }: Props) {
  const [email, setEmail] = useState(emailInicial);
  const [erro, setErro] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function enviar() {
    if (!emailValido(email)) return setErro('Digite um e-mail válido.');
    setErro('');
    setCarregando(true);
    try {
      await recuperarSenha(email);
      setEnviado(true);
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Tela>
      <View style={styles.topo}>
        <Pressable onPress={onVoltar} accessibilityLabel="Voltar" hitSlop={12}>
          <Text style={styles.voltar}>←</Text>
        </Pressable>
        <Text style={styles.titulo}>Recuperar senha</Text>
      </View>

      {enviado ? (
        <>
          <Text style={styles.ok}>
            Se esse e-mail estiver cadastrado, você receberá em instantes um link para criar uma nova senha. Confira também a caixa de spam.
          </Text>
          <Botao titulo="Voltar para o login" onPress={onVoltar} />
        </>
      ) : (
        <>
          <Text style={styles.texto}>
            Informe o e-mail da sua conta. Enviaremos um link para você definir uma nova senha.
          </Text>
          <Campo
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            returnKeyType="send"
            onSubmitEditing={enviar}
          />
          {erro !== '' && <Text style={styles.erro}>{erro}</Text>}
          <Botao titulo="Enviar link" onPress={enviar} carregando={carregando} />
        </>
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  voltar: { fontSize: 20, color: colors.ink },
  titulo: { fontSize: 15, fontWeight: '600', color: colors.ink },
  texto: { fontSize: 13, color: colors.muted, marginBottom: 16, lineHeight: 20 },
  ok: { fontSize: 13, color: colors.success, backgroundColor: colors.successBg, padding: 14, borderRadius: 10, lineHeight: 20 },
  erro: { color: colors.error, fontSize: 12, textAlign: 'center' },
});
