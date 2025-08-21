// components/RealOCRUploader.tsx

import React, { useState, useEffect, useMemo } from 'react';
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
import { useIngredientCategories } from '../hooks/useIngredientCategories';
import { pickInvoiceImage } from '../utils/imagePicker';
import ParsedItemCard from './ParsedItemCard';
import { saveParsedItems } from '../utils/saveParsedItems';
import { saveTrainingData } from '../utils/saveTrainingData';
import RegistrationResultList from './RegistrationResultList';
import type { RegistrationFeedback } from '../utils/saveParsedItems';
import { supabase } from '../supabaseClient';
import type { OCRItem, ParsedItem, ParsedItemStatus } from '../types/types';

interface Props { onUpdate: () => void; }

const DEV_TEST = true;

export default function RealOCRUploader({ onUpdate }: Props) {
  const { parsedItems, setParsedItems, loading, setLoading } = useOCRProcessing();
  const { categories, addCategory } = useIngredientCategories();

  const [imageUrl, setImageUrl] = useState<string>('');
  const [registrationResults, setRegistrationResults] = useState<RegistrationFeedback[]>([]);
  const [rawBlocks, setRawBlocks] = useState<any[]>([]);
  const [inventoryNames, setInventoryNames] = useState<string[]>([]);

  const inventoryNamesLC = useMemo(
    () => inventoryNames.map((n) => (n || '').trim().toLowerCase()),
    [inventoryNames]
  );

  useEffect(() => {
    const fetchInventoryNames = async () => {
      try {
        const { data, error } = await supabase.from('inventory').select('name');
        if (error) throw error;
        const names = (data || []).map((d: any) => d.name).filter(Boolean);
        setInventoryNames(names);
      } catch {
        console.warn('Failed to fetch inventory names');
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

      const rawText = visionJson?.rawText || '';
      const blocks = visionJson?.blocks || [];
      setRawBlocks(blocks);

      const gptRes = await fetch('http://localhost:3001/ocr/gpt-parse-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      });
      const gptJson = await gptRes.json();
      const items: OCRItem[] = gptJson?.items || [];

      // OCRItem -> ParsedItem（在庫名は小文字で照合）
      const processed: ParsedItem[] = items.map((i) => {
        const rawName = (i.name || '').trim();
        const correctedName = rawName;
        const exists = inventoryNamesLC.includes(correctedName.toLowerCase());
        let status: ParsedItemStatus = correctedName ? (exists ? 'tracked' : 'new') : 'pending';

        return {
          name: rawName,
          quantity: Number(i.quantity || 0),
          unit: i.unit || '',
          price: typeof i.price === 'number' ? i.price : undefined,
          note: i.note || '',
          sourceText: i.sourceText,
          extraFields: i.extraFields,
          _newExtraKey: i._newExtraKey,
          _newExtraValue: i._newExtraValue,
          correctedName,
          status,
          category: '',
          showNewCategoryInput: false,
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
    if (base64) await runOCRFlow(base64);
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
    // 事前フィルタなしで**全件**送る（skipped判定は saveParsedItems に委譲）
    const payload: ParsedItem[] = parsedItems.map((item) => ({
      ...item,
      unit: item.unit || '',
      price: typeof item.price === 'number' ? item.price : undefined,
    }));

    // 学習ログ（nullブロックは許容）
    for (let i = 0; i < payload.length; i++) {
      try {
        const userFinal = payload[i];
        const gptResult = { from: 'gpt-parse-text', index: i };
        const input_block = JSON.stringify(rawBlocks?.[i] ?? null);
        await saveTrainingData({ input_block, gpt_result: gptResult, user_final: userFinal });
      } catch {
        console.warn('Failed to save training data for item', i);
      }
    }

    const { results } = await saveParsedItems(payload);
    setRegistrationResults(results);

    const successCount = results.filter((r) => r.status === 'success').length;
    const skipCount    = results.filter((r) => r.status === 'skipped').length;
    const errorCount   = results.filter((r) => r.status === 'error').length;

    const message = `✅ ${successCount} success, ⚠️ ${skipCount} skipped, ❌ ${errorCount} errors`;
    if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.LONG);
    else Alert.alert('Registration Result', message);

    onUpdate();
    setParsedItems([]);
  };

  const retryFailedItems = async () => {
    const failedIndexes = registrationResults.filter((r) => r.status === 'error').map((r) => r.index);
    if (failedIndexes.length === 0) return;

    const retryItems = failedIndexes
      .map((idx) => parsedItems[idx])
      .filter(Boolean)
      .map((item) => ({
        ...item,
        unit: item.unit || '',
        price: typeof item.price === 'number' ? item.price : undefined,
      }));

    const { results } = await saveParsedItems(retryItems);

    const merged = registrationResults.map((r) => results.find((nr) => nr.index === r.index) ?? r);
    setRegistrationResults(merged);

    const msg = `🔁 Retry — ✅ ${results.filter(r=>r.status==='success').length}, ⚠️ ${results.filter(r=>r.status==='skipped').length}, ❌ ${results.filter(r=>r.status==='error').length}`;
    if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.LONG);
    else Alert.alert('Retry Result', msg);
  };

  const resetAll = () => {
    setParsedItems([]);
    setRegistrationResults([]);
    setImageUrl('');
    setRawBlocks([]);
  };

  const updateItem = (index: number, next: ParsedItem) => {
    const copy = [...parsedItems];
    copy[index] = next;
    setParsedItems(copy);
  };

  // ===== Dev Test Panel =====
  const loadTestItems = () => {
    const fixtures: ParsedItem[] = [
      {
        name: 'Tomato', correctedName: 'Tomato',
        quantity: 5, unit: 'kg', price: 12.5, note: 'Roma',
        sourceText: 'TOMATO ROMA 5kg $12.5', extraFields: { brand: 'Local' },
        _newExtraKey: undefined, _newExtraValue: undefined,
        status: inventoryNamesLC.includes('tomato') ? 'tracked' : 'new',
        category: 'Vegetable', showNewCategoryInput: false,
      },
      {
        name: 'Olive Oil', correctedName: 'Olive Oil',
        quantity: 0, unit: '', price: undefined, note: '',
        sourceText: 'OLIVE OIL', extraFields: {},
        _newExtraKey: undefined, _newExtraValue: undefined,
        status: inventoryNamesLC.includes('olive oil') ? 'tracked' : 'new',
        category: '', showNewCategoryInput: false,
      },
      {
        name: '', correctedName: '',
        quantity: 2, unit: 'box', price: 20, note: 'Invalid name',
        sourceText: '??? 2 box $20', extraFields: {},
        _newExtraKey: undefined, _newExtraValue: undefined,
        status: 'pending', category: '', showNewCategoryInput: false,
      },
    ];
    setParsedItems(fixtures);
  };

  const simulateResultNoDB = () => {
    const safe = (i: number) => (parsedItems[i] ? parsedItems[i] : parsedItems[0]);
    const fake: RegistrationFeedback[] = [
      { index: 0, status: 'success', item: safe(0), message: 'Inserted/Updated' },
      { index: 1, status: 'skipped', item: safe(1), message: 'Missing unit/price' },
      { index: 2, status: 'error',   item: safe(2), message: 'Invalid name' },
    ];
    setRegistrationResults(fake);
    const msg = `✅ 1 success, ⚠️ 1 skipped, ❌ 1 errors`;
    if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.LONG);
    else Alert.alert('Simulated Result', msg);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>📷 Upload Invoice Image</Text>
      {Platform.OS === 'web'
        ? <input type="file" accept="image/*" onChange={handleFileChange} />
        : <Button title="📸 Scan Invoice (Camera)" onPress={handleMobileScan} />
      }

      {DEV_TEST && (
        <View style={styles.devPanel}>
          <Text style={styles.devTitle}>🧪 Dev Test Panel</Text>
          <View style={styles.devRow}>
            <Button title="Load Test Items" onPress={loadTestItems} />
            <View style={{ width: 8 }} />
            <Button title="Simulate Result (No DB)" onPress={simulateResultNoDB} />
          </View>
        </View>
      )}

      {!!imageUrl && (
        <View style={styles.imagePreviewBlock}>
          <Text style={styles.subtitle}>🖼️ Before Scan Preview:</Text>
          <Image source={{ uri: imageUrl }} style={styles.image} />
        </View>
      )}

      {parsedItems.length > 0 && (
        <View style={styles.preview}>
          <Text style={styles.subtitle}>🔎 Parsed Items</Text>
          {parsedItems.map((item, idx) => (
            <ParsedItemCard
              key={idx}
              item={item}
              index={idx}
              categories={categories}
              onChange={updateItem}
              onAddCategory={addCategory}
            />
          ))}
          <View style={{ marginTop: 8 }}>
            <Button title="✅ Register Items" onPress={commitOCRItems} />
          </View>
        </View>
      )}

      {registrationResults.length > 0 && (
        <>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>
              ✅ {registrationResults.filter(r => r.status === 'success').length}
              {'  '}⚠️ {registrationResults.filter(r => r.status === 'skipped').length}
              {'  '}❌ {registrationResults.filter(r => r.status === 'error').length}
            </Text>
          </View>
          <RegistrationResultList results={registrationResults} />
          <View style={{ marginTop: 12 }}>
            <Button title="🔁 Retry Failed Items" onPress={retryFailedItems} />
            <View style={{ height: 8 }} />
            <Button title="🧹 Reset All" color="red" onPress={resetAll} />
          </View>
        </>
      )}

      {loading && <Text>Processing OCR...</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { padding: 16, backgroundColor: '#fff', borderRadius: 8, elevation: 4, marginTop: 16, maxWidth: 600, alignSelf: 'center' },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  subtitle: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 8 },
  imagePreviewBlock: { marginTop: 8, borderRadius: 8, overflow: 'hidden' },
  image: { width: '100%', height: 240, resizeMode: 'contain', borderRadius: 8, backgroundColor: '#eee' },
  preview: { marginTop: 12 },
  summaryBox: { marginTop: 12, padding: 10, backgroundColor: '#f3f4f6', borderRadius: 8, alignItems: 'center' },
  summaryText: { fontSize: 16, fontWeight: '600' },
  devPanel: { marginTop: 12, padding: 10, backgroundColor: '#eef6ff', borderRadius: 8 },
  devTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  devRow: { flexDirection: 'row', alignItems: 'center' },
});
