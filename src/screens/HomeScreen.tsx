// src/screens/HomeScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Button, Image, ScrollView, Alert } from 'react-native';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Progress from 'react-native-progress';

// Define a type for a single glucose reading
interface GlucoseReading {
  id: string;
  value: number;
  timestamp: string;
}

// Define navigation types
type HomeStackParamList = {
  HomeBase: undefined;
  RegisterPatient: undefined; 
};
type HomeScreenNavigationProp = NavigationProp<
  HomeStackParamList,
  'HomeBase'
>;

const TREE_MAX_STAGE_KEY = '@tree_max_stage';
const MIN_REQUIRED_READINGS = 7; // Mínimo de leituras nos últimos 7 dias para avaliação
const MIN_READINGS_FOR_NEXT_STAGE = 3; // NÚMERO DE LEITURAS NECESSÁRIAS DENTRO DO NOVO ESTÁGIO

const calculatePotentialTreeStage = (allReadings: GlucoseReading[]): { potentialStage: number; recentCount: number; percentageInTarget: number } => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentReadings = allReadings.filter(reading =>
    new Date(reading.timestamp) >= sevenDaysAgo
  );

  const recentReadingsCount = recentReadings.length;

  let percentageInTarget = 0;
  let potentialStage = 1;

  if (recentReadingsCount < MIN_REQUIRED_READINGS) {
    percentageInTarget = (recentReadingsCount / MIN_REQUIRED_READINGS) * 100;
    potentialStage = 1; 
    return { potentialStage: potentialStage, recentCount: recentReadingsCount, percentageInTarget: percentageInTarget };
  }

  const targetMin = 70;
  const targetMax = 180;

  const readingsInTarget = recentReadings.filter(reading =>
    reading.value >= targetMin && reading.value <= targetMax
  ).length;

  percentageInTarget = (readingsInTarget / recentReadingsCount) * 100;

  console.log(`[CalcPotential] Total de leituras recentes: ${recentReadingsCount}`);
  console.log(`[CalcPotential] Leituras no alvo: ${readingsInTarget}`);
  console.log(`[CalcPotential] Percentagem no alvo: ${percentageInTarget.toFixed(2)}%`);

  if (percentageInTarget >= 80) {
    potentialStage = 4;
  } else if (percentageInTarget >= 55) {
    potentialStage = 3;
  } else if (percentageInTarget >= 30) {
    potentialStage = 2;
  } else {
    potentialStage = 1;
  }

  console.log(`[CalcPotential] Estágio Potencial Calculado: ${potentialStage}`);
  return { potentialStage: potentialStage, recentCount: recentReadingsCount, percentageInTarget: percentageInTarget };
};

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [currentTreeStage, setCurrentTreeStage] = useState(1);
  const [totalGlucoseReadingsCount, setTotalGlucoseReadingsCount] = useState(0);
  const [recentGlucoseReadingsCount, setRecentGlucoseReadingsCount] = useState(0);
  const [treeProgressPercentage, setTreeProgressPercentage] = useState(0);
  const [maxTreeStageReached, setMaxTreeStageReached] = useState(1);
  const [readingsInCurrentStageCount, setReadingsInCurrentStageCount] = useState(0); // Novo estado: leituras boas no estágio atual

  const loadAndCalculateTreeStage = useCallback(async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@glucose_readings');
      const allReadings: GlucoseReading[] = jsonValue != null ? JSON.parse(jsonValue) : [];

      setTotalGlucoseReadingsCount(allReadings.length);

      const storedMaxStage = await AsyncStorage.getItem(TREE_MAX_STAGE_KEY);
      const previousMaxStageInStorage = storedMaxStage != null ? parseInt(storedMaxStage, 10) : 1; 
      
      console.log(`[LoadCalc] previousMaxStageInStorage (do AsyncStorage): ${previousMaxStageInStorage}`);

      const { potentialStage, recentCount, percentageInTarget } = calculatePotentialTreeStage(allReadings);

      setRecentGlucoseReadingsCount(recentCount);

      let newTreeStageToShow = previousMaxStageInStorage;
      let hasLeveledUp = false; 

      // --- LEITURAS NO ALVO DO ESTÁGIO ATUAL ---
      // AQUI É A CORREÇÃO DA LINHA 109
      const sevenDaysAgoTimestamp = new Date(new Date().setDate(new Date().getDate() - 7)).getTime(); // Obter o timestamp de 7 dias atrás

      const readingsInTargetCurrentPeriod = allReadings.filter(reading => {
        // Agora, compare timestamps
        return new Date(reading.timestamp).getTime() >= sevenDaysAgoTimestamp; // <-- CORREÇÃO AQUI
      }).length;
      
      // Carrega o contador de leituras para o estágio anterior
      const storedReadingsInStage = await AsyncStorage.getItem(`@tree_stage_progress_${previousMaxStageInStorage}`);
      let currentReadingsInStage = storedReadingsInStage != null ? parseInt(storedReadingsInStage, 10) : 0;

      // Se a percentagem está no alvo do estágio atual OU se acabou de entrar no estágio 1 por ter menos de 7 leituras totais, incrementa
      // A condição para incrementar o contador agora é mais rigorosa: só incrementa se a última leitura
      // fez a `percentageInTarget` estar a um nível que *potencialmente* avança para o próximo estágio
      // E SE o currentTreeStage (o estágio que estamos a exibir) é o anterior.
      // ISTO É O PONTO CRÍTICO. PRECISAMOS SABER SE A ÚLTIMA LEITURA CONTRIBUIU PARA O CRESCIMENTO OU MANUTENÇÃO.
      // Uma forma é pegar a última leitura e ver se está no alvo. Isso é mais complexo.
      // Uma forma mais simples: se a `potentialStage` é maior que o `previousMaxStageInStorage`,
      // então as leituras recentes estão a empurrar para a frente.
      // Vamos tentar um contador mais direto: quantas das leituras recentes estão no alvo.
      // AQUI É ONDE O CONTADOR É INCREMENTADO:
      // Se a treeStageToShow calculada a partir do previousMaxStageInStorage
      // e as leituras atuais indicam que a performance é boa (potentialStage >= newTreeStageToShow),
      // e o número de leituras recentes é suficiente
      
      // Para evitar que a barra avance para 100% com uma só leitura perfeita:
      // A barra agora vai representar o progresso de "leituras no alvo" para o próximo estágio.
      // Se potentialStage > previousMaxStageInStorage, significa que a qualidade das leituras está a permitir um avanço.
      // Se estamos no estágio currentTreeStage (que é previousMaxStageInStorage)
      // e a última leitura contribuiu para o target
      // vamos incrementar o contador de leituras BOAS desde o último level up.
      
      // ESTA LÓGICA DO CONTADOR É CRÍTICA E PRECISA SER REAVALIADA.
      // Se as leituras estão a empurrar para o próximo estágio (potentialStage > newTreeStageToShow)
      // e estamos no estágio newTreeStageToShow
      if (recentCount >= MIN_REQUIRED_READINGS && percentageInTarget >= (
          newTreeStageToShow === 1 ? 30 : // Se está no 1, precisa de >=30 para o 2
          newTreeStageToShow === 2 ? 55 : // Se está no 2, precisa de >=55 para o 3
          newTreeStageToShow === 3 ? 80 : // Se está no 3, precisa de >=80 para o 4
          0 // Default para stage 4, ou outro caso
        )) {
            // Se as leituras recentes justificam o estágio atual ou um acima, incrementa
            currentReadingsInStage = Math.min(currentReadingsInStage + 1, MIN_READINGS_FOR_NEXT_STAGE); // Não deixa passar do máximo
            await AsyncStorage.setItem(`@tree_stage_progress_${previousMaxStageInStorage}`, currentReadingsInStage.toString());
            console.log(`[LoadCalc] Contador de leituras no estágio ${previousMaxStageInStorage}: ${currentReadingsInStage}`);
        } else {
            // Se a performance caiu abaixo do limite para o próximo estágio, ou se não há leituras suficientes,
            // talvez devêssemos resetar o contador para 0, dependendo da granularidade.
            // Por enquanto, vamos deixá-lo manter o valor se não está a progredir
            // ou se regrediu de nível.
        }
      setReadingsInCurrentStageCount(currentReadingsInStage);


      // --- LÓGICA DE CRESCIMENTO: APENAS UM NÍVEL DE CADA VEZ, COM CONDIÇÃO DO CONTADOR ---
      if (potentialStage > previousMaxStageInStorage) {
        // Se a performance justifica um nível superior E se já temos leituras suficientes no estágio atual
        if (currentReadingsInStage >= MIN_READINGS_FOR_NEXT_STAGE) {
            newTreeStageToShow = previousMaxStageInStorage + 1;
            
            if (newTreeStageToShow > 4) {
                newTreeStageToShow = 4;
            }

            if (newTreeStageToShow > previousMaxStageInStorage) { // Houve um verdadeiro avanço
                console.log(`[LoadCalc] Árvore subiu de nível! De ${previousMaxStageInStorage} para ${newTreeStageToShow}`);
                await AsyncStorage.setItem(TREE_MAX_STAGE_KEY, newTreeStageToShow.toString());
                Alert.alert("Parabéns!", `A sua árvore cresceu para o nível ${newTreeStageToShow}! Continue o bom trabalho!`);
                hasLeveledUp = true; 
                // IMPORTANTE: Resetar o contador para o NOVO estágio para que comece a contar de novo
                await AsyncStorage.setItem(`@tree_stage_progress_${newTreeStageToShow}`, '0'); 
                setReadingsInCurrentStageCount(0); // Reinicia o estado também
            }
        } else {
            console.log(`[LoadCalc] Potencial para ${potentialStage}, mas precisa de mais ${MIN_READINGS_FOR_NEXT_STAGE - currentReadingsInStage} leituras boas no estágio atual.`);
            // A árvore permanece no estágio atual (previousMaxStageInStorage)
            newTreeStageToShow = previousMaxStageInStorage;
        }
      } else if (potentialStage < previousMaxStageInStorage) {
        // Lógica de regressão: se a performance caiu, a árvore regride imediatamente.
        newTreeStageToShow = potentialStage;
        if (newTreeStageToShow < previousMaxStageInStorage) {
             console.log(`[LoadCalc] Árvore regrediu! De ${previousMaxStageInStorage} para ${newTreeStageToShow}`);
             await AsyncStorage.setItem(TREE_MAX_STAGE_KEY, newTreeStageToShow.toString());
             // Se regrediu, o contador para o NOVO (regredido) estágio deve ser carregado ou resetado
             const revertedStageProgress = await AsyncStorage.getItem(`@tree_stage_progress_${newTreeStageToShow}`);
             setReadingsInCurrentStageCount(revertedStageProgress != null ? parseInt(revertedStageProgress, 10) : 0);
        }
      } else {
        // Se o estágio potencial é igual ao estágio salvo, a árvore permanece.
        newTreeStageToShow = potentialStage;
        console.log(`[LoadCalc] Árvore permanece no estágio ${newTreeStageToShow}.`);
      }

      if (newTreeStageToShow < 1) {
          newTreeStageToShow = 1;
      }
      
      setCurrentTreeStage(newTreeStageToShow);
      setMaxTreeStageReached(newTreeStageToShow); 


      // --- AJUSTE DA BARRA DE PROGRESSO (AGORA BASEADA NO CONTADOR) ---
      let progressForBar = 0;
      if (recentCount < MIN_REQUIRED_READINGS) {
        progressForBar = percentageInTarget / 100; 
        console.log(`[Progress] Menos de ${MIN_REQUIRED_READINGS} leituras. Progresso para leituras: ${progressForBar.toFixed(2)}`);
      } else {
        if (hasLeveledUp) {
            progressForBar = 0; // Se nivelou, barra volta a 0
            console.log(`[Progress] Nível subiu, barra resetada para 0.`);
        } else {
            // Agora a barra de progresso mostra o progresso do contador de leituras
            // dentro do estágio atual para o próximo.
            progressForBar = currentReadingsInStage / MIN_READINGS_FOR_NEXT_STAGE;
            console.log(`[Progress] Progresso baseado em leituras boas no estágio ${newTreeStageToShow}: ${progressForBar.toFixed(2)} (${currentReadingsInStage}/${MIN_READINGS_FOR_NEXT_STAGE})`);
        }
      }
      setTreeProgressPercentage(progressForBar);

    } catch (e) {
      console.error("Falha ao carregar dados de glicose para o estágio da árvore:", e);
      Alert.alert("Erro", "Não foi possível atualizar o status da árvore.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAndCalculateTreeStage();
      return () => {};
    }, [loadAndCalculateTreeStage])
  );

  const getTreeImageSource = () => {
    switch (currentTreeStage) {
      case 1:
        return require('../../assets/images/tree_stage_1.jpg');
      case 2:
        return require('../../assets/images/tree_stage_2.jpg');
      case 3:
        return require('../../assets/images/tree_stage_3.jpg');
      case 4:
        return require('../../assets/images/tree_stage_4.jpg');
      default:
        return require('../../assets/images/tree_stage_1.jpg');
    }
  };

  const handleRegisterPatient = () => {
    navigation.navigate('RegisterPatient');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Image
            source={require('../../assets/images/diabetes_logo.png')}
            style={styles.logoImage}
          />
          <Text style={styles.title}>Diabetree!</Text>
        </View>

        <Text style={styles.subtitle}>Acompanhe a sua saúde, faça a sua árvore crescer.</Text>

        <Image
          source={getTreeImageSource()}
          style={styles.treeImage}
        />
        <Text style={styles.treeStatusText}>
          Fase da Árvore: {currentTreeStage}
          {currentTreeStage === 1 && ' (Precisa de atenção)'}
          {currentTreeStage === 2 && ' (A recuperar)'}
          {currentTreeStage === 3 && ' (Saudável)'}
          {currentTreeStage === 4 && ' (A florescer!)'}
        </Text>

        {/* Barra de Progresso */}
        <View style={styles.progressBarContainer}>
          <Progress.Bar
            progress={treeProgressPercentage}
            width={250}
            height={15}
            color={'#28a745'}
            unfilledColor={'#e0e0e0'}
            borderColor={'#ccc'}
            borderRadius={10}
          />
          <Text style={styles.progressText}>
            {`Progresso: ${(treeProgressPercentage * 100).toFixed(0)}% (${readingsInCurrentStageCount}/${MIN_READINGS_FOR_NEXT_STAGE} leituras boas)`}
          </Text>
        </View>

        {/* Mensagem de status das leituras */}
        {recentGlucoseReadingsCount < MIN_REQUIRED_READINGS && totalGlucoseReadingsCount > 0 ? (
          <Text style={styles.readingsCountTextWarning}>
            É necessário ter pelo menos {MIN_REQUIRED_READINGS} leituras nos últimos 7 dias para o crescimento completo.
            Você tem {recentGlucoseReadingsCount} leituras recentes.
          </Text>
        ) : totalGlucoseReadingsCount > 0 ? (
          <Text style={styles.readingsCountText}>
            {recentGlucoseReadingsCount} leituras recentes (total {totalGlucoseReadingsCount}) registadas.
          </Text>
        ) : (
          <Text style={styles.readingsCountText}>
            Nenhuma leitura de glicose registada ainda.
          </Text>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title="Registar Nova Leitura" 
            onPress={handleRegisterPatient}
            color="#007bff"
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0f7fa',
    width: '100%',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  logoImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginRight: 10,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  treeImage: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
    marginBottom: 20,
    borderRadius: 10,
  },
  treeStatusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#555',
  },
  progressBarContainer: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  readingsCountText: {
    fontSize: 14,
    color: '#777',
    marginBottom: 30,
  },
  readingsCountTextWarning: {
    fontSize: 14,
    color: 'red',
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: 20,
    width: '80%',
  },
});

export default HomeScreen;