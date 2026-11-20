import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Botao from '../components/Botao';
import Card from '../components/Card';
import Tela from '../components/Tela';
import { sair } from '../services/authService';
import { colors } from '../theme/colors';
import { nomeDo, Perfil } from '../types';

type Props = { perfil: Perfil | null; email: string };

export default function PerfilScreen({ perfil, email }: Props) {
  const local = [perfil?.cidade, perfil?.uf].filter(Boolean).join(' - ');
  return (
    <Tela edges={['top']}>
      <Text style={styles.titulo}>Perfil</Text>
      <Card>
        <Text style={styles.nome}>{nomeDo(perfil) || 'Usuário'}</Text>
        <Text style={styles.info}>{email}</Text>
        <Text style={styles.info}>
          {perfil?.papel === 'PRESTADOR' ? 'Profissional' : 'Cliente'}
          {local ? ` · ${local}` : ''}
        </Text>
      </Card>
      <Botao titulo="Sair" variante="contorno" onPress={sair} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: 16 },
  nome: { fontSize: 14, fontWeight: '600', color: colors.ink },
  info: { fontSize: 12, color: colors.muted, marginTop: 3 },
});
