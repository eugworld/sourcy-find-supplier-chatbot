export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface SupplierCardData {
  supplierId: string;
  supplierName?: string;
  summary: string;
  matched: string[];
  missing: string[];
  confidence: ConfidenceLevel;
  reasoning?: string;
}
