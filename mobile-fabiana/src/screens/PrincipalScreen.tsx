import React, { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import BarraAbas, { Aba } from '../components/BarraAbas';
import { buscarPerfil } from '../services/perfilService';
import { garantirPerfilPublico, Prestador } from '../services/prestadorService';
import { colors } from '../theme/colors';
import { Perfil } from '../types';
import AgendaScreen from './AgendaScreen';
import AgendamentoScreen, { Existente } from './AgendamentoScreen';
import BuscarScreen from './BuscarScreen';
import DashboardScreen from './DashboardScreen';
import PerfilOficinaScreen from './PerfilOficinaScreen';
import PerfilScreen from './PerfilScreen';

type Props = { uid: string; email: string };

/** Área logada: conteúdo da aba atual + barra inferior. */
export default function PrincipalScreen({ uid, email }: Props) {
  const [aba, setAba] = useState<Aba>('inicio');
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [prestador, setPrestador] = useState<Prestador | null>(null); // oficina aberta
  const [agendando, setAgendando] = useState(false);
  const [editando, setEditando] = useState<Existente | null>(null);  // agendamento em edição
  const [versaoAgenda, setVersaoAgenda] = useState(0);                // recarrega a Agenda após editar

  useEffect(() => {
    buscarPerfil(uid).then((p) => {
      setPerfil(p);
      if (p) garantirPerfilPublico(uid, p); // prestadores verificados passam a aparecer na busca
    });
  }, [uid]);

  // Botão voltar do Android: edição -> agendamento -> perfil da oficina -> início.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (editando) { setEditando(null); return true; }
      if (agendando) { setAgendando(false); return true; }
      if (prestador) { setPrestador(null); return true; }
      if (aba !== 'inicio') { setAba('inicio'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [editando, agendando, prestador, aba]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        {aba === 'inicio' && (
          <DashboardScreen perfil={perfil} onAbrirPrestador={setPrestador} onVerAgenda={() => setAba('agenda')} />
        )}
        {aba === 'buscar' && <BuscarScreen onAbrirPrestador={setPrestador} />}
        {aba === 'agenda' && (
          <AgendaScreen key={versaoAgenda} onVoltar={() => setAba('inicio')} onEditar={setEditando} />
        )}
        {aba === 'perfil' && <PerfilScreen perfil={perfil} email={email} />}
      </View>
      <BarraAbas ativa={aba} onChange={setAba} />

      {editando && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
          <AgendamentoScreen
            existente={editando}
            onVoltar={() => setEditando(null)}
            onConcluir={() => { setEditando(null); setVersaoAgenda((v) => v + 1); }}
          />
        </View>
      )}

      {!editando && prestador && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
          {agendando ? (
            <AgendamentoScreen
              prestador={prestador}
              onVoltar={() => setAgendando(false)}
              onConcluir={() => { setAgendando(false); setPrestador(null); setAba('agenda'); }}
            />
          ) : (
            <PerfilOficinaScreen
              prestador={prestador}
              onVoltar={() => setPrestador(null)}
              onAgendar={() => setAgendando(true)}
            />
          )}
        </View>
      )}
    </View>
  );
}