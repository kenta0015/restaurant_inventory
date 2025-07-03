import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TriangleAlert as AlertTriangle, Check, ChevronRight } from 'lucide-react-native';
import { PrepSuggestion } from '../types/types';

interface PrepSuggestionItemProps {
  item: PrepSuggestion;
  onPress: () => void;
}

export default function PrepSuggestionItem({ item, onPress }: PrepSuggestionItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.recipeName}>{item.recipeName}</Text>
          {item.hasShortage && (
            <View style={styles.warningBadge}>
              <AlertTriangle color="#FFF" size={14} />
              <Text style={styles.warningText}>Shortage</Text>
            </View>
          )}
          {item.status === 'completed' && (
            <View style={styles.completedBadge}>
              <Check color="#FFF" size={14} />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          )}
        </View>
        
        <View style={styles.detailsRow}>
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Suggested:</Text>
            <Text style={styles.quantityValue}>{item.suggestedQuantity} servings</Text>
          </View>
          
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Your prep:</Text>
            <Text style={[
              styles.quantityValue, 
              item.userQuantity !== item.suggestedQuantity && styles.modifiedQuantity
            ]}>
              {item.userQuantity} servings
            </Text>
          </View>
        </View>
        
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{item.weekday}, {item.date}</Text>
        </View>
      </View>
      
      <View style={styles.arrowContainer}>
        <ChevronRight color="#666" size={20} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  warningBadge: {
    backgroundColor: '#FF7F00',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  warningText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'column',
  },
  quantityLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  modifiedQuantity: {
    color: '#8B0000',
    fontWeight: '700',
  },
  dateContainer: {
    marginTop: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  arrowContainer: {
    marginLeft: 8,
  },
});