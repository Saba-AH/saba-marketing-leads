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
  ])('%s → %s', (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });
});

describe('loginPathFor', () => {
  it('does not add next for the home page', () => {
    expect(loginPathFor('/')).toBe('/login');
  });

  it('encodes the route to go back to', () => {
    expect(loginPathFor('/chats?id=1')).toBe('/login?next=%2Fchats%3Fid%3D1');
  });
});
