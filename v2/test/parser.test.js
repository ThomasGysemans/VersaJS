import assert from 'assert';
import { Lexer } from '../lexer.js';
import { Parser } from '../parser.js';
import { AddNode, AndNode, DivideNode, ModuloNode, MultiplyNode, NotNode, NumberNode, OrNode, PowerNode, SubtractNode, VarAssignNode, EqualsNode, LessThanNode, GreaterThanNode, LessThanOrEqualNode, GreaterThanOrEqualNode, NotEqualsNode, ElseAssignmentNode, ListNode, ListAccessNode, ListAssignmentNode, FuncDefNode, CallNode, PrefixOperationNode, PostfixOperationNode, DictionnaryNode } from '../nodes.js';

// npm run test

describe('Parser tests', () => {
    it('should return numbers', () => {
        const tokens = new Lexer("100_000.2").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof NumberNode);
        // new NumberNode(new Token(TokenType.NUMBER, 100_000.2))
    });

    it('should work with an addition', () => {
        const tokens = new Lexer("27 + 14 + 8").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof AddNode);
        // new AddNode(new NumberNode(new Token(TokenType.NUMBER, 27)), new NumberNode(new Token(TokenType.NUMBER, 14)))
    });

    it('should work with a subtraction', () => {
        const tokens = new Lexer("27 - 14").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof SubtractNode);
        // new SubtractNode(new NumberNode(new Token(TokenType.NUMBER, 27)), new NumberNode(new Token(TokenType.NUMBER, 14)))
    });

    it('should work with a multiplication', () => {
        const tokens = new Lexer("27 * 14").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof MultiplyNode);
        // new MultiplyNode(new NumberNode(new Token(TokenType.NUMBER, 27)), new NumberNode(new Token(TokenType.NUMBER, 14)))
    });

    it('should work with a division', () => {
        const tokens = new Lexer("27 / 14").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof DivideNode);
        // new DivideNode(new NumberNode(new Token(TokenType.NUMBER, 27)), new NumberNode(new Token(TokenType.NUMBER, 14)))
    });

    it('should work with a modulo', () => {
        const tokens = new Lexer("27 % 14").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof ModuloNode);
        // new ModuloNode(new NumberNode(new Token(TokenType.NUMBER, 27)), new NumberNode(new Token(TokenType.NUMBER, 14)))
    });

    it('should work with a power', () => {
        const tokens = new Lexer("27 ^ 14").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof PowerNode);
        // new PowerNode(new NumberNode(new Token(TokenType.NUMBER, 27)), new NumberNode(new Token(TokenType.NUMBER, 14)))
    });

    it('should work with a power (list)', () => {
        const tokens = new Lexer("[2] ^ 14").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof PowerNode);
    });

    it('should work with a complex power', () => {
        const tokens = new Lexer("(1 + 2) ^ (1 + 2)").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof PowerNode);
        if (node.element_nodes[0] instanceof PowerNode) {
            assert.deepStrictEqual(true, node.element_nodes[0].node_a instanceof AddNode);
            assert.deepStrictEqual(true, node.element_nodes[0].node_b instanceof AddNode);
        }
        /* new PowerNode(
            new AddNode(
                new NumberNode(new Token(TokenType.NUMBER, 1)),
                new NumberNode(new Token(TokenType.NUMBER, 2))
            ),
            new AddNode(
                new NumberNode(new Token(TokenType.NUMBER, 1)),
                new NumberNode(new Token(TokenType.NUMBER, 2))
            ),
        )
        */
    });

    it('should work with a full expression', () => {
        const tokens = new Lexer("27 + (43 / 36 - 48) * 51").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof AddNode);
        /* new AddNode(new NumberNode(new Token(TokenType.NUMBER, 27)),
            new MultiplyNode(
                new SubtractNode(
                    new DivideNode(
                        new NumberNode(new Token(TokenType.NUMBER, 10)),
                        new NumberNode(new Token(TokenType.NUMBER, 2))
                    ),
                    new NumberNode(new Token(TokenType.NUMBER, 48))
                ),
                new NumberNode(new Token(TokenType.NUMBER, 51))
            )
        )
        */
    });

    it('should return a variable declaration', () => {
        const tokens = new Lexer("var abc = 18").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof VarAssignNode);
    });

    it('should return an and node', () => {
        const tokens = new Lexer("(1+2) and 3").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof AndNode);
    });

    it('should return an or node', () => {
        const tokens = new Lexer("(1+2) or 3").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof OrNode);
    });

    it('should return an not node', () => {
        const tokens = new Lexer("not 1").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof NotNode);
    });

    it('should work with ==', () => {
        const tokens = new Lexer("1 == 1").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof EqualsNode);
    });

    it('should work with !=', () => {
        const tokens = new Lexer("1 != 1").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof NotEqualsNode);
    });

    it('should work with <', () => {
        const tokens = new Lexer("1 < 1").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof LessThanNode);
    });

    it('should work with >', () => {
        const tokens = new Lexer("1 > 1").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof GreaterThanNode);
    });

    it('should work with <=', () => {
        const tokens = new Lexer("1 <= 1").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof LessThanOrEqualNode);
    });

    it('should work with >=', () => {
        const tokens = new Lexer("1 >= 1").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof GreaterThanOrEqualNode);
    });

    it('should work with ??', () => {
        const tokens = new Lexer("1 ?? 0").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof ElseAssignmentNode);
    });

    it('should work with a list', () => {
        const tokens = new Lexer("[1, 3]").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof ListNode);
    });

    it('should work with a list (getter)', () => {
        const tokens = new Lexer("list[0][0]").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof ListAccessNode);
    });

    it('should work with a list (setter)', () => {
        const tokens = new Lexer("list[0][0] = 1").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof ListAssignmentNode);
    });

    it('should work with a function (def)', () => {
        const tokens = new Lexer("func test(a, b?, c?=1) -> a").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof FuncDefNode);
    });

    it('should work with a function (call)', () => {
        const tokens = new Lexer("func test(a, b?, c?=1) -> a; test(1, 1, 1)").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[1] instanceof CallNode);
    });

    it('should work with a prefix operation (before)', () => {
        const tokens = new Lexer("var a = 5; ++a").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[1] instanceof PrefixOperationNode);
    });

    it('should work with a postifx operation (after)', () => {
        const tokens = new Lexer("var a = 5; a++").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[1] instanceof PostfixOperationNode);
    });

    it('should work with a dictionnary (empty)', () => {
        const tokens = new Lexer("{}").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof DictionnaryNode);
    });

    it('should work with a dictionnary', () => {
        const tokens = new Lexer("{ 'yo': 5, 'test': 'hello' }").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof DictionnaryNode);
    });
});