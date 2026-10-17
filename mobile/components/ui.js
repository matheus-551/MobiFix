import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

export function LogoMark({ size = 48 }) {
  return (
    <Image
      source={require('../assets/logo.png')}
      accessibilityLabel="Logo MobiFix"
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

export function Input({ style, ...props }) {
  return (
    <TextInput
      placeholderTextColor={colors.muted}
      autoCapitalize="none"
      accessibilityLabel={props.accessibilityLabel || props.placeholder}
      style={[styles.input, style]}
      {...props}
    />
  );
}

export function Button({ title, onPress, variant = 'solid', loading, disabled, style }) {
  const outline = variant === 'outline';
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      style={[
        styles.button,
        outline ? styles.buttonOutline : styles.buttonSolid,
        (disabled || loading) && { opacity: 0.6 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={outline ? colors.primary : '#fff'} />
      ) : (
        <Text style={[styles.buttonText, outline && { color: colors.primary }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

// Mensagem em linha para erro ou sucesso
export function Banner({ type = 'error', message }) {
  if (!message) return null;
  const ok = type === 'success';
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.banner, ok ? styles.bannerOk : styles.bannerErro]}
    >
      <Ionicons
        name={ok ? 'checkmark-circle' : 'alert-circle'}
        size={16}
        color={ok ? colors.success : colors.error}
      />
      <Text style={[styles.bannerText, { color: ok ? colors.success : colors.error }]}>
        {message}
      </Text>
    </View>
  );
}

// Estados de tela: carregando, vazio e erro (com botão de tentar de novo)
export function EstadoTela({ tipo, titulo, descricao, onRetry }) {
  if (tipo === 'carregando') {
    return (
      <View style={styles.estado} accessibilityLiveRegion="polite">
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.estadoDesc}>{titulo || 'Carregando...'}</Text>
      </View>
    );
  }
  const erro = tipo === 'erro';
  return (
    <View style={styles.estado}>
      <Ionicons
        name={erro ? 'cloud-offline-outline' : 'search-outline'}
        size={28}
        color={colors.muted}
      />
      <Text style={styles.estadoTitulo}>{titulo}</Text>
      {!!descricao && <Text style={styles.estadoDesc}>{descricao}</Text>}
      {erro && onRetry && (
        <Button
          title="Tentar de novo"
          variant="outline"
          onPress={onRetry}
          style={{ marginTop: 12, alignSelf: 'stretch' }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    fontSize: 13,
    color: colors.text,
    backgroundColor: '#fff',
  },
  button: {
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSolid: { backgroundColor: colors.primary },
  buttonOutline: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: radius.md,
    marginBottom: 12,
  },
  bannerErro: { backgroundColor: '#FDECEC' },
  bannerOk: { backgroundColor: '#E8F6EE' },
  bannerText: { flex: 1, fontSize: 12, fontWeight: '600' },
  estado: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 16 },
  estadoTitulo: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: colors.dark,
    textAlign: 'center',
  },
  estadoDesc: { marginTop: 6, fontSize: 11, color: colors.muted, textAlign: 'center' },
});