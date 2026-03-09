import type { ConfidenceLevel, SupplierCardData } from '@/types/supplier';

function normalizeConfidence(value: unknown): ConfidenceLevel {
  if (typeof value !== 'string') {
    return 'medium';
  }

  const normalized = value.trim().toLowerCase();

  if (normalized.includes('high')) return 'high';
  if (normalized.includes('low')) return 'low';

  return 'medium';
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : String(item ?? '').trim()))
    .filter(Boolean);
}

function firstNonEmptyArray(...values: unknown[]): string[] {
  for (const value of values) {
    const parsed = toStringArray(value);
    if (parsed.length > 0) {
      return parsed;
    }
  }

  return [];
}

function extractSupplierId(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function mapSupplier(candidate: unknown): SupplierCardData | null {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const supplier = candidate as Record<string, unknown>;

  const supplierId =
    extractSupplierId(supplier.supplierId) ??
    extractSupplierId(supplier.supplier_id) ??
    extractSupplierId(supplier.supplierID) ??
    extractSupplierId(supplier.id) ??
    extractSupplierId(supplier.supplier);

  if (!supplierId) {
    return null;
  }

  const summaryValue =
    supplier.summary ??
    supplier.capabilitySummary ??
    supplier.capability_summary ??
    supplier.description ??
    supplier.overview;

  const summary =
    typeof summaryValue === 'string' && summaryValue.trim()
      ? summaryValue.trim()
      : 'Supplier information available in the current response.';

  const matched = firstNonEmptyArray(
    supplier.matched,
    supplier.matchedCapabilities,
    supplier.matched_capabilities,
  );

  const missing = firstNonEmptyArray(
    supplier.missing,
    supplier.missingCapabilities,
    supplier.missing_capabilities,
    supplier.gaps,
  );

  const supplierName =
    typeof supplier.supplierName === 'string'
      ? supplier.supplierName
      : typeof supplier.name === 'string'
      ? supplier.name
      : undefined;

  const reasoning =
    typeof supplier.reasoning === 'string'
      ? supplier.reasoning
      : typeof supplier.notes === 'string'
      ? supplier.notes
      : undefined;

  return {
    supplierId,
    supplierName,
    summary,
    matched,
    missing,
    confidence: normalizeConfidence(supplier.confidence),
    reasoning,
  };
}

function collectSuppliers(payload: unknown): SupplierCardData[] {
  const results: SupplierCardData[] = [];
  const queue: unknown[] = [payload];
  const visited = new Set<object>();

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || typeof current !== 'object') {
      continue;
    }

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    if (Array.isArray(current)) {
      for (const item of current) {
        queue.push(item);
      }
      continue;
    }

    const candidate = mapSupplier(current);
    if (candidate) {
      results.push(candidate);
    }

    for (const value of Object.values(current)) {
      if (value && typeof value === 'object') {
        queue.push(value);
      }
    }
  }

  return results;
}

function extractJsonCandidates(text: string): string[] {
  const candidates: string[] = [];

  const fencedPattern = /```(?:json)?\s*([\s\S]*?)```/gi;
  for (const match of text.matchAll(fencedPattern)) {
    if (match[1]) {
      candidates.push(match[1].trim());
    }
  }

  const trimmed = text.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    candidates.push(trimmed);
  }

  return candidates;
}

function parseFromJsonCandidates(text: string): SupplierCardData[] {
  const suppliers: SupplierCardData[] = [];

  for (const candidate of extractJsonCandidates(text)) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      suppliers.push(...collectSuppliers(parsed));
    } catch {
      // Ignore non-JSON candidates.
    }
  }

  return suppliers;
}

function parseFromSupplierIdPattern(text: string): SupplierCardData[] {
  const suppliers: SupplierCardData[] = [];
  const pattern = /Supplier ID:\s*([A-Za-z0-9-]+)[\s\S]*?(?=Supplier ID:\s*[A-Za-z0-9-]+|$)/gi;

  for (const match of text.matchAll(pattern)) {
    const supplierId = match[1]?.trim();
    if (!supplierId) {
      continue;
    }

    const block = match[0] ?? '';
    const capabilitySummary = block.match(/Capability Summary:\s*([^\n\r]+)/i)?.[1]?.trim();
    const supplierName = block.match(/Name:\s*([^\n\r|]+)/i)?.[1]?.trim();
    const location = block.match(/Location:\s*([^\n\r]+)/i)?.[1]?.trim();
    const matchedCapabilities = block.match(/Matched Capabilities:\s*([^\n\r]+)/i)?.[1];
    const missingInfo =
      block.match(/Missing (?:Info|Capabilities):\s*([^\n\r]+)/i)?.[1] ??
      block.match(/Missing:\s*([^\n\r]+)/i)?.[1];
    const confidence = block.match(/Confidence Level:\s*([^\n\r]+)/i)?.[1];

    const matched =
      matchedCapabilities
        ?.split(/[;,]/)
        .map((item) => item.trim())
        .filter(Boolean) ?? [];

    const missing =
      missingInfo
        ?.split(/[;,]/)
        .map((item) => item.trim())
        .filter(Boolean) ?? [];

    suppliers.push({
      supplierId,
      supplierName,
      summary:
        capabilitySummary ??
        (location ? `Location: ${location}` : 'Supplier information available in the response.'),
      matched,
      missing,
      confidence: normalizeConfidence(confidence),
    });
  }

  return suppliers;
}

function dedupeSuppliers(suppliers: SupplierCardData[]): SupplierCardData[] {
  const unique = new Map<string, SupplierCardData>();

  for (const supplier of suppliers) {
    if (!unique.has(supplier.supplierId)) {
      unique.set(supplier.supplierId, supplier);
      continue;
    }

    const existing = unique.get(supplier.supplierId)!;

    unique.set(supplier.supplierId, {
      ...existing,
      supplierName: existing.supplierName ?? supplier.supplierName,
      summary:
        existing.summary.length >= supplier.summary.length
          ? existing.summary
          : supplier.summary,
      matched: existing.matched.length > 0 ? existing.matched : supplier.matched,
      missing: existing.missing.length > 0 ? existing.missing : supplier.missing,
      confidence:
        existing.confidence === 'high'
          ? 'high'
          : supplier.confidence === 'high'
          ? 'high'
          : existing.confidence,
      reasoning: existing.reasoning ?? supplier.reasoning,
    });
  }

  return Array.from(unique.values());
}

export function parseSupplierResponse(text: string): SupplierCardData[] {
  if (!text.trim()) {
    return [];
  }

  const fromJson = parseFromJsonCandidates(text);
  const fromPattern = parseFromSupplierIdPattern(text);

  return dedupeSuppliers([...fromJson, ...fromPattern]);
}
