export type QuoteDetails = {
  quantity: string;
  destination: string;
};

const QUOTE_INTENT_PATTERN = /\b(yes|get\s*quote|quote|rfq|source\s*this|i\s*want\s*to\s*source|proceed)\b/i;

function cleanValue(value: string): string {
  return value
    .replace(/^[\s:,-]+|[\s:,-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isQuoteIntent(text: string): boolean {
  return QUOTE_INTENT_PATTERN.test(text.trim());
}

export function extractQuoteDetails(text: string): Partial<QuoteDetails> {
  const source = text.trim();
  if (!source) {
    return {};
  }

  const quantityMatch = source.match(/(?:quantity|qty|jumlah|order)\s*[:=-]?\s*([^,\n]+)/i);
  const destinationMatch = source.match(/(?:destination|dest|ship(?:ping)?\s*to|kirim\s*ke)\s*[:=-]?\s*([^\n]+)/i);

  if (quantityMatch || destinationMatch) {
    return {
      quantity: quantityMatch ? cleanValue(quantityMatch[1] ?? '') : undefined,
      destination: destinationMatch ? cleanValue(destinationMatch[1] ?? '') : undefined,
    };
  }

  const parts = source
    .split(/\n|,|\band\b/i)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    const quantityCandidate = parts[0] ?? '';
    const destinationCandidate = parts.slice(1).join(', ');

    if (/\d/.test(quantityCandidate) && destinationCandidate.length > 2) {
      return {
        quantity: cleanValue(quantityCandidate),
        destination: cleanValue(destinationCandidate),
      };
    }
  }

  const compactMatch = source.match(/^(\d[^,\n]*)[,\n]\s*(.+)$/);
  if (compactMatch) {
    return {
      quantity: cleanValue(compactMatch[1] ?? ''),
      destination: cleanValue(compactMatch[2] ?? ''),
    };
  }

  return {};
}

export function buildWhatsappMessage(params: {
  userText: string;
  productNames: string[];
  quantity: string;
  destination: string;
}): string {
  const products = params.productNames.length
    ? params.productNames.slice(0, 5).join('; ')
    : 'From latest Sourcy supplier recommendation';

  return [
    'Hi Sourcy team, please help me get a quotation.',
    `Request: ${params.userText || 'Supplier sourcing request'}`,
    `Products: ${products}`,
    `Quantity: ${params.quantity}`,
    `Destination: ${params.destination}`,
  ].join('\n');
}

export function buildWhatsappUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
