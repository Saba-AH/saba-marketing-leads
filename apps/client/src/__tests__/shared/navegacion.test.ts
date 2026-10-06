import { estaActivo } from '@/shared/ui/layouts/navegacion';

describe('estaActivo', () => {
  it.each([
    ['/', '/', true],
    ['/', '/chats', false],
    ['/chats', '/chats', true],
    ['/chats', '/chats/123', true],
    ['/chats', '/chatsviejos', false],
  ])('%s en %s → %s', (href, pathname, esperado) => {
    expect(estaActivo(href, pathname)).toBe(esperado);
  });
});
