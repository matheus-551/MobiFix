import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import Card from '../components/Card';
import Tela from '../components/Tela';
import { auth, db } from '../config/firebase';
import { colors } from '../theme/colors';

export type StatusAgendamento = 'pendente' | 'confirmado' | 'concluido' | 'recusado' | 'cancelado';

export type Agendamento = {
  id: string;
  clienteId: string;
  prestadorId: string;
  prestadorNome: string;
  servico: string;
  data: string; // AAAA-MM-DD
  hora: string; // HH:MM
  status: StatusAgendamento;
};

type Props = {
  /** Chamado ao tocar em "Avaliar" num serviço concluído (tela de avaliação virá depois). */
  onAvaliar?: (agendamento: Agendamento) => void;
};

type Aba = 'proximos' | 'historico';

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const ROTULO: Record<StatusAgendamento, string> = {
  pendente: 'Aguardando confirmação',
  confirmado: 'Confirmado',
  concluido: 'Concluído',
  recusado: 'Recusado',
  cancelado: 'Cancelado',
};

function hojeIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatarData(data: string, hora: string) {
  const [a, m, d] = data.split('-').map(Number);
  if (!a || !m || !d) return `${data} · ${hora}`;
  const dia = DIAS[new Date(a, m - 1, d).getDay()];
  return `${dia} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')} · ${hora.slice(0, 2)}h`;
}

const msgErro = (code?: string) => {
  switch (code) {
    case 'permission-denied': return 'Sem permissão para ler os agendamentos. Verifique as regras do Firestore.';
    case 'unavailable': return 'Serviço indisponível. Tente novamente em instantes.';
    default: return 'Não foi possível carregar seus agendamentos.';
  }
};

// Tela "13-meus-agendamentos" do Figma.
export default function MeusAgendamentosScreen({ onAvaliar }: Props) {
  const [aba, setAba] = useState<Aba>('proximos');
  const [lista, setLista] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setErro('Sessão expirada. Entre novamente.');
      setCarregando(false);
      return;
    }
    // Só filtra por clienteId: assim não precisa criar índice no Firestore. A ordenação é feita aqui no app.
    const q = query(collection(db, 'agendamentos'), where('clienteId', '==', uid));
    const cancelar = onSnapshot(
      q,
      (snap) => {
        setLista(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Agendamento, 'id'>) })));
        setErro('');
        setCarregando(false);
      },
      (e) => {
        setErro(msgErro(e?.code));
        setCarregando(false);
      }
    );
    return cancelar;
  }, []);

  const { proximos, historico } = useMemo(() => {
    const hoje = hojeIso();
    const chave = (a: Agendamento) => `${a.data} ${a.hora}`;
    const abertos = (a: Agendamento) =>
      (a.status === 'pendente' || a.status === 'confirmado') && a.data >= hoje;
    return {
      proximos: lista.filter(abertos).sort((x, y) => chave(x).localeCompare(chave(y))),
      historico: lista.filter((a) => !abertos(a)).sort((x, y) => chave(y).localeCompare(chave(x))),
    };
  }, [lista]);

  const itens = aba === 'proximos' ? proximos : historico;

  return (
    <Tela>
      <Text style={styles.titulo}>Meus agendamentos</Text>

      <View style={styles.abas}>
        <Aba rotulo={`Próximos (${proximos.length})`} ativa={aba === 'proximos'} onPress={() => setAba('proximos')} />
        <Aba rotulo={`Histórico (${historico.length})`} ativa={aba === 'historico'} onPress={() => setAba('historico')} />
      </View>

      {carregando && <Text style={styles.aviso}>Carregando...</Text>}

      {!!erro && (
        <Text style={styles.erro} accessibilityRole="alert">
          {erro}
        </Text>
      )}

      {!carregando && !erro && itens.length === 0 && (
        <Text style={styles.aviso}>
          {aba === 'proximos'
            ? 'Você não tem agendamentos próximos. Busque uma oficina e agende um serviço.'
            : 'Seu histórico ainda está vazio.'}
        </Text>
      )}

      {itens.map((a) => (
        <Card key={a.id}>
          <View style={styles.linha}>
            <Text style={styles.servico}>{a.servico}</Text>
            <Selo status={a.status} />
          </View>
          <Text style={styles.detalhe}>{a.prestadorNome}</Text>
          <Text style={styles.detalhe}>{formatarData(a.data, a.hora)}</Text>

          {a.status === 'concluido' && onAvaliar && (
            <Pressable
              onPress={() => onAvaliar(a)}
              accessibilityRole="button"
              accessibilityLabel={`Avaliar ${a.servico}`}
              style={styles.avaliar}
            >
              <Text style={styles.avaliarTxt}>Avaliar serviço</Text>
            </Pressable>
          )}
        </Card>
      ))}
    </Tela>
  );
}

function Aba({ rotulo, ativa, onPress }: { rotulo: string; ativa: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: ativa }}
      style={[styles.aba, ativa && { backgroundColor: colors.primary, borderColor: colors.primary }]}
    >
      <Text style={{ fontSize: 12, fontWeight: '600', color: ativa ? colors.white : colors.muted }}>{rotulo}</Text>
    </Pressable>
  );
}

function Selo({ status }: { status: StatusAgendamento }) {
  const bom = status === 'confirmado' || status === 'concluido';
  const ruim = status === 'recusado' || status === 'cancelado';
  const cor = bom ? colors.success : ruim ? colors.error : colors.primary;
  return (
    <View style={[styles.selo, { borderColor: cor, backgroundColor: bom ? colors.successBg : colors.background }]}>
      <Text style={{ fontSize: 10, fontWeight: '600', color: cor }}>{ROTULO[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 14 },
  abas: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  aba: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 },
  servico: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.ink },
  detalhe: { fontSize: 12, color: colors.muted, marginTop: 2 },
  selo: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  avaliar: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  avaliarTxt: { fontSize: 12, fontWeight: '600', color: colors.primary },
  aviso: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 24, lineHeight: 20 },
  erro: { fontSize: 12, color: colors.error, textAlign: 'center', marginTop: 16 },
});