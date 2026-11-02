import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

type Props = { placeholder: string; valor: string; opcoes: string[]; onChange: (v: string) => void };

export default function SelectCampo({ placeholder, valor, opcoes, onChange }: Props) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <Pressable style={styles.campo} onPress={() => setAberto(true)} accessibilityRole="button" accessibilityLabel={placeholder}>
        <Text style={{ fontSize: 14, color: valor ? colors.ink : colors.muted }}>{valor || placeholder}</Text>
      </Pressable>
      <Modal visible={aberto} animationType="slide" onRequestClose={() => setAberto(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <Text style={styles.titulo}>{placeholder}</Text>
          <FlatList
            data={opcoes}
            keyExtractor={(o) => o}
            renderItem={({ item }) => (
              <Pressable
                style={styles.item}
                onPress={() => {
                  onChange(item);
                  setAberto(false);
                }}
              >
                <Text style={[styles.itemTexto, item === valor && { color: colors.primary, fontWeight: '700' }]}>{item}</Text>
              </Pressable>
            )}
          />
          <Pressable style={styles.fechar} onPress={() => setAberto(false)}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Cancelar</Text>
          </Pressable>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  campo: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  titulo: { fontSize: 16, fontWeight: '600', color: colors.ink, padding: 20 },
  item: { paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemTexto: { fontSize: 15, color: colors.ink },
  fechar: { alignItems: 'center', padding: 18 },
});
