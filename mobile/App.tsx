import { onAuthStateChanged, User } from 'firebase/auth';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { auth } from './src/config/firebase';
import CadastroScreen from './src/screens/CadastroScreen';
import LoginScreen from './src/screens/LoginScreen';
import RecuperarSenhaScreen from './src/screens/RecuperarSenhaScreen';
import PrincipalScreen from './src/screens/PrincipalScreen';
import VerificarEmailScreen from './src/screens/VerificarEmailScreen';
import { colors } from './src/theme/colors';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [verificado, setVerificado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [tela, setTela] = useState<'login' | 'cadastro' | 'recuperar'>('login');
  const [emailRecuperar, setEmailRecuperar] = useState('');

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setVerificado(!!u?.emailVerified);
        setCarregando(false);
        if (!u) setTela('login');
      }),
    [],
  );

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  let conteudo;
  if (user && !verificado) {
    conteudo = <VerificarEmailScreen email={user.email ?? ''} onVerificado={() => setVerificado(true)} />;
  } else if (user) {
    conteudo = <PrincipalScreen uid={user.uid} email={user.email ?? ''} />;
  } else if (tela === 'cadastro') {
    conteudo = <CadastroScreen onVoltar={() => setTela('login')} />;
  } else if (tela === 'recuperar') {
    conteudo = <RecuperarSenhaScreen emailInicial={emailRecuperar} onVoltar={() => setTela('login')} />;
  } else {
    conteudo = (
      <LoginScreen
        onCadastro={() => setTela('cadastro')}
        onEsqueciSenha={(email) => {
          setEmailRecuperar(email);
          setTela('recuperar');
        }}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {conteudo}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
