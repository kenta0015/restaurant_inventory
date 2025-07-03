import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';

interface PrepSheetSummaryProps {
  totalTasks: number;
  completedTasks: number;
  totalTimeInMinutes: number;
  selectedDate: Date;
}

export default function PrepSheetSummary({
  totalTasks,
  completedTasks,
  totalTimeInMinutes,
  selectedDate,
}: PrepSheetSummaryProps) {
  const hours = Math.floor(totalTimeInMinutes / 60);
  const minutes = totalTimeInMinutes % 60;
  const timeString = `${hours > 0 ? `${hours} hr ` : ''}${minutes} min`;
  const completionPercentage = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prep Summary</Text>
      <Text style={styles.date}>
        {format(selectedDate, 'EEEE, yyyy-MM-dd')}
      </Text>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <View style={styles.iconContainer}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
          <Text style={styles.statValue}>{completedTasks}/{totalTasks}</Text>
          <Text style={styles.statLabel}>Tasks Completed</Text>
        </View>

        <View style={styles.statItem}>
          <View style={styles.iconContainer}>
            <Text style={styles.clock}>⏰</Text>
          </View>
          <Text style={styles.statValue}>{timeString}</Text>
          <Text style={styles.statLabel}>Remaining Time</Text>
        </View>

        <View style={styles.statItem}>
          <View style={styles.iconContainer}>
            <Text style={styles.percentage}>%</Text>
          </View>
          <Text style={styles.statValue}>{completionPercentage}%</Text>
          <Text style={styles.statLabel}>Completion</Text>
        </View>
      </View>

      <View style={styles.totalTime}>
        <Text style={styles.totalTimeLabel}>Total Estimated Time:</Text>
        <Text style={styles.totalTimeValue}>{timeString}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  date: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkmark: {
    fontSize: 24,
    color: '#4CAF50',
  },
  clock: {
    fontSize: 24,
  },
  percentage: {
    fontSize: 20,
    color: '#FF9800',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  totalTime: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  totalTimeLabel: {
    fontSize: 16,
    color: '#666',
  },
  totalTimeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});
