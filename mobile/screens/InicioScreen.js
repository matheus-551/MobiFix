import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { colors, radius } from '../theme';
import { LogoMark, Button, EstadoTela } from '../components/ui';

const PASSOS = [
  { numero: '01', titulo: 'Busque' },
  { numero: '02', titulo: 'Compare' },
  { numero: '03', titulo: 'Agende' },
];

export default function InicioScreen() {
  const [busca, setBusca] = useState('');
  const [oficinas, setOficinas] = useState([]);
  const [status, setStatus] = useState('carregando'); // carregando, erro ou pronto

  // Lê a coleção "oficinas" do Firestore
  const carregar = useCallback(async () => {
    try {
      setStatus('carregando');
      const snap = await getDocs(query(collection(db, 'oficinas'), limit(20)));
      setOficinas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setStatus('pronto');
    } catch (e) {
      setStatus('erro');
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Filtra pelo nome da oficina ou pelos serviços
  const filtradas = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return oficinas;
    return oficinas.filter(
      (o) =>
        o.nome?.toLowerCase().includes(t) ||
        (o.servicos || []).some((s) => s.toLowerCase().includes(t))
    );
  }, [busca, oficinas]);

  function abrirMenu() {
    Alert.alert('Menu', undefined, [
      { text: 'Sair da conta', style: 'destructive', onPress: () => signOut(auth) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <LogoMark size={26} />
          <Text style={styles.brand} accessibilityRole="header">
            Mobi<Text style={{ color: colors.primary }}>Fix</Text>
          </Text>
        </View>
        <TouchableOpacity
          onPress={abrirMenu}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Abrir menu"
          style={styles.menuBtn}
        >
          <Ionicons name="menu" size={22} color={colors.dark} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <LogoMark size={64} />
          <Text style={styles.title} accessibilityRole="header">
            Encontre os melhores{'\n'}profissionais automotivos
          </Text>
        </View>

        <View style={styles.search}>
          <Ionicons name="search" size={14} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Serviço ou oficina"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Buscar serviço ou oficina"
            value={busca}
            onChangeText={setBusca}
            returnKeyType="search"
          />
        </View>

        <View style={styles.steps}>
          {PASSOS.map((p) => (
            <View
              key={p.numero}
              style={styles.step}
              accessible
              accessibilityLabel={`Passo ${Number(p.numero)}: ${p.titulo}`}
            >
              <Text style={styles.stepNumber}>{p.numero}</Text>
              <Text style={styles.stepLabel}>{p.titulo}</Text>
            </View>
          ))}
        </View>

        {status === 'carregando' && <EstadoTela tipo="carregando" titulo="Buscando oficinas..." />}

        {status === 'erro' && (
          <EstadoTela
            tipo="erro"
            titulo="Não foi possível carregar as oficinas"
            descricao="Verifique sua conexão e tente de novo."
            onRetry={carregar}
          />
        )}

        {status === 'pronto' && filtradas.length === 0 && (
          <EstadoTela
            tipo="vazio"
            titulo={busca ? 'Nenhuma oficina encontrada' : 'Ainda não há oficinas cadastradas'}
            descricao={busca ? 'Tente outro serviço ou nome.' : 'Volte mais tarde.'}
          />
        )}

        {status === 'pronto' &&
          filtradas.map((o) => (
            <View
              key={o.id}
              style={styles.card}
              accessible
              accessibilityLabel={`${o.nome}, nota ${o.nota ?? 'sem avaliação'}, a ${o.distanciaKm ?? '?'} quilômetros`}
            >
              <View style={styles.cardImage} />
              <Text style={styles.cardTitle}>{o.nome}</Text>
              <Text style={styles.cardMeta}>
                ★ {o.nota != null ? Number(o.nota).toFixed(1) : '--'} · {o.distanciaKm ?? '--'} km
              </Text>
            </View>
          ))}

        <Button
          title="Ver oficinas"
          onPress={() => Alert.alert('Em breve', 'A lista de oficinas será a próxima tela.')}
          style={{ marginTop: 16 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brand: { fontSize: 14, fontWeight: '800', color: colors.dark },
  menuBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 16, width: '100%', maxWidth: 480, alignSelf: 'center' },
  hero: { alignItems: 'center', marginTop: 8 },
  title: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: colors.dark,
    lineHeight: 24,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    marginTop: 16,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  searchInput: { flex: 1, fontSize: 13, color: colors.text, paddingVertical: 0 },
  steps: { flexDirection: 'row', gap: 10, marginTop: 14 },
  step: {
    flex: 1,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  stepNumber: { fontSize: 18, fontWeight: '800', color: colors.primary },
  stepLabel: { fontSize: 10, color: colors.muted, marginTop: 2 },
  card: {
    marginTop: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  cardImage: { height: 70, borderRadius: radius.sm, backgroundColor: colors.placeholder },
  cardTitle: { marginTop: 10, fontSize: 12, fontWeight: '700', color: colors.dark },
  cardMeta: { marginTop: 4, marginBottom: 4, fontSize: 10, color: colors.muted },
});