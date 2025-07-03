import React, { useState } from 'react';
import Papa from 'papaparse';
import { Modal, Text, View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { supabase } from '../supabaseClient';

interface ParsedRow {
  recipeName: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  category: string;
  howToCook?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

const CSVRecipeUploadModal: React.FC<Props> = ({ visible, onClose }) => {
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        const raw = results.data;
        const formatted: ParsedRow[] = [];

        raw.forEach((row: any, i: number) => {
          const recipeName = row['Recipe Name']?.trim();
          const ingredientName = row['Ingredient Name']?.trim();
          const quantity = parseFloat(row['Quantity']);
          const unit = row['Unit']?.trim();
          const category = row['Category']?.trim();
          const howToCook = row['How to Cook']?.trim();

          if (!recipeName || !ingredientName || isNaN(quantity) || !unit) {
            console.warn(`⚠️ Skipping invalid row ${i + 1}:`, row);
            return;
          }

          formatted.push({
            recipeName,
            ingredientName,
            quantity,
            unit,
            category: category || "Uncategorized",
            howToCook,
          });
        });

        console.log("✅ Parsed valid rows:", formatted.length);
        setParsedData(formatted);
      },
      error: (err) => {
        console.error("❌ CSV parsing failed:", err);
      }
    });
  };

  const uploadToSupabase = async () => {
    if (parsedData.length === 0) {
      alert('⚠️ No data to upload');
      return;
    }

    setUploading(true);
    const recipeMap: Record<string, string> = {};
    const howToCookMap: Record<string, string> = {};

    try {
      // 1. Collect recipe -> howToCook mapping
      parsedData.forEach(row => {
        if (row.howToCook && !howToCookMap[row.recipeName]) {
          howToCookMap[row.recipeName] = row.howToCook;
        }
      });

      // 2. Insert recipes
      const uniqueRecipes = [...new Set(parsedData.map(r => r.recipeName))];
      for (const recipeName of uniqueRecipes) {
        const { data: existing, error: fetchErr } = await supabase
          .from('recipes')
          .select('id')
          .eq('name', recipeName)
          .single();

        if (fetchErr && fetchErr.code !== 'PGRST116') {
          console.error(`❌ Error checking recipe ${recipeName}:`, fetchErr);
          alert(`❌ Error checking recipe: ${recipeName}`);
          continue;
        }

        if (existing) {
          recipeMap[recipeName] = existing.id;
        } else {
          const { data: inserted, error: insertErr } = await supabase
            .from('recipes')
            .insert({ name: recipeName, description: howToCookMap[recipeName] || "" })
            .select()
            .single();

          if (insertErr) {
            console.error(`❌ Error inserting recipe ${recipeName}:`, insertErr);
            alert(`❌ Error inserting recipe: ${recipeName}`);
            continue;
          }

          recipeMap[recipeName] = inserted.id;
        }
      }

      // 3. Insert ingredients
      for (const row of parsedData) {
        const { data: existingIngredient, error: fetchIngErr } = await supabase
          .from('inventory')
          .select('id')
          .eq('name', row.ingredientName)
          .single();

        let ingredientId = existingIngredient?.id;

        if (!ingredientId) {
          const { data: insertedIngredient, error: insertIngErr } = await supabase
            .from('inventory')
            .insert({ name: row.ingredientName, quantity: 0, unit: row.unit })
            .select()
            .single();

          if (insertIngErr) {
            console.error(`❌ Error inserting ingredient ${row.ingredientName}:`, insertIngErr);
            alert(`❌ Error inserting ingredient: ${row.ingredientName}`);
            continue;
          }

          ingredientId = insertedIngredient?.id;
        }

        const recipeId = recipeMap[row.recipeName];

        const { error: linkErr } = await supabase.from('recipe_ingredients').insert({
          recipe_id: recipeId,
          ingredient_id: ingredientId,
          quantity_per_batch: row.quantity,
          unit: row.unit,
        });

        if (linkErr) {
          console.error(`❌ Error linking ingredient to recipe ${row.recipeName}:`, linkErr);
          alert(`❌ Failed to link ${row.ingredientName} to ${row.recipeName}`);
          continue;
        }
      }

      alert('✅ Upload complete!');
      setParsedData([]);
      onClose();
    } catch (e) {
      console.error('❌ Unexpected error during upload:', e);
      alert('❌ Unexpected error. See console for details.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Upload CSV for Recipes</Text>

          <input type="file" accept=".csv" onChange={handleFileChange} style={{ marginBottom: 16 }} />

          {parsedData.length > 0 && (
            <>
              <ScrollView style={styles.preview}>
                <View style={styles.row}>
                  <Text style={styles.headerCell}>Recipe Name</Text>
                  <Text style={styles.headerCell}>Ingredient Name</Text>
                  <Text style={styles.headerCell}>Quantity</Text>
                  <Text style={styles.headerCell}>Unit</Text>
                  <Text style={styles.headerCell}>Category</Text>
                </View>
                {parsedData.map((row, i) => (
                  <View key={i} style={styles.row}>
                    <Text style={styles.cell}>{row.recipeName}</Text>
                    <Text style={styles.cell}>{row.ingredientName}</Text>
                    <Text style={styles.cell}>{row.quantity}</Text>
                    <Text style={styles.cell}>{row.unit}</Text>
                    <Text style={styles.cell}>{row.category}</Text>
                  </View>
                ))}
              </ScrollView>

              <Pressable onPress={uploadToSupabase} style={styles.confirmButton}>
                <Text style={styles.buttonText}>{uploading ? 'Uploading...' : 'Upload to Supabase'}</Text>
              </Pressable>
            </>
          )}

          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.buttonText}>CLOSE</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default CSVRecipeUploadModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000055',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    width: '90%',
    maxWidth: 600,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
  },
  preview: {
    width: '100%',
    maxHeight: 300,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 14,
  },
  cell: {
    flex: 1,
    fontSize: 14,
  },
  confirmButton: {
    marginTop: 12,
    backgroundColor: '#34C759',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    width: '100%',
    minHeight: 40,
  },
  closeButton: {
    width: '100%',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
