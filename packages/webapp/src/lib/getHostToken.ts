/** Return a host token for an onboarded member, or continue as a guest. */
export async function getHostToken(): Promise<string | undefined> {
  try {
    const response = await fetch('/api/game-token', { cache: 'no-store', signal: AbortSignal.timeout(3000) });
    if (!response.ok) return undefined;
    const { token } = await response.json();
    return typeof token === 'string' && token ? token : undefined;
  } catch {
    return undefined;
  }
}

/** Request init for lobby calls that may carry a host token. */
export async function hostTokenInit(): Promise<{ headers: Record<string, string> } | undefined> {
  const token = await getHostToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
}
