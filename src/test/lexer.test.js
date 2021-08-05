import assert from 'assert';
import { Token, TokenType } from '../tokens.js';
import { Lexer } from '../lexer.js';

// npm run test ./test/lexer.test.js

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
    it('should return EOF', () => {
        const tokens = Array.from(new Lexer("").generate_tokens());
        assert.strictEqual(tokens.length, 1); // EOF
    });

    it('should return EOF', () => {
        const tokens = Array.from(new Lexer(" \t\t").generate_tokens());
        assert.strictEqual(tokens.length, 1); // EOF
    });

    it('should return numbers', () => {
        const tokens = Array.from(new Lexer("123 123.456 123. .456").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.NUMBER, 123),
            new Token(TokenType.NUMBER, 123.456),
            new Token(TokenType.NUMBER, 123),
            new Token(TokenType.NUMBER, 0.456),
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
        const tokens = Array.from(new Lexer("+-*/**").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.PLUS),
            new Token(TokenType.MINUS),
            new Token(TokenType.MULTIPLY),
            new Token(TokenType.DIVIDE),
            new Token(TokenType.POWER),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with power operations', () => {
        const tokens = Array.from(new Lexer("10 ** 2").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.NUMBER, 10),
            new Token(TokenType.POWER),
            new Token(TokenType.NUMBER, 2)
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with power operations (list)', () => {
        const tokens = Array.from(new Lexer("[2] ** 2").generate_tokens());
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

    it('should work with bitwise shift operator (<<)', () => {
        const tokens = Array.from(new Lexer("256 << 2").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.NUMBER, 256),
            new Token(TokenType.BINARY_LEFT),
            new Token(TokenType.NUMBER, 2),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with bitwise shift operator (>>)', () => {
        const tokens = Array.from(new Lexer("256 >> 2").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.NUMBER, 256),
            new Token(TokenType.BINARY_RIGHT),
            new Token(TokenType.NUMBER, 2),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with bitwise shift operator (>>>)', () => {
        const tokens = Array.from(new Lexer("256 >>> 2").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.NUMBER, 256),
            new Token(TokenType.BINARY_UNSIGNED_RIGHT),
            new Token(TokenType.NUMBER, 2),
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

    it('should work with a nullish coalescing operator', () => {
        const tokens = Array.from(new Lexer("var a = none ?? 1").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.KEYWORD, "var"),
            new Token(TokenType.IDENTIFIER, "a"),
            new Token(TokenType.EQUALS),
            new Token(TokenType.KEYWORD, "none"),
            new Token(TokenType.NULLISH_OPERATOR),
            new Token(TokenType.NUMBER, 1),
        ];
        check_tokens(tokens, expected_tokens)
    });

    it('should work with a newline', () => {
        const tokens = Array.from(new Lexer("var a = 1; var b = 2").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.KEYWORD, "var"),
            new Token(TokenType.IDENTIFIER, "a"),
            new Token(TokenType.EQUALS),
            new Token(TokenType.NUMBER, 1),
            new Token(TokenType.SEMICOLON),
            new Token(TokenType.KEYWORD, "var"),
            new Token(TokenType.IDENTIFIER, "b"),
            new Token(TokenType.EQUALS),
            new Token(TokenType.NUMBER, 2),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with the delete keyword', () => {
        const tokens = Array.from(new Lexer("delete variable").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.KEYWORD, "delete"),
            new Token(TokenType.IDENTIFIER, "variable"),
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
            new Token(TokenType.COLON),
            new Token(TokenType.NUMBER, 5),
            new Token(TokenType.RSQUARE),
            new Token(TokenType.EQUALS),
            new Token(TokenType.NUMBER, 1),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with a function', () => {
        const tokens = Array.from(new Lexer("func test(a, b?, c?=1) -> a").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.KEYWORD, "func"),
            new Token(TokenType.IDENTIFIER, "test"),
            new Token(TokenType.LPAREN),
            new Token(TokenType.IDENTIFIER, "a"),
            new Token(TokenType.COMMA),
            new Token(TokenType.IDENTIFIER, "b"),
            new Token(TokenType.QMARK),
            new Token(TokenType.COMMA),
            new Token(TokenType.IDENTIFIER, "c"),
            new Token(TokenType.QMARK),
            new Token(TokenType.EQUALS),
            new Token(TokenType.NUMBER, 1),
            new Token(TokenType.RPAREN),
            new Token(TokenType.ARROW),
            new Token(TokenType.IDENTIFIER, "a"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with incrementation', () => {
        const tokens = Array.from(new Lexer("5 + ++5").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.NUMBER, 5),
            new Token(TokenType.PLUS),
            new Token(TokenType.INC),
            new Token(TokenType.NUMBER, 5),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with incrementation (2nd test)', () => {
        const tokens = Array.from(new Lexer("++5 + 5").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.INC),
            new Token(TokenType.NUMBER, 5),
            new Token(TokenType.PLUS),
            new Token(TokenType.NUMBER, 5),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with decrementation', () => {
        const tokens = Array.from(new Lexer("5 - --5").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.NUMBER, 5),
            new Token(TokenType.MINUS),
            new Token(TokenType.DEC),
            new Token(TokenType.NUMBER, 5),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with decrementation (2nd test)', () => {
        const tokens = Array.from(new Lexer("--5 - 5").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.DEC),
            new Token(TokenType.NUMBER, 5),
            new Token(TokenType.MINUS),
            new Token(TokenType.NUMBER, 5),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with a dictionnary', () => {
        const tokens = Array.from(new Lexer("{ 'yo': 5 }").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.LBRACK),
            new Token(TokenType.STRING, "yo"),
            new Token(TokenType.COLON),
            new Token(TokenType.NUMBER, 5),
            new Token(TokenType.RBRACK),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with a foreach statement', () => {
        const tokens = Array.from(new Lexer("foreach variable as variable => variable").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.KEYWORD, "foreach"),
            new Token(TokenType.IDENTIFIER, "variable"),
            new Token(TokenType.KEYWORD, "as"),
            new Token(TokenType.IDENTIFIER, "variable"),
            new Token(TokenType.DOUBLE_ARROW),
            new Token(TokenType.IDENTIFIER, "variable"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with a property call', () => {
        const tokens = Array.from(new Lexer("example.prop").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.IDENTIFIER, "example"),
            new Token(TokenType.DOT),
            new Token(TokenType.IDENTIFIER, "prop"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with a static property call', () => {
        const tokens = Array.from(new Lexer("self::name").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.IDENTIFIER, "self"),
            new Token(TokenType.DOUBLE_COLON),
            new Token(TokenType.IDENTIFIER, "name"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with a property call (_._)', () => {
        const tokens = Array.from(new Lexer("example_._1_prop").generate_tokens()); // might return a number instead of a DOT, that's why
        const expected_tokens = [
            new Token(TokenType.IDENTIFIER, "example_"),
            new Token(TokenType.DOT),
            new Token(TokenType.IDENTIFIER, "_1_prop"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with an instantiation', () => {
        const tokens = Array.from(new Lexer("var person = new Person()").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.KEYWORD, "var"),
            new Token(TokenType.IDENTIFIER, "person"),
            new Token(TokenType.EQUALS),
            new Token(TokenType.KEYWORD, "new"),
            new Token(TokenType.IDENTIFIER, "Person"),
            new Token(TokenType.LPAREN),
            new Token(TokenType.RPAREN),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with triple dots', () => {
        const tokens = Array.from(new Lexer("(...args)").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.LPAREN),
            new Token(TokenType.TRIPLE_DOTS),
            new Token(TokenType.IDENTIFIER, "args"),
            new Token(TokenType.RPAREN),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with booleans', () => {
        const tokens = Array.from(new Lexer("true false yes no none").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.KEYWORD, "true"),
            new Token(TokenType.KEYWORD, "false"),
            new Token(TokenType.KEYWORD, "yes"),
            new Token(TokenType.KEYWORD, "no"),
            new Token(TokenType.KEYWORD, "none"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with logical operators (&, |, ^)', () => {
        const tokens = Array.from(new Lexer("& | ^").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.LOGICAL_AND),
            new Token(TokenType.LOGICAL_OR),
            new Token(TokenType.LOGICAL_XOR),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with a binary NOT (~)', () => {
        const tokens = Array.from(new Lexer("~").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.BIN_NOT),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with AND and OR as tokens (&&, ||)', () => {
        const tokens = Array.from(new Lexer("&& ||").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.AND),
            new Token(TokenType.OR),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with the optional chaining operator as a token (?.)', () => {
        const tokens = Array.from(new Lexer("example?.thing").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.IDENTIFIER, "example"),
            new Token(TokenType.OPTIONAL_CHAINING_OPERATOR),
            new Token(TokenType.IDENTIFIER, "thing"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with the optional static call (?::)', () => {
        const tokens = Array.from(new Lexer("example?::thing").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.IDENTIFIER, "example"),
            new Token(TokenType.OPTIONAL_STATIC_CALL),
            new Token(TokenType.IDENTIFIER, "thing"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with the assignment of a type to an optional argument', () => {
        const tokens = Array.from(new Lexer("a?:number=5").generate_tokens());
        const expected_tokens = [
            new Token(TokenType.IDENTIFIER, "a"),
            new Token(TokenType.QMARK),
            new Token(TokenType.COLON),
            new Token(TokenType.IDENTIFIER, "number"),
            new Token(TokenType.EQUALS),
            new Token(TokenType.NUMBER, 5),
        ];
        check_tokens(tokens, expected_tokens);
    });
});