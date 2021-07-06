import assert from 'assert';
import { NumberNode, AddNode, SubtractNode, MultiplyNode, DivideNode, PowerNode, ModuloNode, VarAssignNode, VarModifyNode, ElseAssignmentNode, ListNode, ListAccessNode, PrefixOperationNode, MinusNode, DictionnaryNode, DictionnaryElementNode, StringNode, DeleteNode, VarAccessNode, ForNode, WhileNode, IfNode, LessThanNode, PostfixOperationNode, GreaterThanNode, EqualsNode, LessThanOrEqualNode, GreaterThanOrEqualNode, NotEqualsNode, FuncDefNode, CallNode } from '../nodes.js';
import { DictionnaryValue, ListValue, NumberValue, StringValue } from '../values.js';
import { Interpreter } from '../interpreter.js';
import { Token, TokenType } from '../tokens.js'; // ok
import { Context } from '../context.js'; // ok
import global_symbol_table from '../symbol_table.js'; // ok
import { RuntimeError } from '../Exceptions.js';

const context = new Context('<program>'); // the context will get modified by visiting the different user's actions.
context.symbol_table = global_symbol_table;

/* 
How to make tests with the interpreter?

* Because of a glitch, we have to comment `CONSTANTS` in symbol_table.js AND replace it with an empty object
* Design an operation (example: 5 ^ (1 + 2 * 10 / 10))
* Test this operation and don't forget to console.log the generated tree (in run.js)
* Recreate that tree in your test.

Tests with `mocha`

! Careful, the context is the same throughout every tests, therefore we might get errors such as "variable 'i' already exists"

*/

// HELPERS
const number = (n) => {
    return new NumberNode(new Token(TokenType.NUMBER, n));
};

const str = (string) => {
    return new StringNode(new Token(TokenType.STRING, string));
};

const identifier_tok = (string) => {
    return new Token(TokenType.IDENTIFIER, string);
}

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

    it('should work with a negative number', () => {
        const tree = new MinusNode(number(5));
        const result = new Interpreter().visit(tree, context);
        assert.deepStrictEqual(result.value.value, -5);
    });

    it('should work with a less than (<) (expected true)', () => {
        const tree = new LessThanNode(
            number(20),
            number(30)
        );
        const result = new Interpreter().visit(tree, context);
        assert.deepStrictEqual(result.value.value, 1); // 1 == true
    });

    it('should work with a less than (<) (expected false)', () => {
        const tree = new LessThanNode(
            number(30),
            number(20)
        );
        const result = new Interpreter().visit(tree, context);
        assert.deepStrictEqual(result.value.value, 0); // 0 == false
    });

    it('should work with a greater than (>) (expected true)', () => {
        const tree = new GreaterThanNode(
            number(30),
            number(20)
        );
        const result = new Interpreter().visit(tree, context);
        assert.deepStrictEqual(result.value.value, 1); // 1 == true
    });

    it('should work with a greater than (>) (expected false)', () => {
        const tree = new GreaterThanNode(
            number(20),
            number(30)
        );
        const result = new Interpreter().visit(tree, context);
        assert.deepStrictEqual(result.value.value, 0); // 0 == false
    });

    it('should work with a less than or equal (<=) (expected true)', () => {
        const tree = new LessThanOrEqualNode(
            number(20),
            number(20)
        );
        const result = new Interpreter().visit(tree, context);
        assert.deepStrictEqual(result.value.value, 1); // 1 == true
    });

    it('should work with a less than or equal (<=) (expected false)', () => {
        const tree = new LessThanOrEqualNode(
            number(21),
            number(20)
        );
        const result = new Interpreter().visit(tree, context);
        assert.deepStrictEqual(result.value.value, 0); // 0 == false
    });

    it('should work with a greater than or equal (>=) (expected true)', () => {
        const tree = new GreaterThanOrEqualNode(
            number(20),
            number(20)
        );
        const result = new Interpreter().visit(tree, context);
        assert.deepStrictEqual(result.value.value, 1); // 1 == true
    });

    it('should work with a greater than or equal (>=) (expected false)', () => {
        const tree = new GreaterThanOrEqualNode(
            number(19),
            number(20)
        );
        const result = new Interpreter().visit(tree, context);
        assert.deepStrictEqual(result.value.value, 0); // 0 == false
    });

    it('should work with an equal node (==) (expected true)', () => {
        const tree = new EqualsNode(
            number(20),
            number(20)
        );
        const result = new Interpreter().visit(tree, context);
        assert.deepStrictEqual(result.value.value, 1); // 1 == true
    });

    it('should work with an equal node (==) (expected false)', () => {
        const tree = new EqualsNode(
            number(19),
            number(20)
        );
        const result = new Interpreter().visit(tree, context);
        assert.deepStrictEqual(result.value.value, 0); // 0 == false
    });

    it('should work with a not equal node (!=) (expected true)', () => {
        const tree = new NotEqualsNode(
            number(19),
            number(20)
        );
        const result = new Interpreter().visit(tree, context);
        assert.deepStrictEqual(result.value.value, 1); // 1 == true
    });

    it('should work with a not equal node (!=) (expected false)', () => {
        const tree = new NotEqualsNode(
            number(20),
            number(20)
        );
        const result = new Interpreter().visit(tree, context);
        assert.deepStrictEqual(result.value.value, 0); // 0 == false
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

    it('should work with an access to a variable', () => {
        // var number = 8; number
        // tree = [(var number = 8), (number)]
        const tree = new ListNode(
            [
                new VarAssignNode(identifier_tok("number"), number(8)),
                new VarAccessNode(identifier_tok("number"))
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context);
        assert.deepStrictEqual(result.value.elements[1].value, 8);
    });

    it('should work with a modification of a variable', () => {
        const tree = new VarModifyNode(
            new Token(TokenType.IDENTIFIER, "list"),
            new NumberNode(new Token(TokenType.NUMBER, 1))
        );
        const result = new Interpreter().visit(tree, context);
        assert.deepStrictEqual(result.value, new NumberValue(1).set_context(context));
    });

    it('should work with a delete keyword', () => {
        // var number = 1; delete number; number
        // tree = (delete (number))
        const tree = new ListNode(
            [
                new VarAssignNode(identifier_tok("number"), number(1)),
                new DeleteNode(
                    new VarAccessNode(identifier_tok("number")),
                    null,
                    null
                ),
                new VarAccessNode(identifier_tok("number")) // should raise an error
            ],
            null,
            null
        );
        try {
            const result = new Interpreter().visit(tree, context);
        } catch(e) {
            assert.strictEqual(true, e instanceof RuntimeError);
        }
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

    it('should work with a for-loop (basic for i to 10)', () => {
        // for i to 10: i
        // tree = ForNode
        // expected result = ListValue of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        const tree = new ForNode(
            identifier_tok("i"),
            number(0),
            number(10),
            number(1),
            new VarAccessNode(identifier_tok("i")),
            false
        );
        const result = new Interpreter().visit(tree, context);
        const expected = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        const value = result.value.elements.map((number_value) => number_value.value);
        assert.deepStrictEqual(expected, value);
    });

    it('should work with a while-loop', () => {
        // var e = 0; while e<10: e++
        // tree = [(var i = 0), WhileNode]
        // expected result = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        const tree = new ListNode(
            [
                new VarAssignNode(identifier_tok("e"), number(0)),
                new WhileNode(
                    new LessThanNode(
                        new VarAccessNode(identifier_tok("e")),
                        number(10)
                    ),
                    new PostfixOperationNode(
                        new VarAccessNode(identifier_tok("e")),
                        1
                    ),
                    false
                )
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context);
        const expected = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const value = result.value.elements[1].elements.map((number_value) => number_value.value);
        assert.deepStrictEqual(expected, value);
    });

    it('should work with an if statement (if)', () => {
        // var age = 19; if age > 18: "majeur" elif age == 18: "pile 18" else: "mineur"
        // tree = [(var age = 19), IfNode(2 cases)]
        // expected result = "majeur"
        const tree = new ListNode(
            [
                new VarAssignNode(identifier_tok("age"), number(19)),
                new IfNode(
                    [
                        [
                            new GreaterThanNode( // condition
                                new VarAccessNode(identifier_tok("age")),
                                number(18)
                            ),
                            str("majeur"), // the content to be returned if the condition is true
                            false, // should return null?
                        ],
                        [
                            new EqualsNode( // condition
                                new VarAccessNode(identifier_tok("age")),
                                number(18)
                            ),
                            str("pile 18"), // the content to be returned if the condition is true
                            false // should return null?
                        ]
                    ],
                    { code: str("mineur"), should_return_null: false },
                    null,
                    null
                )
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context);
        const expected = "majeur";
        assert.deepStrictEqual(result.value.elements[1].value, expected);
    });

    it('should work with an if statement (elif)', () => {
        // var _age = 18; if _age > 18: "majeur" elif _age == 18: "pile 18" else: "mineur"
        // tree = [(var _age = 18), IfNode(2 cases)]
        // expected result = "pile 18"
        const tree = new ListNode(
            [
                new VarAssignNode(identifier_tok("_age"), number(18)),
                new IfNode(
                    [
                        [
                            new GreaterThanNode( // condition
                                new VarAccessNode(identifier_tok("_age")),
                                number(18)
                            ),
                            str("majeur"), // the content to be returned if the condition is true
                            false, // should return null?
                        ],
                        [
                            new EqualsNode( // condition
                                new VarAccessNode(identifier_tok("_age")),
                                number(18)
                            ),
                            str("pile 18"), // the content to be returned if the condition is true
                            false // should return null?
                        ]
                    ],
                    { code: str("mineur"), should_return_null: false },
                    null,
                    null
                )
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context);
        const expected = "pile 18";
        assert.deepStrictEqual(result.value.elements[1].value, expected);
    });

    it('should work with an if statement (else)', () => {
        // var __age = 5; if __age > 18: "majeur" elif __age == 18: "pile 18" else: "mineur"
        // tree = [(var __age = 5), IfNode(2 cases)]
        // expected result = "mineur"
        const tree = new ListNode(
            [
                new VarAssignNode(identifier_tok("__age"), number(5)),
                new IfNode(
                    [
                        [
                            new GreaterThanNode( // condition
                                new VarAccessNode(identifier_tok("__age")),
                                number(18)
                            ),
                            str("majeur"), // the content to be returned if the condition is true
                            false, // should return null?
                        ],
                        [
                            new EqualsNode( // condition
                                new VarAccessNode(identifier_tok("__age")),
                                number(18)
                            ),
                            str("pile 18"), // the content to be returned if the condition is true
                            false // should return null?
                        ]
                    ],
                    { code: str("mineur"), should_return_null: false },
                    null,
                    null
                )
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context);
        const expected = "mineur";
        assert.deepStrictEqual(result.value.elements[1].value, expected);
    });

    it('should work with a function declaration', () => {
        // func add(a, b?, c?=1) -> if b != 0: a + b + c else: a + c; add(5)
        // tree = (func add(a, b, c))
        // expected result = 6
        const tree = new ListNode(
            [
                new FuncDefNode(
                    identifier_tok("add"),
                    [ // all
                        identifier_tok("a"),
                        identifier_tok("b"),
                        identifier_tok("c"),
                    ],
                    [ // mandatories
                        identifier_tok("a"),
                    ],
                    [ // optionals
                        identifier_tok("b"),
                        identifier_tok("c"),
                    ],
                    [
                        number(0),
                        number(1),
                    ],
                    new IfNode(
                        [
                            [
                                new NotEqualsNode(
                                    new VarAccessNode(identifier_tok("b")),
                                    number(0)
                                ),
                                new AddNode(
                                    new AddNode(
                                        new VarAccessNode(identifier_tok("a")),
                                        new VarAccessNode(identifier_tok("b"))
                                    ),
                                    new VarAccessNode(identifier_tok("c"))
                                ),
                                false
                            ]
                        ],
                        { code: new AddNode(new VarAccessNode(identifier_tok("a")), new VarAccessNode(identifier_tok("c"))), should_return_null: false },
                        null,
                        null
                    ),
                    true
                ),
                new CallNode(
                    new VarAccessNode(identifier_tok("add")),
                    [
                        number(5)
                    ]
                )
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context);
        const expected_result = 6;
        assert.deepStrictEqual(result.value.elements[1].value, expected_result);
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

    it('should work with a complex operation including postfix operation (negative)', () => {
        // var b = 5; b----
        // tree = [((b)----)]
        // expected result = 3
        const tree = new ListNode(
            [
                new VarAssignNode(identifier_tok("b"), number(5)),
                new PostfixOperationNode(
                    new VarAccessNode(identifier_tok("b")),
                    -2
                )
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context);
        const value = result.value.elements[1].value;
        const expected = 3;
        assert.deepStrictEqual(value, expected);
    });

    it('should work with a complex operation including postfix operation (positive)', () => {
        // var a = 5; a++++
        // tree = [((a)++++)]
        // expected result = 7
        const tree = new ListNode(
            [
                new VarAssignNode(identifier_tok("a"), number(5)),
                new PostfixOperationNode(
                    new VarAccessNode(identifier_tok("a")),
                    2
                )
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context);
        const value = result.value.elements[1].value;
        const expected = 7;
        assert.deepStrictEqual(value, expected);
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
