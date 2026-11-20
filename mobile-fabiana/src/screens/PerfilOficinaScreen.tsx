import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Botao from '../components/Botao';
import Card from '../components/Card';
import BarraTopo from '../components/BarraTopo';
import { Prestador } from '../services/prestadorService';
import { colors } from '../theme/colors';

type Props = { prestador: Prestador; onVoltar: () => void; onAgendar: () => void };

// Tela "06-perfil-oficina" do Figma.
export default function PerfilOficinaScreen({ prestador: p, onVoltar, onAgendar }: Props) {
  const [fav, setFav] = useState(false); // só visual por enquanto
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 20 }}>
        <BarraTopo
          titulo="Oficina"
          onVoltar={onVoltar}
          direita={
            <Pressable onPress={() => setFav(!fav)} accessibilityRole="button" accessibilityLabel="Favoritar"
              hitSlop={12} style={{ minHeight: 44, justifyContent: 'center' }}>
              <Ionicons name={fav ? 'heart' : 'heart-outline'} size={22} color={colors.primary} />
            </Pressable>
          }
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.foto} />
        <View style={styles.corpo}>
          <Text style={styles.nome}>{p.nomeExibicao}</Text>
          <Text style={styles.meta}>
            ★ {p.notaMedia ? p.notaMedia.toFixed(1) : 'Novo'}{p.cidade ? ` · ${p.cidade}` : ''}
          </Text>

          <View style={{ height: 16 }} />
          <Card>
            <Text style={styles.cardTitulo}>Serviços</Text>
            <Text style={styles.cardTxt}>{p.especialidades.length ? p.especialidades.join(' · ') : 'Não informado'}</Text>
            {p.tiposVeiculo.length > 0 && (
              <Text style={[styles.cardTxt, { marginTop: 8 }]}>Atende: {p.tiposVeiculo.join(', ')}</Text>
            )}
          </Card>
          <View style={{ height: 12 }} />
          <Card>
            <Text style={styles.cardTitulo}>Horários</Text>
            <Text style={styles.cardTxt}>{(p as any).horarios ?? 'A combinar com a oficina no agendamento.'}</Text>
          </Card>
        </View>
      </ScrollView>

      <View style={styles.rodape}>
        <Botao titulo="Agendar serviço" onPress={onAgendar} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  foto: { height: 150, backgroundColor: colors.soft },
  corpo: { padding: 20, width: '100%', maxWidth: 480, alignSelf: 'center' },
  nome: { fontSize: 20, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 13, color: colors.muted, marginTop: 4 },
  cardTitulo: { fontSize: 13, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  cardTxt: { fontSize: 12, color: colors.muted, lineHeight: 18 },
  rodape: { paddingHorizontal: 20, paddingBottom: 16, borderTopWidth: 1, borderTopColor: colors.border },
});