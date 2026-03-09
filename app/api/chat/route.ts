import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

import {
  FAST_MODEL,
  PRIMARY_MODEL,
  QUERY_TYPES,
  type QueryType,
} from '@/lib/constants';
import { buildSystemPrompt } from '@/lib/prompts';
import {
  lookupSupplierProductsTool,
  searchSuppliersTool,
} from '@/lib/tools';

export const maxDuration = 300;

const requestSchema = z.object({
  messages: z.array(z.custom<UIMessage>()),
  queryMode: z.enum([QUERY_TYPES.FAST, QUERY_TYPES.DEEP]).optional(),
});

const tools = {
  search_suppliers: searchSuppliersTool,
  lookup_supplier_products: lookupSupplierProductsTool,
};

function getModelForQueryType(queryMode: QueryType) {
  if (queryMode === QUERY_TYPES.DEEP) {
    return google(PRIMARY_MODEL);
  }

  return google(FAST_MODEL);
}

export async function POST(request: Request): Promise<Response> {
  try {
    const json = await request.json();
    const parsed = requestSchema.safeParse(json);

    if (!parsed.success) {
      return Response.json(
        {
          error: 'Invalid chat payload.',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { messages, queryMode = QUERY_TYPES.FAST } = parsed.data;
    const modelMessages = await convertToModelMessages(messages, { tools });

    const result = streamText({
      model: getModelForQueryType(queryMode),
      system: buildSystemPrompt(queryMode),
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(5),
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingLevel: queryMode === QUERY_TYPES.DEEP ? 'high' : 'medium',
            includeThoughts: true,
          },
        },
      },
    });

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        console.error('Chat stream error:', error);
        return 'Failed to generate response. Please try again.';
      },
    });
  } catch (error) {
    console.error('Chat route error:', error);
    return Response.json(
      { error: 'Unexpected server error while handling chat request.' },
      { status: 500 },
    );
  }
}
