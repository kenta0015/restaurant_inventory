import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChefHat } from 'lucide-react-native';
import { PrepTask } from '../types/types';
import { formatTime } from '../utils/prepSheetUtils';
import PrepTaskItem from './PrepTaskItem';

interface RecipeTaskGroupProps {
  recipeName: string;
  tasks: PrepTask[];
  onCompleteTask: (taskId: string, isCompleted: boolean, completedQuantity: number) => void;
}

export default function RecipeTaskGroup({ recipeName, tasks, onCompleteTask }: RecipeTaskGroupProps) {
  const totalTime = tasks.reduce((total, task) => total + task.estimatedTime, 0);
  const completedTasks = tasks.filter(task => task.isCompleted).length;
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <ChefHat color="#8B0000" size={20} />
          <Text style={styles.title}>{recipeName}</Text>
        </View>
        
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {completedTasks}/{tasks.length} tasks • {formatTime(totalTime)}
          </Text>
        </View>
      </View>
      
      <View style={styles.tasksContainer}>
        {tasks.map(task => (
          <PrepTaskItem
            key={task.id}
            task={task}
            onComplete={onCompleteTask}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statsContainer: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statsText: {
    fontSize: 12,
    color: '#666',
  },
  tasksContainer: {
    marginLeft: 8,
  },
});