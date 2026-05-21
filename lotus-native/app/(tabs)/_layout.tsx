import { Tabs } from 'expo-router';
import { fonts } from '../../lib/theme';
import { useTheme } from '../../context/ThemeContext';
import Icon from '../../components/Icon';

export default function TabLayout() {
  const { colors } = useTheme();

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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <Icon name="home" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tarefas',
          tabBarIcon: ({ color }) => <Icon name="tasks" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pessoal"
        options={{
          title: 'Pessoal',
          tabBarIcon: ({ color }) => <Icon name="person" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="mais"
        options={{
          title: 'Mais',
          tabBarIcon: ({ color }) => <Icon name="more" size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
