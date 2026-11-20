import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type Props = { titulo: string; onVoltar: () => void; direita?: ReactNode };

export default function BarraTopo({ titulo, onVoltar, direita }: Props) {
  return (
    <View style={styles.barra}>
      <Pressable onPress={onVoltar} accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={12} style={styles.voltar}>
        <Ionicons name="arrow-back" size={20} color={colors.ink} />
        <Text style={styles.titulo}>{titulo}</Text>
      </Pressable>
      {direita}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  voltar: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  titulo: { fontSize: 16, fontWeight: '700', color: colors.ink },
});