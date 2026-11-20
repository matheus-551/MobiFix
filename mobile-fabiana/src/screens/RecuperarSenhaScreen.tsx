import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import BarraTopo from '../components/BarraTopo';
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
      <BarraTopo titulo="Recuperar senha" onVoltar={onVoltar} />

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
  texto: { fontSize: 13, color: colors.muted, marginBottom: 16, lineHeight: 20 },
  ok: { fontSize: 13, color: colors.success, backgroundColor: colors.successBg, padding: 14, borderRadius: 10, lineHeight: 20 },
  erro: { color: colors.error, fontSize: 12, textAlign: 'center' },
});