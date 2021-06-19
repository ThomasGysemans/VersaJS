import assert from 'assert';
import { Token, TokenType } from '../tokens.js';
import { Lexer } from '../lexer.js';
import { Parser } from '../parser.js';
import { AddNode, DivideNode, MultiplyNode, NumberNode, PowerNode, SubtractNode } from '../nodes.js';

// npm run test

describe('Parser tests', () => {
    it('should be null', () => {
        const tokens = new Lexer("").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.strictEqual(node, null);
    });

    it('should return numbers', () => {
        const tokens = new Lexer("51.2").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(node, new NumberNode(51.2));
    });

    it('should work with an addition', () => {
        const tokens = new Lexer("27 + 14").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(node, new AddNode(new NumberNode(27), new NumberNode(14)));
    });

    it('should work with a subtraction', () => {
        const tokens = new Lexer("27 - 14").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(node, new SubtractNode(new NumberNode(27), new NumberNode(14)));
    });

    it('should work with a multiplication', () => {
        const tokens = new Lexer("27 * 14").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(node, new MultiplyNode(new NumberNode(27), new NumberNode(14)));
    });

    it('should work with a division', () => {
        const tokens = new Lexer("27 / 14").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(node, new DivideNode(new NumberNode(27), new NumberNode(14)));
    });

    it('should work with a power', () => {
        const tokens = new Lexer("27 ^ 14").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(node, new PowerNode(new NumberNode(27), new NumberNode(14)));
    });

    it('should work with a complex power', () => {
        const tokens = new Lexer("(1 + 2) ^ (1 + 2)").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(node, new PowerNode(
            new AddNode(
                new NumberNode(1),
                new NumberNode(2)
            ),
            new AddNode(
                new NumberNode(1),
                new NumberNode(2)
            ),
        ));
    });

    it('should work with a full expression', () => {
        const tokens = new Lexer("27 + (43 / 36 - 48) * 51").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(node, new AddNode(new NumberNode(27),
            new MultiplyNode(
                new SubtractNode(
                    new DivideNode(
                        new NumberNode(43),
                        new NumberNode(36)
                    ),
                    new NumberNode(48)
                ),
                new NumberNode(51)
            )
        ));
    });
});