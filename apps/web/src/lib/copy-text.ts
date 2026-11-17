export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false; // includes insecure origins, where navigator.clipboard is undefined
  }
}
