import { loginPathFor, safeNextPath } from '@/lib/session/safeNextPath';

describe('safeNextPath', () => {
  it.each([
    ['/leads', '/leads'],
    ['/chats?id=1', '/chats?id=1'],
    [null, '/'],
    ['', '/'],
    ['https://evil.com', '/'],
    ['//evil.com', '/'],
    ['/\\evil.com', '/'],
    ['/login', '/'],
    ['/login?next=/x', '/'],
  ])('%s → %s', (entrada, esperado) => {
    expect(safeNextPath(entrada)).toBe(esperado);
  });
});

describe('loginPathFor', () => {
  it('no agrega next para el inicio', () => {
    expect(loginPathFor('/')).toBe('/login');
  });

  it('codifica la ruta a la que volver', () => {
    expect(loginPathFor('/chats?id=1')).toBe('/login?next=%2Fchats%3Fid%3D1');
  });
});
