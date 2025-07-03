import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';

interface NecessaryPrepItemProps {
  name: string;
  necessaryAmount: number;
  unit: string;
  currentStock: number;
}

interface NecessaryPrepListProps {
  items: NecessaryPrepItemProps[];
  canPrepWithCurrentStock: boolean;
}

export default function NecessaryPrepList({ items, canPrepWithCurrentStock }: NecessaryPrepListProps) {
  // Filter items that need additional prep (necessary amount > 0)
  const itemsNeedingPrep = items.filter(item => item.necessaryAmount > 0);
  
  if (canPrepWithCurrentStock) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <ShoppingBag color="#4CAF50" size={20} />
          <Text style={styles.headerText}>Current Stock Sufficient</Text>
        </View>
        <Text style={styles.infoText}>
          You have enough of all ingredients in stock to prepare this recipe.
        </Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <ShoppingBag color="#8B0000" size={20} />
        <Text style={styles.headerText}>Necessary Prep Today</Text>
      </View>
      
      <Text style={styles.infoText}>
        Based on your current stock, you need to prepare the following ingredients:
      </Text>
      
      {itemsNeedingPrep.length > 0 ? (
        <View style={styles.itemsContainer}>
          {itemsNeedingPrep.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <View style={styles.itemDetails}>
                <Text style={styles.itemAmount}>
                  <Text style={styles.boldText}>{item.necessaryAmount.toFixed(2)}</Text> {item.unit}
                </Text>
                <Text style={styles.stockInfo}>
                  (Current: {item.currentStock.toFixed(2)} {item.unit})
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noItemsText}>No additional prep needed</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  itemsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 6,
    padding: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemName: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  itemDetails: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    fontSize: 15,
    color: '#8B0000',
  },
  stockInfo: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  boldText: {
    fontWeight: '600',
  },
  noItemsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
});