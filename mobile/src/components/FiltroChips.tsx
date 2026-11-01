import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  opcoes: string[];
  /** Opção selecionada; null significa "Todos". */
  valor: string | null;
  onChange: (v: string | null) => void;
  rotuloTodos?: string;
};

export default function FiltroChips({ opcoes, valor, onChange, rotuloTodos = 'Todos' }: Props) {
  const itens: { rotulo: string; valor: string | null }[] = [
    { rotulo: rotuloTodos, valor: null },
    ...opcoes.map((o) => ({ rotulo: o, valor: o })),
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.linha}>
      {itens.map((i) => {
        const on = i.valor === valor;
        return (
          <Pressable
            key={i.rotulo}
            onPress={() => onChange(i.valor)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[styles.chip, on && styles.chipOn]}
          >
            <Text style={[styles.texto, on && { color: colors.white }]}>{i.rotulo}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  linha: { gap: 8, paddingVertical: 2 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 14 },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  texto: { fontSize: 12, color: colors.ink },
});
