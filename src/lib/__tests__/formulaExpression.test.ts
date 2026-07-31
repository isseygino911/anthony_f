// Mirrors the backend's tests/pricingExpression.test.js corpus. The two parsers
// are deliberately separate implementations in separate repos, so these shared
// cases are what stop them drifting apart on syntax. This copy has no
// evaluation cases — the client never computes a price.
import { describe, it, expect } from 'vitest';

import { MAX_LENGTH, parensBalanced, parse, tokenize, tokenizeForDisplay, validate } from '../formulaExpression';

describe('tokenize', () => {
  it('handles decimals and multi-character identifiers', () => {
    const tokens = tokenize('1.5 * sizeInches');
    expect(tokens.map((t) => t.type)).toEqual(['number', 'op', 'ident']);
    expect(tokens[0].value).toBe('1.5');
    expect(tokens[2].value).toBe('sizeInches');
  });

  it('tokenizes without whitespace', () => {
    expect(tokenize('2*(3+4)').map((t) => t.value)).toEqual(['2', '*', '(', '3', '+', '4', ')']);
  });

  it('records token positions for caret placement', () => {
    const tokens = tokenize('a + bb');
    expect(tokens.map((t) => t.position)).toEqual([0, 2, 4]);
  });

  it('rejects characters outside the arithmetic grammar', () => {
    expect(() => tokenize('2 @ 3')).toThrow(/Unexpected character "@"/);
    expect(() => tokenize('2 ^ 3')).toThrow(/Unexpected character "\^"/);
    expect(() => tokenize('a = 3')).toThrow(/Unexpected character "="/);
  });

  it('rejects a malformed number', () => {
    expect(() => tokenize('1.2.3')).toThrow(/Invalid number/);
  });

  it('rejects input beyond the length cap', () => {
    expect(() => tokenize('1+'.repeat(MAX_LENGTH))).toThrow(/too long/);
  });
});

describe('parse — structure and precedence', () => {
  it('gives * higher precedence than +', () => {
    // 2 + (3 * 4) — the top node must be the +
    const ast = parse('2 + 3 * 4');
    expect(ast).toMatchObject({ type: 'binary', op: '+', right: { type: 'binary', op: '*' } });
  });

  it('honours parentheses over natural precedence', () => {
    const ast = parse('(2 + 3) * 4');
    expect(ast).toMatchObject({ type: 'binary', op: '*', left: { type: 'binary', op: '+' } });
  });

  it('parses - and / left-associatively', () => {
    // (10 - 3) - 2, not 10 - (3 - 2)
    expect(parse('10 - 3 - 2')).toMatchObject({
      type: 'binary',
      op: '-',
      left: { type: 'binary', op: '-' },
      right: { type: 'num', value: 2 },
    });
  });

  it('binds unary minus tighter than *', () => {
    expect(parse('-2 * 3')).toMatchObject({ type: 'binary', op: '*', left: { type: 'unary', op: '-' } });
  });

  it('handles a negative right operand', () => {
    expect(parse('2 - -3')).toMatchObject({ type: 'binary', op: '-', right: { type: 'unary', op: '-' } });
  });

  it('handles nested parentheses', () => {
    expect(() => parse('((2 + 3) * (4 - 1)) / 5')).not.toThrow();
  });
});

describe('parse — functions', () => {
  it('accepts the supported function set', () => {
    ['ceil(1)', 'floor(1)', 'round(1)', 'abs(1)', 'min(1, 2)', 'max(1, 2, 3)'].forEach((source) => {
      expect(() => parse(source)).not.toThrow();
    });
  });

  it('rejects wrong arity', () => {
    expect(() => parse('ceil(1, 2)')).toThrow(/takes 1 argument/);
    expect(() => parse('min()')).toThrow(/at least 1 argument/);
  });

  it('rejects an unknown function', () => {
    expect(() => parse('sqrt(4)')).toThrow(/Unknown function "sqrt"/);
  });
});

describe('parse — errors', () => {
  it('rejects unbalanced parentheses in both directions', () => {
    expect(() => parse('(2 + 3')).toThrow(/Expected "\)"/);
    expect(() => parse('2 + 3)')).toThrow(/Unexpected "\)"/);
  });

  it('rejects a trailing or doubled operator', () => {
    expect(() => parse('2 +')).toThrow(/ended unexpectedly/);
    expect(() => parse('2 + * 3')).toThrow(/Unexpected "\*"/);
  });

  it('rejects an empty formula', () => {
    expect(() => parse('')).toThrow(/empty/);
    expect(() => parse('   ')).toThrow(/empty/);
  });
});

describe('validate', () => {
  it('accepts a formula whose variables are all allowed', () => {
    expect(validate('basePrice + sizeInches', ['basePrice', 'sizeInches'])).toEqual({ ok: true });
  });

  it('reports unknown variables without throwing', () => {
    const result = validate('basePrice + mystery', ['basePrice']);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/Unknown variable: mystery/);
  });

  it('reports a syntax error without throwing', () => {
    expect(validate('2 + * 3', []).ok).toBe(false);
  });

  it('does not treat function names as variables', () => {
    expect(validate('ceil(sizeInches / 12)', ['sizeInches']).ok).toBe(true);
  });

  it('treats an empty formula as invalid rather than throwing', () => {
    expect(validate('', []).ok).toBe(false);
  });
});

// The canvas renders on every keystroke, so these two helpers must tolerate
// half-typed input rather than throwing mid-edit.
describe('display helpers', () => {
  it('returns no tokens for input it cannot tokenize, instead of throwing', () => {
    expect(tokenizeForDisplay('2 @ 3')).toEqual([]);
  });

  it('still tokenizes a syntactically incomplete but lexable formula', () => {
    expect(tokenizeForDisplay('2 + ').map((t) => t.value)).toEqual(['2', '+']);
  });

  it('detects unbalanced parentheses', () => {
    expect(parensBalanced('(1 + 2)')).toBe(true);
    expect(parensBalanced('(1 + 2')).toBe(false);
    expect(parensBalanced('1 + 2)')).toBe(false);
    expect(parensBalanced(')(')).toBe(false);
  });
});
