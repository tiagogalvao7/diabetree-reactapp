// src/screens/ProfileScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';

const ProfileScreen = () => {
  // Dados de exemplo para o perfil (podes substituir por dados reais mais tarde)
  const userProfile = {
    name: 'Tiago Galvão',
    email: 'tiago.galvao@example.com',
    diabetesType: 'Tipo 1',
    diagnosisDate: '10 de Janeiro de 2020',
    lastLogin: '10 de Junho de 2025',
  };

  const handleEditProfile = () => {
    // Lógica para navegar para um ecrã de edição de perfil
    console.log('Botão "Editar Perfil" pressionado!');
    // Exemplo: navigation.navigate('EditProfile');
  };

  const handleLogout = () => {
    // Lógica para terminar a sessão do utilizador
    console.log('Botão "Terminar Sessão" pressionado!');
    // Exemplo: Limpar token de autenticação e navegar para o ecrã de login
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.title}>Your profile</Text>

        {/* Informações Básicas do Utilizador */}
        <View style={styles.profileCard}>
          <Text style={styles.userName}>{userProfile.name}</Text>
          <Text style={styles.userEmail}>{userProfile.email}</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Diabetes Type:</Text>
            <Text style={styles.infoValue}>{userProfile.diabetesType}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Diagnosis date:</Text>
            <Text style={styles.infoValue}>{userProfile.diagnosisDate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Login:</Text>
            <Text style={styles.infoValue}>{userProfile.lastLogin}</Text>
          </View>
        </View>

        {/* Botões de Ação */}
        <View style={styles.buttonSection}>
          <Button
            title="Edit Profile"
            onPress={handleEditProfile}
            color="#007bff"
          />
          <View style={styles.spacer} />
          <Button
            title="Logout"
            onPress={handleLogout}
            color="#dc3545" // Cor para botão de logout
          />
        </View>

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Fundo claro para o ScrollView
  },
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    marginTop: 20,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    width: '95%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 30,
    alignItems: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 15,
    color: '#555',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
  },
  buttonSection: {
    width: '95%',
    maxWidth: 400,
    marginTop: 20,
  },
  spacer: {
    height: 15, // Espaçamento entre os botões
  },
});

export default ProfileScreen;