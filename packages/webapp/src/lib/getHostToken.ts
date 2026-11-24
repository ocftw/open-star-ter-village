/**
 * Return a host token for an onboarded member, or continue as a guest.
 * Guests (not signed in) never call /api/game-token, so they see no 401/503.
 */
export async function getHostToken(signedIn: boolean): Promise<string | undefined> {
  if (!signedIn) return undefined;
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
export async function hostTokenInit(signedIn: boolean): Promise<{ headers: Record<string, string> } | undefined> {
  const token = await getHostToken(signedIn);
  return token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
}
