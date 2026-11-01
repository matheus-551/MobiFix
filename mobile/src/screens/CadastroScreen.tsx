import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Botao from '../components/Botao';
import Campo from '../components/Campo';
import ChipSelect from '../components/ChipSelect';
import SelectCampo from '../components/SelectCampo';
import Tela from '../components/Tela';
import { ESPECIALIDADES, TIPOS_VEICULO, UFS } from '../constants/catalogo';
import { cadastrarUsuario, mensagemErro } from '../services/authService';
import { colors } from '../theme/colors';
import { Papel } from '../types';
import { emailValido, formatarTelefone, senhaForte, telefoneValido } from '../utils/validators';

type Props = { onVoltar: () => void };

const VAZIO = {
  nome: '', sobrenome: '', nomeExibicao: '', email: '', telefone: '',
  endereco: '', cidade: '', uf: '', senha: '', confirmar: '',
};

export default function CadastroScreen({ onVoltar }: Props) {
  const [papel, setPapel] = useState<Papel>('CLIENTE');
  const [f, setF] = useState(VAZIO);
  const [tipos, setTipos] = useState<string[]>([]);
  const [esps, setEsps] = useState<string[]>([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const set = (k: keyof typeof VAZIO) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const prestador = papel === 'PRESTADOR';

  function validar(): string | null {
    if (!prestador && (!f.nome.trim() || !f.sobrenome.trim())) return 'Informe nome e sobrenome.';
    if (prestador && !f.nomeExibicao.trim()) return 'Informe seu nome ou o nome fantasia.';
    if (!emailValido(f.email)) return 'Digite um e-mail válido.';
    if (!telefoneValido(f.telefone)) return 'Digite um telefone válido, com DDD.';
    if (prestador && !f.cidade.trim()) return 'Informe a cidade.';
    if (!f.uf) return 'Selecione a UF.';
    if (prestador) {
      if (!f.endereco.trim()) return 'Informe o endereço.';
      if (tipos.length === 0) return 'Selecione ao menos um tipo de veículo atendido.';
      if (esps.length === 0) return 'Selecione ao menos uma especialidade.';
    }
    if (!senhaForte(f.senha)) return 'A senha deve ter 8 ou mais caracteres, com letras e números.';
    if (f.senha !== f.confirmar) return 'As senhas não coincidem.';
    return null;
  }

  async function criar() {
    const problema = validar();
    if (problema) return setErro(problema);
    setErro('');
    setCarregando(true);
    try {
      const base = { email: f.email, senha: f.senha, telefone: f.telefone, cidade: f.cidade.trim(), uf: f.uf };
      await cadastrarUsuario(
        prestador
          ? { ...base, papel: 'PRESTADOR', nomeExibicao: f.nomeExibicao.trim(), endereco: f.endereco.trim(), tiposVeiculo: tipos, especialidades: esps }
          : { ...base, papel: 'CLIENTE', nome: f.nome.trim(), sobrenome: f.sobrenome.trim() },
      );
      // Após criar, o app abre a tela de verificação de e-mail automaticamente.
    } catch (e) {
      setErro(mensagemErro(e));
      setCarregando(false);
    }
  }

  return (
    <Tela>
      <View style={styles.topo}>
        <Pressable onPress={() => onVoltar()} accessibilityLabel="Voltar" hitSlop={12}>
          <Text style={styles.voltar}>←</Text>
        </Pressable>
        <Text style={styles.titulo}>Criar conta</Text>
      </View>

      <View style={styles.seg}>
        {(['CLIENTE', 'PRESTADOR'] as Papel[]).map((p) => (
          <Pressable key={p} onPress={() => setPapel(p)} style={[styles.segBtn, papel === p && styles.segOn]} accessibilityRole="button">
            <Text style={[styles.segTexto, papel === p && { color: colors.white }]}>
              {p === 'CLIENTE' ? 'Cliente' : 'Profissional'}
            </Text>
          </Pressable>
        ))}
      </View>

      {prestador ? (
        <Campo placeholder="Nome ou nome fantasia" value={f.nomeExibicao} onChangeText={set('nomeExibicao')} autoComplete="name" />
      ) : (
        <>
          <Campo placeholder="Nome" value={f.nome} onChangeText={set('nome')} autoComplete="given-name" />
          <Campo placeholder="Sobrenome" value={f.sobrenome} onChangeText={set('sobrenome')} autoComplete="family-name" />
        </>
      )}
      <Campo placeholder="E-mail" value={f.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" />
      <Campo placeholder="Telefone" value={f.telefone} onChangeText={(v) => set('telefone')(formatarTelefone(v))} keyboardType="phone-pad" autoComplete="tel" />
      {prestador && <Campo placeholder="Endereço" value={f.endereco} onChangeText={set('endereco')} autoComplete="street-address" />}
      <Campo placeholder={prestador ? 'Cidade' : 'Cidade (opcional)'} value={f.cidade} onChangeText={set('cidade')} />
      <SelectCampo placeholder="UF" valor={f.uf} opcoes={UFS} onChange={set('uf')} />

      {prestador && (
        <>
          <ChipSelect titulo="Tipos de veículos atendidos" opcoes={TIPOS_VEICULO} selecionadas={tipos} onChange={setTipos} />
          <ChipSelect titulo="Especialidades" opcoes={ESPECIALIDADES} selecionadas={esps} onChange={setEsps} />
        </>
      )}

      <Campo placeholder="Senha" value={f.senha} onChangeText={set('senha')} secureTextEntry autoComplete="new-password" />
      <Campo placeholder="Confirmar senha" value={f.confirmar} onChangeText={set('confirmar')} secureTextEntry autoComplete="new-password" />
      <Text style={styles.dica}>Use 8 ou mais caracteres, com letras e números.</Text>

      {erro !== '' && <Text style={styles.erro}>{erro}</Text>}
      <Botao titulo="Criar conta" onPress={criar} carregando={carregando} />

      <Text style={styles.rodape}>
        Já tem conta?{' '}
        <Text style={styles.link} onPress={() => onVoltar()}>
          Entrar
        </Text>
      </Text>
    </Tela>
  );
}

const styles = StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  voltar: { fontSize: 20, color: colors.ink },
  titulo: { fontSize: 15, fontWeight: '600', color: colors.ink },
  seg: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  segBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  segOn: { backgroundColor: colors.primary },
  segTexto: { fontSize: 13, fontWeight: '600', color: colors.primary },
  dica: { fontSize: 11, color: colors.muted },
  erro: { color: colors.error, fontSize: 12, textAlign: 'center', marginTop: 10 },
  rodape: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 18 },
  link: { color: colors.primary, fontWeight: '500' },
});
