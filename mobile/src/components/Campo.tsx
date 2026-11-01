import React, { forwardRef } from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { colors } from '../theme/colors';

const Campo = forwardRef<TextInput, TextInputProps>((props, ref) => (
  <TextInput
    ref={ref}
    placeholderTextColor={colors.muted}
    accessibilityLabel={props.placeholder}
    {...props}
    style={[styles.input, props.style]}
  />
));
export default Campo;

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.background,
    marginBottom: 12,
  },
});
