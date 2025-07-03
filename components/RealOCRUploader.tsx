// components/RealOCRUploader.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Platform,
  ToastAndroid,
  Alert,
  Button,
} from 'react-native';
import { useOCRProcessing } from '../hooks/useOCRProcessing';
import type { OCRItem } from '../types/types';
import { useIngredientCategories } from '../hooks/useIngredientCategories';
import { pickInvoiceImage } from '../utils/imagePicker';
import ParsedItemCard from './ParsedItemCard';
import { saveParsedItems } from '../utils/saveParsedItems';
import { saveTrainingData } from '../utils/saveTrainingData';
import RegistrationResultList from './RegistrationResultList';
import type { RegistrationFeedback } from '../utils/saveParsedItems';
import { supabase } from '../supabaseClient';

interface Props {
  onUpdate: () => void;
}

export default function RealOCRUploader({ onUpdate }: Props) {
  const { parsedItems, setParsedItems, loading, setLoading } = useOCRProcessing();
  const { categories, addCategory } = useIngredientCategories();
  const [imageUrl, setImageUrl] = useState<string>('');
  const [registrationResults, setRegistrationResults] = useState<RegistrationFeedback[]>([]);
  const [rawBlocks, setRawBlocks] = useState<any[]>([]);
  const [inventoryNames, setInventoryNames] = useState<string[]>([]);

  // 在庫名を最初に取得（小文字・トリムで統一）
  useEffect(() => {
    const fetchInventoryNames = async () => {
      const { data, error } = await supabase.from('inventory').select('name');
      if (!error && data) {
        setInventoryNames(data.map((item) => item.name.trim().toLowerCase()));
      }
    };
    fetchInventoryNames();
  }, []);

  const runOCRFlow = async (base64: string) => {
    try {
      setLoading(true);

      const visionRes = await fetch('http://localhost:3001/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      const visionJson = await visionRes.json();
      const rawText = visionJson.text;

      const gptRes = await fetch('http://localhost:3001/ocr/gpt-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      });
      const gptJson = await gptRes.json();

      console.log('🧾 Final parsed items:', gptJson.data);
      setRawBlocks(gptJson.data);

      const processed = gptJson.data.map((item: any) => {
        const rawCorrected = item.name?.trim() || '';
        const normalized = rawCorrected.toLowerCase();
        const matched = inventoryNames.includes(normalized);
        return {
          ...item,
          correctedName: rawCorrected,
          status: matched ? 'matched' : 'unmatched',
        };
      });

      setParsedItems(processed);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error('OCR flow failed:', err);
      Alert.alert('Error', 'Failed to process OCR and GPT parsing.');
    }
  };

  const handleMobileScan = async () => {
    const base64 = await pickInvoiceImage();
    if (base64) {
      await runOCRFlow(base64);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectURL = URL.createObjectURL(file);
    setImageUrl(objectURL);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const base64 = result.split(',')[1];
        await runOCRFlow(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const commitOCRItems = async () => {
    const cleanedItems = parsedItems
      .filter((item) => item.correctedName && item.correctedName.trim() !== '')
      .map((item) => {
        const needsAttention = !item.unit || item.unit.trim() === '' || item.price === undefined;
        return {
          ...item,
          status: needsAttention ? 'unknown' : item.status || 'new',
          extraFields: item.extraFields ? item.extraFields : undefined,
        };
      });

    if (cleanedItems.length === 0) {
      Alert.alert('No valid items', 'Please enter at least one valid item name.');
      return;
    }

    for (let i = 0; i < cleanedItems.length; i++) {
      const userFinal = cleanedItems[i];
      const gptResult = rawBlocks[i];
      const inputBlock = gptResult?.sourceText || '';
      try {
        await saveTrainingData({
          input_block: inputBlock,
          gpt_result: gptResult,
          user_final: userFinal,
        });
      } catch (e) {
        console.warn('⚠️ Failed to save training data for item', i);
      }
    }

    const { results } = await saveParsedItems(cleanedItems);
    setRegistrationResults(results);

    const successCount = results.filter((r) => r.status === 'success').length;
    const errorCount = results.filter((r) => r.status === 'error').length;
    const skipCount = results.filter((r) => r.status === 'skipped').length;

    const message = `✅ ${successCount} success, ⚠️ ${skipCount} skipped, ❌ ${errorCount} errors`;
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.LONG);
    } else {
      Alert.alert('Registration Result', message);
    }

    onUpdate();
    setParsedItems([]);
  };

  const retryFailedItems = async () => {
    const failedItems = registrationResults
      .filter((r) => r.status === 'error')
      .map((r) => r.item);

    if (failedItems.length === 0) {
      Alert.alert('No failed items', 'There are no items to retry.');
      return;
    }

    const { results } = await saveParsedItems(failedItems);
    setRegistrationResults(results);

    const message = `🔁 Retried ${failedItems.length} items`;
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Retry Complete', message);
    }

    onUpdate();
  };

  const resetAll = () => {
    Alert.alert('Reset All?', 'This will clear all data and results.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setParsedItems([]);
          setRegistrationResults([]);
          setImageUrl('');
        },
      },
    ]);
  };

  const handleItemChange = (index: number, updated: any) => {
    const newItems = [...parsedItems];
    newItems[index] = updated;
    setParsedItems(newItems);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>📷 Upload Invoice Image</Text>
      {Platform.OS === 'web' ? (
        <input type="file" accept="image/*" onChange={handleFileChange} />
      ) : (
        <Button title="📸 Scan Invoice (Camera)" onPress={handleMobileScan} />
      )}

      {imageUrl && (
        <View style={styles.imagePreviewBlock}>
          <Text style={styles.subtitle}>🖼️ Before Scan Preview:</Text>
          <Image source={{ uri: imageUrl }} style={styles.image} />
        </View>
      )}

      {parsedItems.length > 0 && (
        <View style={styles.preview}>
          <Text style={styles.subtitle}>🧾 Parsed Items:</Text>
          {parsedItems.map((item, i) => (
            <ParsedItemCard
              key={i}
              item={item}
              index={i}
              categories={categories}
              onAddCategory={addCategory}
              onChange={handleItemChange}
            />
          ))}
          <Button title="✅ Confirm and Update Inventory" onPress={commitOCRItems} />
        </View>
      )}

      {registrationResults.length > 0 && (
        <>
          <RegistrationResultList results={registrationResults} />
          <View style={{ marginTop: 12 }}>
            <Button title="🔁 Retry Failed Items" onPress={retryFailedItems} />
            <View style={{ height: 8 }} />
            <Button title="🧹 Reset All" color="red" onPress={resetAll} />
          </View>
        </>
      )}

      {loading && <Text style={styles.loading}>🔄 Scanning image with OCR...</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 4,
    marginTop: 16,
    maxWidth: 600,
    alignSelf: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  subtitle: {
    fontWeight: 'bold',
    marginTop: 12,
    fontSize: 16,
  },
  imagePreviewBlock: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 240,
    resizeMode: 'contain',
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  preview: {
    marginTop: 12,
  },
  loading: {
    marginTop: 10,
    color: '#888',
    fontStyle: 'italic',
  },
});
