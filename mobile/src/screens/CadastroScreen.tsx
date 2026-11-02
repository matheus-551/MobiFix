import { User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Botao from '../components/Botao';
import Campo from '../components/Campo';
import ChipSelect from '../components/ChipSelect';
import SelectCampo from '../components/SelectCampo';
import Tela from '../components/Tela';
import { UFS } from '../constants/catalogo';
import { cadastrarUsuario, concluirCadastro, mensagemErro } from '../services/authService';
import { buscarCatalogos } from '../services/catalogoService';
import { ItemCatalogo, UsuarioApi } from '../services/contratos';
import { colors } from '../theme/colors';
import { Papel } from '../types';
import { emailValido, formatarTelefone, senhaForte, telefoneValido } from '../utils/validators';

type Props = { onVoltar: () => void; usuario?: User; conta?: UsuarioApi; onConcluido?: () => void };
const VAZIO = { nome: '', sobrenome: '', nomeExibicao: '', email: '', telefone: '', logradouro: '', numero: '',
  complemento: '', bairro: '', cep: '', cidade: '', uf: '', descricao: '', senha: '', confirmar: '' };

export default function CadastroScreen({ onVoltar, usuario, conta, onConcluido }: Props) {
  const [papel, setPapel] = useState<Papel>(conta?.tipo ?? 'CLIENTE');
  const [f, setF] = useState({ ...VAZIO, nome: conta?.nome ?? '', sobrenome: conta?.sobrenome ?? '',
    email: usuario?.email ?? '', telefone: conta?.telefone ?? '', uf: conta?.uf ?? '' });
  const [tipos, setTipos] = useState<string[]>([]);
  const [esps, setEsps] = useState<string[]>([]);
  const [catalogos, setCatalogos] = useState<{ tiposVeiculo: ItemCatalogo[]; especialidades: ItemCatalogo[] } | null>(null);
  const [erroCatalogo, setErroCatalogo] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const set = (k: keyof typeof VAZIO) => (v: string) => setF(atual => ({ ...atual, [k]: v }));
  const prestador = papel === 'PRESTADOR';

  useEffect(() => {
    if (!prestador) return;
    let ativo = true;
    buscarCatalogos().then(dados => { if (ativo) setCatalogos(dados); })
      .catch(e => { if (ativo) setErroCatalogo(mensagemErro(e)); });
    return () => { ativo = false; };
  }, [prestador, tentativa]);

  function validar(): string | null {
    if (!f.nome.trim() || !f.sobrenome.trim()) return 'Informe nome e sobrenome da pessoa responsável.';
    if (f.nome.trim().length > 100 || f.sobrenome.trim().length > 100) return 'Nome e sobrenome devem ter até 100 caracteres.';
    if (!emailValido(f.email)) return 'Digite um e-mail válido.';
    if (!telefoneValido(f.telefone)) return 'Digite um telefone válido, com DDD.';
    if (!f.uf) return 'Selecione a UF.';
    if (prestador) {
      if (!catalogos) return 'Aguarde os catálogos ou tente carregá-los novamente.';
      if (!f.logradouro.trim() || !f.numero.trim() || !f.bairro.trim() || !f.cidade.trim()) return 'Informe logradouro, número, bairro e cidade.';
      if (f.cep.replace(/\D/g, '').length !== 8) return 'Informe um CEP com oito dígitos.';
      if (tipos.length === 0 || esps.length === 0) return 'Selecione ao menos um tipo de veículo e uma especialidade.';
    }
    if (!usuario) {
      if (!senhaForte(f.senha)) return 'A senha deve ter 8 ou mais caracteres, com letras e números.';
      if (f.senha !== f.confirmar) return 'As senhas não coincidem.';
    }
    return null;
  }

  async function criar() {
    const problema = validar();
    if (problema) { setErro(problema); return; }
    setErro(''); setCarregando(true);
    const dados = { nome: f.nome.trim(), sobrenome: f.sobrenome.trim(), email: f.email, telefone: f.telefone, uf: f.uf, papel,
      ...(usuario ? {} : { senha: f.senha }),
      ...(prestador ? { profissional: {
        nomeFantasia: f.nomeExibicao.trim() || null, descricao: f.descricao.trim() || null,
        endereco: { logradouro: f.logradouro.trim(), numero: f.numero.trim(), complemento: f.complemento.trim() || null,
          bairro: f.bairro.trim(), cidade: f.cidade.trim(), uf: f.uf, cep: f.cep.replace(/\D/g, '') },
        tiposVeiculoIds: catalogos!.tiposVeiculo.filter(item => tipos.includes(item.nome)).map(item => item.id),
        especialidadeIds: catalogos!.especialidades.filter(item => esps.includes(item.nome)).map(item => item.id),
      } } : {}),
    };
    try {
      if (usuario) { await concluirCadastro(dados); onConcluido?.(); }
      else await cadastrarUsuario(dados);
    } catch (e) { setErro(mensagemErro(e)); }
    finally { setCarregando(false); }
  }

  return <Tela>
    <View style={styles.topo}>
      <Pressable onPress={onVoltar} disabled={carregando} accessibilityLabel={usuario ? 'Sair da conta' : 'Voltar'} hitSlop={12}>
        <Text style={styles.voltar}>←</Text>
      </Pressable>
      <Text style={styles.titulo}>{usuario ? 'Concluir cadastro' : 'Criar conta'}</Text>
    </View>
    {usuario && <Text style={styles.dica}>Sua conta Firebase já existe. Complete os dados abaixo para utilizar o MobiFix.</Text>}
    {!conta && <View style={styles.seg}>
      {(['CLIENTE', 'PRESTADOR'] as Papel[]).map(p => <Pressable key={p} disabled={carregando} onPress={() => { if (p !== papel) { setCatalogos(null); setErroCatalogo(''); setTipos([]); setEsps([]); setPapel(p); } }}
        style={[styles.segBtn, papel === p && styles.segOn]} accessibilityRole="button">
        <Text style={[styles.segTexto, papel === p && { color: colors.white }]}>{p === 'CLIENTE' ? 'Cliente' : 'Profissional'}</Text>
      </Pressable>)}
    </View>}
    <Campo placeholder="Nome" value={f.nome} onChangeText={set('nome')} editable={!conta && !carregando} maxLength={100} autoComplete="given-name" />
    <Campo placeholder="Sobrenome" value={f.sobrenome} onChangeText={set('sobrenome')} editable={!conta && !carregando} maxLength={100} autoComplete="family-name" />
    <Campo placeholder="E-mail" value={f.email} onChangeText={set('email')} editable={!usuario && !carregando}
      keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" />
    <Campo placeholder="Telefone" value={f.telefone} onChangeText={v => set('telefone')(formatarTelefone(v))}
      editable={!conta && !carregando} keyboardType="phone-pad" autoComplete="tel" />
    {prestador && <>
      <Campo placeholder="Nome fantasia (opcional)" value={f.nomeExibicao} onChangeText={set('nomeExibicao')} maxLength={150} />
      <Campo placeholder="Descrição dos serviços (opcional)" value={f.descricao} onChangeText={set('descricao')} maxLength={2000} multiline />
      <Campo placeholder="Logradouro" value={f.logradouro} onChangeText={set('logradouro')} maxLength={200} />
      <Campo placeholder="Número" value={f.numero} onChangeText={set('numero')} maxLength={20} />
      <Campo placeholder="Complemento (opcional)" value={f.complemento} onChangeText={set('complemento')} maxLength={100} />
      <Campo placeholder="Bairro" value={f.bairro} onChangeText={set('bairro')} maxLength={100} />
      <Campo placeholder="Cidade" value={f.cidade} onChangeText={set('cidade')} maxLength={100} />
      <Campo placeholder="CEP (8 dígitos)" value={f.cep} onChangeText={v => set('cep')(v.replace(/\D/g, '').slice(0, 8))} keyboardType="number-pad" />
    </>}
    <SelectCampo placeholder={prestador ? 'UF de atendimento' : 'UF'} valor={f.uf} opcoes={UFS} onChange={set('uf')} />
    {prestador && <>
      {erroCatalogo ? <><Text style={styles.erro}>{erroCatalogo}</Text><Botao titulo="Recarregar opções" onPress={() => { setErroCatalogo(''); setCatalogos(null); setTentativa(t => t + 1); }} /></>
        : !catalogos ? <Text style={styles.dica}>Carregando opções…</Text> : <>
          <ChipSelect titulo="Tipos de veículos atendidos" opcoes={catalogos.tiposVeiculo.map(item => item.nome)} selecionadas={tipos} onChange={setTipos} />
          <ChipSelect titulo="Especialidades" opcoes={catalogos.especialidades.map(item => item.nome)} selecionadas={esps} onChange={setEsps} />
        </>}
    </>}
    {!usuario && <>
      <Campo placeholder="Senha" value={f.senha} onChangeText={set('senha')} secureTextEntry autoComplete="new-password" />
      <Campo placeholder="Confirmar senha" value={f.confirmar} onChangeText={set('confirmar')} secureTextEntry autoComplete="new-password" />
      <Text style={styles.dica}>Use 8 ou mais caracteres, com letras e números.</Text>
    </>}
    {erro !== '' && <Text style={styles.erro}>{erro}</Text>}
    <Botao titulo={usuario ? 'Concluir cadastro' : 'Criar conta'} onPress={criar} carregando={carregando} desabilitado={prestador && !catalogos} />
    <Botao titulo={usuario ? 'Usar outra conta' : 'Já tenho conta'} variante="contorno" onPress={onVoltar} desabilitado={carregando} />
  </Tela>;
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
