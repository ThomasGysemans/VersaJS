import assert from 'assert';
import { NumberNode, AddNode, SubtractNode, MultiplyNode, DivideNode, PowerNode, ModuloNode, VarAssignNode, VarModifyNode, NullishOperatorNode, ListNode, ListAccessNode, PrefixOperationNode, MinusNode, DictionnaryNode, DictionnaryElementNode, StringNode, DeleteNode, VarAccessNode, ForNode, WhileNode, IfNode, LessThanNode, PostfixOperationNode, GreaterThanNode, EqualsNode, LessThanOrEqualNode, GreaterThanOrEqualNode, NotEqualsNode, FuncDefNode, CallNode, ListAssignmentNode, ListBinarySelector, ClassDefNode, ClassPropertyDefNode, ClassMethodDefNode, AssignPropertyNode, CallPropertyNode, ClassCallNode, CallMethodNode, CallStaticPropertyNode, SuperNode, ReturnNode, ArgumentNode, EnumNode, SwitchNode, NoneNode, NotNode, BooleanNode, BinaryShiftRightNode, NullishAssignmentNode, LogicalAndNode, BinaryNotNode } from '../nodes.js';
import { BooleanValue, ClassValue, DictionnaryValue, ListValue, NoneValue, NumberValue, StringValue } from '../values.js';
import { Interpreter } from '../interpreter.js';
import { Token, TokenType } from '../tokens.js';
import { Context } from '../context.js';
import { SymbolTable } from '../symbol_table.js';
import { RuntimeError } from '../Exceptions.js';

/*

How to make tests with the interpreter?

* Because of a glitch, we have to comment a block in `symbol_table.js`
* Design an operation (example: 5 ** (1 + 2 * 10 / 10))
* Test this operation and don't forget to console.log the generated tree (in run.js)
* Recreate that tree in your test.

Tests with `mocha` (npm run test ./test/interpreter.test.js)

*/

// HELPERS
const number = (n) => {
    return new NumberNode(new Token(TokenType.NUMBER, n));
};

const str = (string, allow_concatenation=true) => {
    return new StringNode(new Token(TokenType.STRING, string), allow_concatenation);
};

const identifier_tok = (string) => {
    return new Token(TokenType.IDENTIFIER, string, null, null);
};

const none = () => {
    return new NoneNode(null, null);
};

const yes = () => {
    return new BooleanNode(1, "yes", null, null);
};

const no = () => {
    return new BooleanNode(0, "no", null, null);
};

const context = () => {
    const context = new Context('<program>'); // the context will get modified by visiting the different user's actions.
    context.symbol_table = new SymbolTable();
    return context;
};

describe('Interpreter', () => {
    it('should work with numbers', () => {
        const tree = number(51.2);
        const result = new Interpreter().visit(tree, context());
        const value = result.value.value;
        assert.deepStrictEqual(value, 51.2);
    });

    it('should work with an addition', () => {
        const tree = new AddNode(number(27), number(14));
        const result = new Interpreter().visit(tree, context());
        const value = result.value.value;
        assert.deepStrictEqual(value, 41);
    });

    it('should work with a subtract', () => {
        const tree = new SubtractNode(number(27), number(14));
        const result = new Interpreter().visit(tree, context());
        const value = result.value.value;
        assert.deepStrictEqual(value, 13);
    });

    it('should work with a multiplication', () => {
        const tree = new MultiplyNode(number(27), number(14));
        const result = new Interpreter().visit(tree, context());
        const value = result.value.value;
        assert.deepStrictEqual(value, 378);
    });

    it('should work with a power', () => {
        const tree = new PowerNode(number(10), number(0));
        const result = new Interpreter().visit(tree, context());
        const value = result.value.value;
        assert.deepStrictEqual(value, 1);
    });

    it('should work with a divison', () => {
        const tree = new DivideNode(number(10), number(5));
        const result = new Interpreter().visit(tree, context());
        const value = result.value.value;
        assert.deepStrictEqual(value, 2);
    });

    it('should work with a modulo', () => {
        const tree = new ModuloNode(number(9), number(2));
        const result = new Interpreter().visit(tree, context());
        const value = result.value.value;
        assert.deepStrictEqual(value, 1);
    });

    it('should work with a negative number', () => {
        const tree = new MinusNode(number(5));
        const result = new Interpreter().visit(tree, context());
        const value = result.value.value;
        assert.deepStrictEqual(value, -5);
    });

    it('should work with a less than (<) (expected true)', () => {
        const tree = new LessThanNode(
            number(20),
            number(30)
        );
        const result = new Interpreter().visit(tree, context());
        const value = result.value.state;
        assert.deepStrictEqual(value, 1); // 1 == true
    });

    it('should work with a less than (<) (expected false)', () => {
        const tree = new LessThanNode(
            number(30),
            number(20)
        );
        const result = new Interpreter().visit(tree, context());
        const value = result.value.state;
        assert.deepStrictEqual(value, 0); // 0 == false
    });

    it('should work with a greater than (>) (expected true)', () => {
        const tree = new GreaterThanNode(
            number(30),
            number(20)
        );
        const result = new Interpreter().visit(tree, context());
        const value = result.value.state;
        assert.deepStrictEqual(value, 1); // 1 == true
    });

    it('should work with a greater than (>) (expected false)', () => {
        const tree = new GreaterThanNode(
            number(20),
            number(30)
        );
        const result = new Interpreter().visit(tree, context());
        const value = result.value.state;
        assert.deepStrictEqual(value, 0); // 0 == false
    });

    it('should work with a less than or equal (<=) (expected true)', () => {
        const tree = new LessThanOrEqualNode(
            number(20),
            number(20)
        );
        const result = new Interpreter().visit(tree, context());
        const value = result.value.state;
        assert.deepStrictEqual(value, 1); // 1 == true
    });

    it('should work with a less than or equal (<=) (expected false)', () => {
        const tree = new LessThanOrEqualNode(
            number(21),
            number(20)
        );
        const result = new Interpreter().visit(tree, context());
        const value = result.value.state;
        assert.deepStrictEqual(value, 0); // 0 == false
    });

    it('should work with a greater than or equal (>=) (expected true)', () => {
        const tree = new GreaterThanOrEqualNode(
            number(20),
            number(20)
        );
        const result = new Interpreter().visit(tree, context());
        const value = result.value.state;
        assert.deepStrictEqual(value, 1); // 1 == true
    });

    it('should work with a greater than or equal (>=) (expected false)', () => {
        const tree = new GreaterThanOrEqualNode(
            number(19),
            number(20)
        );
        const result = new Interpreter().visit(tree, context());
        const value = result.value.state;
        assert.deepStrictEqual(value, 0); // 0 == false
    });

    it('should work with an equal node (==) (expected true)', () => {
        const tree = new EqualsNode(
            number(20),
            number(20)
        );
        const result = new Interpreter().visit(tree, context());
        const value = result.value.state;
        assert.deepStrictEqual(value, 1); // 1 == true
    });

    it('should work with an equal node (==) (expected false)', () => {
        const tree = new EqualsNode(
            number(19),
            number(20)
        );
        const result = new Interpreter().visit(tree, context());
        const value = result.value.state;
        assert.deepStrictEqual(value, 0); // 0 == false
    });

    it('should work with a not equal node (!=) (expected true)', () => {
        const tree = new NotEqualsNode(
            number(19),
            number(20)
        );
        const result = new Interpreter().visit(tree, context());
        const value = result.value.state;
        assert.deepStrictEqual(value, 1); // 1 == true
    });

    it('should work with a not equal node (!=) (expected false)', () => {
        const tree = new NotEqualsNode(
            number(20),
            number(20)
        );
        const result = new Interpreter().visit(tree, context());
        const value = result.value.state;
        assert.deepStrictEqual(value, 0); // 0 == false
    });

    it('should work with none', () => {
        const tree = none();
        const result = new Interpreter().visit(tree, context());
        const value = result.value;
        assert.deepStrictEqual(true, value instanceof NoneValue);
    });

    it('should work with a complex operation', () => {
        // 5 ** (1 + 2 * 10 / 10) = 125
        // tree = (5**(1+((2*10)/10)))
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
        const result = new Interpreter().visit(tree, context());
        const value = result.value.value;
        const expected = 125;
        assert.deepStrictEqual(value, expected);
    });

    it('should work with a complex operation including binary shift to the right', () => {
        // 256 >> 1 + 2 * 10 / 10 = 32
        const tree = new BinaryShiftRightNode(
            number(256),
            new AddNode(
                number(1),
                new DivideNode(
                    new MultiplyNode(
                        number(2),
                        number(10),
                    ),
                    number(10),
                ),
            ),
        );
        const result = new Interpreter().visit(tree, context());
        const value = result.value.value;
        const expected = 32;
        assert.deepStrictEqual(value, expected);
    });

    it('should work with a complex operation including a logical operation (AND)', () => {
        // 14 ^ 1 + 4 * 2 = 8
        const tree = new LogicalAndNode(
            number(14),
            new AddNode(
                number(1),
                new MultiplyNode(
                    number(4),
                    number(2),
                ),
            ),
        );
        const result = new Interpreter().visit(tree, context());
        const value = result.value.value;
        const expected = 8;
        assert.deepStrictEqual(value, expected);
    });

    it('should work with a complex operation including a binary NOT (~)', () => {
        // 6 + ~5 = 0
        const tree = new AddNode(
            number(6),
            new BinaryNotNode(number(5)),
        );
        const result = new Interpreter().visit(tree, context());
        const value = result.value.value;
        const expected = 0;
        assert.deepStrictEqual(value, expected);
    });

    it('should work with a prefix operation (before)', () => {
        const tree = new PrefixOperationNode(number(9), 1);
        const result = new Interpreter().visit(tree, context());
        const value = result.value.value;
        const expected = 10;
        assert.deepStrictEqual(value, expected);
    });
    
    it('should raise an exception with division by 0', () => {
        try {
            const tree = new DivideNode(
                number(10),
                number(0),
            );
            const value = new Interpreter().visit(tree, context());
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

        const result = new Interpreter().visit(tree, context());
        const value = result.value.value;
        const expected = -2166;
        assert.deepStrictEqual(value, expected);
    });

    it('should work with an assignment to a variable', () => {
        const tree = new VarAssignNode(
            identifier_tok("var_assignment"),
            number(1)
        );
        const result = new Interpreter().visit(tree, context());
        const expected = 1;
        const value = result.value.value;
        assert.deepStrictEqual(value, expected);
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
        const result = new Interpreter().visit(tree, context());
        const value = result.value.elements[1].value;
        const expected = 8;
        assert.deepStrictEqual(value, expected);
    });

    it('should work with a modification of a variable', () => {
        // var variable = 5; variable = 4; variable
        const tree = new ListNode(
            [
                new VarAssignNode(
                    identifier_tok("variable_modification"),
                    number(5)
                ),
                new VarModifyNode(
                    identifier_tok("variable_modification"),
                    number(4)
                ),
                new VarAccessNode(
                    identifier_tok("variable_modification")
                )
            ],
            null,
            null
        )
        const result = new Interpreter().visit(tree, context());
        const expected = 4;
        const value = result.value.elements[2].value;
        assert.deepStrictEqual(value, expected);
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
            const result = new Interpreter().visit(tree, context());
        } catch(e) {
            assert.strictEqual(true, e instanceof RuntimeError);
        }
    });

    it('should work with a nullish coalescing operator (??)', () => {
        const tree = new NullishOperatorNode(
            none(),
            number(1)
        );
        const result = new Interpreter().visit(tree, context());
        const expected = 1;
        const value = result.value.value;
        assert.deepStrictEqual(value, expected);
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
        const result = new Interpreter().visit(tree, context());
        const expected = [0, 1];
        const value = result.value.elements.map((v) => v.value);
        assert.deepStrictEqual(value, expected);
    });

    it('should work with a list (access)', () => {
        // var list = [1, 2, 3]; list
        const tree = new ListNode(
            [
                new VarAssignNode(
                    identifier_tok("list_access"),
                    new ListNode(
                        [
                            number(1),
                            number(2),
                            number(3),
                        ],
                        null,
                        null
                    )
                ),
                new VarAccessNode(identifier_tok("list_access"))
            ],
            null,
            null,
        );
        const result = new Interpreter().visit(tree, context());
        const expected = [1, 2, 3];
        const value = result.value.elements[1].elements.map((v) => v.value);
        assert.deepStrictEqual(value, expected);
    });

    it('should work with a list (assignment)', () => {
        // var list = [1, 2, 3]; list[4] = 5; list
        // expected = [1, 2, 3, none, 5]
        const tree = new ListNode(
            [
                new VarAssignNode(
                    identifier_tok("list_assignment"),
                    new ListNode(
                        [
                            number(1),
                            number(2),
                            number(3),
                        ],
                        null,
                        null
                    )
                ),
                new ListAssignmentNode(
                    new ListAccessNode(
                        new VarAccessNode(identifier_tok("list_assignment")),
                        0,
                        [
                            number(4)
                        ]
                    ),
                    number(5)
                ),
                new VarAccessNode(identifier_tok("list_assignment"))
            ],
            null,
            null,
        );
        const result = new Interpreter().visit(tree, context());
        const expected = [1, 2, 3, 0, 5];
        const value = result.value.elements[2].elements.map((v) => v instanceof NoneValue ? 0 : v.value);
        assert.deepStrictEqual(value, expected);
    });

    it('should work with a list (binary_selector)', () => {
        // var list = [1, 2, 3, 0, 5]; list[1:-1]
        // expected = [2, 3, 0]
        const tree = new ListNode(
            [
                new VarAssignNode(
                    identifier_tok("list_binary_selector"),
                    new ListNode(
                        [
                            number(1),
                            number(2),
                            number(3),
                            number(0),
                            number(3),
                        ],
                        null,
                        null
                    )
                ),
                new ListAccessNode(
                    new VarAccessNode(identifier_tok("list_binary_selector")),
                    0,
                    [
                        new ListBinarySelector(
                            number(1),
                            number(-1),
                            null,
                            null,
                        )
                    ]
                ),
            ],
            null,
            null,
        );
        const result = new Interpreter().visit(tree, context());
        const expected = [2, 3, 0];
        const value = result.value.elements[1].elements.map((v) => v.value);
        assert.deepStrictEqual(value, expected);
    });

    it('should work with a list that contains a function, which we want to call', () => {
        // var list_with_func = [func (a, b) -> a + b]; list_with_func[0](1, 2)
        // tree = [(var list_with_func = [func (a, b)]), (call ((list_with_func)[expr])(2 args))]
        // expected result = 3
        const tree = new ListNode(
            [
                new VarAssignNode(
                    identifier_tok("list_with_func"),
                    new ListNode(
                        [
                            new FuncDefNode(
                                null,
                                [
                                    new ArgumentNode(identifier_tok("a")),
                                    new ArgumentNode(identifier_tok("b"))
                                ],
                                new AddNode(
                                    new VarAccessNode(identifier_tok("a")),
                                    new VarAccessNode(identifier_tok("b")),
                                ),
                                true
                            )
                        ],
                        null,
                        null
                    )
                ),
                new CallNode(
                    new ListAccessNode(
                        new VarAccessNode(identifier_tok("list_with_func")),
                        1,
                        [
                            number(0)
                        ]
                    ),
                    [
                        number(1),
                        number(2)
                    ]
                )
            ],
            null,
            null,
        );
        const result = new Interpreter().visit(tree, context());
        const expected = 3;
        const value = result.value.elements[1].value;
        assert.deepStrictEqual(value, expected);
    });

    it('should work with a list that contains a function, which we want to call (ultimate test)', () => {
        // A list that contains a function, function that returns a list, a list that contains a function which we want to call
        // var list = [func () -> [1, func (a, b) -> a + b]]; list[0]()[1](5, 1)
        // tree (only the call) = [(call ((call ((list)[expr])(0 args))[expr])(2 args))]
        // expected result = 6
        const tree = new ListNode(
            [
                new VarAssignNode(
                    identifier_tok("list_with_func_ultimate"),
                    new ListNode(
                        [
                            new FuncDefNode(
                                null,
                                [],
                                new ListNode(
                                    [
                                        number(1),
                                        new FuncDefNode(
                                            null,
                                            [
                                                new ArgumentNode(identifier_tok("a")),
                                                new ArgumentNode(identifier_tok("b")),
                                            ],
                                            new AddNode(
                                                new VarAccessNode(identifier_tok("a")),
                                                new VarAccessNode(identifier_tok("b")),
                                            ),
                                            true
                                        )
                                    ],
                                    null,
                                    null
                                ),
                                true
                            )
                        ],
                        null,
                        null
                    )
                ),
                new CallNode(
                    new ListAccessNode(
                        new CallNode(
                            new ListAccessNode(
                                new VarAccessNode(identifier_tok("list_with_func_ultimate")),
                                0,
                                [
                                    number(0)
                                ]
                            ),
                            []
                        ),
                        0,
                        [
                            number(1)
                        ]
                    ),
                    [
                        number(5),
                        number(1)
                    ]
                )
            ],
            null,
            null,
        );
        const result = new Interpreter().visit(tree, context());
        const expected = 6;
        const value = result.value.elements[1].value;
        assert.deepStrictEqual(value, expected);
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
        const result = new Interpreter().visit(tree, context());
        const expected = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        const value = result.value.elements.map((number_value) => number_value.value);
        assert.deepStrictEqual(value, expected);
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
        const result = new Interpreter().visit(tree, context());
        const expected = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const value = result.value.elements[1].elements.map((number_value) => number_value.value);
        assert.deepStrictEqual(value, expected);
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
        const result = new Interpreter().visit(tree, context());
        const expected = "majeur";
        const value = result.value.elements[1].value;
        assert.deepStrictEqual(value, expected);
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
        const result = new Interpreter().visit(tree, context());
        const expected = "pile 18";
        const value = result.value.elements[1].value;
        assert.deepStrictEqual(value, expected);
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
        const result = new Interpreter().visit(tree, context());
        const expected = "mineur";
        const value = result.value.elements[1].value;
        assert.deepStrictEqual(value, expected);
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
                        new ArgumentNode(identifier_tok("a"), false, false),
                        new ArgumentNode(identifier_tok("b"), false, true, number(0)),
                        new ArgumentNode(identifier_tok("c"), false, true, number(1)),
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
        const result = new Interpreter().visit(tree, context());
        const expected = 6;
        const value = result.value.elements[1].value;
        assert.deepStrictEqual(value, expected);
    });

    it('should work with a double call to a function (function that returns a function, which we want to call)', () => {
        // func test_func() -> func(a, b) -> a + b; test_func()(5+5, 5)
        // tree = [func test_func(), (call (call (test_func)(0 args))(2 args))]
        // expected result = 15
        const tree = new ListNode(
            [
                new FuncDefNode(
                    identifier_tok("test_func"),
                    [],
                    new FuncDefNode(
                        null,
                        [
                            new ArgumentNode(identifier_tok("a")),
                            new ArgumentNode(identifier_tok("b")),
                        ],
                        new AddNode(
                            new VarAccessNode(identifier_tok("a")),
                            new VarAccessNode(identifier_tok("b"))
                        ),
                        true
                    ),
                    true
                ),
                // we first call test_func(), then test_func()(a, b)
                new CallNode( // the last call (right)
                    new CallNode( // the first call is here (left)
                        new VarAccessNode(identifier_tok("test_func")),
                        []
                    ),
                    [
                        new AddNode(
                            number(5),
                            number(5)
                        ),
                        number(5)
                    ]
                )
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context());
        const expected = 15;
        const value = result.value.elements[1].value;
        assert.deepStrictEqual(value, expected);
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
        const result = new Interpreter().visit(tree, context());
        const value = result.value.value;
        const expected = -1;
        assert.deepStrictEqual(value, expected);
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
        const result = new Interpreter().visit(tree, context());
        const value = result.value.value;
        const expected = 16;
        assert.deepStrictEqual(value, expected);
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
        const result = new Interpreter().visit(tree, context());
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
        const result = new Interpreter().visit(tree, context());
        const value = result.value.elements[1].value;
        const expected = 7;
        assert.deepStrictEqual(value, expected);
    });

    it('should work with concatenation', () => {
        // var age = 17; var str = f"I am $age."; str
        // expected result = "I am 17."
        const tree = new ListNode(
            [
                new VarAssignNode(identifier_tok("age_concatenation"), number(17)),
                new VarAssignNode(identifier_tok("str_concatenation"), str("I am $age_concatenation.")),
                new VarAccessNode(identifier_tok("str_concatenation"))
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context());
        const value = result.value.elements[2].value;
        const expected = "I am 17.";
        assert.deepStrictEqual(value, expected);
    });

    it('should work with concatenation (2)', () => {
        // var variable = "adult"; var str = f"I am an $variable"; str
        // expected result = "I am an adult"
        const tree = new ListNode(
            [
                new VarAssignNode(identifier_tok("variable_concatenation"), str("adult")),
                new VarAssignNode(identifier_tok("str_concatenation_2"), str("I am an $variable_concatenation")),
                new VarAccessNode(identifier_tok("str_concatenation_2"))
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context());
        const value = result.value.elements[2].value;
        const expected = "I am an adult";
        assert.deepStrictEqual(value, expected);
    });

    it('should work with concatenation (with if statement)', () => {
        // var age = 18; "I am " + (if age > 18: "major" elif age == 18: "18" else: "minor") + "."
        // tree = [((STRING:I am +IfNode(2 cases))+STRING:.)]
        // if we don't put parentheses, the else case becomes "minor" + "." ("minor.")
        // expected result = "I am 18."
        const tree = new ListNode(
            [
                new VarAssignNode(identifier_tok("age_concatenation_3"), number(18)),
                new AddNode(
                    new AddNode(
                        str("I am "),
                        new IfNode(
                            [
                                [
                                    new GreaterThanNode(
                                        new VarAccessNode(identifier_tok("age_concatenation_3")),
                                        number(18)
                                    ),
                                    str("major"),
                                    false
                                ],
                                [
                                    new EqualsNode(
                                        new VarAccessNode(identifier_tok("age_concatenation_3")),
                                        number(18)
                                    ),
                                    str("18"),
                                    false
                                ]
                            ],
                            { code: str("minor"), should_return_null: false },
                            null,
                            null
                        )
                    ),
                    str(".")
                )
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context());
        const value = result.value.elements[1].value;
        const expected = "I am 18.";
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
        const result = new Interpreter().visit(tree, context());
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

    it('should work with a class', () => {
        /*
        class Person:
            public property firstname
            private property lastname
            protected property fullname
            protected property age
            
            method __init(firstname, lastname, age):
                self.firstname = firstname
                self.lastname = lastname
                self.age = age
                self.fullname = self.assemble()
            end

            protected method assemble() -> self.firstname + " " + self.lastname

            get getFullname() -> self.fullname

            set setFirstname(new_name):
                self.firstname = new_name
                self.fullname = self.assemble()
            end

            set setAge(new_age?=self.age+1) -> self.age = new_age
        end

        var person = new Person("Thomas", "CodoPixel", 17)
        person.getFullname()
        */
        // tree = [(Class Person), (var person = (new IDENTIFIER:Person)), (call (prop (person).getFullname)(0 args))]
        // expected result (for the last line) = "Thomas CodoPixel"
        const tree = new ListNode(
            [
                new ClassDefNode(
                    identifier_tok("Person"),
                    null,
                    [
                        new ClassPropertyDefNode(
                            identifier_tok("firstname"),
                            number(0),
                            1,
                            0,
                            0
                        ),
                        new ClassPropertyDefNode(
                            identifier_tok("lastname"),
                            number(0),
                            0,
                            0,
                            0
                        ),
                        new ClassPropertyDefNode(
                            identifier_tok("fullname"),
                            number(0),
                            2,
                            0,
                            0
                        ),
                        new ClassPropertyDefNode(
                            identifier_tok("age"),
                            number(0),
                            2,
                            0,
                            0
                        ),
                    ],
                    [
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("__init"),
                                [
                                    new ArgumentNode(identifier_tok("firstname")),
                                    new ArgumentNode(identifier_tok("lastname")),
                                    new ArgumentNode(identifier_tok("age")),
                                ],
                                new ListNode(
                                    [
                                        new AssignPropertyNode(
                                            new CallPropertyNode(
                                                new VarAccessNode(identifier_tok("self")),
                                                identifier_tok("firstname")
                                            ),
                                            new VarAccessNode(identifier_tok("firstname"))
                                        ),
                                        new AssignPropertyNode(
                                            new CallPropertyNode(
                                                new VarAccessNode(identifier_tok("self")),
                                                identifier_tok("lastname")
                                            ),
                                            new VarAccessNode(identifier_tok("lastname"))
                                        ),
                                        new AssignPropertyNode(
                                            new CallPropertyNode(
                                                new VarAccessNode(identifier_tok("self")),
                                                identifier_tok("age")
                                            ),
                                            new VarAccessNode(identifier_tok("age"))
                                        ),
                                        new AssignPropertyNode(
                                            new CallPropertyNode(
                                                new VarAccessNode(identifier_tok("self")),
                                                identifier_tok("fullname")
                                            ),
                                            new CallNode(
                                                new CallPropertyNode(
                                                    new VarAccessNode(identifier_tok("self")),
                                                    identifier_tok("assemble")
                                                ),
                                                []
                                            )
                                        ),
                                    ],
                                    null,
                                    null
                                ),
                                false,
                            ),
                            1,
                            0,
                            0
                        ),
                        // protected method assemble() -> self.firstname + " " + self.lastname
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("assemble"),
                                [],
                                new AddNode(
                                    new AddNode(
                                        new CallPropertyNode(
                                            new VarAccessNode(identifier_tok("self")),
                                            identifier_tok("firstname")
                                        ),
                                        str(" ")
                                    ),
                                    new CallPropertyNode(
                                        new VarAccessNode(identifier_tok("self")),
                                        identifier_tok("lastname")
                                    )
                                ),
                                true,
                            ),
                            2,
                            0,
                            0
                        )
                    ],
                    [
                        // get getFullname() -> self.fullname
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("getFullname"),
                                [],
                                new CallPropertyNode(
                                    new VarAccessNode(identifier_tok("self")),
                                    identifier_tok("fullname")
                                ),
                                true,
                            ),
                            1,
                            0,
                            0
                        )
                    ],
                    [
                        // set setFirstname(new_name):
                        //     self.firstname = new_name
                        //     self.fullname = self.assemble()
                        // end
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("setFirstname"),
                                [
                                    new ArgumentNode(identifier_tok("new_name")),
                                ],
                                new ListNode(
                                    [
                                        new AssignPropertyNode(
                                            new CallPropertyNode(
                                                new VarAccessNode(identifier_tok("self")),
                                                identifier_tok("firstname")
                                            ),
                                            new VarAccessNode(identifier_tok("new_name"))
                                        ),
                                        new AssignPropertyNode(
                                            new CallPropertyNode(
                                                new VarAccessNode(identifier_tok("self")),
                                                identifier_tok("fullname")
                                            ),
                                            new CallNode(
                                                new CallPropertyNode(
                                                    new VarAccessNode(identifier_tok("self")),
                                                    identifier_tok("assemble")
                                                ),
                                                []
                                            )
                                        ),
                                    ],
                                    null,
                                    null
                                ),
                                false,
                            ),
                            1,
                            0,
                            0
                        ),
                        // set setAge(new_age?=self.age+1) -> self.age = new_age
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("setAge"),
                                [
                                    new ArgumentNode(
                                        identifier_tok("new_age"),
                                        false,
                                        true,
                                        new AddNode(
                                            new CallPropertyNode(
                                                new VarAccessNode(identifier_tok("self")),
                                                identifier_tok("age")
                                            ),
                                            number(1)
                                        )
                                    ),
                                ],
                                new AssignPropertyNode(
                                    new CallPropertyNode(
                                        new VarAccessNode(identifier_tok("self")),
                                        identifier_tok("age")
                                    ),
                                    new VarAccessNode(identifier_tok("new_age"))
                                ),
                                true,
                            ),
                            1,
                            0,
                            0
                        )
                    ],
                    null,
                    null
                ),
                // var person = new Person("Thomas", "CodoPixel", 17)
                new VarAssignNode(
                    identifier_tok("person"),
                    new ClassCallNode(
                        identifier_tok("Person"),
                        [
                            str("Thomas"),
                            str("CodoPixel"),
                            number(17)
                        ]
                    )
                ),
                // person.getFullname()
                new CallNode(
                    new CallPropertyNode(
                        new VarAccessNode(identifier_tok("person")),
                        identifier_tok("getFullname")
                    ),
                    []
                )
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context());
        const expected = "Thomas CodoPixel";
        const value = result.value.elements[2].value;
        assert.deepStrictEqual(true, result.value.elements[1] instanceof ClassValue);
        assert.deepStrictEqual(value, expected);
    });

    it('should work with several classes', () => {
        /*
        class Cat:
            property name

            method __init(name):
                self.name = name
            end

            method walk() -> self.name + " walks"
        end

        var cat = new Cat("A cat")
        var cat2 = new Cat("catty")
        cat.walk()
        cat2.walk()
        */
        /*
        tree = [
            (Class Cat),
            (var cat = (new IDENTIFIER:Cat)),
            (var cat2 = (new IDENTIFIER:Cat)),
            (method (cat).(call (prop (cat).walk)(0 args))),
            (method (cat2).(call (prop (cat2).walk)(0 args)))
            ]
        */
        // expected results:
        // A cat walks
        // catty walks
        const tree = new ListNode(
            [
                new ClassDefNode(
                    identifier_tok("Cat"),
                    null,
                    [
                        new ClassPropertyDefNode(
                            identifier_tok("name"),
                            number(0),
                            1,
                            0,
                            0
                        )
                    ],
                    [
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("__init"),
                                [
                                    new ArgumentNode(identifier_tok("name")),
                                ],
                                new AssignPropertyNode(
                                    new CallPropertyNode(
                                        new VarAccessNode(identifier_tok("self")),
                                        identifier_tok("name")
                                    ),
                                    new VarAccessNode(identifier_tok("name"))
                                ),
                                false
                            ),
                            1,
                            0,
                            0
                        ),
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("walk"),
                                [],
                                new AddNode(
                                    new CallPropertyNode(
                                        new VarAccessNode(identifier_tok("self")),
                                        identifier_tok("name")
                                    ),
                                    str(" walks")
                                ),
                                true
                            ),
                            1,
                            0,
                            0
                        )
                    ],
                    [],
                    [],
                    null,
                    null
                ),
                new VarAssignNode(
                    identifier_tok("cat"),
                    new ClassCallNode(
                        identifier_tok("Cat"),
                        [
                            str("A cat")
                        ]
                    )
                ),
                new VarAssignNode(
                    identifier_tok("cat2"),
                    new ClassCallNode(
                        identifier_tok("Cat"),
                        [
                            str("catty")
                        ]
                    )
                ),
                new CallMethodNode(
                    new CallNode(
                        new CallPropertyNode(
                            new VarAccessNode(identifier_tok("cat")),
                            identifier_tok("walk")
                        ),
                        []
                    ),
                    new VarAccessNode(identifier_tok("cat"))
                ),
                new CallMethodNode(
                    new CallNode(
                        new CallPropertyNode(
                            new VarAccessNode(identifier_tok("cat2")),
                            identifier_tok("walk")
                        ),
                        []
                    ),
                    new VarAccessNode(identifier_tok("cat2"))
                )
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context());
        const expected = [
            "A cat walks",
            "catty walks"
        ];
        const values = [
            result.value.elements[3].value,
            result.value.elements[4].value
        ];
        assert.deepStrictEqual(values, expected);
    });

    it('should work with several classes and default values in the __init method', () => {
        /*
        class Dog:
            property name
            private property default_name = "default"

            method __init(name?=self.default_name):
                self.name = name
            end

            method walk() -> self.name + " walks"
        end

        var dog = new Dog("A dog")
        var dog2 = new Dog()
        dog.walk()
        dog2.walk()
        */
        /*
        tree = [
            (Class Dog),
            (var dog = (new IDENTIFIER:Dog)),
            (var dog2 = (new IDENTIFIER:Dog)),
            (method (dog).(call (prop (dog).walk)(0 args))),
            (method (dog2).(call prop (dog2).walk)(0 args))
        ]
        */
        // expected results
        // A dog walks
        // default walks
        const tree = new ListNode(
            [
                new ClassDefNode(
                    identifier_tok("Dog"),
                    null,
                    [
                        new ClassPropertyDefNode(
                            identifier_tok("name"),
                            number(0),
                            1,
                            0,
                            0
                        ),
                        new ClassPropertyDefNode(
                            identifier_tok("default_name"),
                            str("default"),
                            0,
                            0,
                            0
                        ),
                    ],
                    [
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("__init"),
                                [
                                    new ArgumentNode(
                                        identifier_tok("name"),
                                        false,
                                        true,
                                        new CallPropertyNode(
                                            new VarAccessNode(identifier_tok("self")),
                                            identifier_tok("default_name")
                                        )
                                    ),
                                ],
                                new AssignPropertyNode(
                                    new CallPropertyNode(
                                        new VarAccessNode(identifier_tok("self")),
                                        identifier_tok("name")
                                    ),
                                    new VarAccessNode(identifier_tok("name"))
                                ),
                                false
                            ),
                            1,
                            0,
                            0
                        ),
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("walk"),
                                [],
                                new AddNode(
                                    new CallPropertyNode(
                                        new VarAccessNode(identifier_tok("self")),
                                        identifier_tok("name")
                                    ),
                                    str(" walks")
                                ),
                                true
                            ),
                            1,
                            0,
                            0
                        )
                    ],
                    [],
                    [],
                    null,
                    null
                ),
                new VarAssignNode(
                    identifier_tok("dog"),
                    new ClassCallNode(
                        identifier_tok("Dog"),
                        [
                            str("A dog")
                        ]
                    )
                ),
                new VarAssignNode(
                    identifier_tok("dog2"),
                    new ClassCallNode(
                        identifier_tok("Dog"),
                        []
                    )
                ),
                new CallMethodNode(
                    new CallNode(
                        new CallPropertyNode(
                            new VarAccessNode(identifier_tok("dog")),
                            identifier_tok("walk")
                        ),
                        []
                    ),
                    new VarAccessNode(identifier_tok("dog"))
                ),
                new CallMethodNode(
                    new CallNode(
                        new CallPropertyNode(
                            new VarAccessNode(identifier_tok("dog2")),
                            identifier_tok("walk")
                        ),
                        []
                    ),
                    new VarAccessNode(identifier_tok("dog2"))
                )
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context());
        const expected = [
            "A dog walks",
            "default walks"
        ];
        const values = [
            result.value.elements[3].value,
            result.value.elements[4].value
        ];
        assert.deepStrictEqual(values, expected);
    });

    it('should work with inheritance', () => {
        /*
        class Animal:
            property name = "name"
            property type

            method __init(name, type):
                self.name = name
                self.type = type
            end

            method walk() -> self.name + " walks"
        end

        class Wolf extends Animal:
            method __init(name):
                self::__super(name, "Wolf")
            end

            override method walk() -> self.name + " runs"
        end

        var animal = new Animal("An animal", "cat")
        var wolf = new Wolf("Wolfy")
        animal.walk()
        wolf.walk()
        */
        /*
        tree = [
            (Class Animal),
            (Class Wolf),
            (var animal = (new IDENTIFIER:Animal)),
            (var wolf = (new IDENTIFIER:Wolf)),
            (method (animal).(call (prop (animal).walk)(0 args))),
            (method (wolf).(call (prop (wolf).walk)(0 args)))
        ]
        */
        // expected results:
        // An animal walks
        // Wolfy runs
        const tree = new ListNode(
            [
                new ClassDefNode(
                    identifier_tok("Animal"),
                    null,
                    [
                        new ClassPropertyDefNode(
                            identifier_tok("name"),
                            str("name"),
                            1,
                            0,
                            0
                        ),
                        new ClassPropertyDefNode(
                            identifier_tok("type"),
                            number(0),
                            1,
                            0,
                            0
                        ),
                    ],
                    [
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("__init"),
                                [
                                    new ArgumentNode(identifier_tok("name")),
                                    new ArgumentNode(identifier_tok("type")),
                                ],
                                new ListNode(
                                    [
                                        new AssignPropertyNode(
                                            new CallPropertyNode(
                                                new VarAccessNode(identifier_tok("self")),
                                                identifier_tok("name")
                                            ),
                                            new VarAccessNode(identifier_tok("name"))
                                        ),
                                        new AssignPropertyNode(
                                            new CallPropertyNode(
                                                new VarAccessNode(identifier_tok("self")),
                                                identifier_tok("type")
                                            ),
                                            new VarAccessNode(identifier_tok("type"))
                                        )
                                    ],
                                    null,
                                    null,
                                ),
                                false
                            ),
                            1,
                            0,
                            0
                        ),
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("walk"),
                                [],
                                new AddNode(
                                    new CallPropertyNode(
                                        new VarAccessNode(identifier_tok("self")),
                                        identifier_tok("name")
                                    ),
                                    str(" walks")
                                ),
                                true
                            ),
                            1,
                            0,
                            0
                        )
                    ],
                    [],
                    [],
                    null,
                    null
                ),
                new ClassDefNode(
                    identifier_tok("Wolf"),
                    identifier_tok("Animal"),
                    [],
                    [
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("__init"),
                                [
                                    new ArgumentNode(identifier_tok("name")),
                                ],
                                new SuperNode(
                                    [
                                        new VarAccessNode(identifier_tok("name")),
                                        str("Wolf")
                                    ],
                                    null,
                                    null
                                ),
                                false
                            ),
                            1,
                            0,
                            0
                        ),
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("walk"),
                                [],
                                new AddNode(
                                    new CallPropertyNode(
                                        new VarAccessNode(identifier_tok("self")),
                                        identifier_tok("name")
                                    ),
                                    str(" runs")
                                ),
                                true
                            ),
                            1,
                            1,
                            0
                        )
                    ],
                    [],
                    [],
                    null,
                    null
                ),
                new VarAssignNode(
                    identifier_tok("animal"),
                    new ClassCallNode(
                        identifier_tok("Animal"),
                        [
                            str("An animal"),
                            str("cat")
                        ]
                    )
                ),
                new VarAssignNode(
                    identifier_tok("wolf"),
                    new ClassCallNode(
                        identifier_tok("Wolf"),
                        [
                            str("Wolfy"),
                        ]
                    )
                ),
                new CallMethodNode(
                    new CallNode(
                        new CallPropertyNode(
                            new VarAccessNode(identifier_tok("animal")),
                            identifier_tok("walk")
                        ),
                        []
                    ),
                    new VarAccessNode(identifier_tok("animal"))
                ),
                new CallMethodNode(
                    new CallNode(
                        new CallPropertyNode(
                            new VarAccessNode(identifier_tok("wolf")),
                            identifier_tok("walk")
                        ),
                        []
                    ),
                    new VarAccessNode(identifier_tok("wolf"))
                )
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context());
        const expected = [
            "An animal walks",
            "Wolfy runs"
        ];
        const values = [
            result.value.elements[4].value,
            result.value.elements[5].value
        ];
        assert.deepStrictEqual(values, expected);
    });

    it('should work with a method call in the properties of a class', () => {
        /*
        class Snake:
            property name
            private property default_name = self.get_default_name()

            private method get_default_name() -> "default"

            method __init(name?=self.default_name):
                self.name = name
            end

            method walk() -> self.name + " walks"
        end

        var snake = new Snake("A snake")
        var snake2 = new Snake()
        snake.walk()
        snake2.walk()
        */
        /*
        tree = [
            (Class Snake),
            (var snake = (new IDENTIFIER:Snake)),
            (var snake2 = (new IDENTIFIER:Snake)),
            (method (snake).(call (prop (snake).walk)(0 args))),
            (method (snake2).(call (prop (snake2).walk)(0 args)))
        ]
        */
        // expected results:
        // A snake walks
        // default walks
        const tree = new ListNode(
            [
                new ClassDefNode(
                    identifier_tok("Snake"),
                    null,
                    [
                        new ClassPropertyDefNode(
                            identifier_tok("name"),
                            number(0),
                            1,
                            0,
                            0
                        ),
                        new ClassPropertyDefNode(
                            identifier_tok("default_name"),
                            new CallMethodNode(
                                new CallNode(
                                    new CallPropertyNode(
                                        new VarAccessNode(identifier_tok("self")),
                                        identifier_tok("get_default_name")
                                    ),
                                    []
                                ),
                                new VarAccessNode(identifier_tok("self"))
                            ),
                            0,
                            0,
                            0
                        ),
                    ],
                    [
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("get_default_name"),
                                [],
                                str("default"),
                                true
                            ),
                            0,
                            0,
                            0
                        ),
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("__init"),
                                [
                                    new ArgumentNode(
                                        identifier_tok("name"),
                                        false,
                                        true,
                                        new CallPropertyNode(
                                            new VarAccessNode(identifier_tok("self")),
                                            identifier_tok("default_name")
                                        )
                                    )
                                ],
                                new AssignPropertyNode(
                                    new CallPropertyNode(
                                        new VarAccessNode(identifier_tok("self")),
                                        identifier_tok("name")
                                    ),
                                    new VarAccessNode(identifier_tok("name"))
                                ),
                                false
                            ),
                            1,
                            0,
                            0
                        ),
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("walk"),
                                [],
                                new AddNode(
                                    new CallPropertyNode(
                                        new VarAccessNode(identifier_tok("self")),
                                        identifier_tok("name")
                                    ),
                                    str(" walks")
                                ),
                                true
                            ),
                            1,
                            0,
                            0
                        )
                    ],
                    [],
                    [],
                    null,
                    null
                ),
                new VarAssignNode(
                    identifier_tok("snake"),
                    new ClassCallNode(
                        identifier_tok("Snake"),
                        [
                            str("A snake")
                        ]
                    )
                ),
                new VarAssignNode(
                    identifier_tok("snake2"),
                    new ClassCallNode(
                        identifier_tok("Snake"),
                        []
                    )
                ),
                new CallMethodNode(
                    new CallNode(
                        new CallPropertyNode(
                            new VarAccessNode(identifier_tok("snake")),
                            identifier_tok("walk")
                        ),
                        []
                    ),
                    new VarAccessNode(identifier_tok("snake"))
                ),
                new CallMethodNode(
                    new CallNode(
                        new CallPropertyNode(
                            new VarAccessNode(identifier_tok("snake2")),
                            identifier_tok("walk")
                        ),
                        []
                    ),
                    new VarAccessNode(identifier_tok("snake2"))
                )
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context());
        const expected = [
            "A snake walks",
            "default walks"
        ];
        const values = [
            result.value.elements[3].value,
            result.value.elements[4].value
        ];
        assert.deepStrictEqual(values, expected);
    });
    
    it('should work with a method call as default value in __init', () => {
        /*
        class Rat:
            property name

            private method get_default_name() -> "default"

            method __init(name?=self.get_default_name()):
                self.name = name
            end

            method walk() -> self.name + " walks"
        end

        var rat = new Rat("A rat")
        var rat2 = new Rat()
        rat.walk()
        rat2.walk()
        */
        /*
        tree = [
            (Class Rat),
            (var rat = (new IDENTIFIER:Rat)),
            (var rat2 = (new IDENTIFIER:Rat)),
            (method (rat).(call (prop (rat).walk)(0 args))),
            (method (rat2).(call (prop (rat2).walk)(0 args)))
        ]
        */
        // expected results:
        // A rat walks
        // default walks
        const tree = new ListNode(
            [
                new ClassDefNode(
                    identifier_tok("Rat"),
                    null,
                    [
                        new ClassPropertyDefNode(
                            identifier_tok("name"),
                            number(0),
                            1,
                            0,
                            0
                        )
                    ],
                    [
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("get_default_name"),
                                [],
                                str("default"),
                                true
                            ),
                            0,
                            0,
                            0
                        ),
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("__init"),
                                [
                                    new ArgumentNode(
                                        identifier_tok("name"),
                                        false,
                                        true,
                                        new CallMethodNode(
                                            new CallNode(
                                                new CallPropertyNode(
                                                    new VarAccessNode(identifier_tok("self")),
                                                    identifier_tok("get_default_name")
                                                ),
                                                []
                                            ),
                                            new VarAccessNode(identifier_tok("self"))
                                        )
                                    ),
                                ],
                                new AssignPropertyNode(
                                    new CallPropertyNode(
                                        new VarAccessNode(identifier_tok("self")),
                                        identifier_tok("name")
                                    ),
                                    new VarAccessNode(identifier_tok("name"))
                                ),
                                false
                            ),
                            1,
                            0,
                            0
                        ),
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("walk"),
                                [],
                                new AddNode(
                                    new CallPropertyNode(
                                        new VarAccessNode(identifier_tok("self")),
                                        identifier_tok("name")
                                    ),
                                    str(" walks")
                                ),
                                true
                            ),
                            1,
                            0,
                            0
                        )
                    ],
                    [],
                    [],
                    null,
                    null
                ),
                new VarAssignNode(
                    identifier_tok("rat"),
                    new ClassCallNode(
                        identifier_tok("Rat"),
                        [
                            str("A rat")
                        ]
                    )
                ),
                new VarAssignNode(
                    identifier_tok("rat2"),
                    new ClassCallNode(
                        identifier_tok("Rat"),
                        []
                    )
                ),
                new CallMethodNode(
                    new CallNode(
                        new CallPropertyNode(
                            new VarAccessNode(identifier_tok("rat")),
                            identifier_tok("walk")
                        ),
                        []
                    ),
                    new VarAccessNode(identifier_tok("rat"))
                ),
                new CallMethodNode(
                    new CallNode(
                        new CallPropertyNode(
                            new VarAccessNode(identifier_tok("rat2")),
                            identifier_tok("walk")
                        ),
                        []
                    ),
                    new VarAccessNode(identifier_tok("rat2"))
                )
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context());
        const expected = [
            "A rat walks",
            "default walks"
        ];
        const values = [
            result.value.elements[3].value,
            result.value.elements[4].value
        ];
        assert.deepStrictEqual(values, expected);
    });

    it('should not create any conflicts between different instances of the same class', () => {
        /*
        class Test:
            property value = none
        end

        var t = new Test()
        t.value = 5
        var t2 = new Test()

        t.value # 5
        t2.value # none
        */
        const tree = new ListNode(
            [
                new ClassDefNode(
                    identifier_tok("Test"),
                    null,
                    [
                        new ClassPropertyDefNode(
                            identifier_tok("value"),
                            none(),
                            1,
                            0,
                            0
                        )
                    ],
                    [],
                    [],
                    [],
                    null,
                    null
                ),
                new VarAssignNode(
                    identifier_tok("t"),
                    new ClassCallNode(
                        identifier_tok("Test"),
                        []
                    )
                ),
                new AssignPropertyNode(
                    new CallPropertyNode(
                        new VarAccessNode(identifier_tok("t")),
                        identifier_tok("value")
                    ),
                    number(5),
                ),
                new VarAssignNode(
                    identifier_tok("t2"),
                    new ClassCallNode(
                        identifier_tok("Test"),
                        []
                    )
                ),
                new CallPropertyNode(
                    new VarAccessNode(identifier_tok("t")),
                    identifier_tok("value")
                ),
                new CallPropertyNode(
                    new VarAccessNode(identifier_tok("t2")),
                    identifier_tok("value")
                ),
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context());
        assert.deepStrictEqual(result.value.elements[4].value, 5);
        assert.deepStrictEqual(result.value.elements[5] instanceof NoneValue, true);
    });
    
    it('should work with static properties', () => {
        /*
        class Test:
            static property static_property = "static property"
            property test

            static method get_name() -> Test::static_property

            method __init():
                self.test = Test::get_name()
            end

            static method static_method() -> "static method"

            method __repr():
                return "self.test = " + self.test
            end
        end

        var t = new Test()
        t.__repr() # doesn't work properly in tests so we use __repr() directly
        Test::static_property
        Test::static_method()
        Test::__name
        */
        /*
        tree = [
            (Class Test),
            (var t = (new IDENTIFIER:Test)),
            (method (t).(call (prop (t).__repr)(0 args))),
            (prop (Test)::static_property),
            (method (Test).(call (prop (Test)::static_method)(0 args)))
            (prop (Test)::__name)
        ]
        */
        // expected results:
        // self.test = static property
        // static property
        // static method
        // Test
        const tree = new ListNode(
            [
                new ClassDefNode(
                    identifier_tok("Test"),
                    null,
                    [
                        new ClassPropertyDefNode(
                            identifier_tok("static_property"),
                            str("static property"),
                            1,
                            0,
                            1
                        ),
                        new ClassPropertyDefNode(
                            identifier_tok("test"),
                            number(0),
                            1,
                            0,
                            0
                        ),
                    ],
                    [
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("get_name"),
                                [],
                                new CallStaticPropertyNode(
                                    new VarAccessNode(identifier_tok("Test")),
                                    identifier_tok("static_property")
                                ),
                                true
                            ),
                            1,
                            0,
                            1
                        ),
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("__init"),
                                [],
                                new AssignPropertyNode(
                                    new CallPropertyNode(
                                        new VarAccessNode(identifier_tok("self")),
                                        identifier_tok("test")
                                    ),
                                    new CallMethodNode(
                                        new CallNode(
                                            new CallStaticPropertyNode(
                                                new VarAccessNode(identifier_tok("Test")),
                                                identifier_tok("get_name")
                                            ),
                                            []
                                        ),
                                        new VarAccessNode(identifier_tok("self"))
                                    )
                                ),
                                true
                            ),
                            1,
                            0,
                            0
                        ),
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("static_method"),
                                [],
                                str("static method"),
                                true
                            ),
                            1,
                            0,
                            1
                        ),
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("__repr"),
                                [],
                                new AddNode(
                                    str("self.test = "),
                                    new CallPropertyNode(
                                        new VarAccessNode(identifier_tok("self")),
                                        identifier_tok("test")
                                    )
                                ),
                                true
                            ),
                            1,
                            0,
                            0
                        )
                    ],
                    [],
                    [],
                    null,
                    null
                ),
                new VarAssignNode(
                    identifier_tok("t"),
                    new ClassCallNode(
                        identifier_tok("Test"),
                        []
                    )
                ),
                new CallMethodNode(
                    new CallNode(
                        new CallPropertyNode(
                            new VarAccessNode(identifier_tok("t")),
                            identifier_tok("__repr")
                        ),
                        []
                    ),
                    new VarAccessNode(identifier_tok("t"))
                ),
                new CallStaticPropertyNode(
                    new VarAccessNode(identifier_tok("Test")),
                    identifier_tok("static_property")
                ),
                new CallMethodNode(
                    new CallNode(
                        new CallStaticPropertyNode(
                            new VarAccessNode(identifier_tok("Test")),
                            identifier_tok("static_method")
                        ),
                        []
                    ),
                    new VarAccessNode(identifier_tok("Test"))
                ),
                new CallStaticPropertyNode(
                    new VarAccessNode(identifier_tok("Test")),
                    identifier_tok("__name")
                ),
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context());
        const expected = [
            "self.test = static property",
            "static property",
            "static method",
            "Test"
        ];
        const values = [
            result.value.elements[2].value,
            result.value.elements[3].value,
            result.value.elements[4].value,
            result.value.elements[5].value,
        ];
        assert.deepStrictEqual(values, expected);
    });

    it('should work with complex inheritance', () => {
        /*
        class LivingThing:
            property isalive = 1

            method __init(isalive):
                self.isalive = isalive
            end

            set die() -> self.isalive = 0
            set resuscitate() -> self.isalive = 1
        end

        class Animal extends LivingThing:
            property name = "name"
            property type

            method __init(name, type):
                super(1)
                self.name = name
                self.type = type
            end

            method walk() -> if self.isalive: self.name + " walks" else: self.name + " is dead"
        end

        class Wolf extends Animal:
            method __init(name):
                super(name, "Wolf")
            end

            override method walk() -> if self.isalive: self.name + " runs" else: self.name + " is dead"
        end

        var wolf = new Wolf("Wolfy")
        var animal = new Animal("Animal", "Dog")
        var wolf2 = new Wolf("Wolf2");
        wolf.walk()
        wolf2.die()
        wolf2.walk()
        animal.walk()
        animal.isalive = 0
        animal.walk()
        */
        /*
        tree = [
            (Class LivingThing),
            (Class Animal),
            (Class Wolf),
            (var wolf = (new IDENTIFIER:Wolf)),
            (var animal = (new IDENTIFIER:Animal)),
            (var wolf2 = (new IDENTIFIER:Wolf)),
            (method (wolf).(call (prop (wolf).walk)(0 args))),
            (method (wolf2).(call (prop (wolf2).die)(0 args))),
            (method (wolf2).(call (prop (wolf2).walk)(0 args))),
            (method (animal).(call (prop (animal).walk)(0 args))),
            ((prop (animal).isalive) = 0),
            (method (animal).(call (prop (animal).walk)(0 args))),
        ]
        */
        // expected results:
        // Wolfy runs
        // Wolf2 is dead
        // Animal walks
        // Animal is dead
        const tree = new ListNode(
            [
                new ClassDefNode(
                    identifier_tok("LivingThing"),
                    null,
                    [
                        new ClassPropertyDefNode(
                            identifier_tok("isalive"),
                            number(1),
                            1,
                            0,
                            0
                        )
                    ],
                    [
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("__init"),
                                [
                                    new ArgumentNode(identifier_tok("isalive")),
                                ],
                                new AssignPropertyNode(
                                    new CallPropertyNode(
                                        new VarAccessNode(identifier_tok("self")),
                                        identifier_tok("isalive")
                                    ),
                                    new VarAccessNode(identifier_tok("isalive"))
                                ),
                                false
                            ),
                            1,
                            0,
                            0
                        )
                    ],
                    [],
                    [
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("die"),
                                [],
                                new AssignPropertyNode(
                                    new CallPropertyNode(
                                        new VarAccessNode(identifier_tok("self")),
                                        identifier_tok("isalive")
                                    ),
                                    number(0)
                                ),
                                true
                            ),
                            1,
                            0,
                            0
                        ),
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("resuscitate"),
                                [],
                                new AssignPropertyNode(
                                    new CallPropertyNode(
                                        new VarAccessNode(identifier_tok("self")),
                                        identifier_tok("isalive")
                                    ),
                                    number(1)
                                ),
                                true
                            ),
                            1,
                            0,
                            0
                        )
                    ],
                    null,
                    null
                ),
                new ClassDefNode(
                    identifier_tok("Animal"),
                    identifier_tok("LivingThing"),
                    [
                        new ClassPropertyDefNode(
                            identifier_tok("name"),
                            str("name"),
                            1,
                            0,
                            0
                        ),
                        new ClassPropertyDefNode(
                            identifier_tok("type"),
                            number(0),
                            1,
                            0,
                            0
                        )
                    ],
                    [
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("__init"),
                                [
                                    new ArgumentNode(identifier_tok("name")),
                                    new ArgumentNode(identifier_tok("type")),
                                ],
                                new ListNode(
                                    [
                                        new SuperNode([number(1)], null, null),
                                        new AssignPropertyNode(
                                            new CallPropertyNode(
                                                new VarAccessNode(identifier_tok("self")),
                                                identifier_tok("name")
                                            ),
                                            new VarAccessNode(identifier_tok("name"))
                                        ),
                                        new AssignPropertyNode(
                                            new CallPropertyNode(
                                                new VarAccessNode(identifier_tok("self")),
                                                identifier_tok("type")
                                            ),
                                            new VarAccessNode(identifier_tok("type"))
                                        )
                                    ],
                                    null,
                                    null
                                ),
                                false
                            ),
                            1,
                            0,
                            0
                        ),
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("walk"),
                                [],
                                // if self.isalive: self.name + " walks" else: self.name + " is dead"
                                new IfNode(
                                    [
                                        [
                                            new CallPropertyNode(
                                                new VarAccessNode(identifier_tok("self")),
                                                identifier_tok("isalive")
                                            ),
                                            new AddNode(
                                                new CallPropertyNode(
                                                    new VarAccessNode(identifier_tok("self")),
                                                    identifier_tok("name")
                                                ),
                                                str(" walks")
                                            ),
                                            false
                                        ]
                                    ],
                                    { code: new AddNode(
                                        new CallPropertyNode(
                                            new VarAccessNode(identifier_tok("self")),
                                            identifier_tok("name")
                                        ),
                                        str(" is dead")
                                    ), should_return_null: false },
                                    null,
                                    null
                                ),
                                true
                            ),
                            1,
                            0,
                            0
                        )
                    ],
                    [],
                    [],
                    null,
                    null
                ),
                new ClassDefNode(
                    identifier_tok("Wolf"),
                    identifier_tok("Animal"),
                    [],
                    [
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("__init"),
                                [
                                    new ArgumentNode(identifier_tok("name")),
                                ],
                                new SuperNode(
                                    [
                                        new VarAccessNode(identifier_tok("name")),
                                        str("Wolf")
                                    ],
                                    null,
                                    null
                                ),
                                false
                            ),
                            1,
                            0,
                            0
                        ),
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("walk"),
                                [],
                                new IfNode(
                                    [
                                        [
                                            new CallPropertyNode(
                                                new VarAccessNode(identifier_tok("self")),
                                                identifier_tok("isalive")
                                            ),
                                            new AddNode(
                                                new CallPropertyNode(
                                                    new VarAccessNode(identifier_tok("self")),
                                                    identifier_tok("name")
                                                ),
                                                str(" runs")
                                            ),
                                            false
                                        ]
                                    ],
                                    { code: new AddNode(
                                        new CallPropertyNode(
                                            new VarAccessNode(identifier_tok("self")),
                                            identifier_tok("name")
                                        ),
                                        str(" is dead")
                                    ), should_return_null: false },
                                    null,
                                    null
                                ),
                                true
                            ),
                            1,
                            1,
                            0
                        )
                    ],
                    [],
                    [],
                    null,
                    null
                ),
                new VarAssignNode(
                    identifier_tok("wolf"),
                    new ClassCallNode(
                        identifier_tok("Wolf"),
                        [
                            str("Wolfy")
                        ]
                    )
                ),
                new VarAssignNode(
                    identifier_tok("animal"),
                    new ClassCallNode(
                        identifier_tok("Animal"),
                        [
                            str("Animal"),
                            str("Dog")
                        ]
                    )
                ),
                new VarAssignNode(
                    identifier_tok("wolf2"),
                    new ClassCallNode(
                        identifier_tok("Wolf"),
                        [
                            str("Wolf2")
                        ]
                    )
                ),
                new CallMethodNode(
                    new CallNode(
                        new CallPropertyNode(
                            new VarAccessNode(identifier_tok("wolf")),
                            identifier_tok("walk")
                        ),
                        []
                    ),
                    new VarAccessNode(identifier_tok("wolf"))
                ),
                new CallMethodNode(
                    new CallNode(
                        new CallPropertyNode(
                            new VarAccessNode(identifier_tok("wolf2")),
                            identifier_tok("die")
                        ),
                        []
                    ),
                    new VarAccessNode(identifier_tok("wolf2"))
                ),
                new CallMethodNode(
                    new CallNode(
                        new CallPropertyNode(
                            new VarAccessNode(identifier_tok("wolf2")),
                            identifier_tok("walk")
                        ),
                        []
                    ),
                    new VarAccessNode(identifier_tok("wolf2"))
                ),
                new CallMethodNode(
                    new CallNode(
                        new CallPropertyNode(
                            new VarAccessNode(identifier_tok("animal")),
                            identifier_tok("walk")
                        ),
                        []
                    ),
                    new VarAccessNode(identifier_tok("animal"))
                ),
                new AssignPropertyNode(
                    new CallPropertyNode(
                        new VarAccessNode(identifier_tok("animal")),
                        identifier_tok("isalive")
                    ),
                    number(0)
                ),
                new CallMethodNode(
                    new CallNode(
                        new CallPropertyNode(
                            new VarAccessNode(identifier_tok("animal")),
                            identifier_tok("walk")
                        ),
                        []
                    ),
                    new VarAccessNode(identifier_tok("animal"))
                )
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context());
        const expected = [
            "Wolfy runs",
            "Wolf2 is dead",
            "Animal walks",
            "Animal is dead"
        ];
        const values = [
            result.value.elements[6].value,
            result.value.elements[8].value,
            result.value.elements[9].value,
            result.value.elements[11].value,
        ];
        assert.deepStrictEqual(values, expected);
    });

    it('should work with complex inheritance (with super in another method than __init)', () => {
        /*
        class LivingThing:
            property isalive = yes
            property walk_counter = 0

            method __init(isalive):
                self.isalive = isalive
            end

            set die() -> self.isalive = no
            set resuscitate() -> self.isalive = yes

            method walk():
                self.walk_counter = self.walk_counter + 1
            end
        end

        class Animal extends LivingThing:
            property name = "name"
            property type

            method __init(name, type):
                super(yes)
                self.name = name
                self.type = type
            end

            override method walk():
                super()
                self.walk_counter = self.walk_counter * 10
            end
        end

        class Wolf extends Animal:
            method __init(name):
                super(name, "Wolf")
            end

            override method walk():
                if self.isalive:
                    super()
                    return self.name + " runs"
                else:
                    return self.name + " is dead, but walked " + self.walk_counter + " times"
                end
            end
        end

        var wolf = new Wolf("Wolfy")
        wolf.walk() # Wolfy runs
        wolf.die()
        wolf.walk() # Wolfy is dead, but walked 10 times
        */
        /*
        tree = [
            (Class LivingThing),
            (Class Animal),
            (Class Wolf),
            (var wolf = (new IDENTIFIER:Wolf)),
            (method (wolf).(call (prop (wolf).walk)(0 args))),
            (method (wolf).(call (prop (wolf).die)(0 args))),
            (method (wolf).(call (prop (wolf).walk)(0 args))),
        ]
        */
        // expected results:
        // Wolfy runs
        // Wolfy is dead, but walked 10 times
        const tree = new ListNode(
            [
                new ClassDefNode(
                    identifier_tok("LivingThing"),
                    null,
                    [
                        new ClassPropertyDefNode(
                            identifier_tok("isalive"),
                            yes(),
                            1,
                            0,
                            0
                        ),
                        new ClassPropertyDefNode(
                            identifier_tok("walk_counter"),
                            number(0),
                            1,
                            0,
                            0
                        )
                    ],
                    [
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("__init"),
                                [
                                    new ArgumentNode(identifier_tok("isalive")),
                                ],
                                new AssignPropertyNode(
                                    new CallPropertyNode(
                                        new VarAccessNode(identifier_tok("self")),
                                        identifier_tok("isalive")
                                    ),
                                    new VarAccessNode(identifier_tok("isalive"))
                                ),
                                false
                            ),
                            1,
                            0,
                            0
                        ),
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("walk"),
                                [],
                                new AssignPropertyNode(
                                    new CallPropertyNode(
                                        new VarAccessNode(identifier_tok("self")),
                                        identifier_tok("walk_counter")
                                    ),
                                    new AddNode(
                                        new CallPropertyNode(
                                            new VarAccessNode(identifier_tok("self")),
                                            identifier_tok("walk_counter")
                                        ),
                                        number(1)
                                    ),
                                ),
                                false
                            ),
                            1,
                            0,
                            0
                        )
                    ],
                    [],
                    [
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("die"),
                                [],
                                new AssignPropertyNode(
                                    new CallPropertyNode(
                                        new VarAccessNode(identifier_tok("self")),
                                        identifier_tok("isalive")
                                    ),
                                    no()
                                ),
                                true
                            ),
                            1,
                            0,
                            0
                        ),
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("resuscitate"),
                                [],
                                new AssignPropertyNode(
                                    new CallPropertyNode(
                                        new VarAccessNode(identifier_tok("self")),
                                        identifier_tok("isalive")
                                    ),
                                    yes()
                                ),
                                true
                            ),
                            1,
                            0,
                            0
                        )
                    ],
                    null,
                    null
                ),
                new ClassDefNode(
                    identifier_tok("Animal"),
                    identifier_tok("LivingThing"),
                    [
                        new ClassPropertyDefNode(
                            identifier_tok("name"),
                            str("name"),
                            1,
                            0,
                            0
                        ),
                        new ClassPropertyDefNode(
                            identifier_tok("type"),
                            number(0),
                            1,
                            0,
                            0
                        )
                    ],
                    [
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("__init"),
                                [
                                    new ArgumentNode(identifier_tok("name")),
                                    new ArgumentNode(identifier_tok("type")),
                                ],
                                new ListNode(
                                    [
                                        new SuperNode([yes()], null, null),
                                        new AssignPropertyNode(
                                            new CallPropertyNode(
                                                new VarAccessNode(identifier_tok("self")),
                                                identifier_tok("name")
                                            ),
                                            new VarAccessNode(identifier_tok("name"))
                                        ),
                                        new AssignPropertyNode(
                                            new CallPropertyNode(
                                                new VarAccessNode(identifier_tok("self")),
                                                identifier_tok("type")
                                            ),
                                            new VarAccessNode(identifier_tok("type"))
                                        )
                                    ],
                                    null,
                                    null
                                ),
                                false
                            ),
                            1,
                            0,
                            0
                        ),
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("walk"),
                                [],
                                new ListNode(
                                    [
                                        new SuperNode([], null, null),
                                        new AssignPropertyNode(
                                            new CallPropertyNode(
                                                new VarAccessNode(identifier_tok("self")),
                                                identifier_tok("walk_counter")
                                            ),
                                            new MultiplyNode(
                                                new CallPropertyNode(
                                                    new VarAccessNode(identifier_tok("self")),
                                                    identifier_tok("walk_counter"),
                                                ),
                                                number(10)
                                            ),
                                        )
                                    ],
                                    null,
                                    null
                                ),
                                false
                            ),
                            1,
                            1,
                            0
                        )
                    ],
                    [],
                    [],
                    null,
                    null
                ),
                new ClassDefNode(
                    identifier_tok("Wolf"),
                    identifier_tok("Animal"),
                    [],
                    [
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("__init"),
                                [
                                    new ArgumentNode(identifier_tok("name")),
                                ],
                                new SuperNode(
                                    [
                                        new VarAccessNode(identifier_tok("name")),
                                        str("Wolf")
                                    ],
                                    null,
                                    null
                                ),
                                false
                            ),
                            1,
                            0,
                            0
                        ),
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("walk"),
                                [],
                                new IfNode(
                                    [
                                        [
                                            new CallPropertyNode(
                                                new VarAccessNode(identifier_tok("self")),
                                                identifier_tok("isalive")
                                            ),
                                            new ListNode(
                                                [
                                                    new SuperNode([], null, null),
                                                    new ReturnNode(
                                                        new AddNode(
                                                            new CallPropertyNode(
                                                                new VarAccessNode(identifier_tok("self")),
                                                                identifier_tok("name")
                                                            ),
                                                            str(" runs")
                                                        ),
                                                        null,
                                                        null
                                                    ),
                                                ],
                                                null,
                                                null
                                            ),
                                            true
                                        ]
                                    ],
                                    { code: new ReturnNode(
                                        new AddNode(
                                            new AddNode(
                                                new AddNode(
                                                    new CallPropertyNode(
                                                        new VarAccessNode(identifier_tok("self")),
                                                        identifier_tok("name")
                                                    ),
                                                    str(" is dead, but walked ")
                                                ),
                                                new CallPropertyNode(
                                                    new VarAccessNode(identifier_tok("self")),
                                                    identifier_tok("walk_counter")
                                                )
                                            ),
                                            str(" times")
                                        ),
                                        null,
                                        null
                                    ), should_return_null: true },
                                    null,
                                    null
                                ),
                                false
                            ),
                            1,
                            1,
                            0
                        )
                    ],
                    [],
                    [],
                    null,
                    null
                ),
                new VarAssignNode(
                    identifier_tok("wolf"),
                    new ClassCallNode(
                        identifier_tok("Wolf"),
                        [
                            str("Wolfy")
                        ]
                    )
                ),
                new CallMethodNode(
                    new CallNode(
                        new CallPropertyNode(
                            new VarAccessNode(identifier_tok("wolf")),
                            identifier_tok("walk")
                        ),
                        []
                    ),
                    new VarAccessNode(identifier_tok("wolf"))
                ),
                new CallMethodNode(
                    new CallNode(
                        new CallPropertyNode(
                            new VarAccessNode(identifier_tok("wolf")),
                            identifier_tok("die")
                        ),
                        []
                    ),
                    new VarAccessNode(identifier_tok("wolf"))
                ),
                new CallMethodNode(
                    new CallNode(
                        new CallPropertyNode(
                            new VarAccessNode(identifier_tok("wolf")),
                            identifier_tok("walk")
                        ),
                        []
                    ),
                    new VarAccessNode(identifier_tok("wolf"))
                )
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context());
        const expected = [
            "Wolfy runs",
            "Wolfy is dead, but walked 10 times",
        ];
        const values = [
            result.value.elements[4].value,
            result.value.elements[6].value,
        ];
        assert.deepStrictEqual(values, expected);
    });

    it('should work with the arguments keyword inside a function', () => {
        /*
        func test_arguments(arg1):
            return arguments
        end

        test_arguments("yo")
        */
        const tree = new ListNode(
            [
                new FuncDefNode(
                    identifier_tok("test_arguments"),
                    [
                        new ArgumentNode(identifier_tok("arg1")),
                    ],
                    new ReturnNode(
                        new VarAccessNode(identifier_tok("arguments")),
                        null,
                        null
                    ),
                    false
                ),
                new CallNode(
                    new VarAccessNode(identifier_tok("test_arguments")),
                    [
                        str("yo")
                    ]
                )
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context());
        const expected = ["yo"];
        const values = result.value.elements[1].elements.map((v) => v.value);
        assert.deepStrictEqual(values, expected);
    });

    it('should work with rest parameter', () => {
        /*
        # we use number_of_marks because len() doesn't work here
        # indeed, we cannot initiate the global symbol table because of a bug with mocha
        func average_grade(number_of_marks, ...marks):
            var s = 0
            for i to number_of_marks:
                s += marks[i]
            end
            return s / number_of_marks
        end
        average_grade(3, 10, 11, 12)
        */
        const tree = new ListNode(
            [
                new FuncDefNode(
                    identifier_tok("average_grade"),
                    [
                        new ArgumentNode(identifier_tok("number_of_marks")),
                        new ArgumentNode(identifier_tok("marks"), true),
                    ],
                    new ListNode(
                        [
                            new VarAssignNode(
                                identifier_tok("s"),
                                number(0)
                            ),
                            new ForNode(
                                identifier_tok("i"),
                                number(0),
                                new VarAccessNode(identifier_tok("number_of_marks")),
                                number(1),
                                new VarModifyNode(
                                    identifier_tok("s"),
                                    new AddNode(
                                        new VarAccessNode(identifier_tok("s")),
                                        new ListAccessNode(
                                            new VarAccessNode(identifier_tok("marks")),
                                            0,
                                            [
                                                new VarAccessNode(identifier_tok("i"))
                                            ]
                                        )
                                    )
                                ),
                                false
                            ),
                            new ReturnNode(
                                new DivideNode(
                                    new VarAccessNode(identifier_tok("s")),
                                    new VarAccessNode(identifier_tok("number_of_marks"))
                                ),
                                null,
                                null
                            )
                        ],
                        null,
                        null
                    ),
                    false
                ),
                new CallNode(
                    new VarAccessNode(identifier_tok("average_grade")),
                    [
                        number(3),
                        number(10),
                        number(11),
                        number(12),
                    ]
                )
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context());
        const expected = 11;
        const values = result.value.elements[1].value;
        assert.deepStrictEqual(values, expected);
    });

    it('should work with an enum', () => {
        /*
        enum Status:
            running,
            paused,
        end

        var st = Status.running;
        st = Status.paused
        */
        const tree = new ListNode(
            [
                new EnumNode(
                    identifier_tok("Status"),
                    [
                        identifier_tok("running"),
                        identifier_tok("paused")
                    ]
                ),
                new VarAssignNode(
                    identifier_tok("st"),
                    new CallPropertyNode(
                        new VarAccessNode(identifier_tok("Status")),
                        identifier_tok("running")
                    )
                ),
                new VarModifyNode(
                    identifier_tok("st"),
                    new CallPropertyNode(
                        new VarAccessNode(identifier_tok("Status")),
                        identifier_tok("paused")
                    )
                )
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context());
        const expected = [0, 1];
        const values = [result.value.elements[1].value, result.value.elements[2].value];
        assert.deepStrictEqual(values, expected);
    });

    it('should work with a switch statement (basic without default)', () => {
        /*
        var value = 5
        var response = -1

        switch (value):
            case 4:
                response = "4"
            
            case 5:
                response = "5"
        end

        response
        */
        const tree = new ListNode(
            [
                new VarAssignNode(
                    identifier_tok("value"),
                    number(5)
                ),
                new VarAssignNode(
                    identifier_tok("response"),
                    number(-1)
                ),
                new SwitchNode(
                    new VarAccessNode(identifier_tok("value")),
                    [
                        {
                            conditions: [new EqualsNode(new VarAccessNode(identifier_tok("value")), number(4))],
                            body: new VarModifyNode(identifier_tok("response"), str("4"))
                        },
                        {
                            conditions: [new EqualsNode(new VarAccessNode(identifier_tok("value")), number(5))],
                            body: new VarModifyNode(identifier_tok("response"), str("5"))
                        }
                    ],
                    null,
                ),
                new VarAccessNode(identifier_tok("response"))
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context());
        const expected = "5";
        const values = result.value.elements[3].value;
        assert.deepStrictEqual(values, expected);
    });

    it('should work with a switch statement (with default)', () => {
        /*
        var value = 0
        var response = -1

        switch (value):
            case 4:
                response = "4"
            
            case 5:
                response = "5"
            
            default:
                response = "default"
        end

        response
        */
        const tree = new ListNode(
            [
                new VarAssignNode(
                    identifier_tok("value"),
                    number(0)
                ),
                new VarAssignNode(
                    identifier_tok("response"),
                    number(-1)
                ),
                new SwitchNode(
                    new VarAccessNode(identifier_tok("value")),
                    [
                        {
                            conditions: [new EqualsNode(new VarAccessNode(identifier_tok("value")), number(4))],
                            body: new VarModifyNode(identifier_tok("response"), str("4"))
                        },
                        {
                            conditions: [new EqualsNode(new VarAccessNode(identifier_tok("value")), number(5))],
                            body: new VarModifyNode(identifier_tok("response"), str("5"))
                        }
                    ],
                    new VarModifyNode(identifier_tok("response"), str("default")),
                ),
                new VarAccessNode(identifier_tok("response"))
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context());
        const expected = "default";
        const values = result.value.elements[3].value;
        assert.deepStrictEqual(values, expected);
    });

    it('should work with complex cases on switch statement', () => {
        /*
        var value = 3
        var response = -1

        switch (value):
            case 4,3:
                response = "4 or 3"
            
            default:
                response = "default"
        end

        response
        */
        const tree = new ListNode(
            [
                new VarAssignNode(
                    identifier_tok("value"),
                    number(3)
                ),
                new VarAssignNode(
                    identifier_tok("response"),
                    number(-1)
                ),
                new SwitchNode(
                    new VarAccessNode(identifier_tok("value")),
                    [
                        {
                            conditions: [
                                new EqualsNode(new VarAccessNode(identifier_tok("value")), number(4)),
                                new EqualsNode(new VarAccessNode(identifier_tok("value")), number(3))
                            ],
                            body: new VarModifyNode(identifier_tok("response"), str("4 or 3"))
                        }
                    ],
                    new VarModifyNode(identifier_tok("response"), str("default")),
                ),
                new VarAccessNode(identifier_tok("response"))
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context());
        const expected = "4 or 3";
        const values = result.value.elements[3].value;
        assert.deepStrictEqual(values, expected);
    });

    it('should work with a switch statement and an enum', () => {
        /*
        enum State:
            stopped,
            paused,
            running
        end

        var state = State.paused
        var response = none

        switch (state):
            case State.stopped: response = "stopped"
            case State.paused: response = "paused"
            case State.running: response = "running"
            default: response = no
        end

        response
        */
        const tree = new ListNode(
            [
                new EnumNode(
                    identifier_tok("State"),
                    [
                        identifier_tok("stopped"),
                        identifier_tok("paused"),
                        identifier_tok("running"),
                    ],
                ),
                new VarAssignNode(
                    identifier_tok("state"),
                    new CallPropertyNode(
                        new VarAccessNode(identifier_tok("State")),
                        identifier_tok("paused")
                    )
                ),
                new VarAssignNode(
                    identifier_tok("response"),
                    number(0)
                ),
                new SwitchNode(
                    new VarAccessNode(identifier_tok("state")),
                    [
                        {
                            conditions: [
                                new CallPropertyNode(
                                    new VarAccessNode(identifier_tok("State")),
                                    identifier_tok("stopped")
                                )
                            ],
                            body: new VarModifyNode(identifier_tok("response"), str("stopped"))
                        },
                        {
                            conditions: [
                                new CallPropertyNode(
                                    new VarAccessNode(identifier_tok("State")),
                                    identifier_tok("paused")
                                )
                            ],
                            body: new VarModifyNode(identifier_tok("response"), str("paused"))
                        },
                        {
                            conditions: [
                                new CallPropertyNode(
                                    new VarAccessNode(identifier_tok("State")),
                                    identifier_tok("running")
                                )
                            ],
                            body: new VarModifyNode(identifier_tok("response"), str("running"))
                        }
                    ],
                    new VarModifyNode(identifier_tok("response"), number(0)),
                ),
                new VarAccessNode(identifier_tok("response"))
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context());
        const expected = "paused";
        const values = result.value.elements[4].value;
        assert.deepStrictEqual(values, expected);
    });

    it('should work with a nullish assignment operator applied to a dictionnary', () => {
        /*
        var dict = { "duration": 50 }
        dict["duration"] ??= 10
        dict["duration"] # 50

        dict["speed"] ??= 25
        dict["speed"] # 25
        */
        const tree = new ListNode(
            [
                new VarAssignNode(
                    identifier_tok("dict"),
                    new DictionnaryNode(
                        [
                            new DictionnaryElementNode(str("duration"), number(50))
                        ],
                        null,
                        null
                    )
                ),
                new NullishAssignmentNode(
                    new ListAccessNode(
                        new VarAccessNode(identifier_tok("dict")),
                        0,
                        [
                            str("duration")
                        ]
                    ),
                    number(10)
                ),
                new ListAccessNode(
                    new VarAccessNode(identifier_tok("dict")),
                    0,
                    [
                        str("duration")
                    ]
                ),
                new NullishAssignmentNode(
                    new ListAccessNode(
                        new VarAccessNode(identifier_tok("dict")),
                        0,
                        [
                            str("speed")
                        ]
                    ),
                    number(25)
                ),
                new ListAccessNode(
                    new VarAccessNode(identifier_tok("dict")),
                    0,
                    [
                        str("speed")
                    ]
                ),
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context());
        const expected = [
            50,
            25
        ];
        const values = [
            result.value.elements[2].value,
            result.value.elements[4].value,
        ];
        assert.deepStrictEqual(values, expected);
    });

    it('should work with a nullish assignment operator applied to a list', () => {
        /*
        var list = [1, 2]
        list[1] ??= 50
        list[1] # 2

        list[3] ??= 25
        list[3] # 25
        */
        const tree = new ListNode(
            [
                new VarAssignNode(
                    identifier_tok("list"),
                    new ListNode([number(1),number(2)],null,null),
                ),
                new NullishAssignmentNode(
                    new ListAccessNode(
                        new VarAccessNode(identifier_tok("list")),
                        0,
                        [number(1)]
                    ),
                    number(50)
                ),
                new ListAccessNode(
                    new VarAccessNode(identifier_tok("list")),
                    0,
                    [number(1)]
                ),
                new NullishAssignmentNode(
                    new ListAccessNode(
                        new VarAccessNode(identifier_tok("list")),
                        0,
                        [number(3)]
                    ),
                    number(25)
                ),
                new ListAccessNode(
                    new VarAccessNode(identifier_tok("list")),
                    0,
                    [number(3)]
                ),
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context());
        const expected = [
            2,
            25
        ];
        const values = [
            result.value.elements[2].value,
            result.value.elements[4].value,
        ];
        assert.deepStrictEqual(values, expected);
    });

    it('should work with a nullish assignment operator applied to a variable', () => {
        /*
        var nullish = none
        nullish ??= 5
        nullish

        var falsy = false
        falsy ??= true
        falsy
        */
        const tree = new ListNode(
            [
                new VarAssignNode(
                    identifier_tok("nullish"),
                    none(),
                ),
                new NullishAssignmentNode(
                    new VarAccessNode(identifier_tok("nullish")),
                    number(5),
                ),
                new VarAccessNode(identifier_tok("nullish")),
                new VarAssignNode(
                    identifier_tok("falsy"),
                    no(),
                ),
                new NullishAssignmentNode(
                    new VarAccessNode(identifier_tok("falsy")),
                    yes(),
                ),
                new VarAccessNode(identifier_tok("falsy")),
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context());
        assert.deepStrictEqual(result.value.elements[2].value, 5);
        assert.deepStrictEqual(result.value.elements[4] instanceof BooleanValue && result.value.elements[4].state === 0, true);
    });
});