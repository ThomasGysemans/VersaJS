import assert from 'assert';
import { Token, TokenType } from '../tokens.js';
import { Lexer } from '../lexer.js';

// npm run test

describe('Lexer tests', () => {
    it('should return empty list', () => {
        const tokens = Array.from(new Lexer("").generate_tokens());
        assert.strictEqual(tokens.length, 0);
    });

    it('should return empty list', () => {
        const tokens = Array.from(new Lexer(" \t\n \r\n\n\t\t   ").generate_tokens());
        assert.strictEqual(tokens.length, 0);
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
        assert.deepStrictEqual(tokens, expected_tokens);
    });

    it('should work with aerated numbers', () => {
        const tokens = Array.from(new Lexer("100_000.567_123").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.NUMBER, 100_000.567_123)
        ];
        assert.deepStrictEqual(tokens, expected_tokens);
    });

    it('should return all operators', () => {
        const tokens = Array.from(new Lexer("+-*/").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.PLUS),
            new Token(TokenType.MINUS),
            new Token(TokenType.MULTIPLY),
            new Token(TokenType.DIVIDE),
        ];
        assert.deepStrictEqual(tokens, expected_tokens);
    });

    it('should work with power operations', () => {
        const tokens = Array.from(new Lexer("10 ^ 2").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.NUMBER, 10),
            new Token(TokenType.POWER),
            new Token(TokenType.NUMBER, 2)
        ];
        assert.deepStrictEqual(tokens, expected_tokens);
    });

    it('should return parenthesis', () => {
        const tokens = Array.from(new Lexer("()").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.LPAREN),
            new Token(TokenType.RPAREN),
        ];
        assert.deepStrictEqual(tokens, expected_tokens);
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
        assert.deepStrictEqual(tokens, expected_tokens);
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
        assert.deepStrictEqual(tokens, expected_tokens);
    });
});