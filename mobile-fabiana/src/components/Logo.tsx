import React from 'react';
import { Image } from 'react-native';

export default function Logo({ tamanho = 96 }: { tamanho?: number }) {
  return (
    <Image
      source={require('../../assets/logo.png')}
      style={{ width: tamanho, height: tamanho, alignSelf: 'center' }}
      accessibilityLabel="Logo MobiFix"
    />
  );
}
