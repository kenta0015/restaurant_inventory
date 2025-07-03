import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { InventoryItem as InventoryItemType } from '../../types/types';
import { supabase } from '../../supabaseClient';
import InventoryItem from '../../components/InventoryItem';
import AddIngredientModal from '../../components/AddIngredientModal';
import RealOCRUploader from '../../components/RealOCRUploader';
import { Plus, Camera } from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function InventoryScreen() {
  const [items, setItems] = useState<InventoryItemType[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<{ [category: string]: boolean }>({});
  const [isModalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    const { data, error } = await supabase.from('inventory').select('*');
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setItems(data as InventoryItemType[]);
      const initialExpanded: { [category: string]: boolean } = {};
      (data as InventoryItemType[]).forEach((item) => {
        const category = item.category ?? 'Uncategorized';
        if (!(category in initialExpanded)) {
          initialExpanded[category] = true;
        }
      });
      setExpandedCategories(initialExpanded);
    }
  };

  const handleDelete = async (itemId: string) => {
    const { error } = await supabase.from('inventory').delete().eq('id', itemId);
    if (error) {
      Alert.alert('Error deleting item', error.message);
    } else {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  };

  const toggleCategory = (category: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const grouped = filteredItems.reduce((acc: { [key: string]: InventoryItemType[] }, item) => {
    const cat = item.category ?? 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const lowStockItems = items.filter((item) => item.quantity < item.alertLevel);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory List</Text>
        <View style={styles.iconRow}>
          <TouchableOpacity style={styles.iconButton}>
            <Camera size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.iconButton}>
            <Plus size={28} color="#8a1e1e" />
          </TouchableOpacity>
        </View>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search ingredient..."
        value={searchText}
        onChangeText={setSearchText}
      />

      {lowStockItems.length > 0 && (
        <View style={styles.alertBox}>
          <Text style={styles.alertText}>
            ⚠️ {lowStockItems.length} items are below minimum stock level:{' '}
            {lowStockItems.map((i) => i.name).join(', ')}
          </Text>
        </View>
      )}

      {Object.entries(grouped).map(([category, categoryItems]) => (
        <View key={category} style={styles.categorySection}>
          <TouchableOpacity onPress={() => toggleCategory(category)} style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>
              {expandedCategories[category] ? '▼' : '▶'} {category}
            </Text>
          </TouchableOpacity>
          {expandedCategories[category] &&
            categoryItems.map((item) => (
              <InventoryItem key={item.id} item={item} onDelete={() => handleDelete(item.id)} />
            ))}
        </View>
      ))}

      <RealOCRUploader onUpdate={fetchInventory} />

      <AddIngredientModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onSave={fetchInventory}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 120,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  iconRow: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    padding: 6,
    marginLeft: 8,
  },
  alertBox: {
    backgroundColor: '#ffe6e6',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  alertText: {
    color: '#a00',
    fontWeight: 'bold',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    paddingVertical: 8,
    backgroundColor: '#ddd',
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
