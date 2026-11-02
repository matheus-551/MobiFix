import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import Campo from '../components/Campo';
import CartaoPrestador from '../components/CartaoPrestador';
import FiltroChips from '../components/FiltroChips';
import Logo from '../components/Logo';
import Tela from '../components/Tela';
import { buscarCatalogos } from '../services/catalogoService';
import { mensagemErro } from '../services/authService';
import { ItemCatalogo } from '../services/contratos';
import Botao from '../components/Botao';
import { buscarPrestadores, Prestador } from '../services/prestadorService';
import { colors } from '../theme/colors';

const PASSOS = [
  { n: '01', t: 'Busque' },
  { n: '02', t: 'Compare' },
  { n: '03', t: 'Agende' },
];

const normalizar = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Tela "03-inicio" do Figma + busca por veículo e especialidade (US-09).
export default function BuscarScreen() {
  const [todos, setTodos] = useState<Prestador[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [veiculo, setVeiculo] = useState<string | null>(null);
  const [especialidade, setEspecialidade] = useState<string | null>(null);

  const [catalogos, setCatalogos] = useState<{ tiposVeiculo: ItemCatalogo[]; especialidades: ItemCatalogo[] } | null>(null);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    if (!catalogos) return;
    let ativo = true;
    buscarPrestadores({ page: pagina, tipoVeiculoId: catalogos.tiposVeiculo.find(item => item.nome === veiculo)?.id,
      especialidadeId: catalogos.especialidades.find(item => item.nome === especialidade)?.id })
      .then(resposta => {
        if (!ativo) return;
        setTodos(anterior => pagina === 0 ? resposta.content : [...anterior, ...resposta.content.filter(item => !anterior.some(p => p.id === item.id))]);
        setTotalPaginas(resposta.totalPages);
      }).catch(e => { if (ativo) setErro(mensagemErro(e)); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [pagina, veiculo, especialidade, catalogos, tentativa]);
  useEffect(() => {
    let ativo = true;
    buscarCatalogos().then(dados => { if (ativo) setCatalogos(dados); })
      .catch(e => { if (ativo) { setErro(mensagemErro(e)); setCarregando(false); } });
    return () => { ativo = false; };
  }, [tentativa]);

  const lista = useMemo(() => {
    const q = normalizar(busca.trim());
    return todos
      .filter((p) => !veiculo || p.tiposVeiculo.includes(veiculo))
      .filter((p) => !especialidade || p.especialidades.includes(especialidade))
      .filter((p) => !q || normalizar([p.nomeExibicao, p.cidade, ...p.especialidades].join(' ')).includes(q));
  }, [todos, busca, veiculo, especialidade]);

  return (
    <Tela edges={['top']}>
      <Logo tamanho={64} />
      <Text style={styles.titulo}>Encontre os melhores profissionais automotivos</Text>
      <Campo placeholder="Filtrar os profissionais carregados" value={busca} onChangeText={setBusca} returnKeyType="search" />

      <View style={styles.passos}>
        {PASSOS.map((p) => (
          <View key={p.n} style={styles.passo}>
            <Text style={styles.passoN}>{p.n}</Text>
            <Text style={styles.passoT}>{p.t}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.rotulo}>Tipo de veículo</Text>
      <FiltroChips opcoes={(catalogos?.tiposVeiculo ?? []).map(item => item.nome)} valor={veiculo} onChange={valor => { setCarregando(true); setErro(''); setPagina(0); setTodos([]); setVeiculo(valor); }} />
      <Text style={styles.rotulo}>Especialidade</Text>
      <FiltroChips opcoes={(catalogos?.especialidades ?? []).map(item => item.nome)} valor={especialidade} onChange={valor => { setCarregando(true); setErro(''); setPagina(0); setTodos([]); setEspecialidade(valor); }} />

      <Text style={styles.secao}>
        {carregando ? 'Carregando…' : `${lista.length} ${lista.length === 1 ? 'profissional carregado' : 'profissionais carregados'}`}
      </Text>

      {carregando && <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />}
      {erro !== '' && <><Text style={styles.erro}>{erro}</Text><Botao titulo="Tentar novamente" onPress={() => { setCarregando(true); setErro(''); setCatalogos(null); setTentativa(t => t + 1); }} /></>}

      <View style={{ gap: 12 }}>
        {lista.map((p) => (
          <CartaoPrestador
            key={p.id}
            prestador={p}
            onPress={() => Alert.alert(p.nomeExibicao, 'O perfil completo e o pedido de agendamento serão a próxima etapa.')}
          />
        ))}
      </View>

      {!carregando && erro === '' && lista.length === 0 && (
        <Text style={styles.vazio}>
          Nenhum profissional encontrado nesta lista. Tente outro filtro ou carregue mais resultados, se disponíveis.
        </Text>
      )}
      {erro === '' && pagina + 1 < totalPaginas && <Botao titulo="Carregar mais" carregando={carregando} onPress={() => { setCarregando(true); setErro(''); setPagina(p => p + 1); }} />}
    </Tela>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 20, fontWeight: '700', color: colors.ink, textAlign: 'center', marginVertical: 14, lineHeight: 26 },
  passos: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  passo: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  passoN: { fontSize: 18, fontWeight: '700', color: colors.primary },
  passoT: { fontSize: 11, color: colors.muted, marginTop: 2 },
  rotulo: { fontSize: 12, color: colors.muted, marginTop: 8, marginBottom: 6 },
  secao: { fontSize: 12, fontWeight: '600', color: colors.ink, marginTop: 18, marginBottom: 10 },
  erro: { color: colors.error, fontSize: 12, textAlign: 'center', marginTop: 8 },
  vazio: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 12, lineHeight: 18 },
});
