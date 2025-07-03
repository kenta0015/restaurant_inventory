import React from 'react';
import { View, Text, Pressable, StyleSheet, ToastAndroid, Platform, Alert } from 'react-native';
import { Camera } from 'lucide-react-native';
import { supabase } from '../supabaseClient';

const mockOCRResult = [
  { name: 'Tomato', quantity: 3.0, unit: 'kg' },
  { name: 'Onion', quantity: 1.5, unit: 'kg' },
  { name: 'Garlic', quantity: 0.8, unit: 'kg' },
];

export default function AutoOCRUploader({ onUpdate }: { onUpdate: () => void }) {
  const handleAutoOCR = async () => {
    let updatedCount = 0;

    for (const item of mockOCRResult) {
      const { data: existing } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('name', item.name)
        .single();

      if (existing) {
        const updatedQty = parseFloat(existing.quantity) + item.quantity;
        await supabase.from('inventory').update({ quantity: updatedQty }).eq('id', existing.id);
      } else {
        await supabase.from('inventory').insert({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
        });
      }

      updatedCount++;
    }

    if (Platform.OS === 'android') {
      ToastAndroid.show(`✅ ${updatedCount} items updated from invoice`, ToastAndroid.SHORT);
    } else {
      Alert.alert('Success', `✅ ${updatedCount} items updated from invoice`);
    }

    onUpdate(); // Refresh inventory
  };

  return (
    <Pressable style={styles.button} onPress={handleAutoOCR}>
      <Camera size={24} color="white" />
      <Text style={styles.text}>Auto OCR</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 2, height: 2 },
    elevation: 6,
  },
  text: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
});
