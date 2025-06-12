// src/screens/RegisterPatientScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RegisterPatientScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Insert new Patient</Text>
      {/* Aqui adicionaremos os campos de input e a lógica mais tarde */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fffbe6', // Um fundo diferente para diferenciar
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default RegisterPatientScreen;