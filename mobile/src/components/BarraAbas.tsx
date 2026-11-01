import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export type Aba = 'inicio' | 'buscar' | 'agenda' | 'perfil';

type Icone = keyof typeof Ionicons.glyphMap;
const ABAS: { id: Aba; rotulo: string; icone: Icone; iconeAtivo: Icone }[] = [
  { id: 'inicio', rotulo: 'Início', icone: 'home-outline', iconeAtivo: 'home' },
  { id: 'buscar', rotulo: 'Buscar', icone: 'search-outline', iconeAtivo: 'search' },
  { id: 'agenda', rotulo: 'Agenda', icone: 'calendar-outline', iconeAtivo: 'calendar' },
  { id: 'perfil', rotulo: 'Perfil', icone: 'person-outline', iconeAtivo: 'person' },
];

type Props = { ativa: Aba; onChange: (a: Aba) => void };

export default function BarraAbas({ ativa, onChange }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.barra, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {ABAS.map((a) => {
        const on = a.id === ativa;
        return (
          <Pressable
            key={a.id}
            style={styles.aba}
            onPress={() => onChange(a.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={a.rotulo}
          >
            <Ionicons name={on ? a.iconeAtivo : a.icone} size={22} color={on ? colors.primary : colors.muted} />
            <Text style={[styles.rotulo, on && styles.rotuloOn]}>{a.rotulo}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    paddingTop: 8,
  },
  aba: { flex: 1, alignItems: 'center', gap: 2 },
  rotulo: { fontSize: 11, color: colors.muted },
  rotuloOn: { color: colors.primary, fontWeight: '600' },
});
