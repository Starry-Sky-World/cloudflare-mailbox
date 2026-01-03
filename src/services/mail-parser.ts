import PostalMime from 'postal-mime';

export async function parseRawEmail(raw: ReadableStream<Uint8Array>) {
  const parser = new PostalMime();
  const rawEmail = await streamToArrayBuffer(raw);
  return await parser.parse(rawEmail);
}

async function streamToArrayBuffer(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let done = false;

  while (!done) {
    const result = await reader.read();
    done = result.done;
    if (result.value) chunks.push(result.value);
  }

  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const buffer = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }
  return buffer.buffer;
}
