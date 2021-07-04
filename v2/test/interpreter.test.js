import assert from 'assert';
import { NumberNode, AddNode, SubtractNode, MultiplyNode, DivideNode, PowerNode, ModuloNode, VarAssignNode, VarModifyNode, ElseAssignmentNode, ListNode, ListAccessNode, PrefixOperationNode } from '../nodes.js';
import { ListValue, NumberValue } from '../values.js';
import { Interpreter } from '../interpreter.js';
import { Token, TokenType } from '../tokens.js'; // ok
import { Context } from '../context.js'; // ok
import global_symbol_table from '../symbol_table.js'; // ok

const context = new Context('<program>'); // the context will get modified by visiting the different user's actions.
context.symbol_table = global_symbol_table;

describe('Interpreter', () => {
    it('should work with numbers', () => {
        const value = new Interpreter().visit(new NumberNode(new Token(TokenType.NUMBER, 51.2)), context);
        assert.deepStrictEqual(value.value, new NumberValue(51.2).set_context(context));
    });

    it('should work with an addition', () => {
        const value = new Interpreter().visit(new AddNode(new NumberNode(new Token(TokenType.NUMBER, 27)), new NumberNode(new Token(TokenType.NUMBER, 14))), context);
        assert.deepStrictEqual(value.value, new NumberValue(41).set_context(context));
    });

    it('should work with a subtract', () => {
        const value = new Interpreter().visit(new SubtractNode(new NumberNode(new Token(TokenType.NUMBER, 27)), new NumberNode(new Token(TokenType.NUMBER, 14))), context);
        assert.deepStrictEqual(value.value, new NumberValue(13).set_context(context));
    });

    it('should work with a multiplication', () => {
        const value = new Interpreter().visit(new MultiplyNode(new NumberNode(new Token(TokenType.NUMBER, 27)), new NumberNode(new Token(TokenType.NUMBER, 14))), context);
        assert.deepStrictEqual(value.value, new NumberValue(378).set_context(context));
    });

    it('should work with a power', () => {
        const value = new Interpreter().visit(new PowerNode(new NumberNode(new Token(TokenType.NUMBER, 10)), new NumberNode(new Token(TokenType.NUMBER, 0))), context);
        assert.deepStrictEqual(value.value, new NumberValue(1).set_context(context));
    });

    it('should work with a divison', () => {
        const value = new Interpreter().visit(new DivideNode(new NumberNode(new Token(TokenType.NUMBER, 10)), new NumberNode(new Token(TokenType.NUMBER, 5))), context);
        assert.deepStrictEqual(value.value, new NumberValue(2).set_context(context));
    });

    it('should work with a modulo', () => {
        const value = new Interpreter().visit(new ModuloNode(new NumberNode(new Token(TokenType.NUMBER, 9)), new NumberNode(new Token(TokenType.NUMBER, 2))), context);
        assert.deepStrictEqual(value.value, new NumberValue(1).set_context(context));
    });

    it('should work with a prefix operation (before)', () => {
        const value = new Interpreter().visit(new PrefixOperationNode(new NumberNode(new Token(TokenType.NUMBER, 9)), 1), context);
        assert.deepStrictEqual(value.value, new NumberValue(10).set_context(context));
    });
    
    it('should raise an exception with division by 0', () => {
        try {
            const value = new Interpreter().visit(new DivideNode(new NumberNode(new Token(TokenType.NUMBER, 10)), new NumberNode(new Token(TokenType.NUMBER, 0))), context);
        } catch(e) {
            assert.strictEqual(true, true);
        }
    });

    it('should work with a full expression', () => {
        const tree = new AddNode(new NumberNode(new Token(TokenType.NUMBER, 27)),
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
        );

        const result = new Interpreter().visit(tree, context);
        assert.deepStrictEqual(result.value, new NumberValue(-2166).set_context(context));
    });

    it('should work with an assignment to a variable', () => {
        const tree = new VarAssignNode(
            new Token(TokenType.IDENTIFIER, "list"),
            new NumberNode(new Token(TokenType.NUMBER, 1))
        );
        const result = new Interpreter().visit(tree, context);
        assert.deepStrictEqual(result.value, new NumberValue(1).set_context(context));
    });

    it('should work with a modification of a variable', () => {
        const tree = new VarModifyNode(
            new Token(TokenType.IDENTIFIER, "list"),
            new NumberNode(new Token(TokenType.NUMBER, 1))
        );
        const result = new Interpreter().visit(tree, context);
        assert.deepStrictEqual(result.value, new NumberValue(1).set_context(context));
    });

    it('should work with an else operator (??)', () => {
        const tree = new ElseAssignmentNode(
            new NumberNode(new Token(TokenType.NUMBER, 0)),
            new NumberNode(new Token(TokenType.NUMBER, 1))
        );
        const result = new Interpreter().visit(tree, context);
        assert.deepStrictEqual(result.value, new NumberValue(1).set_context(context));
    });

    it('should work with a list', () => {
        const tree = new ListNode(
            [
                new NumberNode(new Token(TokenType.NUMBER, 0)),
                new NumberNode(new Token(TokenType.NUMBER, 1))
            ],
            null,
            null,
        );
        const result = new Interpreter().visit(tree, context);
        const expected = [
            new NumberValue(0),
            new NumberValue(1)
        ];
        var i = 0;
        if (result.value instanceof ListValue) {
            for (let el of result.value.elements) {
                if (el instanceof NumberValue) {
                    assert.strictEqual(el.value, expected[i].value);
                } else {
                    assert.strictEqual(NumberValue, false);
                }
                i++;
            }
        } else {
            assert.strictEqual(ListValue, false);
        }
    });
});
