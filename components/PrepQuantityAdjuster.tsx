import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';

interface PrepQuantityAdjusterProps {
  value: number;
  suggestedValue: number;
  onChange: (value: number) => void;
  min?: number;
}

export default function PrepQuantityAdjuster({ 
  value, 
  suggestedValue,
  onChange, 
  min = 0 
}: PrepQuantityAdjusterProps) {
  const increment = () => {
    onChange(value + 1);
  };

  const decrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleTextChange = (text: string) => {
    const newValue = parseInt(text);
    if (!isNaN(newValue) && newValue >= min) {
      onChange(newValue);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>Prep Quantity:</Text>
        {value !== suggestedValue && (
          <Text style={styles.suggestedLabel}>
            (Suggested: {suggestedValue})
          </Text>
        )}
      </View>
      
      <View style={styles.adjustContainer}>
        <TouchableOpacity 
          style={[styles.button, value <= min && styles.disabledButton]} 
          onPress={decrement}
          disabled={value <= min}
        >
          <Minus color={value <= min ? '#CCC' : '#8B0000'} size={20} />
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          value={value.toString()}
          onChangeText={handleTextChange}
          keyboardType="numeric"
          selectTextOnFocus
        />
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={increment}
        >
          <Plus color="#8B0000" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  suggestedLabel: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  adjustContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  disabledButton: {
    backgroundColor: '#F0F0F0',
    borderColor: '#EEE',
  },
  input: {
    width: 80,
    height: 44,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    marginHorizontal: 12,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
    backgroundColor: '#FFF',
  },
});