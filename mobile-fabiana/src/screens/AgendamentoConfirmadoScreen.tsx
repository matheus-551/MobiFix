import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Botao from '../components/Botao';
import Card from '../components/Card';
import { colors } from '../theme/colors';
import { ResumoAgendamento } from './AgendamentoScreen';

type Props = {
  resumo: ResumoAgendamento;
  onVerAgendamentos: () => void;
  onInicio: () => void;
};

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function formatarData(data: string) {
  const [a, m, d] = data.split('-').map(Number);
  if (!a || !m || !d) return data;
  return `${DIAS[new Date(a, m - 1, d).getDay()]}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${a}`;
}

// Tela "12-agendamento-confirmado" do Figma.
// O título diz "enviado" porque o agendamento só vira "Confirmado" quando a oficina aceita.
export default function AgendamentoConfirmadoScreen({ resumo, onVerAgendamentos, onInicio }: Props) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.selo} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Ionicons name="checkmark" size={44} color={colors.success} />
        </View>

        <Text style={styles.titulo} accessibilityRole="header">Agendamento enviado!</Text>
        <Text style={styles.sub}>A oficina vai confirmar em breve. Você acompanha o status em Meus agendamentos.</Text>

        <View style={{ alignSelf: 'stretch', marginTop: 8 }}>
          <Card>
            <Linha rotulo="Serviço" valor={resumo.servico} />
            <Linha rotulo="Oficina" valor={resumo.prestadorNome} />
            <Linha rotulo="Data" valor={formatarData(resumo.data)} />
            <Linha rotulo="Horário" valor={`${resumo.hora.slice(0, 2)}h`} ultima />
          </Card>
        </View>
      </ScrollView>

      <View style={styles.rodape}>
        <Botao titulo="Ver meus agendamentos" onPress={onVerAgendamentos} />
        <Botao titulo="Voltar ao início" variante="contorno" onPress={onInicio} />
      </View>
    </SafeAreaView>
  );
}

function Linha({ rotulo, valor, ultima }: { rotulo: string; valor: string; ultima?: boolean }) {
  return (
    <View style={[styles.linha, ultima && { marginBottom: 0 }]}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <Text style={styles.valor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  selo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  titulo: { fontSize: 20, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  sub: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 8, marginBottom: 20, lineHeight: 20 },
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 10 },
  rotulo: { fontSize: 12, color: colors.muted },
  valor: { flex: 1, fontSize: 12, fontWeight: '600', color: colors.ink, textAlign: 'right' },
  rodape: { paddingHorizontal: 20, paddingBottom: 16, width: '100%', maxWidth: 480, alignSelf: 'center' },
});