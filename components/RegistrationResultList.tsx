import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import type { ParsedItem } from '../types/types';

export type RegistrationResult = 'success' | 'skipped' | 'error';

export interface RegistrationFeedback {
  index: number;
  item: ParsedItem;
  status: RegistrationResult;
  message?: string;
}

interface Props {
  results: RegistrationFeedback[];
}

export default function RegistrationResultList({ results }: Props) {
  const renderStatus = (status: RegistrationResult) => {
    switch (status) {
      case 'success':
        return '✅ 成功';
      case 'skipped':
        return '⚠ スキップ';
      case 'error':
        return '❌ エラー';
      default:
        return '';
    }
  };

  const renderItem = ({ item }: { item: RegistrationFeedback }) => {
    const name = item.item.correctedName || '(no name)';
    const statusText = renderStatus(item.status);
    return (
      <View style={styles.row}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.status}>{statusText}</Text>
        {item.message && <Text style={styles.message}>{item.message}</Text>}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>登録結果一覧</Text>
      <FlatList
        data={results}
        keyExtractor={(item) => `${item.index}-${item.item.correctedName}`}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'column',
    backgroundColor: 'white',
    padding: 8,
    marginBottom: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    fontSize: 14,
    marginTop: 2,
  },
  message: {
    fontSize: 12,
    color: '#a00',
    marginTop: 2,
  },
});
