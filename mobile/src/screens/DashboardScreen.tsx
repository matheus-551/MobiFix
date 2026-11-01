import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from '../components/Card';
import Logo from '../components/Logo';
import Tela from '../components/Tela';
import { colors } from '../theme/colors';
import { nomeDo, Perfil } from '../types';

type Props = { perfil: Perfil | null };

// Tela "04-dashboard" do Figma.
// ATENÇÃO: os números e os cards abaixo são EXEMPLOS fixos do protótipo.
// Serão trocados por dados reais quando o módulo de agendamentos existir.
export default function DashboardScreen({ perfil }: Props) {
  const nome = nomeDo(perfil).trim().split(' ')[0];

  return (
    <Tela edges={['top']}>
      <View style={styles.cabecalho}>
        <View style={styles.saudacao}>
          <Logo tamanho={30} />
          <Text style={styles.ola}>{nome ? `Olá, ${nome}` : 'Olá'}</Text>
        </View>
        <Ionicons name="notifications-outline" size={22} color={colors.primary} accessibilityLabel="Notificações" />
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statN}>2</Text>
          <Text style={styles.statT}>Agendados</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statN}>5</Text>
          <Text style={styles.statT}>Concluídos</Text>
        </View>
      </View>

      <Text style={styles.secao}>Próximo agendamento</Text>
      <Card>
        <Text style={styles.nome}>Troca de óleo</Text>
        <Text style={styles.info}>Auto Center Premium · Qui, 14h</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeT}>Confirmado</Text>
        </View>
      </Card>

      <Text style={styles.secao}>Oficinas recomendadas</Text>
      <Card>
        <View style={styles.foto} />
        <Text style={styles.nome}>Mecânica Express</Text>
        <Text style={styles.info}>★ 4.6 · 3 km</Text>
      </Card>
    </Tela>
  );
}

const styles = StyleSheet.create({
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  saudacao: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ola: { fontSize: 15, fontWeight: '700', color: colors.ink },
  stats: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  stat: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, alignItems: 'center' },
  statN: { fontSize: 26, fontWeight: '700', color: colors.primary },
  statT: { fontSize: 11, color: colors.muted },
  secao: { fontSize: 12, fontWeight: '600', color: colors.ink, marginTop: 16, marginBottom: 8 },
  nome: { fontSize: 13, fontWeight: '600', color: colors.ink },
  info: { fontSize: 11, color: colors.muted, marginTop: 3 },
  badge: { alignSelf: 'flex-start', backgroundColor: colors.successBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 8 },
  badgeT: { fontSize: 10, fontWeight: '600', color: colors.success },
  foto: { height: 110, borderRadius: 8, backgroundColor: colors.soft, marginBottom: 10 },
});
