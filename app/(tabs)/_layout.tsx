import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import {
  Clipboard,
  ChefHat,
  ChartBar as BarChart2,
  Calculator,
  ClipboardCheck,
  BookText,
} from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#8B0000',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTintColor: '#FFF',
      }}
    >
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          headerTitle: 'Kitchen Inventory',
          tabBarIcon: ({ color, size }) => (
            <Clipboard color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recipes',
          headerTitle: 'Recipe Book',
          tabBarIcon: ({ color, size }) => (
            <ChefHat color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="meal-log"
        options={{
          title: 'Meal Log',
          headerTitle: 'Meal Tracking',
          tabBarIcon: ({ color, size }) => (
            <BarChart2 color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="prep-sheet"
        options={{
          title: 'Prep Sheet',
          headerTitle: 'Prep Sheet',
          tabBarIcon: ({ color, size }) => (
            <ClipboardCheck color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="modal-test"
        options={{
          title: 'Modal Test',
          headerTitle: 'Test Prep Modal',
          tabBarIcon: ({ color, size }) => (
            <ClipboardCheck color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="training-log"
        options={{
          title: 'Training Log',
          headerTitle: 'Training Log',
          tabBarIcon: ({ color, size }) => (
            <BookText color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFF',
    borderTopColor: '#DDD',
    height: 60,
    paddingBottom: 5,
    paddingTop: 5,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#8B0000',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
