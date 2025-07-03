import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function useIngredientCategories() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inventory')
      .select('category');

    if (error) {
      console.error('Error fetching categories:', error);
      setLoading(false);
      return;
    }

    const unique = Array.from(
      new Set(
        data
          .map((row) => row.category?.trim())
          .filter(Boolean)
          .map((c) => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase())
      )
    );

    setCategories(unique.sort());
    setLoading(false);
  };

  const addCategory = (newCategory: string) => {
    const titleCase = newCategory.charAt(0).toUpperCase() + newCategory.slice(1).toLowerCase();
    if (!categories.includes(titleCase)) {
      setCategories((prev) => [...prev, titleCase].sort());
    }
  };

  return { categories, loading, addCategory, refresh: fetchCategories };
}
