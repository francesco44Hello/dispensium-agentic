// Streams a request body and stops at the limit, so a chunked body cannot buffer unbounded memory.
export async function readCapped(request: Request, limit: number): Promise<string | null> {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}
