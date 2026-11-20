import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Tela from '../components/Tela';
import { colors } from '../theme/colors';

type Props = { titulo: string; texto: string };

export default function EmBreveScreen({ titulo, texto }: Props) {
  return (
    <Tela edges={['top']} centralizar>
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.texto}>{texto}</Text>
    </Tela>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 18, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  texto: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 8 },
});
