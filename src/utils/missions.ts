// src/utils/missions.ts

// --- Interface for Glucose Readings ---
// It's important that this interface is the same one you use in your application.
// If you already have a GlucoseReading interface elsewhere (e.g., in your data or types file),
// you can import it here instead of redefining it.
export interface GlucoseReading {
    id: string;
    value: number;
    timestamp: string; // ISO 8601 string (e.g., "2024-06-30T10:30:00.000Z")
    mealContext?: string;    // Novo: Contexto da refeição (opcional)
    activityContext?: string; // Novo: Contexto da atividade (opcional)
    notes?: string;          // Novo: Notas adicionais (opcional)
    dataHash?: string;
}
  
  // --- Interface for the Daily Mission ---
  export interface DailyMission {
    id: string;
    name: string;
    description: string;
    // `checkCompletion` is a function that checks if the mission has been completed
    // It receives all glucose readings as an argument
    checkCompletion: (allReadings: GlucoseReading[]) => boolean;
  }
  
  // --- Definition of Daily Missions ---
  // You will have 4 missions that will rotate daily.
  export const DAILY_MISSIONS: DailyMission[] = [
    {
      id: 'daily_mission_1',
      name: 'First Reading of the Day',
      description: 'Record at least 1 glucose reading today.',
      checkCompletion: (allReadings) => {
        const today = new Date().toISOString().split('T')[0]; // Gets today's date (YYYY-MM-DD)
        // Checks if there is any reading with today's date
        return allReadings.some(r => new Date(r.timestamp).toISOString().split('T')[0] === today);
      },
    },
    {
      id: 'daily_mission_2',
      name: 'Healthy Levels Today',
      description: 'Record all glucose readings within healthy levels today.',
      checkCompletion: (allReadings) => {
        const today = new Date().toISOString().split('T')[0];
        const targetMin = 70; // **ADJUST THESE VALUES** for your healthy glucose limits
        const targetMax = 180; // **ADJUST THESE VALUES** for your healthy glucose limits
  
        // Filters readings for today only
        const todayReadings = allReadings.filter(r => new Date(r.timestamp).toISOString().split('T')[0] === today);
  
        // If there are no readings for today, the mission is not complete
        if (todayReadings.length === 0) return false;
  
        // Checks if ALL readings for today are within the healthy range
        return todayReadings.every(r => r.value >= targetMin && r.value <= targetMax);
      },
    },
    {
      id: 'daily_mission_3',
      name: 'Three Readings',
      description: 'Record at least 3 glucose readings today.',
      checkCompletion: (allReadings) => {
        const today = new Date().toISOString().split('T')[0];
        // Counts how many readings were taken today
        return allReadings.filter(r => new Date(r.timestamp).toISOString().split('T')[0] === today).length >= 3;
      },
    },
    {
      id: 'daily_mission_4',
      name: 'Night Reading',
      description: 'Record a glucose reading between 10 PM and 6 AM.',
      checkCompletion: (allReadings) => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
  
        // Considers the time window between 10 PM of the previous day and 6 AM of the current day
        // or 10 PM of the current day and 6 AM of the next day.
        return allReadings.some(r => {
          const readingDate = new Date(r.timestamp);
          const readingDateStr = readingDate.toISOString().split('T')[0];
          const readingHour = readingDate.getHours();
  
          // Checks if it's today OR if it's from the previous day but within the night window
          const isToday = readingDateStr === todayStr;
          const isYesterdayNight = new Date(readingDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] === todayStr;
  
          if (isToday) {
            return readingHour >= 22 || readingHour < 6; // Between 10 PM and 05:59 AM
          }
          if (isYesterdayNight && readingHour >= 22) { // Readings from the previous night after 10 PM
            return true;
          }
          return false;
        });
      },
    },
  ];
  
  // --- Keys for AsyncStorage (to save daily mission state) ---
  export const DAILY_MISSION_STATE_KEY = '@daily_mission_state'; // Stores which mission it is and if it has been completed
  export const DAILY_MISSION_REWARD_COINS = 5; // Fixed reward for completing the daily mission
  export const GLUCOSE_READINGS_KEY = '@glucose_readings'; // Key for glucose readings (you should already have this)
  export const USER_COINS_KEY = '@user_coins'; // Key for user coins (you should already have this)
  export const ACHIEVEMENTS_KEY = '@unlocked_achievements'; // Used to mark that the daily reward has been given (prevents duplicates)