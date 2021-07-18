import assert from 'assert';
import { Lexer } from '../lexer.js';
import { Parser } from '../parser.js';
import { AddNode, AndNode, DivideNode, ModuloNode, MultiplyNode, NotNode, NumberNode, OrNode, PowerNode, SubtractNode, VarAssignNode, EqualsNode, LessThanNode, GreaterThanNode, LessThanOrEqualNode, GreaterThanOrEqualNode, NotEqualsNode, ElseAssignmentNode, ListNode, ListAccessNode, ListAssignmentNode, FuncDefNode, CallNode, PrefixOperationNode, PostfixOperationNode, DictionnaryNode, DeleteNode, ForeachNode, CallPropertyNode, ClassCallNode, VarModifyNode, AssignPropertyNode, CallMethodNode, VarAccessNode, CallStaticPropertyNode, SuperNode, EnumNode } from '../nodes.js';
import { InvalidSyntaxError } from '../Exceptions.js';

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

    it('should work with a delete node', () => {
        const tokens = new Lexer("delete variable").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof DeleteNode);
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

    it('should work with a postfix operation (after)', () => {
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

    it('should work with a foreach loop (key as value)', () => {
        const tokens = new Lexer("foreach list as key => value: log(key)").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof ForeachNode);
    });

    it('should work with a foreach loop (value)', () => {
        const tokens = new Lexer("foreach list as value: log(key)").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof ForeachNode);
    });

    it('should work with a property call (property)', () => {
        const tokens = new Lexer("example.prop").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof CallPropertyNode);
    });

    it('should work with a property call (method)', () => {
        const tokens = new Lexer("example.prop()").generate_tokens();
        const node = new Parser(tokens).parse();
        // assert.deepStrictEqual(true, node.element_nodes[0] instanceof CallNode); // will call example.prop
        // assert.deepStrictEqual(true, node.element_nodes[0].node_to_call instanceof CallPropertyNode);
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof CallMethodNode);
        assert.deepStrictEqual(true, node.element_nodes[0].node_to_call instanceof CallNode);
        assert.deepStrictEqual(true, node.element_nodes[0].origin instanceof VarAccessNode);
    });

    it('should work with a property call (method and property)', () => {
        const tokens = new Lexer("example.prop().another").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof CallPropertyNode);
        assert.deepStrictEqual(true, node.element_nodes[0].node_to_call instanceof CallMethodNode);
        assert.deepStrictEqual(true, node.element_nodes[0].node_to_call.node_to_call instanceof CallNode);
        assert.deepStrictEqual(true, node.element_nodes[0].node_to_call.origin instanceof VarAccessNode);
    });

    it('should work with a property call (list)', () => {
        const tokens = new Lexer("example.prop[another.one]").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof ListAccessNode);
        assert.deepStrictEqual(true, node.element_nodes[0].list_nodes[0] instanceof CallPropertyNode);
        assert.deepStrictEqual(true, node.element_nodes[0].node_to_access instanceof CallPropertyNode);
    });

    it('should work with a property call (complex list)', () => {
        const tokens = new Lexer("example[0].prop[another.one]").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof ListAccessNode);
        assert.deepStrictEqual(true, node.element_nodes[0].node_to_access instanceof CallPropertyNode);
        assert.deepStrictEqual(true, node.element_nodes[0].node_to_access.node_to_call instanceof ListAccessNode);
    });

    it('should work with a property call (3 props)', () => {
        const tokens = new Lexer("prop1.prop2.prop3").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof CallPropertyNode);
        assert.deepStrictEqual(true, node.element_nodes[0].node_to_call instanceof CallPropertyNode);
    });

    it('should work with an instantiation', () => {
        const tokens = new Lexer("new Person('thomas', 17)").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof ClassCallNode);
    });

    it('should work with an assignement to a property (list)', () => {
        const tokens = new Lexer("person.names[] = 5").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof ListAssignmentNode);
    });

    it('should work with an assignement to a property (method)', () => {
        try {
            const tokens = new Lexer("person.names() = 5").generate_tokens();
            const node = new Parser(tokens).parse();
        } catch(e) {
            assert.deepStrictEqual(true, e instanceof InvalidSyntaxError)
        }
    });

    it('should work with an assignement to a property (just property)', () => {
        const tokens = new Lexer("person.names = 5").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof AssignPropertyNode);
        assert.deepStrictEqual(true, node.element_nodes[0].property instanceof CallPropertyNode);
    });

    it('should work with an assignement to a property (all)', () => {
        const tokens = new Lexer("person.names().list[0].prop = 5").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof AssignPropertyNode);
        assert.deepStrictEqual(true, node.element_nodes[0].property instanceof CallPropertyNode);
        assert.deepStrictEqual(true, node.element_nodes[0].property.node_to_call instanceof ListAccessNode);
        assert.deepStrictEqual(true, node.element_nodes[0].property.node_to_call.node_to_access instanceof CallPropertyNode);
        assert.deepStrictEqual(true, node.element_nodes[0].property.node_to_call.node_to_access.node_to_call instanceof CallMethodNode);
        assert.deepStrictEqual(true, node.element_nodes[0].property.node_to_call.node_to_access.node_to_call.node_to_call instanceof CallNode);
    });

    it('should work with a call to a static property', () => {
        const tokens = new Lexer("self::name").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof CallStaticPropertyNode);
    });

    it('should work with a static property call (method)', () => {
        const tokens = new Lexer("example::prop()").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof CallMethodNode);
        assert.deepStrictEqual(true, node.element_nodes[0].node_to_call instanceof CallNode);
        assert.deepStrictEqual(true, node.element_nodes[0].node_to_call.node_to_call instanceof CallStaticPropertyNode);
        assert.deepStrictEqual(true, node.element_nodes[0].origin instanceof VarAccessNode);
    });

    it('should work with a super() method', () => {
        const tokens = new Lexer("super(1)").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof SuperNode);
    });

    it('should work with an enum', () => {
        const tokens = new Lexer("enum Status: running, paused end").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof EnumNode);
        assert.deepStrictEqual(["running", "paused"], node.element_nodes[0].properties.map((v) => v.value));
    });
});