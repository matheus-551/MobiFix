import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import BarraTopo from '../components/BarraTopo';
import Botao from '../components/Botao';
import Card from '../components/Card';
import Tela from '../components/Tela';
import { auth, db } from '../config/firebase';
import { colors } from '../theme/colors';

type Ag = { id: string; servico: string; prestadorNome: string; data: string; hora: string; status: string };
type Props = { onVoltar: () => void; onEditar: (a: Ag) => void };

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const quando = (iso: string, hora: string) => {
  const [a, m, d] = iso.split('-').map(Number);
  const dd = String(d).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${DIAS[new Date(a, m - 1, d).getDay()]}, ${dd}/${mm} · ${hora}`;
};
const ativo = (s: string) => s === 'pendente' || s === 'confirmado';

const ROTULO: Record<string, string> = {
  pendente: 'Pendente', confirmado: 'Confirmado', concluido: 'Concluído', cancelado: 'Cancelado',
};
const COR: Record<string, { bg: string; fg: string }> = {
  pendente: { bg: colors.primarySoft, fg: colors.primary },
  confirmado: { bg: colors.successBg, fg: colors.success },
  concluido: { bg: colors.successBg, fg: colors.success },
  cancelado: { bg: colors.border, fg: colors.muted },
};

// Aba "Agenda": agendamentos do cliente. Só os PENDENTES podem ser editados ou desmarcados (US-12).
export default function AgendaScreen({ onVoltar, onEditar }: Props) {
  const [lista, setLista] = useState<Ag[]>([]);
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando');
  const [cancelando, setCancelando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setEstado('carregando');
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('sem usuário');
      const snap = await getDocs(query(collection(db, 'agendamentos'), where('clienteId', '==', uid)));
      const itens = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Ag[];
      itens.sort((a, b) => {
        if (ativo(a.status) !== ativo(b.status)) return ativo(a.status) ? -1 : 1; // ativos primeiro
        const ka = a.data + a.hora;
        const kb = b.data + b.hora;
        return ativo(a.status) ? ka.localeCompare(kb) : kb.localeCompare(ka);
      });
      setLista(itens);
      setEstado('ok');
    } catch {
      setEstado('erro');
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  function desmarcar(a: Ag) {
    Alert.alert(
      'Desmarcar agendamento',
      `Deseja desmarcar "${a.servico}" em ${a.prestadorNome}, ${quando(a.data, a.hora)}?`,
      [
        { text: 'Manter', style: 'cancel' },
        {
          text: 'Desmarcar',
          style: 'destructive',
          onPress: async () => {
            setCancelando(a.id);
            try {
              await updateDoc(doc(db, 'agendamentos', a.id), { status: 'cancelado' });
              setLista((l) => l.map((x) => (x.id === a.id ? { ...x, status: 'cancelado' } : x)));
            } catch {
              Alert.alert('Não foi possível desmarcar', 'Verifique sua conexão e as regras do Firestore e tente de novo.');
            } finally {
              setCancelando(null);
            }
          },
        },
      ],
    );
  }

  return (
    <Tela edges={['top']}>
      <BarraTopo titulo="Meus agendamentos" onVoltar={onVoltar} />

      {estado === 'carregando' && <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />}

      {estado === 'erro' && (
        <View>
          <Text style={styles.msg}>Não foi possível carregar seus agendamentos.</Text>
          <Botao titulo="Tentar de novo" variante="contorno" onPress={carregar} />
        </View>
      )}

      {estado === 'ok' && lista.length === 0 && (
        <Text style={styles.msg}>Você ainda não tem agendamentos. Use a aba Buscar para agendar um serviço.</Text>
      )}

      {estado === 'ok' && lista.map((a) => {
        const cor = COR[a.status] ?? COR.pendente;
        return (
          <View key={a.id} style={{ marginBottom: 12 }}>
            <Card>
              <View style={styles.linha}>
                <Text style={styles.servico}>{a.servico}</Text>
                <View style={[styles.badge, { backgroundColor: cor.bg }]}>
                  <Text style={[styles.badgeT, { color: cor.fg }]}>{ROTULO[a.status] ?? a.status}</Text>
                </View>
              </View>
              <Text style={styles.info}>{a.prestadorNome}</Text>
              <Text style={styles.info}>{quando(a.data, a.hora)}</Text>

              {a.status === 'pendente' && (
                <View style={styles.acoes}>
                  <Pressable
                    onPress={() => onEditar(a)}
                    accessibilityRole="button"
                    accessibilityLabel={`Editar ${a.servico}`}
                    style={[styles.botao, { borderColor: colors.primary }]}
                  >
                    <Text style={[styles.botaoT, { color: colors.primary }]}>Editar</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => desmarcar(a)}
                    disabled={cancelando === a.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Desmarcar ${a.servico}`}
                    style={[styles.botao, { borderColor: colors.error }, cancelando === a.id && { opacity: 0.5 }]}
                  >
                    <Text style={[styles.botaoT, { color: colors.error }]}>
                      {cancelando === a.id ? 'Desmarcando…' : 'Desmarcar'}
                    </Text>
                  </Pressable>
                </View>
              )}

              {a.status === 'confirmado' && (
                <Text style={styles.nota}>Confirmado pela oficina. Para alterar, entre em contato com ela.</Text>
              )}
            </Card>
          </View>
        );
      })}
    </Tela>
  );
}

const styles = StyleSheet.create({
  msg: { fontSize: 13, color: colors.muted, textAlign: 'center', marginVertical: 20, lineHeight: 20 },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  servico: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.ink },
  info: { fontSize: 12, color: colors.muted, marginTop: 4 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeT: { fontSize: 10, fontWeight: '700' },
  acoes: { flexDirection: 'row', gap: 10, marginTop: 12 },
  botao: { flex: 1, minHeight: 44, borderWidth: 1.5, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  botaoT: { fontSize: 13, fontWeight: '600' },
  nota: { fontSize: 11, color: colors.muted, marginTop: 10, lineHeight: 16 },
});