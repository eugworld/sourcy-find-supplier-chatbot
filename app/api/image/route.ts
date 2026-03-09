function isBlockedHostname(hostname: string): boolean {
  const blocked = new Set(['localhost', '127.0.0.1', '::1']);
  if (blocked.has(hostname)) {
    return true;
  }

  return hostname.endsWith('.local');
}

async function fetchImageWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      // Avoid forwarding restrictive referer/origin headers.
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
      cache: 'force-cache',
      next: { revalidate: 60 * 60 * 24 },
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const src = searchParams.get('src');

  if (!src) {
    return new Response('Missing src', { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(src);
  } catch {
    return new Response('Invalid src URL', { status: 400 });
  }

  if (!['http:', 'https:'].includes(target.protocol)) {
    return new Response('Unsupported protocol', { status: 400 });
  }

  if (isBlockedHostname(target.hostname)) {
    return new Response('Blocked host', { status: 403 });
  }

  try {
    const upstream = await fetchImageWithTimeout(target.toString(), 12_000);
    if (!upstream.ok) {
      return new Response('Image unavailable', { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
    const body = await upstream.arrayBuffer();

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return new Response('Image request timed out', { status: 504 });
    }

    return new Response('Image proxy error', { status: 502 });
  }
}
