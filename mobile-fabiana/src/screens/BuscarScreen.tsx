import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Campo from '../components/Campo';
import CartaoPrestador from '../components/CartaoPrestador';
import FiltroChips from '../components/FiltroChips';
import Logo from '../components/Logo';
import Tela from '../components/Tela';
import { ESPECIALIDADES, TIPOS_VEICULO } from '../constants/catalogo';
import { buscarPrestadores, Prestador } from '../services/prestadorService';
import { colors } from '../theme/colors';

const normalizar = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

type Props = { onAbrirPrestador: (p: Prestador) => void };

// Busca por VEÍCULO (principal) e por tipo de serviço. Não busca pelo nome da oficina.
export default function BuscarScreen({ onAbrirPrestador }: Props) {
  const [todos, setTodos] = useState<Prestador[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [veiculo, setVeiculo] = useState<string | null>(null);
  const [servico, setServico] = useState('');
  const [especialidade, setEspecialidade] = useState<string | null>(null);

  useEffect(() => {
    buscarPrestadores()
      .then(setTodos)
      .catch(() => setErro('Não foi possível carregar os profissionais. Verifique a conexão e as regras do Firestore.'))
      .finally(() => setCarregando(false));
  }, []);

  const lista = useMemo(() => {
    const q = normalizar(servico.trim());
    return todos
      .filter((p) => !veiculo || p.tiposVeiculo.includes(veiculo))
      .filter((p) => !especialidade || p.especialidades.includes(especialidade))
      .filter((p) => !q || p.especialidades.some((e) => normalizar(e).includes(q)))
      .sort((a, b) => b.notaMedia - a.notaMedia || a.nomeExibicao.localeCompare(b.nomeExibicao));
  }, [todos, veiculo, servico, especialidade]);

  return (
    <Tela edges={['top']}>
      <Logo tamanho={56} />
      <Text style={styles.titulo}>Encontre profissionais para o seu veículo</Text>

      <Text style={styles.rotulo}>Qual é o seu veículo?</Text>
      <FiltroChips opcoes={TIPOS_VEICULO} valor={veiculo} onChange={setVeiculo} rotuloTodos="Todos" />

      <View style={{ height: 14 }} />
      <Campo placeholder="🔍  Tipo de serviço (ex.: freios)" value={servico} onChangeText={setServico} returnKeyType="search" />

      <Text style={styles.rotulo}>Especialidade</Text>
      <FiltroChips opcoes={ESPECIALIDADES} valor={especialidade} onChange={setEspecialidade} />

      <Text style={styles.secao}>
        {carregando ? 'Carregando…' : `${lista.length} ${lista.length === 1 ? 'profissional encontrado' : 'profissionais encontrados'}`}
      </Text>

      {carregando && <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />}
      {erro !== '' && <Text style={styles.erro}>{erro}</Text>}

      <View style={{ gap: 12 }}>
        {lista.map((p) => (
          <CartaoPrestador key={p.id} prestador={p} onPress={() => onAbrirPrestador(p)} />
        ))}
      </View>

      {!carregando && erro === '' && lista.length === 0 && (
        <Text style={styles.vazio}>
          Nenhum profissional encontrado para esse veículo e serviço. Tente outro filtro.
        </Text>
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 19, fontWeight: '700', color: colors.ink, textAlign: 'center', marginVertical: 12, lineHeight: 25 },
  rotulo: { fontSize: 12, color: colors.muted, marginTop: 8, marginBottom: 6 },
  secao: { fontSize: 12, fontWeight: '600', color: colors.ink, marginTop: 18, marginBottom: 10 },
  erro: { color: colors.error, fontSize: 12, textAlign: 'center', marginTop: 8 },
  vazio: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 12, lineHeight: 18 },
});