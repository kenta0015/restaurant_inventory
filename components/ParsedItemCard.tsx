import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface ParsedItem {
  correctedName: string;
  quantity: number;
  unit?: string;
  price?: number;
  note?: string;
  category?: string;
  status?: 'tracked' | 'matched' | 'new' | 'unmatched' | 'unknown' | 'pending';
  showNewCategoryInput?: boolean;
  extraFields?: { [key: string]: string };
  _newExtraKey?: string;
  _newExtraValue?: string;
}

interface Props {
  item: ParsedItem;
  index: number;
  categories: string[];
  onChange: (index: number, updated: ParsedItem) => void;
  onAddCategory: (name: string) => void;
}

export default function ParsedItemCard({ item, index, categories, onChange, onAddCategory }: Props) {
  const update = (key: keyof ParsedItem, value: any) => {
    onChange(index, { ...item, [key]: value });
  };

  const updateExtraField = (key: string, value: string) => {
    const updatedFields = { ...(item.extraFields || {}) };
    updatedFields[key] = value;
    update('extraFields', updatedFields);
  };

  const removeExtraField = (key: string) => {
    const updatedFields = { ...(item.extraFields || {}) };
    delete updatedFields[key];
    update('extraFields', updatedFields);
  };

  const commitNewExtraField = () => {
    if (item._newExtraKey && item._newExtraValue) {
      const fields = { ...(item.extraFields || {}) };
      fields[item._newExtraKey] = item._newExtraValue;
      onChange(index, { ...item, extraFields: fields, _newExtraKey: '', _newExtraValue: '' });
    }
  };

  const getStatusLabel = () => {
    switch (item.status) {
      case 'tracked':
      case 'matched':
        return '✅ Matched';
      case 'new':
        return '🆕 New';
      case 'pending':
        return '⏳ Pending';
      default:
        return '❗ No Match';
    }
  };

  const getStatusColor = () => {
    switch (item.status) {
      case 'tracked':
      case 'matched':
        return 'green';
      case 'new':
        return 'orange';
      case 'pending':
        return '#888';
      default:
        return 'red';
    }
  };

  return (
    <View style={styles.card}>
      <TextInput
        style={styles.input}
        value={item.correctedName}
        onChangeText={(text) => update('correctedName', text)}
        placeholder="Name"
      />
      <TextInput
        style={styles.input}
        value={String(item.quantity)}
        onChangeText={(text) => update('quantity', parseFloat(text) || 0)}
        placeholder="Quantity"
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        value={item.unit || ''}
        onChangeText={(text) => update('unit', text)}
        placeholder="Unit"
      />
      <TextInput
        style={styles.input}
        value={item.price !== undefined ? String(item.price) : ''}
        onChangeText={(text) => update('price', parseFloat(text) || undefined)}
        placeholder="Price"
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        value={item.note || ''}
        onChangeText={(text) => update('note', text)}
        placeholder="Note"
      />

      <Text style={{ color: getStatusColor() }}>{getStatusLabel()}</Text>

      {item.status !== 'tracked' && item.status !== 'matched' && (
        <View style={{ marginTop: 8 }}>
          <Text style={{ fontWeight: '600' }}>Category:</Text>
          {!item.showNewCategoryInput ? (
            <View style={styles.categoryList}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryOption, item.category === cat && styles.selected]}
                  onPress={() => update('category', cat)}
                >
                  <Text>{cat}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => update('showNewCategoryInput', true)}>
                <Text style={styles.addMore}>+ New Category</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <TextInput
                placeholder="New Category"
                style={styles.input}
                value={item.category || ''}
                onChangeText={(text) => {
                  const titleCase = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
                  update('category', titleCase);
                  onAddCategory(titleCase);
                }}
              />
              <TouchableOpacity onPress={() => update('showNewCategoryInput', false)}>
                <Text style={styles.addMore}>← Back to Category List</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <View style={{ marginTop: 8 }}>
        <Text style={{ fontWeight: '600' }}>Custom Fields:</Text>
        {item.extraFields &&
          Object.entries(item.extraFields).map(([key, value]) => (
            <View key={key} style={styles.extraRow}>
              <Text style={styles.extraKey}>{key}:</Text>
              <TextInput
                style={styles.extraInput}
                value={value}
                onChangeText={(text) => updateExtraField(key, text)}
              />
              <TouchableOpacity onPress={() => removeExtraField(key)}>
                <Text style={styles.remove}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        <View style={styles.extraRow}>
          <TextInput
            style={styles.extraKeyInput}
            placeholder="Key"
            value={item._newExtraKey || ''}
            onChangeText={(text) => update('_newExtraKey', text)}
          />
          <TextInput
            style={styles.extraInput}
            placeholder="Value"
            value={item._newExtraValue || ''}
            onChangeText={(text) => update('_newExtraValue', text)}
          />
          <TouchableOpacity onPress={commitNewExtraField}>
            <Text style={styles.addMore}>＋</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16, padding: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 },
  input: { borderBottomWidth: 1, borderColor: '#ccc', marginBottom: 6, padding: 4 },
  categoryList: { marginTop: 4 },
  categoryOption: {
    padding: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginVertical: 2,
  },
  selected: { backgroundColor: '#def', borderColor: '#007AFF' },
  addMore: { color: '#007AFF', marginLeft: 8 },
  remove: { color: 'red', marginLeft: 8 },
  extraRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  extraKey: { width: 80, fontWeight: 'bold' },
  extraInput: { flex: 1, borderBottomWidth: 1, borderColor: '#ccc', padding: 4 },
  extraKeyInput: { width: 80, borderBottomWidth: 1, borderColor: '#ccc', padding: 4 },
});
