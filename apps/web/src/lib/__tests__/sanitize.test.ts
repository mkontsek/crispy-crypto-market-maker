import { describe, expect, it } from 'vitest';

import { sanitize } from '../sanitize';

describe('sanitize', () => {
    it('removes control characters in the 0x00–0x1F range', () => {
        expect(sanitize('hello\x00world')).toBe('helloworld');
        expect(sanitize('hello\x01world')).toBe('helloworld');
        expect(sanitize('hello\x1Fworld')).toBe('helloworld');
    });

    it('removes the DEL character (0x7F)', () => {
        expect(sanitize('hello\x7Fworld')).toBe('helloworld');
    });

    it('trims leading and trailing whitespace', () => {
        expect(sanitize('  hello  ')).toBe('hello');
        expect(sanitize('\t hello \t')).toBe('hello');
    });

    it('leaves normal printable strings unchanged', () => {
        expect(sanitize('hello world')).toBe('hello world');
        expect(sanitize('bot-1')).toBe('bot-1');
    });

    it('returns empty string for a string of only control chars', () => {
        expect(sanitize('\x00\x01\x1F\x7F')).toBe('');
    });
});
