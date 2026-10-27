import { getHostToken } from './getHostToken';

it('has no host token before member sign-in exists', async () => {
  expect(await getHostToken()).toBeUndefined();
});
