import React, { ComponentRef, forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Campo from './Campo';
import { colors } from '../theme/colors';

/** Campo de senha com o "olho" para mostrar/ocultar. Use no lugar de <Campo secureTextEntry />. */
const CampoSenha = forwardRef<ComponentRef<typeof TextInput>, TextInputProps>((props, ref) => {
  const [visivel, setVisivel] = useState(false);
  return (
    <View>
      <Campo
        ref={ref as any}
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
        secureTextEntry={!visivel}
        style={[{ paddingRight: 48 }, props.style]}
      />
      <Pressable
        onPress={() => setVisivel((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        hitSlop={8}
        style={styles.olho}
      >
        <Ionicons name={visivel ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
      </Pressable>
    </View>
  );
});
export default CampoSenha;

const styles = StyleSheet.create({
  olho: { position: 'absolute', right: 0, top: 0, width: 48, height: 46, alignItems: 'center', justifyContent: 'center' },
});