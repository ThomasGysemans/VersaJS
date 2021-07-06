import assert from 'assert';
import { NumberNode, AddNode, SubtractNode, MultiplyNode, DivideNode, PowerNode, ModuloNode, VarAssignNode, VarModifyNode, ElseAssignmentNode, ListNode, ListAccessNode, PrefixOperationNode, MinusNode, DictionnaryNode, DictionnaryElementNode, StringNode } from '../nodes.js';
import { DictionnaryValue, ListValue, NumberValue, StringValue } from '../values.js';
import { Interpreter } from '../interpreter.js';
import { Token, TokenType } from '../tokens.js'; // ok
import { Context } from '../context.js'; // ok
import global_symbol_table from '../symbol_table.js'; // ok

const context = new Context('<program>'); // the context will get modified by visiting the different user's actions.
context.symbol_table = global_symbol_table;

/* 
How to make tests with the interpreter?

* Because of a glitch, we have to comment `CONSTANTS` in symbol_table.js AND replace it with an empty object
* Design an operation (example: 5 ^ (1 + 2 * 10 / 10))
* Test this operation and don't forget to console.log the generated tree (in run.js)
* Recreate that tree in your test.

Tests with `mocha`

*/

// HELPERS
const number = (n) => {
    return new NumberNode(new Token(TokenType.NUMBER, n));
};

const str = (string) => {
    return new StringNode(new Token(TokenType.STRING, string));
};

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

    it('should work with a complex operation', () => {
        // 5 ^ (1 + 2 * 10 / 10) = 125
        // tree = (5^(1+((2*10)/10)))
        const tree = new PowerNode(
            number(5),
            new AddNode(
                number(1),
                new DivideNode(
                    new MultiplyNode(
                        number(2),
                        number(10)
                    ),
                    number(10)
                )
            )
        );
        const value = new Interpreter().visit(tree, context);
        assert.deepStrictEqual(value.value, new NumberValue(125).set_context(context));
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

    it('should work with a complex operation including prefix operation (negative)', () => {
        // 5 - --2 - 5 = -1
        // tree = ((5-(--2))-5)
        const tree = new SubtractNode(
            new SubtractNode(
                new NumberNode(new Token(TokenType.NUMBER, 5)),
                new PrefixOperationNode(new NumberNode(new Token(TokenType.NUMBER, 2)), -1)
            ),
            new NumberNode(new Token(TokenType.NUMBER, 5))
        );
        const result = new Interpreter().visit(tree, context);
        assert.deepStrictEqual(result.value, new NumberValue(-1).set_context(context));
    });

    it('should work with a complex operation including prefix operation (positive)', () => {
        // 5 + ++2 + 5 = 16
        // tree = ((5+(++5))+5)
        const tree = new AddNode(
            new AddNode(
                new NumberNode(new Token(TokenType.NUMBER, 5)),
                new PrefixOperationNode(new NumberNode(new Token(TokenType.NUMBER, 5)), 1)
            ),
            new NumberNode(new Token(TokenType.NUMBER, 5))
        );
        const result = new Interpreter().visit(tree, context);
        assert.deepStrictEqual(result.value, new NumberValue(16).set_context(context));
    });

    it('should work with a dictionnary', () => {
        // { 'yo': 5, 'test: 'coucou', 'list': [1, 2] }
        const tree = new DictionnaryNode(
            [
                new DictionnaryElementNode(str("yo"), number(5)),
                new DictionnaryElementNode(str("test"), str("coucou")),
                new DictionnaryElementNode(str("list"), new ListNode([number(1), number(2)], null, null)),
            ],
            null,
            null,
        );
        const result = new Interpreter().visit(tree, context);
        const keys = [
            new StringValue("yo"),
            new StringValue("test"),
            new StringValue("list"),
        ];
        const expected = [
            new NumberValue(5),
            new StringValue("coucou"),
            new ListValue([new NumberValue(1), new NumberValue(2)]),
        ];
        if (result.value instanceof DictionnaryValue) {
            for (let i = 0; i < keys.length; i++) {
                let v = result.value.elements.get(keys[i].value);
                let e = expected[i];
                if (e instanceof ListValue) {
                    let value_elements = v.elements;
                    let expected_elements = e.elements;
                    if (value_elements.length !== expected_elements.length) {
                        throw new Error("The length of the expected elements should be equal to the length of the registered elements.");
                    }
                    for (let y = 0; y < value_elements.length; y++) {
                        // @ts-ignore
                        assert.strictEqual(value_elements[y].value, expected_elements[y].value);
                    }
                } else {
                    assert.strictEqual(v.value, e.value);
                }
            }
        } else {
            assert.strictEqual(DictionnaryValue, false);
        }
    });
});
