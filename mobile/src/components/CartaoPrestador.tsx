import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Prestador } from '../services/prestadorService';
import { colors } from '../theme/colors';
import Card from './Card';

type Props = { prestador: Prestador; onPress: () => void };

export default function CartaoPrestador({ prestador: p, onPress }: Props) {
  const local = [p.cidade, p.uf].filter(Boolean).join(' - ');
  const nota = p.totalAvaliacoes > 0 ? `★ ${p.notaMedia.toFixed(1)} (${p.totalAvaliacoes})` : 'Sem avaliações';
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Ver ${p.nomeExibicao}`}>
      <Card>
        <View style={styles.foto} />
        <View style={styles.linha}>
          <Text style={styles.nome} numberOfLines={1}>{p.nomeExibicao}</Text>
          <Text style={styles.nota}>{nota}</Text>
        </View>
        {local !== '' && <Text style={styles.info}>{local}</Text>}
        {p.tiposVeiculo.length > 0 && <Text style={styles.info}>Atende: {p.tiposVeiculo.join(', ')}</Text>}
        {p.especialidades.length > 0 && <Text style={styles.info}>{p.especialidades.join(' · ')}</Text>}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  foto: { height: 90, borderRadius: 8, backgroundColor: colors.soft, marginBottom: 10 },
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  nome: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.ink },
  nota: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  info: { fontSize: 11, color: colors.muted, marginTop: 3 },
});
