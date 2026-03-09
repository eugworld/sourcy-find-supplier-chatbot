import { tool } from 'ai';
import { z } from 'zod';

import {
  POSTGREST_BASE_URL,
  QUERY_TYPES,
  SOURCY_SUPPLIER_API_URL,
  SUPPLIER_NODE_NAME,
} from '@/lib/constants';

function getPostgrestAuthHeaders(jwt: string | undefined): Record<string, string> {
  if (!jwt) {
    return {};
  }

  return {
    Authorization: `Bearer ${jwt}`,
    apikey: jwt,
  };
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function getTemporarySupplierFallback(): Promise<string> {
  const postgrestJwt = process.env.POSTGREST_JWT;
  const url =
    `${POSTGREST_BASE_URL}/suppliers` +
    '?select=supplier_id,title,location_str,business_model,status,url' +
    '&limit=8';

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...getPostgrestAuthHeaders(postgrestJwt),
    },
  });

  if (!response.ok) {
    return 'Supplier data is temporarily unavailable. Please retry in a moment.';
  }

  const data = (await response.json()) as unknown;
  const rows = Array.isArray(data) ? data : [];

  if (rows.length === 0) {
    return 'No results found.';
  }

  const lines: string[] = [
    'Temporary fallback mode: data is sourced from PostgREST suppliers while labs is unavailable.',
  ];

  for (const row of rows) {
    if (!row || typeof row !== 'object') {
      continue;
    }

    const supplier = row as Record<string, unknown>;
    const supplierId =
      typeof supplier.supplier_id === 'number' || typeof supplier.supplier_id === 'string'
        ? String(supplier.supplier_id)
        : null;

    if (!supplierId) {
      continue;
    }

    const supplierName =
      typeof supplier.title === 'string' && supplier.title.trim()
        ? supplier.title.trim()
        : 'Unknown supplier';
    const location =
      typeof supplier.location_str === 'string' ? supplier.location_str : 'Unknown location';
    const businessModel =
      typeof supplier.business_model === 'string'
        ? supplier.business_model
        : 'Unknown business model';
    const status =
      typeof supplier.status === 'string' ? supplier.status : 'Unknown status';

    lines.push(
      `- Supplier ID: ${supplierId} | Name: ${supplierName} | Location: ${location} | Business Model: ${businessModel} | Status: ${status}`,
    );
  }

  return lines.join('\n');
}

export const searchSuppliersTool = tool({
  description:
    'Search the Sourcy supplier intelligence knowledge base. Use this for any supplier, product, category, capability, MOQ, pricing, material, sourcing, or supplier-evaluation question. Do not answer supplier questions without this tool.',
  inputSchema: z.object({
    question: z
      .string()
      .min(2)
      .describe(
        'The query sent to the supplier intelligence API. Include all relevant user constraints and request structured JSON output when useful.',
      ),
    query_type: z
      .enum([QUERY_TYPES.FAST, QUERY_TYPES.DEEP])
      .describe(
        'RAG_COMPLETION for fast results, GRAPH_COMPLETION_CONTEXT_EXTENSION for comprehensive analysis.',
      ),
  }),
  execute: async ({ question, query_type }) => {
    try {
      const response = await fetchWithTimeout(
        SOURCY_SUPPLIER_API_URL,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question,
            query_type,
            node_name: SUPPLIER_NODE_NAME,
          }),
        },
        query_type === QUERY_TYPES.DEEP ? 120_000 : 45_000,
      );

      if (!response.ok) {
        return getTemporarySupplierFallback();
      }

      const data = (await response.json()) as {
        answer?: unknown;
        [key: string]: unknown;
      };

      const answer = Array.isArray(data.answer) ? data.answer[0] : data.answer;

      if (typeof answer === 'string') {
        return answer;
      }

      if (answer == null) {
        return 'No results found.';
      }

      return JSON.stringify(answer);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'Search timed out while waiting for supplier intelligence API. Please retry or use Fast Search.';
      }

      return getTemporarySupplierFallback();
    }
  },
});

const supplierProductsToolInputSchema = z.object({
  supplier_ids: z
    .array(z.union([z.string(), z.number()]))
    .min(1)
    .describe(
      'Supplier IDs from search_suppliers. Use these to lookup supplier rows and their products.',
    ),
  product_limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe('Maximum number of product rows to return. Default is 30.'),
});

function toStringValue(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function normalizeImageUrl(url: string | null): string | null {
  if (!url) {
    return null;
  }

  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  if (url.startsWith('http://')) {
    return `https://${url.slice('http://'.length)}`;
  }

  return url;
}

function pickFirstImageUrl(rawImageUrls: unknown): string | null {
  if (Array.isArray(rawImageUrls)) {
    return normalizeImageUrl(toStringValue(rawImageUrls[0]));
  }

  const asString = toStringValue(rawImageUrls);
  if (!asString) {
    return null;
  }

  try {
    const parsed = JSON.parse(asString) as unknown;
    if (Array.isArray(parsed)) {
      return normalizeImageUrl(toStringValue(parsed[0]));
    }
  } catch {
    // fall through and treat as direct URL string
  }

  return normalizeImageUrl(asString);
}

function buildProductApiUrl(productId: string): string {
  return `${POSTGREST_BASE_URL}/products?product_id=eq.${encodeURIComponent(productId)}`;
}

function buildSupplierApiUrl(supplierId: string): string {
  return `${POSTGREST_BASE_URL}/suppliers?supplier_id=eq.${encodeURIComponent(supplierId)}`;
}

function toLatinFriendlyText(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const replacements: Array<[RegExp, string]> = [
    [/浙江/g, 'Zhejiang'],
    [/福建/g, 'Fujian'],
    [/广东/g, 'Guangdong'],
    [/江苏/g, 'Jiangsu'],
    [/河南/g, 'Henan'],
    [/上海/g, 'Shanghai'],
    [/绍兴/g, 'Shaoxing'],
    [/泉州/g, 'Quanzhou'],
    [/广州/g, 'Guangzhou'],
    [/南通/g, 'Nantong'],
    [/洛阳/g, 'Luoyang'],
    [/义乌/g, 'Yiwu'],
    [/金华/g, 'Jinhua'],
    [/温州/g, 'Wenzhou'],
    [/市/g, ''],
    [/省/g, ''],
  ];

  let next = value;
  for (const [pattern, replacement] of replacements) {
    next = next.replace(pattern, replacement);
  }

  return next.replace(/\s+/g, ' ').trim();
}

export const lookupSupplierProductsTool = tool({
  description:
    'Lookup suppliers and linked products from Sourcy PostgREST using supplier IDs from search_suppliers. Use this when user asks for product lists/examples/details after suppliers are identified.',
  inputSchema: supplierProductsToolInputSchema,
  execute: async ({ supplier_ids, product_limit = 30 }) => {
    const postgrestJwt = process.env.POSTGREST_JWT;
    const uniqueSupplierIds = Array.from(
      new Set(
        supplier_ids
          .map((id) => toStringValue(id))
          .filter((id): id is string => Boolean(id)),
      ),
    );

    if (uniqueSupplierIds.length === 0) {
      return JSON.stringify({
        suppliers: [],
        products: [],
        note: 'No valid supplier IDs were provided for product lookup.',
      });
    }

    const inClause = `in.(${uniqueSupplierIds.join(',')})`;
    const suppliersUrl =
      `${POSTGREST_BASE_URL}/supplier_intelligence_complete_output` +
      `?supplier_id=${encodeURIComponent(inClause)}` +
      `&select=supplier_id,supplier_en_name,supplier_cn_name,location_str`;
    const productsUrl =
      `${POSTGREST_BASE_URL}/products` +
      `?supplier_id=${encodeURIComponent(inClause)}` +
      `&select=product_id,supplier_id,title,title_translated,link,image_urls,currency,sale_count,stock_count` +
      `&order=sale_count.desc.nullslast` +
      `&limit=${product_limit}`;

    const [supplierResponse, productResponse] = await Promise.all([
      fetchWithTimeout(
        suppliersUrl,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            ...getPostgrestAuthHeaders(postgrestJwt),
          },
        },
        20_000,
      ),
      fetchWithTimeout(
        productsUrl,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            ...getPostgrestAuthHeaders(postgrestJwt),
          },
        },
        20_000,
      ),
    ]);

    if (!supplierResponse.ok || !productResponse.ok) {
      return JSON.stringify({
        suppliers: [],
        products: [],
        note: 'Supplier product data is temporarily unavailable.',
      });
    }

    const suppliersRaw = (await supplierResponse.json()) as unknown;
    const productsRaw = (await productResponse.json()) as unknown;
    const suppliers = Array.isArray(suppliersRaw) ? suppliersRaw : [];
    const products = Array.isArray(productsRaw) ? productsRaw : [];

    const normalizedSuppliers = suppliers
      .map((row) => {
        if (!row || typeof row !== 'object') {
          return null;
        }

        const supplier = row as Record<string, unknown>;
        const supplierId = toStringValue(supplier.supplier_id);

        if (!supplierId) {
          return null;
        }

        const supplierEnName = toStringValue(supplier.supplier_en_name);
        const supplierCnName = toStringValue(supplier.supplier_cn_name);
        const locationRaw = toStringValue(supplier.location_str);

        return {
          supplier_id: supplierId,
          supplier_name: supplierEnName ?? supplierCnName ?? 'Unknown supplier',
          supplier_name_latin:
            supplierEnName ?? toLatinFriendlyText(supplierCnName) ?? 'Unknown supplier',
          location: locationRaw,
          location_latin: toLatinFriendlyText(locationRaw),
          supplier_api_url: buildSupplierApiUrl(supplierId),
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    const normalizedProducts = products
      .map((row) => {
        if (!row || typeof row !== 'object') {
          return null;
        }

        const product = row as Record<string, unknown>;
        const productId = toStringValue(product.product_id);
        const supplierId = toStringValue(product.supplier_id);

        if (!productId || !supplierId) {
          return null;
        }

        return {
          product_id: productId,
          supplier_id: supplierId,
          product_name:
            toStringValue(product.title_translated) ??
            toStringValue(product.title) ??
            'Unnamed product',
          product_url: toStringValue(product.link),
          product_image_url: pickFirstImageUrl(product.image_urls),
          product_api_url: buildProductApiUrl(productId),
          currency: toStringValue(product.currency),
          sale_count: toStringValue(product.sale_count),
          stock_count: toStringValue(product.stock_count),
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    return JSON.stringify({
      suppliers: normalizedSuppliers,
      products: normalizedProducts,
      supplier_query_url: suppliersUrl,
      product_query_url: productsUrl,
      note:
        normalizedProducts.length === 0
          ? 'No products found for the supplied supplier IDs.'
          : undefined,
    });
  },
});
