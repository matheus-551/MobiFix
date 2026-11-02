import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

export default function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, backgroundColor: colors.background },
});
