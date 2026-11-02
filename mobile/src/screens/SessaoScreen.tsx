import { User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import Botao from '../components/Botao';
import Tela from '../components/Tela';
import { mensagemErro, sair } from '../services/authService';
import { carregarSessao, Sessao } from '../services/perfilService';
import { colors } from '../theme/colors';
import CadastroScreen from './CadastroScreen';
import PrincipalScreen from './PrincipalScreen';

export default function SessaoScreen({ usuario }: { usuario: User }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [erro, setErro] = useState('');
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    let ativo = true;
    carregarSessao().then(resultado => { if (ativo) setSessao(resultado); })
      .catch(e => { if (ativo) setErro(mensagemErro(e)); });
    return () => { ativo = false; };
  }, [usuario.uid, tentativa]);
  function tentarNovamente() { setSessao(null); setErro(''); setTentativa(t => t + 1); }
  if (sessao?.estado === 'pronta') return <PrincipalScreen perfil={sessao.perfil} />;
  if (sessao?.estado === 'cadastro') return <CadastroScreen usuario={usuario} conta={sessao.usuario}
    onConcluido={tentarNovamente} onVoltar={() => { void sair(); }} />;
  return <Tela centralizar>
    {sessao?.estado === 'inativa' ? <Text>Sua conta está desativada.</Text>
      : erro ? <><Text style={{ color: colors.error }}>{erro}</Text><Botao titulo="Tentar novamente" onPress={tentarNovamente} /></>
      : <><ActivityIndicator color={colors.primary} /><Text>Carregando sua conta…</Text></>}
    <Botao titulo="Sair" variante="contorno" onPress={() => { void sair(); }} />
  </Tela>;
}
