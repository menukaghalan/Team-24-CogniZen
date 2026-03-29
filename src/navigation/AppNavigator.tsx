import React, { useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { CardStyleInterpolators, createStackNavigator } from '@react-navigation/stack';
import HomeScreen           from '../screens/HomeScreen';
import IntakeScreen         from '../screens/IntakeScreen';
import ScenarioScreen       from '../screens/ScenarioScreen';
import SessionCompleteScreen from '../screens/SessionCompleteScreen';
import HistoryScreen        from '../screens/HistoryScreen';
import GamesScreen          from '../screens/GamesScreen';
import WeeklySnapshotScreen from '../screens/WeeklySnapshotScreen';
import CharacterSelectScreen from '../screens/CharacterSelectScreen';
import SettingsScreen        from '../screens/SettingsScreen';
import ReactionTapGame      from '../screens/games/ReactionTapGame';
import StroopGame           from '../screens/games/StroopGame';
import PatternMemoryGame    from '../screens/games/PatternMemoryGame';
import { useProfileStore }  from '../store/profileStore';
import { colors } from '../themes/tokens';

const Stack = createStackNavigator();

const defaultScreenOptions = {
  headerShown: false,
  cardStyle: { backgroundColor: colors.bg0 },
  gestureEnabled: false,
  cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
};

const checkInScreenOptions = {
  headerShown: false,
  cardStyle: { backgroundColor: colors.bg0 },
  gestureEnabled: false,
  cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
};

export default function AppNavigator() {
  const loadProfile        = useProfileStore(s => s.loadProfile);
  const isLoaded           = useProfileStore(s => s.isLoaded);
  const hasCompletedIntake = useProfileStore(s => s.profile.hasCompletedIntake);

  useEffect(() => { loadProfile(); }, []);

  if (!isLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bg0 }} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={hasCompletedIntake ? 'Home' : 'Intake'}
        screenOptions={defaultScreenOptions}
      >
        <Stack.Screen name="Intake"           component={IntakeScreen} options={checkInScreenOptions} />
        <Stack.Screen name="Home"             component={HomeScreen} />
        <Stack.Screen name="Scenario"         component={ScenarioScreen} options={checkInScreenOptions} />
        <Stack.Screen name="SessionComplete"  component={SessionCompleteScreen} options={checkInScreenOptions} />
        <Stack.Screen name="History"          component={HistoryScreen} />
        <Stack.Screen name="Games"            component={GamesScreen} />
        <Stack.Screen name="WeeklySnapshot"   component={WeeklySnapshotScreen} />
        <Stack.Screen name="Characters"       component={CharacterSelectScreen} />
        <Stack.Screen name="Settings"         component={SettingsScreen} />
        <Stack.Screen name="ReactionTapGame"  component={ReactionTapGame} options={checkInScreenOptions} />
        <Stack.Screen name="StroopGame"       component={StroopGame} options={checkInScreenOptions} />
        <Stack.Screen name="PatternMemoryGame" component={PatternMemoryGame} options={checkInScreenOptions} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
