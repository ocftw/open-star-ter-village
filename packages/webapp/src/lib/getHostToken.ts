/** Member sign-in will supply a short-lived host token here. Guests omit it. */
export async function getHostToken(): Promise<string | undefined> {
  return undefined;
}
