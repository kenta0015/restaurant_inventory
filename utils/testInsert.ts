import { supabase } from '../supabaseClient';

async function testManualInsert() {
  const item = {
    name: 'test_insert_item',
    quantity: 1,
    unit: 'kg',
    category: 'Test',
    price: 99,
    comment: 'This is a test insert.',
    alertLevel: 1,
    lastChecked: new Date().toISOString(),
    status: 'tracked',
  };

  const { data, error } = await supabase.from('inventory').insert([item]);

  if (error) {
    console.error('❌ Insert failed:', error.message);
  } else {
    console.log('✅ Insert success:', data);
  }
}

testManualInsert();
