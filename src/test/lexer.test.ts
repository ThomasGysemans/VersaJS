import { assert } from 'chai';
import { Token, TokenType } from '../tokens.js';
import { getDefaultPos } from '../position.js';
import { Lexer } from '../lexer.js';

/**
 * @param values The tokens that were produced by the program.
 * @param expected The tokens that we expect to get from the program.
 */
const check_tokens = (values: Token<any>[], expected: Token<any>[]) => {
    for (let i = 0; i < expected.length; i++) {
        assert.strictEqual(values[i].type, expected[i].type);
        assert.strictEqual(values[i].value, expected[i].value);
    }
};

const new_token = (type: TokenType, value: any): Token<any> => new Token(type, value, getDefaultPos());

describe('Lexer tests', () => {
    it('should return EOF', () => {
        const tokens = Array.from(new Lexer("").generate_tokens());
        assert.strictEqual(tokens.length, 1); // EOF
    });

    it('should work with indentation', () => {
        const tokens = Array.from(new Lexer(" \t\t").generate_tokens());
        assert.strictEqual(tokens.length, 3); // EOF, INDENTATION, INDENTATION
    });

    it('should work with indentation (2)', () => {
        const tokens = Array.from(new Lexer("    var a = 5").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.INDENTATION, "\t"),
            new_token(TokenType.KEYWORD, "var"),
            new_token(TokenType.IDENTIFIER, "a"),
            new_token(TokenType.EQUALS, "="),
            new_token(TokenType.NUMBER, 5),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should return numbers', () => {
        const tokens = Array.from(new Lexer("123 123.456 123. .456").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.NUMBER, 123),
            new_token(TokenType.NUMBER, 123.456),
            new_token(TokenType.NUMBER, 123),
            new_token(TokenType.NUMBER, 0.456),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with aerated numbers', () => {
        const tokens = Array.from(new Lexer("100_000.567_123").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.NUMBER, 100_000.567_123)
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should return all operators', () => {
        const tokens = Array.from(new Lexer("+-*/**").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.PLUS, "+"),
            new_token(TokenType.MINUS, "-"),
            new_token(TokenType.MULTIPLY, "*"),
            new_token(TokenType.SLASH, "/"),
            new_token(TokenType.POWER, "**"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with power operations', () => {
        const tokens = Array.from(new Lexer("10 ** 2").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.NUMBER, 10),
            new_token(TokenType.POWER, "**"),
            new_token(TokenType.NUMBER, 2)
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with a list', () => {
        const tokens = Array.from(new Lexer("[2]").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.LSQUARE, "["),
            new_token(TokenType.NUMBER, 2),
            new_token(TokenType.RSQUARE,"]"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should return parenthesis', () => {
        const tokens = Array.from(new Lexer("()").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.LPAREN, "("),
            new_token(TokenType.RPAREN, ")"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with modulo', () => {
        const tokens = Array.from(new Lexer("(1+2) % (1+1)").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.LPAREN, "("),
            new_token(TokenType.NUMBER, 1),
            new_token(TokenType.PLUS, "+"),
            new_token(TokenType.NUMBER, 2),
            new_token(TokenType.RPAREN, ")"),
            new_token(TokenType.MODULO, "%"),
            new_token(TokenType.LPAREN, "("),
            new_token(TokenType.NUMBER, 1),
            new_token(TokenType.PLUS, "+"),
            new_token(TokenType.NUMBER, 1),
            new_token(TokenType.RPAREN, ")"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with bitwise shift operator (<<)', () => {
        const tokens = Array.from(new Lexer("256 << 2").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.NUMBER, 256),
            new_token(TokenType.BINARY_LEFT, "<<"),
            new_token(TokenType.NUMBER, 2),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with bitwise shift operator (>>)', () => {
        const tokens = Array.from(new Lexer("256 >> 2").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.NUMBER, 256),
            new_token(TokenType.BINARY_RIGHT, ">>"),
            new_token(TokenType.NUMBER, 2),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with bitwise shift operator (>>>)', () => {
        const tokens = Array.from(new Lexer("256 >>> 2").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.NUMBER, 256),
            new_token(TokenType.BINARY_UNSIGNED_RIGHT, ">>>"),
            new_token(TokenType.NUMBER, 2),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with random operations', () => {
        const tokens = Array.from(new Lexer("27 + (43 / 36 - 48) * 51").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.NUMBER, 27),
            new_token(TokenType.PLUS, "+"),
            new_token(TokenType.LPAREN, "("),
            new_token(TokenType.NUMBER, 43),
            new_token(TokenType.SLASH, "/"),
            new_token(TokenType.NUMBER, 36),
            new_token(TokenType.MINUS, "-"),
            new_token(TokenType.NUMBER, 48),
            new_token(TokenType.RPAREN, ")"),
            new_token(TokenType.MULTIPLY, "*"),
            new_token(TokenType.NUMBER, 51),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should return variable declaration', () => {
        const tokens = Array.from(new Lexer("var _Vari234_able = 1").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.KEYWORD, "var"),
            new_token(TokenType.IDENTIFIER, "_Vari234_able"),
            new_token(TokenType.EQUALS, "="),
            new_token(TokenType.NUMBER, 1)
        ];
        check_tokens(tokens, expected_tokens)
    });

    it('should return variable call', () => {
        const tokens = Array.from(new Lexer("_Vari234_able").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.IDENTIFIER, "_Vari234_able"),
        ];
        check_tokens(tokens, expected_tokens)
    });

    it('should return variable keywords', () => {
        const tokens = Array.from(new Lexer("not or and").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.KEYWORD, "not"),
            new_token(TokenType.KEYWORD, "or"),
            new_token(TokenType.KEYWORD, "and"),
        ];
        check_tokens(tokens, expected_tokens)
    });

    it('should return double equals', () => {
        const tokens = Array.from(new Lexer("1 == 1").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.NUMBER, 1),
            new_token(TokenType.DOUBLE_EQUALS, "=="),
            new_token(TokenType.NUMBER, 1),
        ];
        check_tokens(tokens, expected_tokens)
    });

    it('should return not equals', () => {
        const tokens = Array.from(new Lexer("1 != 1").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.NUMBER, 1),
            new_token(TokenType.NOT_EQUAL, "!="),
            new_token(TokenType.NUMBER, 1),
        ];
        check_tokens(tokens, expected_tokens)
    });

    it('should return less than', () => {
        const tokens = Array.from(new Lexer("1 < 1").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.NUMBER, 1),
            new_token(TokenType.LT, "<"),
            new_token(TokenType.NUMBER, 1),
        ];
        check_tokens(tokens, expected_tokens)
    });

    it('should return greater than', () => {
        const tokens = Array.from(new Lexer("1 > 1").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.NUMBER, 1),
            new_token(TokenType.GT, ">"),
            new_token(TokenType.NUMBER, 1),
        ];
        check_tokens(tokens, expected_tokens)
    });

    it('should return less than or equal', () => {
        const tokens = Array.from(new Lexer("1 <= 1").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.NUMBER, 1),
            new_token(TokenType.LTE, "<="),
            new_token(TokenType.NUMBER, 1),
        ];
        check_tokens(tokens, expected_tokens)
    });

    it('should return greater than or equal', () => {
        const tokens = Array.from(new Lexer("1 >= 1").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.NUMBER, 1),
            new_token(TokenType.GTE, ">="),
            new_token(TokenType.NUMBER, 1),
        ];
        check_tokens(tokens, expected_tokens)
    });

    it('should work with a nullish coalescing operator', () => {
        const tokens = Array.from(new Lexer("var a = none ?? 1").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.KEYWORD, "var"),
            new_token(TokenType.IDENTIFIER, "a"),
            new_token(TokenType.EQUALS, "="),
            new_token(TokenType.KEYWORD, "none"),
            new_token(TokenType.NULLISH_OPERATOR, "??"),
            new_token(TokenType.NUMBER, 1),
        ];
        check_tokens(tokens, expected_tokens)
    });

    it('should work with a newline', () => {
        const tokens = Array.from(new Lexer("var a = 1; var b = 2").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.KEYWORD, "var"),
            new_token(TokenType.IDENTIFIER, "a"),
            new_token(TokenType.EQUALS, "="),
            new_token(TokenType.NUMBER, 1),
            new_token(TokenType.SEMICOLON, ";"),
            new_token(TokenType.KEYWORD, "var"),
            new_token(TokenType.IDENTIFIER, "b"),
            new_token(TokenType.EQUALS, "="),
            new_token(TokenType.NUMBER, 2),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with the delete keyword', () => {
        const tokens = Array.from(new Lexer("delete variable").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.KEYWORD, "delete"),
            new_token(TokenType.IDENTIFIER, "variable"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with a list', () => {
        const tokens = Array.from(new Lexer("[1, 3]").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.LSQUARE, "["),
            new_token(TokenType.NUMBER, 1),
            new_token(TokenType.COMMA, ","),
            new_token(TokenType.NUMBER, 3),
            new_token(TokenType.RSQUARE, "]"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with a list (get an element in it)', () => {
        const tokens = Array.from(new Lexer("list[0]").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.IDENTIFIER, "list"),
            new_token(TokenType.LSQUARE, "["),
            new_token(TokenType.NUMBER, 0),
            new_token(TokenType.RSQUARE, "]"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with a list (set an element in it)', () => {
        const tokens = Array.from(new Lexer("list[] = 1").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.IDENTIFIER, "list"),
            new_token(TokenType.LSQUARE, "["),
            new_token(TokenType.RSQUARE, "]"),
            new_token(TokenType.EQUALS, "="),
            new_token(TokenType.NUMBER, 1),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with a list (binary selector)', () => {
        const tokens = Array.from(new Lexer("list[0:5] = 1").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.IDENTIFIER, "list"),
            new_token(TokenType.LSQUARE, "["),
            new_token(TokenType.NUMBER, 0),
            new_token(TokenType.COLON, ":"),
            new_token(TokenType.NUMBER, 5),
            new_token(TokenType.RSQUARE, "]"),
            new_token(TokenType.EQUALS, "="),
            new_token(TokenType.NUMBER, 1),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with a function', () => {
        const tokens = Array.from(new Lexer("func test(a, b?, c?=1) -> a").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.KEYWORD, "func"),
            new_token(TokenType.IDENTIFIER, "test"),
            new_token(TokenType.LPAREN, "("),
            new_token(TokenType.IDENTIFIER, "a"),
            new_token(TokenType.COMMA, ","),
            new_token(TokenType.IDENTIFIER, "b"),
            new_token(TokenType.QMARK, "?"),
            new_token(TokenType.COMMA, ","),
            new_token(TokenType.IDENTIFIER, "c"),
            new_token(TokenType.QMARK, "?"),
            new_token(TokenType.EQUALS, "="),
            new_token(TokenType.NUMBER, 1),
            new_token(TokenType.RPAREN, ")"),
            new_token(TokenType.ARROW, "->"),
            new_token(TokenType.IDENTIFIER, "a"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with incrementation', () => {
        const tokens = Array.from(new Lexer("5 + ++5").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.NUMBER, 5),
            new_token(TokenType.PLUS, "+"),
            new_token(TokenType.INC, "++"),
            new_token(TokenType.NUMBER, 5),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with incrementation (2nd test)', () => {
        const tokens = Array.from(new Lexer("++5 + 5").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.INC, "++"),
            new_token(TokenType.NUMBER, 5),
            new_token(TokenType.PLUS, "+"),
            new_token(TokenType.NUMBER, 5),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with decrementation', () => {
        const tokens = Array.from(new Lexer("5 - --5").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.NUMBER, 5),
            new_token(TokenType.MINUS, "-"),
            new_token(TokenType.DEC, "--"),
            new_token(TokenType.NUMBER, 5),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with decrementation (2nd test)', () => {
        const tokens = Array.from(new Lexer("--5 - 5").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.DEC, "--"),
            new_token(TokenType.NUMBER, 5),
            new_token(TokenType.MINUS, "-"),
            new_token(TokenType.NUMBER, 5),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with a dictionary', () => {
        const tokens = Array.from(new Lexer("{ 'yo': 5 }").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.LBRACK, "{"),
            new_token(TokenType.STRING, "yo"),
            new_token(TokenType.COLON, ":"),
            new_token(TokenType.NUMBER, 5),
            new_token(TokenType.RBRACK, "}"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with a foreach statement', () => {
        const tokens = Array.from(new Lexer("foreach variable as variable => variable").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.KEYWORD, "foreach"),
            new_token(TokenType.IDENTIFIER, "variable"),
            new_token(TokenType.KEYWORD, "as"),
            new_token(TokenType.IDENTIFIER, "variable"),
            new_token(TokenType.DOUBLE_ARROW, "=>"),
            new_token(TokenType.IDENTIFIER, "variable"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with a property call', () => {
        const tokens = Array.from(new Lexer("example.prop_").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.IDENTIFIER, "example"),
            new_token(TokenType.DOT, "."),
            new_token(TokenType.IDENTIFIER, "prop_"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with a static property call', () => {
        const tokens = Array.from(new Lexer("self::name").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.IDENTIFIER, "self"),
            new_token(TokenType.DOUBLE_COLON, "::"),
            new_token(TokenType.IDENTIFIER, "name"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with a property call (_._)', () => {
        const tokens = Array.from(new Lexer("example_._1_prop").generate_tokens()); // might return a number instead of a DOT, that's why
        const expected_tokens = [
            new_token(TokenType.IDENTIFIER, "example_"),
            new_token(TokenType.DOT, "."),
            new_token(TokenType.IDENTIFIER, "_1_prop"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with an instantiation', () => {
        const tokens = Array.from(new Lexer("var person = new Person()").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.KEYWORD, "var"),
            new_token(TokenType.IDENTIFIER, "person"),
            new_token(TokenType.EQUALS, "="),
            new_token(TokenType.KEYWORD, "new"),
            new_token(TokenType.IDENTIFIER, "Person"),
            new_token(TokenType.LPAREN, "("),
            new_token(TokenType.RPAREN, ")"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with triple dots', () => {
        const tokens = Array.from(new Lexer("(...args)").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.LPAREN, "("),
            new_token(TokenType.TRIPLE_DOTS, "..."),
            new_token(TokenType.IDENTIFIER, "args"),
            new_token(TokenType.RPAREN, ")"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with booleans', () => {
        const tokens = Array.from(new Lexer("true false yes no none").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.KEYWORD, "true"),
            new_token(TokenType.KEYWORD, "false"),
            new_token(TokenType.KEYWORD, "yes"),
            new_token(TokenType.KEYWORD, "no"),
            new_token(TokenType.KEYWORD, "none"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with logical operators (&, |, ^)', () => {
        const tokens = Array.from(new Lexer("& | ^").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.LOGICAL_AND, "&"),
            new_token(TokenType.LOGICAL_OR, "|"),
            new_token(TokenType.LOGICAL_XOR, "^"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with a binary NOT (~)', () => {
        const tokens = Array.from(new Lexer("~").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.BIN_NOT, "~"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with AND and OR as tokens (&&, ||)', () => {
        const tokens = Array.from(new Lexer("&& ||").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.AND, "&&"),
            new_token(TokenType.OR, "||"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with the optional chaining operator as a token (?.)', () => {
        const tokens = Array.from(new Lexer("example?.thing").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.IDENTIFIER, "example"),
            new_token(TokenType.OPTIONAL_CHAINING_OPERATOR, "?."),
            new_token(TokenType.IDENTIFIER, "thing"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with the optional static call (?::)', () => {
        const tokens = Array.from(new Lexer("example?::thing").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.IDENTIFIER, "example"),
            new_token(TokenType.OPTIONAL_STATIC_CALL, "?::"),
            new_token(TokenType.IDENTIFIER, "thing"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with the assignment of a type to an optional argument', () => {
        const tokens = Array.from(new Lexer("a?:number=5").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.IDENTIFIER, "a"),
            new_token(TokenType.QMARK, "?"),
            new_token(TokenType.COLON, ":"),
            new_token(TokenType.IDENTIFIER, "number"),
            new_token(TokenType.EQUALS, "="),
            new_token(TokenType.NUMBER, 5),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with an HTML element', () => {
        const tokens = Array.from(new Lexer("<div attr={5>5}>").generate_tokens());
        const expected_tokens = [
            new_token(TokenType.LCHEVRON, "<"),
            new_token(TokenType.IDENTIFIER, "div"),
            new_token(TokenType.IDENTIFIER, "attr"),
            new_token(TokenType.EQUALS, "="),
            new_token(TokenType.LBRACK, "{"),
            new_token(TokenType.NUMBER, 5),
            new_token(TokenType.GT, ">"),
            new_token(TokenType.NUMBER, 5),
            new_token(TokenType.RBRACK, "}"),
            new_token(TokenType.RCHEVRON, ">"),
        ];
        check_tokens(tokens, expected_tokens);
    });

    it('should work with a complex HTML architecture', () => {
        const tokens = Array.from(new Lexer(`
            <div> "yo"
                <div>
                    <div>
                <div>
            <div>
        `).generate_tokens());
        const expected_tokens = [
            new_token(TokenType.NEWLINE, "\n"),
            new_token(TokenType.INDENTATION, "\t"),
            new_token(TokenType.INDENTATION, "\t"),
            new_token(TokenType.INDENTATION, "\t"),
            new_token(TokenType.LCHEVRON, "<"),
            new_token(TokenType.IDENTIFIER, "div"),
            new_token(TokenType.RCHEVRON, ">"),
            new_token(TokenType.STRING, "yo"),
            new_token(TokenType.NEWLINE, "\n"),
            new_token(TokenType.INDENTATION, "\t"),
            new_token(TokenType.INDENTATION, "\t"),
            new_token(TokenType.INDENTATION, "\t"),
            new_token(TokenType.INDENTATION, "\t"),
            new_token(TokenType.LCHEVRON, "<"),
            new_token(TokenType.IDENTIFIER, "div"),
            new_token(TokenType.RCHEVRON, ">"),
            new_token(TokenType.NEWLINE, "\n"),
            new_token(TokenType.INDENTATION, "\t"),
            new_token(TokenType.INDENTATION, "\t"),
            new_token(TokenType.INDENTATION, "\t"),
            new_token(TokenType.INDENTATION, "\t"),
            new_token(TokenType.INDENTATION, "\t"),
            new_token(TokenType.LCHEVRON, "<"),
            new_token(TokenType.IDENTIFIER, "div"),
            new_token(TokenType.RCHEVRON, ">"),
            new_token(TokenType.NEWLINE, "\n"),
            new_token(TokenType.INDENTATION, "\t"),
            new_token(TokenType.INDENTATION, "\t"),
            new_token(TokenType.INDENTATION, "\t"),
            new_token(TokenType.INDENTATION, "\t"),
            new_token(TokenType.LCHEVRON, "<"),
            new_token(TokenType.IDENTIFIER, "div"),
            new_token(TokenType.RCHEVRON, ">"),
            new_token(TokenType.NEWLINE, "\n"),
            new_token(TokenType.INDENTATION, "\t"),
            new_token(TokenType.INDENTATION, "\t"),
            new_token(TokenType.INDENTATION, "\t"),
            new_token(TokenType.LCHEVRON, "<"),
            new_token(TokenType.IDENTIFIER, "div"),
            new_token(TokenType.RCHEVRON, ">"),
            new_token(TokenType.NEWLINE, "\n"),
            new_token(TokenType.INDENTATION, "\t"),
            new_token(TokenType.INDENTATION, "\t"),
            new_token(TokenType.EOF, "EOF"),
        ];
        check_tokens(tokens, expected_tokens);
    });
});