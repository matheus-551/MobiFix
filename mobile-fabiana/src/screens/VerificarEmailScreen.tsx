import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Botao from '../components/Botao';
import Logo from '../components/Logo';
import Tela from '../components/Tela';
import { atualizarVerificacao, mensagemErro, reenviarVerificacao, sair } from '../services/authService';
import { colors } from '../theme/colors';

const ESPERA_SEGUNDOS = 60;

type Props = { email: string; onVerificado: () => void };

export default function VerificarEmailScreen({ email, onVerificado }: Props) {
  const [espera, setEspera] = useState(0);
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');
  const [verificando, setVerificando] = useState(false);

  useEffect(() => {
    if (espera <= 0) return;
    const t = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  async function jaVerifiquei() {
    setErro('');
    setMsg('');
    setVerificando(true);
    try {
      const ok = await atualizarVerificacao();
      if (ok) onVerificado();
      else setErro('Ainda não encontramos a confirmação. Abra o link enviado ao seu e-mail e tente de novo.');
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setVerificando(false);
    }
  }

  async function reenviar() {
    setErro('');
    setMsg('');
    try {
      await reenviarVerificacao();
      setMsg('Enviamos um novo e-mail de verificação.');
      setEspera(ESPERA_SEGUNDOS);
    } catch (e) {
      setErro(mensagemErro(e));
    }
  }

  return (
    <Tela centralizar>
      <Logo tamanho={72} />
      <Text style={styles.titulo}>Verifique seu e-mail</Text>
      <Text style={styles.texto}>
        Enviamos um link de confirmação para{'\n'}
        <Text style={{ fontWeight: '700', color: colors.ink }}>{email}</Text>
        {'\n'}Abra o e-mail e toque no link para ativar sua conta. Se não encontrar, olhe a caixa de spam.
      </Text>

      {msg !== '' && <Text style={styles.ok}>{msg}</Text>}
      {erro !== '' && <Text style={styles.erro}>{erro}</Text>}

      <View style={{ marginTop: 8 }}>
        <Botao titulo="Já verifiquei" onPress={jaVerifiquei} carregando={verificando} />
        <Botao
          titulo={espera > 0 ? `Reenviar e-mail (${espera}s)` : 'Reenviar e-mail'}
          variante="contorno"
          desabilitado={espera > 0}
          onPress={reenviar}
        />
      </View>

      <Text style={styles.sair} onPress={sair}>
        Usar outra conta
      </Text>
    </Tela>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 20, fontWeight: '700', color: colors.ink, textAlign: 'center', marginTop: 16 },
  texto: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  ok: { color: colors.success, fontSize: 12, textAlign: 'center', marginTop: 12 },
  erro: { color: colors.error, fontSize: 12, textAlign: 'center', marginTop: 12 },
  sair: { color: colors.primary, textAlign: 'center', marginTop: 24, fontSize: 12, fontWeight: '500' },
});
