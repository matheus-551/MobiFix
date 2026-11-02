import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  titulo: string;
  onPress?: () => void;
  variante?: 'primario' | 'contorno';
  carregando?: boolean;
  desabilitado?: boolean;
};

export default function Botao({ titulo, onPress, variante = 'primario', carregando, desabilitado }: Props) {
  const contorno = variante === 'contorno';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={carregando || desabilitado}
      style={({ pressed }) => [
        styles.base,
        contorno ? styles.contorno : styles.primario,
        pressed && (contorno ? styles.contornoPressed : styles.primarioPressed),
        (carregando || desabilitado) && styles.disabled,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={contorno ? colors.primary : colors.white} />
      ) : (
        <Text style={[styles.texto, contorno && { color: colors.primary }]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  primario: { backgroundColor: colors.primary },
  primarioPressed: { backgroundColor: colors.primaryPressed, borderColor: colors.primaryPressed },
  contorno: { backgroundColor: colors.background },
  contornoPressed: { backgroundColor: colors.primarySoft },
  disabled: { opacity: 0.6 },
  texto: { color: colors.white, fontSize: 14, fontWeight: '600' },
});
