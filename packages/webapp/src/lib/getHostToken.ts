/**
 * Short-lived member host token for `createMatch` (#447). Member sign-in
 * (#452) will supply it; until then there is none and every match is
 * guest-hosted.
 */
export async function getHostToken(): Promise<string | undefined> {
  return undefined;
}

/** Request init for lobby calls that may carry a host token. */
export async function hostTokenInit(): Promise<{ headers: Record<string, string> } | undefined> {
  const token = await getHostToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
}
