import React, { useState } from 'react';
import { View } from 'react-native';
import BarraAbas, { Aba } from '../components/BarraAbas';
import { colors } from '../theme/colors';
import { Perfil } from '../types';
import BuscarScreen from './BuscarScreen';
import DashboardScreen from './DashboardScreen';
import EmBreveScreen from './EmBreveScreen';
import PerfilScreen from './PerfilScreen';

type Props = { perfil: Perfil };

/** Área logada: conteúdo da aba atual + barra inferior. */
export default function PrincipalScreen({ perfil }: Props) {
  const [aba, setAba] = useState<Aba>('inicio');
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        {aba === 'inicio' && <DashboardScreen perfil={perfil} />}
        {aba === 'buscar' && <BuscarScreen />}
        {aba === 'agenda' && <EmBreveScreen titulo="Agenda" texto="Em breve: seus agendamentos aparecerão aqui." />}
        {aba === 'perfil' && <PerfilScreen perfil={perfil} email={perfil.email} />}
      </View>
      <BarraAbas ativa={aba} onChange={setAba} />
    </View>
  );
}
