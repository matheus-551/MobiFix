import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BarraTopo from '../components/BarraTopo';
import Botao from '../components/Botao';
import Card from '../components/Card';
import ChipSelect from '../components/ChipSelect';
import { auth, db } from '../config/firebase';
import { Prestador } from '../services/prestadorService';
import { colors } from '../theme/colors';

const msgFirebase = (code?: string) => {
  switch (code) {
    case 'auth/network-request-failed': return 'Sem conexão. Verifique sua internet.';
    case 'permission-denied': return 'Sem permissão para salvar. Verifique as regras do Firestore.';
    case 'unavailable': return 'Serviço indisponível. Tente novamente em instantes.';
    default: return 'Não foi possível concluir. Tente novamente.';
  }
};

/** Agendamento já existente (modo edição). */
export type Existente = { id: string; servico: string; prestadorNome: string; data: string; hora: string };

type Props = {
  prestador?: Prestador;   // novo agendamento
  existente?: Existente;   // editar agendamento pendente
  onVoltar: () => void;
  onConcluir: () => void;
};

const HORARIOS = ['09:00', '14:00', '16:00'];
const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES_A_FRENTE = 12; // até quantos meses à frente dá para agendar

// ---- Dias sem expediente --------------------------------------------------
// 0 = domingo, 6 = sábado. Para abrir aos sábados, deixe só [0].
const DIAS_SEM_EXPEDIENTE = [0, 6];
// Feriados locais fixos (MM-DD) que a oficina não abre. Exemplo: ['03-06', '06-24'].
const FERIADOS_LOCAIS: string[] = [];
// Feriados nacionais fixos (MM-DD).
const FERIADOS_FIXOS = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25'];

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (a: number, m: number, d: number) => `${a}-${pad(m + 1)}-${pad(d)}`;
const doIso = (s: string) => { const [a, m, d] = s.split('-').map(Number); return { a, m: m - 1, d }; };

// Páscoa (algoritmo de Meeus/Jones/Butcher), base dos feriados móveis.
function pascoa(ano: number): Date {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}
const somar = (dt: Date, n: number) => { const x = new Date(dt); x.setDate(x.getDate() + n); return x; };

const cacheFeriados = new Map<number, Set<string>>();
function feriadosDo(ano: number): Set<string> {
  const pronto = cacheFeriados.get(ano);
  if (pronto) return pronto;
  const set = new Set<string>([...FERIADOS_FIXOS, ...FERIADOS_LOCAIS].map((f) => `${ano}-${f}`));
  const p = pascoa(ano);
  // Segunda e terça de Carnaval, Sexta-feira Santa e Corpus Christi.
  [-48, -47, -2, 60].forEach((n) => { const x = somar(p, n); set.add(iso(x.getFullYear(), x.getMonth(), x.getDate())); });
  cacheFeriados.set(ano, set);
  return set;
}

/** Retorna o motivo do bloqueio ou null se o dia está disponível. */
function bloqueio(s: string, hojeStr: string): string | null {
  if (s < hojeStr) return 'Data já passou.';
  const { a, m, d } = doIso(s);
  if (DIAS_SEM_EXPEDIENTE.includes(new Date(a, m, d).getDay())) return 'A oficina não atende aos sábados e domingos.';
  if (feriadosDo(a).has(s)) return 'Feriado: a oficina não atende.';
  return null;
}

// Telas "07-agendar" do Figma (novo agendamento) e edição de agendamento pendente.
export default function AgendamentoScreen({ prestador: p, existente, onVoltar, onConcluir }: Props) {
  const hoje = new Date();
  const hojeStr = iso(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const base = hoje.getFullYear() * 12 + hoje.getMonth();

  const [servico, setServico] = useState(existente?.servico ?? p?.especialidades[0] ?? 'Serviço');
  const [vis, setVis] = useState(() => {
    if (existente) { const { a, m } = doIso(existente.data); return { a, m }; }
    return { a: hoje.getFullYear(), m: hoje.getMonth() };
  });
  const [dataSel, setDataSel] = useState<string | null>(existente?.data ?? null);
  const [hora, setHora] = useState(existente?.hora ?? '14:00');
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const [enviando, setEnviando] = useState(false);

  const nomeOficina = existente?.prestadorNome ?? p?.nomeExibicao ?? '';
  const pos = vis.a * 12 + vis.m;
  const podeVoltar = pos > base;
  const podeAvancar = pos < base + MESES_A_FRENTE;
  const mudarMes = (delta: number) =>
    setVis(({ a, m }) => { const t = a * 12 + m + delta; return { a: Math.floor(t / 12), m: t % 12 }; });

  const celulas = useMemo(() => {
    const primeiro = new Date(vis.a, vis.m, 1).getDay();
    const total = new Date(vis.a, vis.m + 1, 0).getDate();
    const c: (number | null)[] = Array(primeiro).fill(null);
    for (let d = 1; d <= total; d++) c.push(d);
    while (c.length % 7) c.push(null);
    return c;
  }, [vis]);

  const resumoData = dataSel
    ? (() => { const { a, m, d } = doIso(dataSel); return `${DIAS[new Date(a, m, d).getDay()]} ${pad(d)}/${pad(m + 1)}, ${hora.slice(0, 2)}h`; })()
    : 'Selecione uma data';

  async function confirmar() {
    setErro('');
    if (!dataSel) return setErro('Escolha um dia para o agendamento.');
    const motivo = bloqueio(dataSel, hojeStr);
    if (motivo) return setErro(motivo);
    const uid = auth.currentUser?.uid;
    if (!uid) return setErro('Sessão expirada. Entre novamente.');
    setEnviando(true);
    try {
      if (existente) {
        await updateDoc(doc(db, 'agendamentos', existente.id), { data: dataSel, hora });
        setOk('Agendamento atualizado!');
      } else {
        if (!p) throw new Error('sem prestador');
        await addDoc(collection(db, 'agendamentos'), {
          clienteId: uid,
          prestadorId: p.id,
          prestadorNome: p.nomeExibicao,
          servico,
          data: dataSel,
          hora,
          status: 'pendente',
          criadoEm: serverTimestamp(),
        });
        setOk('Agendamento enviado! A oficina vai confirmar em breve.');
      }
      setTimeout(onConcluir, 1200);
    } catch (e: any) {
      setErro(msgFirebase(e?.code));
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 20 }}>
        <BarraTopo titulo={existente ? 'Editar agendamento' : 'Agendamento'} onVoltar={onVoltar} />
      </View>
      <ScrollView contentContainerStyle={styles.conteudo}>
        {!existente && p && p.especialidades.length > 1 && (
          <ChipSelect titulo="Serviço" opcoes={p.especialidades} selecionadas={[servico]}
            onChange={(v) => setServico(v.find((x) => x !== servico) ?? servico)} />
        )}

        <View style={styles.mesLinha}>
          <Pressable onPress={() => mudarMes(-1)} disabled={!podeVoltar} hitSlop={10}
            accessibilityRole="button" accessibilityLabel="Mês anterior"
            style={[styles.seta, !podeVoltar && { opacity: 0.3 }]}>
            <Ionicons name="chevron-back" size={20} color={colors.ink} />
          </Pressable>
          <Text style={styles.mes}>{MESES[vis.m]} {vis.a}</Text>
          <Pressable onPress={() => mudarMes(1)} disabled={!podeAvancar} hitSlop={10}
            accessibilityRole="button" accessibilityLabel="Próximo mês"
            style={[styles.seta, !podeAvancar && { opacity: 0.3 }]}>
            <Ionicons name="chevron-forward" size={20} color={colors.ink} />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row' }}>
          {SEMANA.map((l, i) => <Text key={i} style={styles.cabecalho}>{l}</Text>)}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {celulas.map((d, i) => {
            const s = d === null ? '' : iso(vis.a, vis.m, d);
            const travado = d !== null && bloqueio(s, hojeStr) !== null;
            const ativo = d !== null && s === dataSel;
            return (
              <View key={i} style={styles.celula}>
                {d !== null && (
                  <Pressable disabled={travado} onPress={() => setDataSel(s)} accessibilityRole="button"
                    accessibilityLabel={`Dia ${d}${travado ? ', indisponível' : ''}`}
                    accessibilityState={{ selected: ativo, disabled: travado }}
                    style={[styles.dia, ativo && { backgroundColor: colors.primary }]}>
                    <Text style={{
                      color: ativo ? colors.white : colors.ink,
                      fontWeight: ativo ? '700' : '400',
                      opacity: travado ? 0.3 : 1,
                    }}>{d}</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
        <Text style={styles.legenda}>Dias em cinza: sem expediente (sábados, domingos e feriados) ou já passaram.</Text>

        <View style={{ marginTop: 16 }}>
          <ChipSelect titulo="Horário" opcoes={HORARIOS} selecionadas={[hora]}
            onChange={(v) => setHora(v.find((x) => x !== hora) ?? hora)} />
        </View>

        <Card>
          <Text style={styles.cardTitulo}>Resumo</Text>
          <Text style={styles.cardTxt}>{servico}</Text>
          <Text style={styles.cardTxt}>{nomeOficina} · {resumoData}</Text>
        </Card>
      </ScrollView>

      <View style={styles.rodape}>
        {!!erro && <Text style={{ color: colors.error, fontSize: 12, marginTop: 10 }} accessibilityRole="alert">{erro}</Text>}
        {!!ok && <Text style={{ color: colors.success, fontSize: 12, marginTop: 10 }}>{ok}</Text>}
        <Botao titulo={existente ? 'Salvar alterações' : 'Confirmar agendamento'} onPress={confirmar} carregando={enviando} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: 20, paddingTop: 4, width: '100%', maxWidth: 480, alignSelf: 'center' },
  mesLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  seta: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  mes: { fontSize: 16, fontWeight: '700', color: colors.ink },
  cabecalho: { flex: 1, textAlign: 'center', fontSize: 12, color: colors.muted, paddingVertical: 8 },
  celula: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 },
  dia: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  legenda: { fontSize: 11, color: colors.muted, marginTop: 8, lineHeight: 16 },
  cardTitulo: { fontSize: 13, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  cardTxt: { fontSize: 12, color: colors.muted, marginTop: 2 },
  rodape: { paddingHorizontal: 20, paddingBottom: 16, borderTopWidth: 1, borderTopColor: colors.border },
});