import assert from 'assert';
import { NumberNode, AddNode, SubtractNode, MultiplyNode, DivideNode, PowerNode, ModuloNode, VarAssignNode, VarModifyNode, ElseAssignmentNode, ListNode, ListAccessNode, PrefixOperationNode, MinusNode, DictionnaryNode, DictionnaryElementNode, StringNode, DeleteNode, VarAccessNode, ForNode, WhileNode, IfNode, LessThanNode, PostfixOperationNode, GreaterThanNode, EqualsNode, LessThanOrEqualNode, GreaterThanOrEqualNode, NotEqualsNode, FuncDefNode, CallNode, ListAssignmentNode, ListBinarySelector, ClassDefNode, ClassPropertyDefNode, ClassMethodDefNode, AssignPropertyNode, CallPropertyNode, ClassCallNode, CallMethodNode, CallStaticPropertyNode, SuperNode } from '../nodes.js';
import { ClassValue, DictionnaryValue, FunctionValue, ListValue, NumberValue, StringValue } from '../values.js';
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

Tests with `mocha` (npm run test ./test/interpreter.test.js)

! Careful, the context is the same throughout every tests, therefore we might get errors such as "variable 'i' already exists"

*/

// HELPERS
const number = (n) => {
    return new NumberNode(new Token(TokenType.NUMBER, n));
};

const str = (string, allow_concatenation=true) => {
    return new StringNode(new Token(TokenType.STRING, string), allow_concatenation);
};

const identifier_tok = (string) => {
    return new Token(TokenType.IDENTIFIER, string);
}

describe('Interpreter', () => {
    it('should work with numbers', () => {
        const tree = number(51.2);
        const result = new Interpreter().visit(tree, context);
        const value = result.value.value;
        assert.deepStrictEqual(value, 51.2);
    });

    it('should work with an addition', () => {
        const tree = new AddNode(number(27), number(14));
        const result = new Interpreter().visit(tree, context);
        const value = result.value.value;
        assert.deepStrictEqual(value, 41);
    });

    it('should work with a subtract', () => {
        const tree = new SubtractNode(number(27), number(14));
        const result = new Interpreter().visit(tree, context);
        const value = result.value.value;
        assert.deepStrictEqual(value, 13);
    });

    it('should work with a multiplication', () => {
        const tree = new MultiplyNode(number(27), number(14));
        const result = new Interpreter().visit(tree, context);
        const value = result.value.value;
        assert.deepStrictEqual(value, 378);
    });

    it('should work with a power', () => {
        const tree = new PowerNode(number(10), number(0));
        const result = new Interpreter().visit(tree, context);
        const value = result.value.value;
        assert.deepStrictEqual(value, 1);
    });

    it('should work with a divison', () => {
        const tree = new DivideNode(number(10), number(5));
        const result = new Interpreter().visit(tree, context);
        const value = result.value.value;
        assert.deepStrictEqual(value, 2);
    });

    it('should work with a modulo', () => {
        const tree = new ModuloNode(number(9), number(2));
        const result = new Interpreter().visit(tree, context);
        const value = result.value.value;
        assert.deepStrictEqual(value, 1);
    });

    it('should work with a negative number', () => {
        const tree = new MinusNode(number(5));
        const result = new Interpreter().visit(tree, context);
        const value = result.value.value;
        assert.deepStrictEqual(value, -5);
    });

    it('should work with a less than (<) (expected true)', () => {
        const tree = new LessThanNode(
            number(20),
            number(30)
        );
        const result = new Interpreter().visit(tree, context);
        const value = result.value.value;
        assert.deepStrictEqual(value, 1); // 1 == true
    });

    it('should work with a less than (<) (expected false)', () => {
        const tree = new LessThanNode(
            number(30),
            number(20)
        );
        const result = new Interpreter().visit(tree, context);
        const value = result.value.value;
        assert.deepStrictEqual(value, 0); // 0 == false
    });

    it('should work with a greater than (>) (expected true)', () => {
        const tree = new GreaterThanNode(
            number(30),
            number(20)
        );
        const result = new Interpreter().visit(tree, context);
        const value = result.value.value;
        assert.deepStrictEqual(value, 1); // 1 == true
    });

    it('should work with a greater than (>) (expected false)', () => {
        const tree = new GreaterThanNode(
            number(20),
            number(30)
        );
        const result = new Interpreter().visit(tree, context);
        const value = result.value.value;
        assert.deepStrictEqual(value, 0); // 0 == false
    });

    it('should work with a less than or equal (<=) (expected true)', () => {
        const tree = new LessThanOrEqualNode(
            number(20),
            number(20)
        );
        const result = new Interpreter().visit(tree, context);
        const value = result.value.value;
        assert.deepStrictEqual(value, 1); // 1 == true
    });

    it('should work with a less than or equal (<=) (expected false)', () => {
        const tree = new LessThanOrEqualNode(
            number(21),
            number(20)
        );
        const result = new Interpreter().visit(tree, context);
        const value = result.value.value;
        assert.deepStrictEqual(value, 0); // 0 == false
    });

    it('should work with a greater than or equal (>=) (expected true)', () => {
        const tree = new GreaterThanOrEqualNode(
            number(20),
            number(20)
        );
        const result = new Interpreter().visit(tree, context);
        const value = result.value.value;
        assert.deepStrictEqual(value, 1); // 1 == true
    });

    it('should work with a greater than or equal (>=) (expected false)', () => {
        const tree = new GreaterThanOrEqualNode(
            number(19),
            number(20)
        );
        const result = new Interpreter().visit(tree, context);
        const value = result.value.value;
        assert.deepStrictEqual(value, 0); // 0 == false
    });

    it('should work with an equal node (==) (expected true)', () => {
        const tree = new EqualsNode(
            number(20),
            number(20)
        );
        const result = new Interpreter().visit(tree, context);
        const value = result.value.value;
        assert.deepStrictEqual(value, 1); // 1 == true
    });

    it('should work with an equal node (==) (expected false)', () => {
        const tree = new EqualsNode(
            number(19),
            number(20)
        );
        const result = new Interpreter().visit(tree, context);
        const value = result.value.value;
        assert.deepStrictEqual(value, 0); // 0 == false
    });

    it('should work with a not equal node (!=) (expected true)', () => {
        const tree = new NotEqualsNode(
            number(19),
            number(20)
        );
        const result = new Interpreter().visit(tree, context);
        const value = result.value.value;
        assert.deepStrictEqual(value, 1); // 1 == true
    });

    it('should work with a not equal node (!=) (expected false)', () => {
        const tree = new NotEqualsNode(
            number(20),
            number(20)
        );
        const result = new Interpreter().visit(tree, context);
        const value = result.value.value;
        assert.deepStrictEqual(value, 0); // 0 == false
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
        const result = new Interpreter().visit(tree, context);
        const value = result.value.value;
        const expected = 125;
        assert.deepStrictEqual(value, expected);
    });

    it('should work with a prefix operation (before)', () => {
        const tree = new PrefixOperationNode(number(9), 1);
        const result = new Interpreter().visit(tree, context);
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
            const value = new Interpreter().visit(tree, context);
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
        const value = result.value.value;
        const expected = -2166;
        assert.deepStrictEqual(value, expected);
    });

    it('should work with an assignment to a variable', () => {
        const tree = new VarAssignNode(
            identifier_tok("var_assignement"),
            number(1)
        );
        const result = new Interpreter().visit(tree, context);
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
        const result = new Interpreter().visit(tree, context);
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
        const result = new Interpreter().visit(tree, context);
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
            const result = new Interpreter().visit(tree, context);
        } catch(e) {
            assert.strictEqual(true, e instanceof RuntimeError);
        }
    });

    it('should work with an else operator (??)', () => {
        const tree = new ElseAssignmentNode(
            number(0),
            number(1)
        );
        const result = new Interpreter().visit(tree, context);
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
        const result = new Interpreter().visit(tree, context);
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
        const result = new Interpreter().visit(tree, context);
        const expected = [1, 2, 3];
        const value = result.value.elements[1].elements.map((v) => v.value);
        assert.deepStrictEqual(value, expected);
    });

    it('should work with a list (assignement)', () => {
        // var list = [1, 2, 3]; list[4] = 5; list
        // expected = [1, 2, 3, 0, 5]
        const tree = new ListNode(
            [
                new VarAssignNode(
                    identifier_tok("list_assignement"),
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
                        new VarAccessNode(identifier_tok("list_assignement")),
                        0,
                        [
                            number(4)
                        ]
                    ),
                    number(5)
                ),
                new VarAccessNode(identifier_tok("list_assignement"))
            ],
            null,
            null,
        );
        const result = new Interpreter().visit(tree, context);
        const expected = [1, 2, 3, 0, 5];
        const value = result.value.elements[2].elements.map((v) => v.value);
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
        const result = new Interpreter().visit(tree, context);
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
                                    identifier_tok("a"),
                                    identifier_tok("b"),
                                ],
                                [
                                    identifier_tok("a"),
                                    identifier_tok("b"),
                                ],
                                [],
                                [],
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
        const result = new Interpreter().visit(tree, context);
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
                                [],
                                [],
                                [],
                                new ListNode(
                                    [
                                        number(1),
                                        new FuncDefNode(
                                            null,
                                            [
                                                identifier_tok("a"),
                                                identifier_tok("b"),
                                            ],
                                            [
                                                identifier_tok("a"),
                                                identifier_tok("b"),
                                            ],
                                            [],
                                            [],
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
        const result = new Interpreter().visit(tree, context);
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
        const result = new Interpreter().visit(tree, context);
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
        const result = new Interpreter().visit(tree, context);
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
        const result = new Interpreter().visit(tree, context);
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
        const result = new Interpreter().visit(tree, context);
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
        const result = new Interpreter().visit(tree, context);
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
                    [],
                    [],
                    [],
                    new FuncDefNode(
                        null,
                        [
                            identifier_tok("a"),
                            identifier_tok("b"),
                        ],
                        [
                            identifier_tok("a"),
                            identifier_tok("b"),
                        ],
                        [],
                        [],
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
        const result = new Interpreter().visit(tree, context);
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
        const result = new Interpreter().visit(tree, context);
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
        const result = new Interpreter().visit(tree, context);
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
        const result = new Interpreter().visit(tree, context);
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
        const result = new Interpreter().visit(tree, context);
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
        const result = new Interpreter().visit(tree, context);
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
                                    identifier_tok("firstname"),
                                    identifier_tok("lastname"),
                                    identifier_tok("age"),
                                ],
                                [
                                    identifier_tok("firstname"),
                                    identifier_tok("lastname"),
                                    identifier_tok("age"),
                                ],
                                [],
                                [],
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
                                [],
                                [],
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
                                [],
                                [],
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
                                    identifier_tok("new_name")
                                ],
                                [
                                    identifier_tok("new_name")
                                ],
                                [],
                                [],
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
                                    identifier_tok("new_age")
                                ],
                                [],
                                [
                                    identifier_tok("new_age")
                                ],
                                [
                                    new AddNode(
                                        new CallPropertyNode(
                                            new VarAccessNode(identifier_tok("self")),
                                            identifier_tok("age")
                                        ),
                                        number(1)
                                    )
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
        const result = new Interpreter().visit(tree, context);
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
                                    identifier_tok("name")
                                ],
                                [
                                    identifier_tok("name")
                                ],
                                [],
                                [],
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
                                [],
                                [],
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
        const result = new Interpreter().visit(tree, context);
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
                                    identifier_tok("name")
                                ],
                                [],
                                [
                                    identifier_tok("name")
                                ],
                                [
                                    new CallPropertyNode(
                                        new VarAccessNode(identifier_tok("self")),
                                        identifier_tok("default_name")
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
                                [],
                                [],
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
        const result = new Interpreter().visit(tree, context);
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
                                    identifier_tok("name"),
                                    identifier_tok("type"),
                                ],
                                [
                                    identifier_tok("name"),
                                    identifier_tok("type"),
                                ],
                                [],
                                [],
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
                                [],
                                [],
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
                                    identifier_tok("name"),
                                ],
                                [
                                    identifier_tok("name"),
                                ],
                                [],
                                [],
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
                                [],
                                [],
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
        const result = new Interpreter().visit(tree, context);
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
                                [],
                                [],
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
                                    identifier_tok("name")
                                ],
                                [],
                                [
                                    identifier_tok("name")
                                ],
                                [
                                    new CallPropertyNode(
                                        new VarAccessNode(identifier_tok("self")),
                                        identifier_tok("default_name")
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
                                [],
                                [],
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
        const result = new Interpreter().visit(tree, context);
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
                                [],
                                [],
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
                                    identifier_tok("name")
                                ],
                                [],
                                [
                                    identifier_tok("name")
                                ],
                                [
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
                                [],
                                [],
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
        const result = new Interpreter().visit(tree, context);
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
    
    it('should work with static properties', () => {
        /*
        class Test:
            static property static_property = "static property"
            property test

            static method get_name() -> self::static_property

            method __init():
                self.test = self::get_name()
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
        ]
        */
        // expected results:
        // self.test = static property
        // static property
        // static method
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
                                [],
                                [],
                                [],
                                new CallStaticPropertyNode(
                                    new VarAccessNode(identifier_tok("self")),
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
                                [],
                                [],
                                [],
                                new AssignPropertyNode(
                                    new CallPropertyNode(
                                        new VarAccessNode(identifier_tok("self")),
                                        identifier_tok("test")
                                    ),
                                    new CallMethodNode(
                                        new CallNode(
                                            new CallStaticPropertyNode(
                                                new VarAccessNode(identifier_tok("self")),
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
                                [],
                                [],
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
                                [],
                                [],
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
        const result = new Interpreter().visit(tree, context);
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

        class _Animal extends LivingThing:
            property name = "name"
            property type

            method __init(name, type):
                super(1)
                self.name = name
                self.type = type
            end

            method walk() -> if self.isalive: self.name + " walks" else: self.name + " is dead"
        end

        class _Wolf extends _Animal:
            method __init(name):
                super(name, "_Wolf")
            end

            override method walk() -> if self.isalive: self.name + " runs" else: self.name + " is dead"
        end

        var _wolf = new _Wolf("Wolfy")
        var _animal = new _Animal("Animal", "Dog")
        var _wolf2 = new _Wolf("Wolf2");
        _wolf.walk()
        _wolf2.die()
        _wolf2.walk()
        _animal.walk()
        _animal.isalive = 0
        _animal.walk()
        */
        /*
        tree = [
            (Class LivingThing),
            (Class _Animal),
            (Class _Wolf),
            (var _wolf = (new IDENTIFIER:_Wolf)),
            (var _animal = (new IDENTIFIER:_Animal)),
            (var _wolf2 = (new IDENTIFIER:_Wolf)),
            (method (_wolf).(call (prop (_wolf).walk)(0 args))),
            (method (_wolf2).(call (prop (_wolf2).die)(0 args))),
            (method (_wolf2).(call (prop (_wolf2).walk)(0 args))),
            (method (_animal).(call (prop (_animal).walk)(0 args))),
            ((prop (_animal).isalive) = 0),
            (method (_animal).(call (prop (_animal).walk)(0 args))),
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
                                    identifier_tok("isalive")
                                ],
                                [
                                    identifier_tok("isalive")
                                ],
                                [],
                                [],
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
                                [],
                                [],
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
                                [],
                                [],
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
                    identifier_tok("_Animal"),
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
                                    identifier_tok("name"),
                                    identifier_tok("type"),
                                ],
                                [
                                    identifier_tok("name"),
                                    identifier_tok("type"),
                                ],
                                [],
                                [],
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
                                [],
                                [],
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
                    identifier_tok("_Wolf"),
                    identifier_tok("_Animal"),
                    [],
                    [
                        new ClassMethodDefNode(
                            new FuncDefNode(
                                identifier_tok("__init"),
                                [
                                    identifier_tok("name")
                                ],
                                [
                                    identifier_tok("name")
                                ],
                                [],
                                [],
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
                                [],
                                [],
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
                    identifier_tok("_wolf"),
                    new ClassCallNode(
                        identifier_tok("_Wolf"),
                        [
                            str("Wolfy")
                        ]
                    )
                ),
                new VarAssignNode(
                    identifier_tok("_animal"),
                    new ClassCallNode(
                        identifier_tok("_Animal"),
                        [
                            str("Animal"),
                            str("Dog")
                        ]
                    )
                ),
                new VarAssignNode(
                    identifier_tok("_wolf2"),
                    new ClassCallNode(
                        identifier_tok("_Wolf"),
                        [
                            str("Wolf2")
                        ]
                    )
                ),
                new CallMethodNode(
                    new CallNode(
                        new CallPropertyNode(
                            new VarAccessNode(identifier_tok("_wolf")),
                            identifier_tok("walk")
                        ),
                        []
                    ),
                    new VarAccessNode(identifier_tok("_wolf"))
                ),
                new CallMethodNode(
                    new CallNode(
                        new CallPropertyNode(
                            new VarAccessNode(identifier_tok("_wolf2")),
                            identifier_tok("die")
                        ),
                        []
                    ),
                    new VarAccessNode(identifier_tok("_wolf2"))
                ),
                new CallMethodNode(
                    new CallNode(
                        new CallPropertyNode(
                            new VarAccessNode(identifier_tok("_wolf2")),
                            identifier_tok("walk")
                        ),
                        []
                    ),
                    new VarAccessNode(identifier_tok("_wolf2"))
                ),
                new CallMethodNode(
                    new CallNode(
                        new CallPropertyNode(
                            new VarAccessNode(identifier_tok("_animal")),
                            identifier_tok("walk")
                        ),
                        []
                    ),
                    new VarAccessNode(identifier_tok("_animal"))
                ),
                new AssignPropertyNode(
                    new CallPropertyNode(
                        new VarAccessNode(identifier_tok("_animal")),
                        identifier_tok("isalive")
                    ),
                    number(0)
                ),
                new CallMethodNode(
                    new CallNode(
                        new CallPropertyNode(
                            new VarAccessNode(identifier_tok("_animal")),
                            identifier_tok("walk")
                        ),
                        []
                    ),
                    new VarAccessNode(identifier_tok("_animal"))
                )
            ],
            null,
            null
        );
        const result = new Interpreter().visit(tree, context);
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
});