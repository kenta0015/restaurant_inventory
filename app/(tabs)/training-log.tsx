// app/(tabs)/training-log.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView, Platform } from 'react-native';
import { supabase } from '../../supabaseClient';

interface TrainingLogItem {
  id: string;
  input_block: string;
  gpt_result: Record<string, any>;
  user_final: Record<string, any>;
  timestamp: string;
}

export default function TrainingLogScreen() {
  const [logs, setLogs] = useState<TrainingLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ocr_training_data')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to fetch training logs:', error.message);
    } else {
      setLogs(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const renderItem = ({ item }: { item: TrainingLogItem }) => (
    <View style={styles.item}>
      <Text style={styles.timestamp}>🕒 {new Date(item.timestamp).toLocaleString()}</Text>
      <Text style={styles.label}>🧾 Input Block:</Text>
      <Text style={styles.text}>{item.input_block}</Text>
      <Text style={styles.label}>🤖 GPT Result:</Text>
      <Text style={styles.json}>{JSON.stringify(item.gpt_result, null, 2)}</Text>
      <Text style={styles.label}>✅ User Final:</Text>
      <Text style={styles.json}>{JSON.stringify(item.user_final, null, 2)}</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📚 OCR Training Log</Text>
      {loading ? (
        <Text style={styles.loading}>Loading...</Text>
      ) : logs.length === 0 ? (
        <Text style={styles.loading}>No training data found.</Text>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    paddingBottom: 80,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  loading: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  item: {
    marginBottom: 24,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderColor: '#ddd',
    borderWidth: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  text: {
    fontSize: 14,
  },
  json: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    fontSize: 12,
    backgroundColor: '#eee',
    padding: 6,
    borderRadius: 6,
    marginTop: 4,
  },
});
