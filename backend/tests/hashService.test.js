const { encode, decode } = require('../src/services/hashService');

describe('hashService', () => {
  test('encodes a number to 7-char Base62 string', () => {
    const code = encode(1);
    expect(code).toHaveLength(7);
    expect(/^[a-zA-Z0-9]+$/.test(code)).toBe(true);
  });

  test('different IDs produce different short codes', () => {
    expect(encode(1)).not.toBe(encode(2));
    expect(encode(100)).not.toBe(encode(101));
  });

  test('encode and decode are inverse operations', () => {
    const id = 123456;
    expect(decode(encode(id))).toBe(id);
  });

  test('handles large IDs (billion+)', () => {
    const code = encode(1_000_000_000);
    expect(code).toHaveLength(7);
  });

  test('encodes zero without crashing', () => {
    expect(() => encode(0)).not.toThrow();
  });
});
