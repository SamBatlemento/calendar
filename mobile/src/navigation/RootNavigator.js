import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, navigationTheme, headerScreenOptions, tabScreenOptions } from '../theme';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

import AthleteTasksScreen from '../screens/AthleteTasksScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import AthleteMealsScreen from '../screens/AthleteMealsScreen';
import AthleteGamesScreen from '../screens/AthleteGamesScreen';

import CoachAssignScreen from '../screens/CoachAssignScreen';
import CoachProgressScreen from '../screens/CoachProgressScreen';
import CoachTeamScreen from '../screens/CoachTeamScreen';
import CoachExercisesScreen from '../screens/CoachExercisesScreen';
import CoachGamesScreen from '../screens/CoachGamesScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function LogoutButton() {
  const { logout } = useAuth();
  return (
    <Pressable onPress={logout} style={{ marginRight: 16 }}>
      <Text style={{ color: colors.accent, fontWeight: '700' }}>Sign Out</Text>
    </Pressable>
  );
}

// ---- Auth (logged-out) flow ----
function LoginStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

// ---- Athlete flow ----
function AthleteTasksStack() {
  return (
    <Stack.Navigator screenOptions={{ ...headerScreenOptions, headerRight: LogoutButton }}>
      <Stack.Screen name="TaskList" component={AthleteTasksScreen} options={{ title: 'My Tasks' }} />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{ title: 'Log Time', headerRight: undefined }}
      />
    </Stack.Navigator>
  );
}

function AthleteTabs() {
  return (
    <Tab.Navigator screenOptions={{ ...tabScreenOptions, headerRight: LogoutButton }}>
      <Tab.Screen name="Tasks" component={AthleteTasksStack} options={{ headerShown: false }} />
      <Tab.Screen name="Meals" component={AthleteMealsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Games" component={AthleteGamesScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

// ---- Coach flow ----
function CoachTabs() {
  return (
    <Tab.Navigator screenOptions={{ ...tabScreenOptions, headerRight: LogoutButton }}>
      <Tab.Screen name="Assign" component={CoachAssignScreen} />
      <Tab.Screen name="Progress" component={CoachProgressScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Team" component={CoachTeamScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Exercises" component={CoachExercisesScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Games" component={CoachGamesScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, booting } = useAuth();

  if (booting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {!user ? <LoginStack /> : user.role === 'Coach' ? <CoachTabs /> : <AthleteTabs />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
});
