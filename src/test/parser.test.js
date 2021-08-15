import assert from 'assert';
import { Lexer } from '../lexer.js';
import { Parser } from '../parser.js';
import { AddNode, AndNode, DivideNode, ModuloNode, MultiplyNode, NotNode, NumberNode, OrNode, PowerNode, SubtractNode, VarAssignNode, EqualsNode, LessThanNode, GreaterThanNode, LessThanOrEqualNode, GreaterThanOrEqualNode, NotEqualsNode, NullishOperatorNode, ListNode, ListAccessNode, ListAssignmentNode, FuncDefNode, CallNode, PrefixOperationNode, PostfixOperationNode, DictionnaryNode, DeleteNode, ForeachNode, CallPropertyNode, ClassCallNode, VarModifyNode, AssignPropertyNode, CallMethodNode, VarAccessNode, CallStaticPropertyNode, SuperNode, EnumNode, SwitchNode, NoneNode, BooleanNode, BinaryShiftLeftNode, BinaryShiftRightNode, UnsignedBinaryShiftRightNode, LogicalAndNode, LogicalOrNode, LogicalXORNode, BinaryNotNode, MinusNode, NullishAssignmentNode, AndAssignmentNode, OrAssignmentNode, TypeofNode, InstanceofNode, TagDefNode, HtmlNode, IfNode, ForNode } from '../nodes.js';
import { InvalidSyntaxError } from '../Exceptions.js';

// npm run test ./test/parser.test.js

describe('Parser tests', () => {
    it('should return numbers', () => {
        const tokens = new Lexer("100_000.2").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof NumberNode);
    });

    it('should work with an addition', () => {
        const tokens = new Lexer("27 + 14 + 8").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof AddNode);
    });

    it('should work with a subtraction', () => {
        const tokens = new Lexer("27 - 14").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof SubtractNode);
    });

    it('should work with a multiplication', () => {
        const tokens = new Lexer("27 * 14").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof MultiplyNode);
    });

    it('should work with a division', () => {
        const tokens = new Lexer("27 / 14").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof DivideNode);
    });

    it('should work with a modulo', () => {
        const tokens = new Lexer("27 % 14").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof ModuloNode);
    });

    it('should work with a power', () => {
        const tokens = new Lexer("27 ** 14").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof PowerNode);
    });

    it('should work with a power (list)', () => {
        const tokens = new Lexer("[2] ** 14").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof PowerNode);
    });

    it('should work with a complex power', () => {
        const tokens = new Lexer("(1 + 2) ** (1 + 2)").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof PowerNode);
        if (node.element_nodes[0] instanceof PowerNode) {
            assert.deepStrictEqual(true, node.element_nodes[0].node_a instanceof AddNode);
            assert.deepStrictEqual(true, node.element_nodes[0].node_b instanceof AddNode);
        }
    });

    it('should work with a full expression', () => {
        const tokens = new Lexer("27 + (43 / 36 - 48) * 51").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof AddNode);
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
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof NullishOperatorNode);
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
        const tokens = new Lexer("example.prop_").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof CallPropertyNode);
    });

    it('should work with a property call (method)', () => {
        const tokens = new Lexer("example.prop_()").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof CallMethodNode);
        assert.deepStrictEqual(true, node.element_nodes[0].node_to_call instanceof CallNode);
        assert.deepStrictEqual(true, node.element_nodes[0].origin instanceof VarAccessNode);
    });

    it('should work with a property call (method and property)', () => {
        const tokens = new Lexer("example.prop_().another").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof CallPropertyNode);
        assert.deepStrictEqual(true, node.element_nodes[0].node_to_call instanceof CallMethodNode);
        assert.deepStrictEqual(true, node.element_nodes[0].node_to_call.node_to_call instanceof CallNode);
        assert.deepStrictEqual(true, node.element_nodes[0].node_to_call.origin instanceof VarAccessNode);
    });

    it('should work with a property call (list)', () => {
        const tokens = new Lexer("example.prop_[another.one]").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof ListAccessNode);
        assert.deepStrictEqual(true, node.element_nodes[0].list_nodes[0].node instanceof CallPropertyNode);
        assert.deepStrictEqual(true, node.element_nodes[0].node_to_access instanceof CallPropertyNode);
    });

    it('should work with a property call (complex list)', () => {
        const tokens = new Lexer("example[0].prop_[another.one]").generate_tokens();
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

    it('should work with an assignment to a property (list)', () => {
        const tokens = new Lexer("person.names[] = 5").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof ListAssignmentNode);
    });

    it('should work with an assignment to a property (method)', () => {
        try {
            const tokens = new Lexer("person.names() = 5").generate_tokens();
            const node = new Parser(tokens).parse();
        } catch(e) {
            assert.deepStrictEqual(true, e instanceof InvalidSyntaxError)
        }
    });

    it('should work with an assignment to a property (just property)', () => {
        const tokens = new Lexer("person.names = 5").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof AssignPropertyNode);
        assert.deepStrictEqual(true, node.element_nodes[0].property instanceof CallPropertyNode);
    });

    it('should work with an assignment to a property (all)', () => {
        const tokens = new Lexer("person.names().list[0].prop_ = 5").generate_tokens();
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
        const tokens = new Lexer("example::prop_()").generate_tokens();
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
        const tokens = new Lexer("enum Status: running, paused").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof EnumNode);
        assert.deepStrictEqual(["running", "paused"], node.element_nodes[0].properties.map((v) => v.value));
    });

    it('should work with a switch statement', () => {
        const tokens = new Lexer("switch value: case 4: log('4') case 5: log('5') end").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof SwitchNode);
        assert.deepStrictEqual(true, node.element_nodes[0].primary_value instanceof VarAccessNode);
        assert.deepStrictEqual(2, node.element_nodes[0].cases.length);
    });

    it('should work with none (as a node)', () => {
        const tokens = new Lexer("none").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof NoneNode);
    });

    it('should work with true, yes, no, false (as a node)', () => {
        const tokens = new Lexer("true; yes; no; false").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof BooleanNode);
        assert.deepStrictEqual(true, node.element_nodes[1] instanceof BooleanNode);
        assert.deepStrictEqual(true, node.element_nodes[2] instanceof BooleanNode);
        assert.deepStrictEqual(true, node.element_nodes[3] instanceof BooleanNode);
    });

    it('should work with bitwise shift operators', () => {
        const tokens = new Lexer("256 << 2; 256 >> 2; 256 >>> 2").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof BinaryShiftLeftNode);
        assert.deepStrictEqual(true, node.element_nodes[1] instanceof BinaryShiftRightNode);
        assert.deepStrictEqual(true, node.element_nodes[2] instanceof UnsignedBinaryShiftRightNode);
    });

    it('should work with a complex operation including a binary shift to the right', () => {
        const tokens = new Lexer("256 >> 1 + 2 * 10 / 10").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof BinaryShiftRightNode);
    });

    it('should work with logical operations', () => {
        const tokens = new Lexer("5 & 3; 5 | 3; 5 ^ 3").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof LogicalAndNode);
        assert.deepStrictEqual(true, node.element_nodes[1] instanceof LogicalOrNode);
        assert.deepStrictEqual(true, node.element_nodes[2] instanceof LogicalXORNode);
    });

    it('should work with a binary NOT (~)', () => {
        const tokens = new Lexer("~a").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof BinaryNotNode);
    });

    it('should work with a complex binary NOT (~)', () => {
        const tokens = new Lexer("~-1").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof BinaryNotNode);
    });

    it('should work with a negative binary NOT (~)', () => {
        const tokens = new Lexer("-~1").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof MinusNode);
    });

    it('should work with AND and OR as tokens (&&, ||)', () => {
        const tokens = new Lexer("1 && 1; 0 || 1").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof AndNode);
        assert.deepStrictEqual(true, node.element_nodes[1] instanceof OrNode);
    });

    it('should work with a nullish assignment operator (??=)', () => {
        const tokens = new Lexer("a ??= b").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof NullishAssignmentNode);
    });

    it('should work with an and assignment operator (&&=)', () => {
        const tokens = new Lexer("a &&= b").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof AndAssignmentNode);
    });

    it('should work with an or assignment operator (||=)', () => {
        const tokens = new Lexer("a ||= b").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof OrAssignmentNode);
    });

    it('should work with an optional chaining operator', () => {
        const tokens = new Lexer("example?.thing?.yo").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof CallPropertyNode);
        assert.deepStrictEqual(true, node.element_nodes[0].is_optional);
    });

    it('should work with an optional chaining operator and a static property', () => {
        const tokens = new Lexer("example.thing?::yo").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof CallStaticPropertyNode);
        assert.deepStrictEqual(true, node.element_nodes[0].is_optional);
    });

    it('should work with an optional chaining operator and a method', () => {
        const tokens = new Lexer("example.imaginaryMethod?.()").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof CallMethodNode);
        assert.deepStrictEqual(true, node.element_nodes[0].is_optional);
    });

    it('should work with an optional chaining operator and a list', () => {
        const tokens = new Lexer("arr[42]?.[42]").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof ListAccessNode);
        assert.deepStrictEqual(true, node.element_nodes[0].list_nodes[1].is_optional);
    });

    it('should work with a complex call including properties, methods and lists', () => {
        const tokens = new Lexer("example.meth()[0]().name").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(true, node.element_nodes[0] instanceof CallPropertyNode);
    });

    it('should work with a complex call including methods, lists and optional chaining operator', () => {
        const tokens = new Lexer("adv.imaginaryMethod?.()?.(1, 2)?.[0]?.[5]").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(node.element_nodes[0] instanceof ListAccessNode, true);
        assert.deepStrictEqual(node.element_nodes[0].list_nodes[0].is_optional, true);
    });

    it('should work with a basic call to a function and an optional chaining operator', () => {
        const tokens = new Lexer("myImaginaryFunction?.()").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(node.element_nodes[0] instanceof CallNode, true);
        assert.deepStrictEqual(node.element_nodes[0].is_optional, true);
    });

    it('should work with a double call to a function and an optional chaining operator', () => {
        const tokens = new Lexer("myImaginaryFunction?.()()").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(node.element_nodes[0] instanceof CallNode, true);
        assert.deepStrictEqual(node.element_nodes[0].is_optional, true); // all calls are defined as optional as soon as one of them is defined as optional
    });

    it('should work with \'typeof\'', () => {
        const tokens = new Lexer("typeof something").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(node.element_nodes[0] instanceof TypeofNode, true);
    });

    it('should work with \'instanceof\'', () => {
        const tokens = new Lexer("something instanceof something").generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(node.element_nodes[0] instanceof InstanceofNode, true);
    });

    it('should work with a tag', () => {
        const tokens = new Lexer(`
            tag Test:
                prop item: any = 5
                prop? anotheritem: any = none
                state status: number = 1

                method one() -> 1

                method __init():
                    self.yo = "yo"
                end
            end

            tag Test: pass
            tag Test:
                pass
            end
        `).generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(node.element_nodes[0] instanceof TagDefNode, true);
        assert.deepStrictEqual(node.element_nodes[0].props[0].property_name_tok.value, "item");
        assert.deepStrictEqual(node.element_nodes[0].states[0].property_name_tok.value, "status");
        assert.deepStrictEqual(node.element_nodes[0].methods[0].var_name_tok.value, "one");
    });

    it('should work with a basic HTML structure', () => {
        const tokens = new Lexer(`
            var div = <div.class1#id attr="5"> "Content"
            var test = 5
        `).generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(node.element_nodes[0] instanceof VarAssignNode, true);
        assert.deepStrictEqual(node.element_nodes[0].value_node instanceof HtmlNode, true);
        assert.deepStrictEqual(node.element_nodes[0].value_node.tagname_tok.value, "div");
        assert.deepStrictEqual(node.element_nodes[0].value_node.classes, ["class1"]);
        assert.deepStrictEqual(node.element_nodes[0].value_node.id, "id");
        assert.deepStrictEqual(node.element_nodes[0].value_node.attributes.length, 1);
        assert.deepStrictEqual(node.element_nodes[0].value_node.attributes[0][0].value, "attr");
        assert.deepStrictEqual(node.element_nodes[0].value_node.attributes[0][1].token.value, "5");
        assert.deepStrictEqual(node.element_nodes[0].value_node.children[0].token.value, "Content");
        assert.deepStrictEqual(node.element_nodes[1] instanceof VarAssignNode, true);
    });

    it('should work with a complex HTML structure', () => {
        const tokens = new Lexer(`
            <>
                <div.class1.class2#id>
                    <span#id.class1 attr="5">
                    <strong>
            </>
        `).generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(node.element_nodes[0] instanceof HtmlNode, true);
        assert.deepStrictEqual(node.element_nodes[0].children.length, 1); // the fragment has 1 child
        assert.deepStrictEqual(node.element_nodes[0].children[0].children.length, 2); // div has 2 children
        assert.deepStrictEqual(node.element_nodes[0].children[0].tagname_tok.value, "div"); // div
        assert.deepStrictEqual(node.element_nodes[0].children[0].classes, ["class1", "class2"]); // div
        assert.deepStrictEqual(node.element_nodes[0].children[0].id, "id"); // div
        assert.deepStrictEqual(node.element_nodes[0].children[0].children[0].tagname_tok.value, "span"); // span
        assert.deepStrictEqual(node.element_nodes[0].children[0].children[0].classes, ["class1"]); // span
        assert.deepStrictEqual(node.element_nodes[0].children[0].children[0].id, "id"); // span
        assert.deepStrictEqual(node.element_nodes[0].children[0].children[0].attributes[0][0].value, "attr"); // span
        assert.deepStrictEqual(node.element_nodes[0].children[0].children[0].attributes[0][1].token.value, "5"); // span
        assert.deepStrictEqual(node.element_nodes[0].children[0].children[1].tagname_tok.value, "strong"); // strong
    });

    it('should work with a complex HTML structure (2)', () => {
        const tokens = new Lexer(`
            <>
                <div complex_attr={5 + 5}>
                    <span>
                        <strong>
                        <mark>
                <div>
            </>
        `).generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(node.element_nodes[0] instanceof HtmlNode, true);
        assert.deepStrictEqual(node.element_nodes[0].children.length, 2);
        assert.deepStrictEqual(node.element_nodes[0].children[0].tagname_tok.value, "div"); // div
        assert.deepStrictEqual(node.element_nodes[0].children[0].attributes[0][0].value, "complex_attr"); // div
        assert.deepStrictEqual(node.element_nodes[0].children[0].attributes[0][1] instanceof AddNode, true); // div
        assert.deepStrictEqual(node.element_nodes[0].children[0].children.length, 1);
        assert.deepStrictEqual(node.element_nodes[0].children[0].children[0].tagname_tok.value, "span"); // span
        assert.deepStrictEqual(node.element_nodes[0].children[0].children[0].children[0].tagname_tok.value, "strong"); // strong
        assert.deepStrictEqual(node.element_nodes[0].children[0].children[0].children[1].tagname_tok.value, "mark"); // mark
        assert.deepStrictEqual(node.element_nodes[0].children[1].tagname_tok.value, "div"); // div
    });

    it('should work with an if-statement inside an html structure', () => {
        const tokens = new Lexer(`
            <>
                <div.class1.class2#id>
                    <span#id.class1 attr={5}>
                        if status:
                            <>
                                <strong>
                                    <span>
                            </>
                        end
                        <div>
            </>
        `).generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(node.element_nodes[0] instanceof HtmlNode, true);
        assert.deepStrictEqual(node.element_nodes[0].children.length, 1); // just the div, child of the fragment
        assert.deepStrictEqual(node.element_nodes[0].children[0].tagname_tok.value, "div");
        assert.deepStrictEqual(node.element_nodes[0].children[0].children[0].tagname_tok.value, "span");
        assert.deepStrictEqual(node.element_nodes[0].children[0].children[0].children[0] instanceof IfNode, true);
        assert.deepStrictEqual(node.element_nodes[0].children[0].children[0].children[1].tagname_tok.value, "div");
    });

    it('should work with a for-loop inside an html structure', () => {
        const tokens = new Lexer(`
            <>
                <div.class1.class2#id>
                    <span#id.class1 attr={5}>
                        for i to 10:
                            <>
                                <strong>
                                    <span>
                            </>
                        end
                        <div>
            </>
        `).generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(node.element_nodes[0] instanceof HtmlNode, true);
        assert.deepStrictEqual(node.element_nodes[0].children.length, 1); // just the div, child of the fragment
        assert.deepStrictEqual(node.element_nodes[0].children[0].tagname_tok.value, "div");
        assert.deepStrictEqual(node.element_nodes[0].children[0].children[0].tagname_tok.value, "span");
        assert.deepStrictEqual(node.element_nodes[0].children[0].children[0].children[0] instanceof ForNode, true);
        assert.deepStrictEqual(node.element_nodes[0].children[0].children[0].children[1].tagname_tok.value, "div");
    });

    it('should work with a foreach-loop inside an html structure', () => {
        const tokens = new Lexer(`
            <>
                <div.class1.class2#id>
                    <span#id.class1 attr={5}>
                        foreach list as element:
                            <>
                                <strong>
                                    <span>
                            </>
                        end
                        <div>
            </>
        `).generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(node.element_nodes[0] instanceof HtmlNode, true);
        assert.deepStrictEqual(node.element_nodes[0].children.length, 1); // just the div, child of the fragment
        assert.deepStrictEqual(node.element_nodes[0].children[0].tagname_tok.value, "div");
        assert.deepStrictEqual(node.element_nodes[0].children[0].children[0].tagname_tok.value, "span");
        assert.deepStrictEqual(node.element_nodes[0].children[0].children[0].children[0] instanceof ForeachNode, true);
        assert.deepStrictEqual(node.element_nodes[0].children[0].children[0].children[1].tagname_tok.value, "div");
    });

    it('should work with events in html structure', () => {
        const tokens = new Lexer(`
            <>
                <div.class1#id attr={5} @mousemove={function} attr={5}>
            </>
        `).generate_tokens();
        const node = new Parser(tokens).parse();
        assert.deepStrictEqual(node.element_nodes[0] instanceof HtmlNode, true);
        assert.deepStrictEqual(node.element_nodes[0].children[0].tagname_tok.value, "div");
    });
});