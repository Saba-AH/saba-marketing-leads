import { isNavItemActive } from '@/shared/ui/layouts/navigation';

describe('isNavItemActive', () => {
  it.each([
    ['/', '/', true],
    ['/', '/chats', false],
    ['/chats', '/chats', true],
    ['/chats', '/chats/123', true],
    ['/chats', '/chatsviejos', false],
  ])('%s on %s → %s', (href, pathname, expected) => {
    expect(isNavItemActive(href, pathname)).toBe(expected);
  });
});
