import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import BarraAbas, { Aba } from '../components/BarraAbas';
import { buscarPerfil } from '../services/perfilService';
import { garantirPerfilPublico } from '../services/prestadorService';
import { colors } from '../theme/colors';
import { Perfil } from '../types';
import BuscarScreen from './BuscarScreen';
import DashboardScreen from './DashboardScreen';
import EmBreveScreen from './EmBreveScreen';
import PerfilScreen from './PerfilScreen';

type Props = { uid: string; email: string };

/** Área logada: conteúdo da aba atual + barra inferior. */
export default function PrincipalScreen({ uid, email }: Props) {
  const [aba, setAba] = useState<Aba>('inicio');
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  useEffect(() => {
    buscarPerfil(uid).then((p) => {
      setPerfil(p);
      if (p) garantirPerfilPublico(uid, p); // prestadores verificados passam a aparecer na busca
    });
  }, [uid]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        {aba === 'inicio' && <DashboardScreen perfil={perfil} />}
        {aba === 'buscar' && <BuscarScreen />}
        {aba === 'agenda' && <EmBreveScreen titulo="Agenda" texto="Em breve: seus agendamentos aparecerão aqui." />}
        {aba === 'perfil' && <PerfilScreen perfil={perfil} email={email} />}
      </View>
      <BarraAbas ativa={aba} onChange={setAba} />
    </View>
  );
}
