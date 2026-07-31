// Syntax-only port of the backend's pricing formula parser
// (anthony_b/src/services/pricingFormulas/expression.js), used by the admin
// formula builder to render chips and show live syntax errors without a
// round-trip per keystroke.
//
// Deliberately NOT shared code: anthony_f and anthony_b are separate repos and
// neither imports from the other. This file therefore carries no evaluator —
// it can tokenize, parse and validate, but it cannot compute a number. Prices
// are only ever produced server-side (see PricingConfig in types.ts), so the
// live preview goes through the price-preview endpoint rather than this file.
//
// tests/formulaExpression.test.ts mirrors the backend's test corpus so the two
// implementations cannot drift apart on syntax.

export const MAX_LENGTH = 500;

// Arity null means variadic (at least one argument).
export const FUNCTIONS: Record<string, { arity: number | null }> = {
  ceil: { arity: 1 },
  floor: { arity: 1 },
  round: { arity: 1 },
  abs: { arity: 1 },
  min: { arity: null },
  max: { arity: null },
};

export type TokenType = 'number' | 'ident' | 'op' | 'lparen' | 'rparen' | 'comma';

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

export class FormulaError extends Error {}

export function tokenize(source: string): Token[] {
  if (source.length > MAX_LENGTH) {
    throw new FormulaError(`Formula is too long (max ${MAX_LENGTH} characters)`);
  }

  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const char = source[i];

    if (/\s/.test(char)) {
      i += 1;
    } else if (/[0-9.]/.test(char)) {
      const start = i;
      while (i < source.length && /[0-9.]/.test(source[i])) i += 1;
      const raw = source.slice(start, i);
      if (!/^\d+(\.\d+)?$/.test(raw)) {
        throw new FormulaError(`Invalid number "${raw}" at position ${start}`);
      }
      tokens.push({ type: 'number', value: raw, position: start });
    } else if (/[A-Za-z_]/.test(char)) {
      const start = i;
      while (i < source.length && /[A-Za-z0-9_]/.test(source[i])) i += 1;
      tokens.push({ type: 'ident', value: source.slice(start, i), position: start });
    } else if ('+-*/'.includes(char)) {
      tokens.push({ type: 'op', value: char, position: i });
      i += 1;
    } else if (char === '(' || char === ')') {
      tokens.push({ type: char === '(' ? 'lparen' : 'rparen', value: char, position: i });
      i += 1;
    } else if (char === ',') {
      tokens.push({ type: 'comma', value: char, position: i });
      i += 1;
    } else {
      throw new FormulaError(`Unexpected character "${char}" at position ${i}`);
    }
  }
  return tokens;
}

export type Node =
  | { type: 'num'; value: number }
  | { type: 'var'; name: string }
  | { type: 'unary'; op: '-'; arg: Node }
  | { type: 'binary'; op: string; left: Node; right: Node }
  | { type: 'call'; name: string; args: Node[] };

// Same grammar as the backend: expr -> term (('+'|'-') term)*,
// term -> unary (('*'|'/') unary)*, unary -> '-' unary | primary.
export function parse(source: string): Node {
  const tokens = tokenize(source);
  let pos = 0;

  const peek = (): Token | undefined => tokens[pos];

  function expect(type: TokenType, description: string): Token {
    const token = peek();
    if (!token || token.type !== type) {
      const where = token ? `at position ${token.position}` : 'at end of formula';
      throw new FormulaError(`Expected ${description} ${where}`);
    }
    pos += 1;
    return token;
  }

  function parsePrimary(): Node {
    const token = peek();
    if (!token) throw new FormulaError('Formula ended unexpectedly — expected a value');

    if (token.type === 'number') {
      pos += 1;
      return { type: 'num', value: Number(token.value) };
    }

    if (token.type === 'ident') {
      pos += 1;
      if (peek()?.type === 'lparen') {
        const fn = FUNCTIONS[token.value];
        if (!fn) throw new FormulaError(`Unknown function "${token.value}"`);
        pos += 1; // consume '('
        const args: Node[] = [];
        if (peek()?.type === 'rparen') {
          pos += 1;
        } else {
          for (;;) {
            args.push(parseExpr());
            if (peek()?.type === 'comma') {
              pos += 1;
            } else {
              expect('rparen', `")" to close ${token.value}(`);
              break;
            }
          }
        }
        if (fn.arity === null) {
          if (args.length < 1) throw new FormulaError(`${token.value}() needs at least 1 argument`);
        } else if (args.length !== fn.arity) {
          throw new FormulaError(
            `${token.value}() takes ${fn.arity} argument${fn.arity === 1 ? '' : 's'}, got ${args.length}`,
          );
        }
        return { type: 'call', name: token.value, args };
      }
      return { type: 'var', name: token.value };
    }

    if (token.type === 'lparen') {
      pos += 1;
      const inner = parseExpr();
      expect('rparen', '")"');
      return inner;
    }

    throw new FormulaError(`Unexpected "${token.value}" at position ${token.position}`);
  }

  function parseUnary(): Node {
    const token = peek();
    if (token && token.type === 'op' && token.value === '-') {
      pos += 1;
      return { type: 'unary', op: '-', arg: parseUnary() };
    }
    return parsePrimary();
  }

  function parseTerm(): Node {
    let left = parseUnary();
    for (;;) {
      const token = peek();
      if (!token || token.type !== 'op' || (token.value !== '*' && token.value !== '/')) break;
      pos += 1;
      left = { type: 'binary', op: token.value, left, right: parseUnary() };
    }
    return left;
  }

  function parseExpr(): Node {
    let left = parseTerm();
    for (;;) {
      const token = peek();
      if (!token || token.type !== 'op' || (token.value !== '+' && token.value !== '-')) break;
      pos += 1;
      left = { type: 'binary', op: token.value, left, right: parseTerm() };
    }
    return left;
  }

  if (tokens.length === 0) throw new FormulaError('Formula is empty');
  const ast = parseExpr();
  const trailing = peek();
  if (trailing) {
    throw new FormulaError(`Unexpected "${trailing.value}" at position ${trailing.position}`);
  }
  return ast;
}

export function collectVariables(node: Node, found = new Set<string>()): Set<string> {
  if (node.type === 'var') found.add(node.name);
  else if (node.type === 'unary') collectVariables(node.arg, found);
  else if (node.type === 'binary') {
    collectVariables(node.left, found);
    collectVariables(node.right, found);
  } else if (node.type === 'call') node.args.forEach((arg) => collectVariables(arg, found));
  return found;
}

export interface ValidationResult {
  ok: boolean;
  message?: string;
}

// Non-throwing check for live editor feedback. The server re-validates on save;
// this only exists so the admin sees an error as they type.
export function validate(source: string, allowedVars: string[] = []): ValidationResult {
  if (source.trim() === '') return { ok: false, message: 'Formula is empty' };
  try {
    const ast = parse(source);
    const allowed = new Set(allowedVars);
    const unknown = [...collectVariables(ast)].filter((name) => !allowed.has(name));
    if (unknown.length > 0) {
      return {
        ok: false,
        message: `Unknown variable${unknown.length === 1 ? '' : 's'}: ${unknown.join(', ')}`,
      };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Invalid formula' };
  }
}

// Splits an expression into display tokens for the chip canvas. Unlike
// tokenize() this never throws: a half-typed formula must still render.
export function tokenizeForDisplay(source: string): Token[] {
  try {
    return tokenize(source);
  } catch {
    return [];
  }
}

// True when every parenthesis is matched — used to highlight stray parens in
// the canvas without running a full parse on every keystroke.
export function parensBalanced(source: string): boolean {
  let depth = 0;
  for (const token of tokenizeForDisplay(source)) {
    if (token.type === 'lparen') depth += 1;
    if (token.type === 'rparen') {
      depth -= 1;
      if (depth < 0) return false;
    }
  }
  return depth === 0;
}
