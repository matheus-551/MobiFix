import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Botao from '../components/Botao';
import Card from '../components/Card';
import CartaoPrestador from '../components/CartaoPrestador';
import Logo from '../components/Logo';
import Tela from '../components/Tela';
import { auth, db } from '../config/firebase';
import { buscarPrestadores, Prestador } from '../services/prestadorService';
import { colors } from '../theme/colors';
import { nomeDo, Perfil } from '../types';

type Props = {
  perfil: Perfil | null;
  onAbrirPrestador?: (p: Prestador) => void;
  onVerAgenda?: () => void;
};

type Ag = { id: string; servico: string; prestadorNome: string; data: string; hora: string; status: string };

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const quando = (iso: string, hora: string) => {
  const [a, m, d] = iso.split('-').map(Number);
  return `${DIAS[new Date(a, m - 1, d).getDay()]}, ${hora}`;
};
// Data de hoje no fuso do celular (AAAA-MM-DD).
const hojeIso = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};
const ativo = (s: string) => s === 'pendente' || s === 'confirmado';

// Tela "04-dashboard" do Figma, com dados reais de agendamentos e oficinas.
export default function DashboardScreen({ perfil, onAbrirPrestador, onVerAgenda }: Props) {
  const nome = nomeDo(perfil).trim().split(' ')[0];
  const [ags, setAgs] = useState<Ag[]>([]);
  const [recomendados, setRecomendados] = useState<Prestador[]>([]);
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando');

  const carregar = useCallback(async () => {
    setEstado('carregando');
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('sem usuário');
      const [snap, prestadores] = await Promise.all([
        getDocs(query(collection(db, 'agendamentos'), where('clienteId', '==', uid))),
        buscarPrestadores().catch(() => [] as Prestador[]),
      ]);
      setAgs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Ag[]);
      setRecomendados(
        [...prestadores].sort((a, b) => b.notaMedia - a.notaMedia || a.nomeExibicao.localeCompare(b.nomeExibicao)).slice(0, 2),
      );
      setEstado('ok');
    } catch {
      setEstado('erro');
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const hoje = hojeIso();
  const futuros = ags.filter((a) => ativo(a.status) && a.data >= hoje);
  const concluidos = ags.filter((a) => a.status === 'concluido').length;
  const proximo = [...futuros].sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))[0];
  const confirmado = proximo?.status === 'confirmado';

  return (
    <Tela edges={['top']}>
      <View style={styles.cabecalho}>
        <View style={styles.saudacao}>
          <Logo tamanho={30} />
          <Text style={styles.ola}>{nome ? `Olá, ${nome}` : 'Olá'}</Text>
        </View>
        <Ionicons name="notifications-outline" size={22} color={colors.primary} accessibilityLabel="Notificações" />
      </View>

      {estado === 'carregando' && <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />}

      {estado === 'erro' && (
        <View>
          <Text style={styles.msg}>Não foi possível carregar seus dados.</Text>
          <Botao titulo="Tentar de novo" variante="contorno" onPress={carregar} />
        </View>
      )}

      {estado === 'ok' && (
        <>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statN}>{futuros.length}</Text>
              <Text style={styles.statT}>Agendados</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statN}>{concluidos}</Text>
              <Text style={styles.statT}>Concluídos</Text>
            </View>
          </View>

          <Text style={styles.secao}>Próximo agendamento</Text>
          <Pressable onPress={onVerAgenda} accessibilityRole="button" accessibilityLabel="Abrir minha agenda">
            <Card>
              {proximo ? (
                <>
                  <Text style={styles.nome}>{proximo.servico}</Text>
                  <Text style={styles.info}>{proximo.prestadorNome} · {quando(proximo.data, proximo.hora)}</Text>
                  <View style={[styles.badge, !confirmado && { backgroundColor: colors.primarySoft }]}>
                    <Text style={[styles.badgeT, !confirmado && { color: colors.primary }]}>
                      {confirmado ? 'Confirmado' : 'Pendente'}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={styles.info}>Você não tem agendamentos próximos. Use a aba Buscar para marcar um serviço.</Text>
              )}
            </Card>
          </Pressable>

          <Text style={styles.secao}>Oficinas recomendadas</Text>
          {recomendados.length === 0 ? (
            <Card>
              <Text style={styles.info}>Nenhuma oficina cadastrada ainda.</Text>
            </Card>
          ) : (
            <View style={{ gap: 12 }}>
              {recomendados.map((p) => (
                <CartaoPrestador key={p.id} prestador={p} onPress={() => onAbrirPrestador?.(p)} />
              ))}
            </View>
          )}
        </>
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  saudacao: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ola: { fontSize: 15, fontWeight: '700', color: colors.ink },
  msg: { fontSize: 13, color: colors.muted, textAlign: 'center', marginVertical: 16 },
  stats: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  stat: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, alignItems: 'center' },
  statN: { fontSize: 26, fontWeight: '700', color: colors.primary },
  statT: { fontSize: 11, color: colors.muted },
  secao: { fontSize: 12, fontWeight: '600', color: colors.ink, marginTop: 16, marginBottom: 8 },
  nome: { fontSize: 13, fontWeight: '600', color: colors.ink },
  info: { fontSize: 11, color: colors.muted, marginTop: 3, lineHeight: 17 },
  badge: { alignSelf: 'flex-start', backgroundColor: colors.successBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 8 },
  badgeT: { fontSize: 10, fontWeight: '600', color: colors.success },
});