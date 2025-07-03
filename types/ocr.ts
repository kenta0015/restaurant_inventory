// types/ocr.ts

export interface OCRItem {
  name: string;
  quantity: number;
  unit?: string;
  price?: number;
  note?: string;
  correctedName: string;
  sourceText: string;
  status: 'tracked' | 'new' | 'unknown';
  category?: string;
  showNewCategoryInput?: boolean;
}
