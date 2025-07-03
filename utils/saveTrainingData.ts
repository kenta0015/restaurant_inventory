// utils/saveTrainingData.ts

import { supabase } from '../supabaseClient';

interface TrainingData {
  input_block: string;
  gpt_result: Record<string, any>;
  user_final: Record<string, any>;
  timestamp?: string;
}

export async function saveTrainingData(data: TrainingData) {
  const { input_block, gpt_result, user_final } = data;

  const { error } = await supabase.from('ocr_training_data').insert([
    {
      input_block,
      gpt_result,
      user_final,
      timestamp: new Date().toISOString(),
    },
  ]);

  if (error) {
    console.error('❌ Failed to save training data:', error.message);
    throw error;
  } else {
    console.log('✅ Training data saved for block:', input_block);
  }
}
