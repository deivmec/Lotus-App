import { Tabs } from 'expo-router';
import { colors, fonts } from '../../lib/theme';

// Ícones SVG inline — copiar de src/components/Icon.jsx para RN com react-native-svg
// Por enquanto usa texto até a conversão do Icon component

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          paddingBottom: 20,
          paddingTop: 8,
          height: 68,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.sansMedium,
          fontSize: 10,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.text3,
      }}
    >
      <Tabs.Screen name="index"    options={{ title: 'Início' }} />
      <Tabs.Screen name="tasks"    options={{ title: 'Tarefas' }} />
      <Tabs.Screen name="pessoal"  options={{ title: 'Pessoal' }} />
      <Tabs.Screen name="mais"     options={{ title: 'Mais' }} />
    </Tabs>
  );
}
