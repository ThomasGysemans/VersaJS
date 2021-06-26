import assert from 'assert';
import { Token, TokenType } from '../tokens.js';
import { Lexer } from '../lexer.js';

// npm run test

/**
 * @param {Token[]} values
 * @param {Token[]} expected
 */
const check_tokens = (values, expected) => {
    for (let i = 0; i < expected.length; i++) {
        assert.strictEqual(values[i].type, expected[i].type);
        assert.strictEqual(values[i].value, expected[i].value);
    }
};

describe('Lexer tests', () => {
    it('should return empty list', () => {
        const tokens = Array.from(new Lexer("").generate_tokens());
        assert.strictEqual(tokens.length, 1); // EOF
    });

    it('should return empty list', () => {
        const tokens = Array.from(new Lexer(" \t\t").generate_tokens());
        assert.strictEqual(tokens.length, 1); // EOF
    });

    it('should return numbers', () => {
        const tokens = Array.from(new Lexer("123 123.456 123. .456 .").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.NUMBER, 123),
            new Token(TokenType.NUMBER, 123.456),
            new Token(TokenType.NUMBER, 123),
            new Token(TokenType.NUMBER, 0.456),
            new Token(TokenType.NUMBER, 0),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with aerated numbers', () => {
        const tokens = Array.from(new Lexer("100_000.567_123").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.NUMBER, 100_000.567_123)
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should return all operators', () => {
        const tokens = Array.from(new Lexer("+-*/").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.PLUS),
            new Token(TokenType.MINUS),
            new Token(TokenType.MULTIPLY),
            new Token(TokenType.DIVIDE),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with power operations', () => {
        const tokens = Array.from(new Lexer("10 ^ 2").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.NUMBER, 10),
            new Token(TokenType.POWER),
            new Token(TokenType.NUMBER, 2)
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with power operations (list)', () => {
        const tokens = Array.from(new Lexer("[2] ^ 2").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.LSQUARE),
            new Token(TokenType.NUMBER, 2),
            new Token(TokenType.RSQUARE),
            new Token(TokenType.POWER),
            new Token(TokenType.NUMBER, 2)
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should return parenthesis', () => {
        const tokens = Array.from(new Lexer("()").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.LPAREN),
            new Token(TokenType.RPAREN),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with modulo', () => {
        const tokens = Array.from(new Lexer("(1+2) % (1+1)").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.LPAREN),
            new Token(TokenType.NUMBER, 1),
            new Token(TokenType.PLUS),
            new Token(TokenType.NUMBER, 2),
            new Token(TokenType.RPAREN),
            new Token(TokenType.MODULO),
            new Token(TokenType.LPAREN),
            new Token(TokenType.NUMBER, 1),
            new Token(TokenType.PLUS),
            new Token(TokenType.NUMBER, 1),
            new Token(TokenType.RPAREN),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with random operations', () => {
        const tokens = Array.from(new Lexer("27 + (43 / 36 - 48) * 51").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.NUMBER, 27),
            new Token(TokenType.PLUS),
            new Token(TokenType.LPAREN),
            new Token(TokenType.NUMBER, 43),
            new Token(TokenType.DIVIDE),
            new Token(TokenType.NUMBER, 36),
            new Token(TokenType.MINUS),
            new Token(TokenType.NUMBER, 48),
            new Token(TokenType.RPAREN),
            new Token(TokenType.MULTIPLY),
            new Token(TokenType.NUMBER, 51),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should return variable declaration', () => {
        const tokens = Array.from(new Lexer("var _Vari234_able = 1").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.KEYWORD, "var"),
            new Token(TokenType.IDENTIFIER, "_Vari234_able"),
            new Token(TokenType.EQUALS),
            new Token(TokenType.NUMBER, 1)
        ];
        check_tokens(tokens, expected_tokens)
    });

    it('should return variable call', () => {
        const tokens = Array.from(new Lexer("_Vari234_able").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.IDENTIFIER, "_Vari234_able"),
        ];
        check_tokens(tokens, expected_tokens)
    });

    it('should return variable keywords', () => {
        const tokens = Array.from(new Lexer("not or and").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.KEYWORD, "not"),
            new Token(TokenType.KEYWORD, "or"),
            new Token(TokenType.KEYWORD, "and"),
        ];
        check_tokens(tokens, expected_tokens)
    });

    it('should return double equals', () => {
        const tokens = Array.from(new Lexer("1 == 1").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.NUMBER, 1),
            new Token(TokenType.DOUBLE_EQUALS),
            new Token(TokenType.NUMBER, 1),
        ];
        check_tokens(tokens, expected_tokens)
    });

    it('should return not equals', () => {
        const tokens = Array.from(new Lexer("1 != 1").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.NUMBER, 1),
            new Token(TokenType.NOT_EQUAL),
            new Token(TokenType.NUMBER, 1),
        ];
        check_tokens(tokens, expected_tokens)
    });

    it('should return less than', () => {
        const tokens = Array.from(new Lexer("1 < 1").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.NUMBER, 1),
            new Token(TokenType.LT),
            new Token(TokenType.NUMBER, 1),
        ];
        check_tokens(tokens, expected_tokens)
    });

    it('should return greater than', () => {
        const tokens = Array.from(new Lexer("1 > 1").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.NUMBER, 1),
            new Token(TokenType.GT),
            new Token(TokenType.NUMBER, 1),
        ];
        check_tokens(tokens, expected_tokens)
    });

    it('should return less than or equal', () => {
        const tokens = Array.from(new Lexer("1 <= 1").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.NUMBER, 1),
            new Token(TokenType.LTE),
            new Token(TokenType.NUMBER, 1),
        ];
        check_tokens(tokens, expected_tokens)
    });

    it('should return greater than or equal', () => {
        const tokens = Array.from(new Lexer("1 >= 1").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.NUMBER, 1),
            new Token(TokenType.GTE),
            new Token(TokenType.NUMBER, 1),
        ];
        check_tokens(tokens, expected_tokens)
    });

    it('should work with an else assignment', () => {
        const tokens = Array.from(new Lexer("var a = 0 ?? 1").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.KEYWORD, "var"),
            new Token(TokenType.IDENTIFIER, "a"),
            new Token(TokenType.EQUALS),
            new Token(TokenType.NUMBER, 0),
            new Token(TokenType.ELSE_ASSIGN),
            new Token(TokenType.NUMBER, 1),
        ];
        check_tokens(tokens, expected_tokens)
    });

    it('should work with newlines', () => {
        const tokens = Array.from(new Lexer("var a = 1; var b = 2").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.KEYWORD, "var"),
            new Token(TokenType.IDENTIFIER, "a"),
            new Token(TokenType.EQUALS),
            new Token(TokenType.NUMBER, 1),
            new Token(TokenType.NEWLINE),
            new Token(TokenType.KEYWORD, "var"),
            new Token(TokenType.IDENTIFIER, "b"),
            new Token(TokenType.EQUALS),
            new Token(TokenType.NUMBER, 2),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with a list', () => {
        const tokens = Array.from(new Lexer("[1, 3]").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.LSQUARE),
            new Token(TokenType.NUMBER, 1),
            new Token(TokenType.COMMA),
            new Token(TokenType.NUMBER, 3),
            new Token(TokenType.RSQUARE),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with a list (get an element in it)', () => {
        const tokens = Array.from(new Lexer("list[0]").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.IDENTIFIER, "list"),
            new Token(TokenType.LSQUARE),
            new Token(TokenType.NUMBER, 0),
            new Token(TokenType.RSQUARE),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with a list (set an element in it)', () => {
        const tokens = Array.from(new Lexer("list[] = 1").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.IDENTIFIER, "list"),
            new Token(TokenType.LSQUARE),
            new Token(TokenType.RSQUARE),
            new Token(TokenType.EQUALS),
            new Token(TokenType.NUMBER, 1),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with a list (binary selector)', () => {
        const tokens = Array.from(new Lexer("list[0:5] = 1").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.IDENTIFIER, "list"),
            new Token(TokenType.LSQUARE),
            new Token(TokenType.NUMBER, 0),
            new Token(TokenType.SEMICOLON),
            new Token(TokenType.NUMBER, 5),
            new Token(TokenType.RSQUARE),
            new Token(TokenType.EQUALS),
            new Token(TokenType.NUMBER, 1),
        ];
        check_tokens(tokens, expected_tokens);
    });
});