// components/RealOCRUploader.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
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

interface Props {
  onUpdate: () => void;
}

const getEnv = (key: string): string | undefined => {
  const p = (globalThis as any)?.process;
  const env = p?.env;
  const v = env?.[key];
  return typeof v === 'string' ? v : undefined;
};

// Hidden by default. To enable locally, set EXPO_PUBLIC_SHOW_DEV_TEST_PANEL=true
// and run in development mode.
const DEV_TEST = !!__DEV__ && getEnv('EXPO_PUBLIC_SHOW_DEV_TEST_PANEL') === 'true';

// Configure OCR API base URL via env.
// Example: EXPO_PUBLIC_OCR_API_URL=http://localhost:3001
const OCR_API_BASE = (() => {
  const raw =
    getEnv('EXPO_PUBLIC_OCR_API_URL') ||
    getEnv('EXPO_PUBLIC_API_BASE_URL') ||
    'http://localhost:3001';
  return raw.trim().replace(/\/+$/, '');
})();

export default function RealOCRUploader({ onUpdate }: Props) {
  const { parsedItems, setParsedItems, loading, setLoading } = useOCRProcessing();
  const { categories, addCategory } = useIngredientCategories();

  const [imageUrl, setImageUrl] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [registrationResults, setRegistrationResults] = useState<RegistrationFeedback[]>([]);
  const [rawTextForTraining, setRawTextForTraining] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [inventoryNames, setInventoryNames] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    return () => {
      if (imageUrl) {
        try {
          URL.revokeObjectURL(imageUrl);
        } catch {}
      }
    };
  }, [imageUrl]);

  const showError = (title: string, message: string) => {
    setErrorMessage(message);
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.LONG);
    } else {
      Alert.alert(title, message);
    }
  };

  const postJson = async (url: string, body: any) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await res.text().catch(() => '');
    let json: any = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = {};
    }

    if (!res.ok) {
      const preview = text ? text.slice(0, 240) : '';
      throw new Error(`${res.status} ${res.statusText}${preview ? ` — ${preview}` : ''}`);
    }

    return json;
  };

  const runOCRFlow = async (base64: string) => {
    try {
      setErrorMessage('');
      setLoading(true);

      // 1) Vision OCR
      const visionJson = await postJson(`${OCR_API_BASE}/ocr`, { imageBase64: base64 });

      // Support both older and newer response shapes
      const extractedText: string =
        (typeof visionJson?.text === 'string' && visionJson.text) ||
        (typeof visionJson?.rawText === 'string' && visionJson.rawText) ||
        '';

      setRawTextForTraining(extractedText);

      if (!extractedText.trim()) {
        throw new Error('OCR returned empty text. Try a higher-resolution image.');
      }

      // 2) GPT Parse (try primary endpoint first, then fallback)
      let gptJson: any;
      try {
        gptJson = await postJson(`${OCR_API_BASE}/ocr/gpt-parse`, { rawText: extractedText });
      } catch (e) {
        gptJson = await postJson(`${OCR_API_BASE}/ocr/gpt-parse-text`, { rawText: extractedText });
      }

      const items: OCRItem[] = Array.isArray(gptJson?.data)
        ? gptJson.data
        : Array.isArray(gptJson?.items)
          ? gptJson.items
          : [];

      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('No items were parsed. The invoice may not contain clear item lines.');
      }

      // Map OCRItem -> ParsedItem (match inventory names case-insensitively)
      const processed: ParsedItem[] = items.map((i) => {
        const rawName = (i?.name || '').trim();
        const correctedName = rawName;
        const exists = correctedName ? inventoryNamesLC.includes(correctedName.toLowerCase()) : false;
        const status: ParsedItemStatus = correctedName ? (exists ? 'tracked' : 'new') : 'pending';

        return {
          name: rawName,
          quantity: Number((i as any)?.quantity || 0),
          unit: (i as any)?.unit || '',
          price: typeof (i as any)?.price === 'number' ? (i as any).price : undefined,
          note: (i as any)?.note || '',
          sourceText: (i as any)?.sourceText,
          extraFields: (i as any)?.extraFields,
          _newExtraKey: (i as any)?._newExtraKey,
          _newExtraValue: (i as any)?._newExtraValue,
          correctedName,
          status,
          category: '',
          showNewCategoryInput: false,
        };
      });

      setParsedItems(processed);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      console.error('OCR flow failed:', err);

      const detail = typeof err?.message === 'string' ? err.message : 'Unknown error';
      showError(
        'OCR Error',
        `Failed to process invoice.\n\nMake sure the API server is running and reachable at:\n${OCR_API_BASE}\n\nDetails:\n${detail}`
      );
    }
  };

  const handleMobileScan = async () => {
    const base64 = await pickInvoiceImage();
    if (base64) await runOCRFlow(base64);
  };

  const handleChooseFileClick = () => {
    if (Platform.OS !== 'web') return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFileName('');
      return;
    }

    setErrorMessage('');
    setSelectedFileName(file.name);

    if (imageUrl) {
      try {
        URL.revokeObjectURL(imageUrl);
      } catch {}
    }

    const objectURL = URL.createObjectURL(file);
    setImageUrl(objectURL);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const base64 = result.split(',')[1];
        if (base64) await runOCRFlow(base64);
        else showError('Upload Error', 'Failed to read image as base64.');
      }
    };
    reader.readAsDataURL(file);
  };

  const commitOCRItems = async () => {
    const payload: ParsedItem[] = parsedItems.map((item) => ({
      ...item,
      unit: item.unit || '',
      price: typeof item.price === 'number' ? item.price : undefined,
    }));

    for (let i = 0; i < payload.length; i++) {
      try {
        const userFinal = payload[i];
        const gptResult = { from: 'gpt-parse', index: i };
        const input_block = JSON.stringify({
          rawText: rawTextForTraining || null,
          index: i,
          sourceText: userFinal?.sourceText ?? null,
        });
        await saveTrainingData({ input_block, gpt_result: gptResult, user_final: userFinal });
      } catch {
        console.warn('Failed to save training data for item', i);
      }
    }

    const { results } = await saveParsedItems(payload);
    setRegistrationResults(results);

    const successCount = results.filter((r) => r.status === 'success').length;
    const skipCount = results.filter((r) => r.status === 'skipped').length;
    const errorCount = results.filter((r) => r.status === 'error').length;

    const message = `✅ ${successCount} success, ⚠️ ${skipCount} skipped, ❌ ${errorCount} errors`;
    if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.LONG);
    else Alert.alert('Registration Result', message);

    onUpdate();
    setParsedItems([]);
  };

  const retryFailedItems = async () => {
    const failedIndexes = registrationResults
      .filter((r) => r.status === 'error')
      .map((r) => r.index);
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

    const merged = registrationResults.map(
      (r) => results.find((nr) => nr.index === r.index) ?? r
    );
    setRegistrationResults(merged);

    const msg = `🔁 Retry — ✅ ${results.filter((r) => r.status === 'success').length}, ⚠️ ${results.filter((r) => r.status === 'skipped').length}, ❌ ${results.filter((r) => r.status === 'error').length}`;
    if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.LONG);
    else Alert.alert('Retry Result', msg);
  };

  const resetAll = () => {
    setParsedItems([]);
    setRegistrationResults([]);
    setRawTextForTraining('');
    setErrorMessage('');

    if (imageUrl) {
      try {
        URL.revokeObjectURL(imageUrl);
      } catch {}
    }
    setImageUrl('');
    setSelectedFileName('');

    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
        name: 'Tomato',
        correctedName: 'Tomato',
        quantity: 5,
        unit: 'kg',
        price: 12.5,
        note: 'Roma',
        sourceText: 'TOMATO ROMA 5kg $12.5',
        extraFields: { brand: 'Local' },
        _newExtraKey: undefined,
        _newExtraValue: undefined,
        status: inventoryNamesLC.includes('tomato') ? 'tracked' : 'new',
        category: 'Vegetable',
        showNewCategoryInput: false,
      },
      {
        name: 'Olive Oil',
        correctedName: 'Olive Oil',
        quantity: 0,
        unit: '',
        price: undefined,
        note: '',
        sourceText: 'OLIVE OIL',
        extraFields: {},
        _newExtraKey: undefined,
        _newExtraValue: undefined,
        status: inventoryNamesLC.includes('olive oil') ? 'tracked' : 'new',
        category: '',
        showNewCategoryInput: false,
      },
      {
        name: '',
        correctedName: '',
        quantity: 2,
        unit: 'box',
        price: 20,
        note: 'Invalid name',
        sourceText: '??? 2 box $20',
        extraFields: {},
        _newExtraKey: undefined,
        _newExtraValue: undefined,
        status: 'pending',
        category: '',
        showNewCategoryInput: false,
      },
    ];
    setParsedItems(fixtures);
  };

  const simulateResultNoDB = () => {
    const safe = (i: number) => (parsedItems[i] ? parsedItems[i] : parsedItems[0]);
    const fake: RegistrationFeedback[] = [
      { index: 0, status: 'success', item: safe(0), message: 'Inserted/Updated' },
      { index: 1, status: 'skipped', item: safe(1), message: 'Missing unit/price' },
      { index: 2, status: 'error', item: safe(2), message: 'Invalid name' },
    ];
    setRegistrationResults(fake);
    const msg = `✅ 1 success, ⚠️ 1 skipped, ❌ 1 errors`;
    if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.LONG);
    else Alert.alert('Simulated Result', msg);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>📷 Upload Invoice Image</Text>

      {Platform.OS === 'web' ? (
        <View style={styles.webFileRow}>
          <Button
            title={selectedFileName ? 'Change Image' : 'Choose Image'}
            onPress={handleChooseFileClick}
          />
          <Text style={styles.webFileName} numberOfLines={1}>
            {selectedFileName || 'No file selected'}
          </Text>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </View>
      ) : (
        <Button title="📸 Scan Invoice (Camera)" onPress={handleMobileScan} />
      )}

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>⚠️ OCR failed</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

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
              ✅ {registrationResults.filter((r) => r.status === 'success').length}
              {'  '}⚠️ {registrationResults.filter((r) => r.status === 'skipped').length}
              {'  '}❌ {registrationResults.filter((r) => r.status === 'error').length}
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
  wrapper: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 4,
    marginTop: 16,
    maxWidth: 600,
    alignSelf: 'center',
  },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  subtitle: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 8 },
  imagePreviewBlock: { marginTop: 8, borderRadius: 8, overflow: 'hidden' },
  image: {
    width: '100%',
    height: 240,
    resizeMode: 'contain',
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  preview: { marginTop: 12 },
  summaryBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryText: { fontSize: 16, fontWeight: '600' },
  devPanel: { marginTop: 12, padding: 10, backgroundColor: '#eef6ff', borderRadius: 8 },
  devTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  devRow: { flexDirection: 'row', alignItems: 'center' },
  webFileRow: { flexDirection: 'row', alignItems: 'center' },
  webFileName: { flex: 1, marginLeft: 12, fontSize: 14 },
  errorBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff1f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  errorTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  errorText: { fontSize: 12, lineHeight: 16 },
});
