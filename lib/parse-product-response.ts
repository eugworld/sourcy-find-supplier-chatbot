export interface ProductCardData {
  productId: string;
  supplierId: string;
  supplierName?: string;
  productName: string;
  productLink: string | null;
  imageUrl: string | null;
  currency: string | null;
  priceRange: string | null;
  moqRange: string | null;
}

function toStr(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function formatRange(minValue: number | null, maxValue: number | null): string | null {
  if (minValue === null && maxValue === null) {
    return null;
  }

  const min = minValue ?? maxValue;
  const max = maxValue ?? minValue;

  if (min === null || max === null) {
    return null;
  }

  if (min === max) {
    return `${min}`;
  }

  return `${min}-${max}`;
}

export function parseProductsFromToolOutput(output: unknown): ProductCardData[] {
  const raw = typeof output === 'string' ? output : JSON.stringify(output);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return [];
    }

    const root = parsed as Record<string, unknown>;
    const productsRaw = Array.isArray(root.products) ? root.products : [];
    const suppliersRaw = Array.isArray(root.suppliers) ? root.suppliers : [];
    const supplierNameById = Object.fromEntries(
      suppliersRaw
        .map((supplier) => {
          if (!supplier || typeof supplier !== 'object') {
            return null;
          }

          const row = supplier as Record<string, unknown>;
          const supplierId = toStr(row.supplier_id);
          const supplierName =
            toStr(row.supplier_name) ?? toStr(row.title) ?? null;

          if (!supplierId || !supplierName) {
            return null;
          }

          return [supplierId, supplierName] as const;
        })
        .filter((entry): entry is readonly [string, string] => entry !== null),
    );

    return productsRaw
      .map((row) => {
        if (!row || typeof row !== 'object') {
          return null;
        }

        const product = row as Record<string, unknown>;
        const productId = toStr(product.product_id);
        const supplierId = toStr(product.supplier_id);

        if (!productId || !supplierId) {
          return null;
        }

        return {
          productId,
          supplierId,
          supplierName: supplierNameById[supplierId],
          productName: toStr(product.product_name) ?? 'Unnamed product',
          productLink: toStr(product.product_url),
          imageUrl: toStr(product.product_image_url),
          currency: toStr(product.currency),
          priceRange: formatRange(
            toNumber(product.price_min),
            toNumber(product.price_max),
          ),
          moqRange: formatRange(toNumber(product.moq_min), toNumber(product.moq_max)),
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
  } catch {
    return [];
  }
}

export function parseSupplierNamesFromToolOutput(
  output: unknown,
): Record<string, string> {
  const raw = typeof output === 'string' ? output : JSON.stringify(output);

  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    const root = parsed as Record<string, unknown>;
    const suppliersRaw = Array.isArray(root.suppliers) ? root.suppliers : [];

    return Object.fromEntries(
      suppliersRaw
        .map((supplier) => {
          if (!supplier || typeof supplier !== 'object') {
            return null;
          }

          const row = supplier as Record<string, unknown>;
          const supplierId = toStr(row.supplier_id);
          const supplierName =
            toStr(row.supplier_name) ?? toStr(row.title) ?? null;

          if (!supplierId || !supplierName) {
            return null;
          }

          return [supplierId, supplierName] as const;
        })
        .filter((entry): entry is readonly [string, string] => entry !== null),
    );
  } catch {
    return {};
  }
}
