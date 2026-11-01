import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type Props = { titulo: string; opcoes: string[]; selecionadas: string[]; onChange: (v: string[]) => void };

export default function ChipSelect({ titulo, opcoes, selecionadas, onChange }: Props) {
  const alternar = (o: string) =>
    onChange(selecionadas.includes(o) ? selecionadas.filter((x) => x !== o) : [...selecionadas, o]);
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.titulo}>{titulo}</Text>
      <View style={styles.linha}>
        {opcoes.map((o) => {
          const on = selecionadas.includes(o);
          return (
            <Pressable
              key={o}
              onPress={() => alternar(o)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipTexto, on && { color: colors.white }]}>{o}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 12, color: colors.muted, marginBottom: 8 },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 12 },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTexto: { fontSize: 12, color: colors.ink },
});
