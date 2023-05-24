"use strict";

import { NumberNode, AddNode, SubtractNode, MultiplyNode, DivideNode, PlusNode, MinusNode, PowerNode, ModuloNode, VarAssignNode, VarAccessNode, VarModifyNode, AndNode, OrNode, NotNode, EqualsNode, LessThanNode, GreaterThanNode, LessThanOrEqualNode, GreaterThanOrEqualNode, NotEqualsNode, NullishOperatorNode, ListNode, ListAccessNode, ListAssignmentNode, ListPushBracketsNode, ListBinarySelector, StringNode, IfNode, ForNode, WhileNode, FuncDefNode, CallNode, ReturnNode, ContinueNode, BreakNode, DefineNode, DeleteNode, PrefixOperationNode, PostfixOperationNode, DictionaryNode, ForeachNode, ClassDefNode, ClassPropertyDefNode, ClassCallNode, CallPropertyNode, AssignPropertyNode, CallMethodNode, CallStaticPropertyNode, SuperNode, EnumNode, SwitchNode, NoneNode, BooleanNode, BinaryShiftLeftNode, BinaryShiftRightNode, UnsignedBinaryShiftRightNode, NullishAssignmentNode, LogicalAndNode, LogicalOrNode, LogicalXORNode, BinaryNotNode, AndAssignmentNode, OrAssignmentNode, TypeofNode, InstanceofNode, TagDefNode, HtmlNode, CustomNode, TagPropDefNode, TagStateDefNode } from './nodes.js';
import { BaseFunction, BooleanValue, ClassValue, DictionaryValue, EnumValue, FunctionValue, HtmlValue, ListValue, NativeClassValue, NativeFunction, NativePropertyValue, NoneValue, NumberValue, StringValue, TagValue, Value } from './values.js';
import { CustomTypeError, InvalidSyntaxError, RuntimeError } from './Exceptions.js';
import { CONSTANTS, SymbolTable } from './symbol_table.js';
import { Visibility } from './lib/Visibility.js';
import { is_in } from './miscellaneous.js';
import { NATIVE_TAGS } from './native.js';
import { Parser } from "./parser.js";
import { Types } from './tokens.js';
import { Lexer } from './lexer.js';
import RuntimeResult from './runtime.js';
import Position from './position.js';
import Context from './context.js';
import { PropertyNature } from './lib/PropertyNature.js';

// [a:b] in a list accessor
class BinarySelectorValues {
    public a: NumberValue;
    public b: NumberValue | null;
    public value: number;

    constructor(a: NumberValue, b: NumberValue | null) {
        this.a = a;
        this.b = b;
        this.value = 0;
    }
}

/**
 * Checks if two arrays are equal. [Stackoverflow](@link https://stackoverflow.com/a/14853974)
 */
function array_equals(a: any[], b: any[]): boolean {
    // if the other array is a falsy value, return
    if (!b)
        return false;

    // compare lengths - can save a lot of time
    if (a.length !== b.length)
        return false;

    for (let i = 0, l=a.length; i < l; i++) {
        if (a[i].constructor.name !== b[i].constructor.name) return false;

        if (a[i] instanceof ListValue && b[i] instanceof ListValue) {
            if (!array_equals(a[i], b[i])) return false;
        } else {
            let a_element = a[i];
            let b_element = b[i];
            if (a_element instanceof NumberValue) {
                if (a_element.value !== b_element.value) {
                    return false;
                }
            } else if (a_element instanceof StringValue) {
                if (a_element.value !== b_element.value) {
                    return false;
                }
            } else if (a_element instanceof BaseFunction) {
                return false; // two functions cannot be equal
            } else if (a_element instanceof NoneValue) {
                return true;
            } else if (a_element instanceof ClassValue) {
                return false; // two classes cannot be equal
            } else if (a_element instanceof DictionaryValue) {
                return dictionary_equals(a_element, b_element);
            } else if (a_element instanceof BooleanValue) {
                return a_element.state === b_element.state;
            } else {
                return false;
            }
            // todo: change here if there are new types
        }
    }

    return true;
}

/**
 * Checks if two dictionnaries are equal.
 */
function dictionary_equals(left: DictionaryValue, right: DictionaryValue): boolean {
    let is_equal = true;
    let left_entries = Array.from(left.elements.entries());
    let right_entries = Array.from(right.elements.entries());
    if (left_entries.length === right_entries.length) {
        for (let i = 0; i < left_entries.length; i++) {
            let left_key = left_entries[i][0];
            let left_value = left_entries[i][1];
            let right_key = right_entries[i][0];
            let right_value = right_entries[i][1];

            if (left_key !== right_key) {
                is_equal = false;
                break;
            }

            if (left_value instanceof ListValue && right_value instanceof ListValue) {
                is_equal = array_equals(left_value.elements, right_value.elements);
            } else if (left_value instanceof NumberValue && right_value instanceof NumberValue) {
                is_equal = left_value.value === right_value.value;
            } else if (left_value instanceof StringValue && right_value instanceof StringValue) {
                is_equal = left_value.value === right_value.value;
            } else if (left_value instanceof DictionaryValue && right_value instanceof DictionaryValue) {
                is_equal = dictionary_equals(left_value, right_value);
            } else if (left_value instanceof BaseFunction && right_value instanceof BaseFunction) {
                is_equal = false; // two functions cannot be equal
            } else {
                is_equal = false;
            }

            if (is_equal === false) break;
        }
    } else {
        is_equal = false;
    }

    return is_equal;
}

/**
 * @classdesc Reads the nodes and perform the calculations.
 */
export class Interpreter {
    /**
     * @param node The node to be interpreted.
     * @param context The root context.
     */
    public visit(node: CustomNode, context: Context): RuntimeResult {
        if (node instanceof NumberNode) {
            return this.visit_NumberNode(node, context);
        } else if (node instanceof AddNode) {
            return this.visit_AddNode(node, context)!; // if a visit method returns undefined, it means an error was thrown using a separate method like "illegal_operation()"
        } else if (node instanceof SubtractNode) {
            return this.visit_SubtractNode(node, context)!;
        } else if (node instanceof MultiplyNode) {
            return this.visit_MultiplyNode(node, context)!;
        } else if (node instanceof DivideNode) {
            return this.visit_DivideNode(node, context)!;
        } else if (node instanceof PlusNode) {
            return this.visit_PlusNode(node, context)!;
        } else if (node instanceof MinusNode) {
            return this.visit_MinusNode(node, context)!;
        } else if (node instanceof PowerNode) {
            return this.visit_PowerNode(node, context)!;
        } else if (node instanceof ModuloNode) {
            return this.visit_ModuloNode(node, context)!;
        } else if (node instanceof VarAssignNode) {
            return this.visit_VarAssignNode(node, context);
        } else if (node instanceof VarAccessNode) {
            return this.visit_VarAccessNode(node, context);
        } else if (node instanceof VarModifyNode) {
            return this.visit_VarModifyNode(node, context);
        } else if (node instanceof AndNode) {
            return this.visit_AndNode(node, context);
        } else if (node instanceof OrNode) {
            return this.visit_OrNode(node, context);
        } else if (node instanceof NotNode) {
            return this.visit_NotNode(node, context);
        } else if (node instanceof EqualsNode) {
            return this.visit_EqualsNode(node, context);
        } else if (node instanceof LessThanNode) {
            return this.visit_LessThanNode(node, context);
        } else if (node instanceof GreaterThanNode) {
            return this.visit_GreaterThanNode(node, context);
        } else if (node instanceof LessThanOrEqualNode) {
            return this.visit_LessThanOrEqualNode(node, context);
        } else if (node instanceof GreaterThanOrEqualNode) {
            return this.visit_GreaterThanOrEqualNode(node, context);
        } else if (node instanceof NotEqualsNode) {
            return this.visit_NotEqualsNode(node, context);
        } else if (node instanceof NullishOperatorNode) {
            return this.visit_NullishOperatorNode(node, context);
        } else if (node instanceof ListNode) {
            return this.visit_ListNode(node, context);
        } else if (node instanceof ListAccessNode) {
            return this.visit_ListAccessNode(node, context);
        } else if (node instanceof ListAssignmentNode) {
            return this.visit_ListAssignmentNode(node, context);
        } else if (node instanceof StringNode) {
            return this.visit_StringNode(node, context);
        } else if (node instanceof IfNode) {
            return this.visit_IfNode(node, context);
        } else if (node instanceof ForNode) {
            return this.visit_ForNode(node, context);
        } else if (node instanceof WhileNode) {
            return this.visit_WhileNode(node, context);
        } else if (node instanceof FuncDefNode) {
            return this.visit_FuncDefNode(node, context);
        } else if (node instanceof CallNode) {
            return this.visit_CallNode(node, context);
        } else if (node instanceof ReturnNode) {
            return this.visit_ReturnNode(node, context);
        } else if (node instanceof ContinueNode) {
            return this.visit_ContinueNode();
        } else if (node instanceof BreakNode) {
            return this.visit_BreakNode();
        } else if (node instanceof DefineNode) {
            return this.visit_DefineNode(node, context);
        } else if (node instanceof DeleteNode) {
            return this.visit_DeleteNode(node, context);
        } else if (node instanceof PrefixOperationNode) {
            return this.visit_PrefixOperationNode(node, context)!;
        } else if (node instanceof PostfixOperationNode) {
            return this.visit_PostfixOperationNode(node, context)!;
        } else if (node instanceof DictionaryNode) {
            return this.visit_DictionaryNode(node, context);
        } else if (node instanceof ForeachNode) {
            return this.visit_ForeachNode(node, context);
        } else if (node instanceof ClassDefNode) {
            return this.visit_ClassDefNode(node, context);
        } else if (node instanceof ClassCallNode) {
            return this.visit_ClassCallNode(node, context);
        } else if (node instanceof ClassPropertyDefNode) {
            return this.visit_ClassPropertyDefNode(node, context);
        } else if (node instanceof CallPropertyNode) {
            return this.visit_CallPropertyNode(node, context);
        } else if (node instanceof CallStaticPropertyNode) {
            return this.visit_CallStaticPropertyNode(node, context);
        } else if (node instanceof AssignPropertyNode) {
            return this.visit_AssignPropertyNode(node, context);
        } else if (node instanceof CallMethodNode) {
            return this.visit_CallMethodNode(node, context);
        } else if (node instanceof SuperNode) {
            return this.visit_SuperNode(node, context);
        } else if (node instanceof EnumNode) {
            return this.visit_EnumNode(node, context);
        } else if (node instanceof SwitchNode) {
            return this.visit_SwitchNode(node, context);
        } else if (node instanceof NoneNode) {
            return this.visit_NoneNode(node, context);
        } else if (node instanceof BooleanNode) {
            return this.visit_BooleanNode(node, context);
        } else if (node instanceof BinaryShiftLeftNode) {
            return this.visit_BinaryShiftLeftNode(node, context)!;
        } else if (node instanceof BinaryShiftRightNode) {
            return this.visit_BinaryShiftRightNode(node, context)!;
        } else if (node instanceof UnsignedBinaryShiftRightNode) {
            return this.visit_UnsignedBinaryShiftRightNode(node, context)!;
        } else if (node instanceof NullishAssignmentNode) {
            return this.visit_NullishAssignmentNode(node, context);
        } else if (node instanceof LogicalAndNode) {
            return this.visit_LogicalAndNode(node, context)!;
        } else if (node instanceof LogicalOrNode) {
            return this.visit_LogicalOrNode(node, context)!;
        } else if (node instanceof LogicalXORNode) {
            return this.visit_LogicalXORNode(node, context)!;
        } else if (node instanceof BinaryNotNode) {
            return this.visit_BinaryNotNode(node, context)!;
        } else if (node instanceof AndAssignmentNode) {
            return this.visit_AndAssignmentNode(node, context);
        } else if (node instanceof OrAssignmentNode) {
            return this.visit_OrAssignmentNode(node, context);
        } else if (node instanceof TypeofNode) {
            return this.visit_TypeofNode(node, context);
        } else if (node instanceof InstanceofNode) {
            return this.visit_InstanceofNode(node, context);
        } else if (node instanceof TagDefNode) {
            return this.visit_TagDefNode(node, context);
        } else if (node instanceof HtmlNode) {
            return this.visit_HtmlNode(node, context);
        } else {
            throw new Error(`There is no visit method for node '${node.constructor.name}'`);
        }
    }

    /**
     * Creates a new context.
     */
    private generate_new_context(parent_context: Context, context_name: string, pos_start: Position): Context {
        const new_context = new Context(context_name, parent_context, pos_start);
        new_context.symbol_table = new SymbolTable(new_context.parent!.symbol_table);
        return new_context;
    }

    /**
     * Trying to operate an illegal operation between two values.
     */
    private illegal_operation(node: CustomNode, context: Context): RuntimeError {
        throw new RuntimeError(
            node.pos_start, node.pos_end,
            "Illegal operation",
            context
        );
    }

    /**
     * Throws a TypeError when trying to assign a value to a variable whose type doesn't match the given value's type.
     * @param value_type The value of the variable.
     * @param expected_type The expected type of the new value
     * @param pos_start Starting position of the node who threw the error.
     * @param pos_end End position of the node who threw the error.
     * @param context The context in which the error was thrown in order to build the stack trace.
     */
    private type_error(value_type: string, expected_type: string, pos_start: Position, pos_end: Position, context: Context) {
        throw new CustomTypeError(
            pos_start, pos_end,
            `Type '${value_type}' is not assignable to type '${expected_type}'`,
            context
        );
    };

    /**
     * @param {Value} value Checks if the type of that value corresponds to an object.
     */
    private is_value_object(value: Value): boolean {
        // Enum is an object and its type remains Types.OBJECT so we're good
        return value.type === Types.OBJECT || value instanceof NativeClassValue || value instanceof ClassValue;
    }

    /**
     * Interprets a number as a NumberValue.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_NumberNode(node: NumberNode, context: Context): RuntimeResult {
        return new RuntimeResult().success(
            new NumberValue(node.value).set_pos(node.pos_start, node.pos_end).set_context(context)
        );
    }

    /**
     * Interprets an addition.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_AddNode(node: AddNode, context: Context) {
        const res = new RuntimeResult();
        const left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        const right = res.register(this.visit(node.node_b, context));
        if (res.should_return()) return res;

        // there are so many types of values
        // I keep forgetting some combinations
        // therefore, I designed this solution
        // just to keep my mind safe
        // I test every scenario in `./test/maths.test.js`

        // ---
        // Every possible addition which returns a number
        // ---
        // number + number            OK
        // number + none              OK
        // none + number              OK
        // number + boolean           OK
        // boolean + number           OK
        // boolean + boolean          OK
        // none + none                OK
        if (left instanceof NumberValue && right instanceof NumberValue) { // number + number
            return new RuntimeResult().success(
                new NumberValue(left.value + right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof NoneValue) { // number + none
            return new RuntimeResult().success(
                new NumberValue(left.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NumberValue) { // none + number
            return new RuntimeResult().success(
                new NumberValue(right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof BooleanValue) { // number + boolean
            return new RuntimeResult().success(
                new NumberValue(left.value + right.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof NumberValue) { // boolean + number
            return new RuntimeResult().success(
                new NumberValue(left.state + right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof BooleanValue) { // boolean + boolean
            return new RuntimeResult().success(
                new NumberValue(left.state + right.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NoneValue) {
            return new RuntimeResult().success(
                new NumberValue(0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        // ---
        // Every possible addition which returns a string
        // ---
        // number + string            OK
        // string + number            OK
        // string + string            OK
        // string + none              OK
        // none + string              OK
        // string + boolean           OK
        // boolean + string           OK
        if (left instanceof NumberValue && right instanceof StringValue) { // number + string
            return new RuntimeResult().success(
                new StringValue(left.value.toString() + right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof NumberValue) { // string + number
            return new RuntimeResult().success(
                new StringValue(left.value + right.value.toString()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof StringValue) { // string + string
            return new RuntimeResult().success(
                new StringValue(left.value + right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof NoneValue) { // string + none
            return new RuntimeResult().success(
                new StringValue(left.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof StringValue) { // none + string
            return new RuntimeResult().success(
                new StringValue(right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof BooleanValue) { // string + boolean
            return new RuntimeResult().success(
                new StringValue(left.value + right.state.toString()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof StringValue) { // boolean + string
            return new RuntimeResult().success(
                new StringValue(left.state.toString() + right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        // ---
        // Every possible addition which returns a list
        // ---
        // list + number              OK
        // number + list              OK
        // list + string              OK
        // string + list              OK
        // list + list                OK
        // list + dict                OK
        // dict + list                OK
        // list + class               OK
        // class + list               OK
        // list + enum                OK
        // enum + list                OK
        // list + none                OK
        // none + list                OK
        // list + boolean             OK
        // boolean + list             OK
        if (left instanceof ListValue && right instanceof NumberValue) { // list + number
            const new_values = [...left.elements, right];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof ListValue) { // number + list
            const new_values = [left, ...right.elements];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof StringValue) { // list + string
            const new_values = [...left.elements, right];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof ListValue) { // string + list
            const new_values = [left, ...right.elements];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof ListValue) { // list + list
            const new_values = [...left.elements, ...right.elements];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof DictionaryValue) { // list + dict
            const new_values = [...left.elements, right];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionaryValue && right instanceof ListValue) { // dict + list
            const new_values = [left, ...right.elements];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof ClassValue) { // list + class
            const new_values = [...left.elements, right];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ClassValue && right instanceof ListValue) { // class + list
            const new_values = [left, ...right.elements];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof EnumValue) { // list + enum
            const new_values = [...left.elements, right];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof EnumValue && right instanceof ListValue) { // enum + list
            const new_values = [left, ...right.elements];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof NoneValue) { // list + none
            const new_values = [...left.elements, right];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof ListValue) { // none + list
            const new_values = [left, ...right.elements];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof BooleanValue) { // list + boolean
            const new_values = [...left.elements, right];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof ListValue) { // boolean + list
            const new_values = [left, ...right.elements];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        // ---
        // Every possible addition which returns a dictionary
        // ---
        // dict + dict
        if (left instanceof DictionaryValue && right instanceof DictionaryValue) {
            return new RuntimeResult().success(
                new DictionaryValue(new Map(Array.from(left.elements.entries()).concat(Array.from(right.elements.entries())))).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        this.illegal_operation(node, context);
    }

    /**
     * Interprets a subtraction.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_SubtractNode(node: SubtractNode, context: Context): RuntimeResult | undefined {
        const res = new RuntimeResult();
        const left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        const right = res.register(this.visit(node.node_b, context));
        if (res.should_return()) return res;

        if (left instanceof NumberValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(left.value - right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof NoneValue) {
            return new RuntimeResult().success(
                new NumberValue(left.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(0 - right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NoneValue) {
            return new RuntimeResult().success(
                new NumberValue(0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof BooleanValue) {
            return new RuntimeResult().success(
                new NumberValue(left.value - right.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(left.state - right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof BooleanValue) {
            return new RuntimeResult().success(
                new NumberValue(left.state - right.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        this.illegal_operation(node, context);
    }

    /**
     * Interprets a multiplication.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_MultiplyNode(node: MultiplyNode, context: Context): RuntimeResult | undefined {
        const res = new RuntimeResult();
        const left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        const right = res.register(this.visit(node.node_b, context));
        if (res.should_return()) return res;

        if (left instanceof NumberValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(left.value * right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof NumberValue) {
            const new_values = [];
            for (let i = 0; i < right.value; ++i) new_values.push(...left.elements);
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof ListValue) {
            const new_values = [];
            for (let i = 0; i < left.value; ++i) new_values.push(...right.elements);
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new StringValue(left.value.repeat(right.value)).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof StringValue) {
            return new RuntimeResult().success(
                new StringValue(right.value.repeat(left.value)).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof NoneValue) {
            return new RuntimeResult().success(
                new NumberValue(0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NoneValue) {
            return new RuntimeResult().success(
                new NumberValue(0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof BooleanValue) {
            return new RuntimeResult().success(
                new NumberValue(left.value * right.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(left.state * right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof BooleanValue) {
            return new RuntimeResult().success(
                new NumberValue(left.state * right.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        this.illegal_operation(node, context);
    }

    /**
     * Interprets a division.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_DivideNode(node: DivideNode, context: Context): RuntimeResult | undefined {
        const res = new RuntimeResult();
        const left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        const right = res.register(this.visit(node.node_b, context));
        if (res.should_return()) return res;

        const err_divide_by_zero = () => {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                'Division by Zero',
                context
            );
        };

        if (left instanceof NumberValue && right instanceof NumberValue) {
            if (right.value === 0) {
                err_divide_by_zero();
            }
            return new RuntimeResult().success(
                new NumberValue(left.value / right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof NoneValue) {
            err_divide_by_zero();
        } else if (left instanceof NoneValue && right instanceof NumberValue) {
            if (right.value === 0) {
                err_divide_by_zero();
            }
            return new RuntimeResult().success(
                new NumberValue(0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NoneValue) {
            err_divide_by_zero();
        } else if (left instanceof NumberValue && right instanceof BooleanValue) {
            if (right.state === 0) {
                err_divide_by_zero();
            }
            return new RuntimeResult().success(
                new NumberValue(left.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof NumberValue) {
            if (right.value === 0) {
                err_divide_by_zero();
            }
            return new RuntimeResult().success(
                new NumberValue(left.state / right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof BooleanValue) {
            if (right.state === 0) {
                err_divide_by_zero();
            }
            return new RuntimeResult().success(
                new NumberValue(left.state / right.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        this.illegal_operation(node, context);
    }

    /**
     * Interprets an euclidian division.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_ModuloNode(node: ModuloNode, context: Context): RuntimeResult | undefined {
        const res = new RuntimeResult();
        const left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        const right = res.register(this.visit(node.node_b, context));
        if (res.should_return()) return res;

        const err_divide_by_zero = () => {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                'Division by Zero',
                context
            );
        };

        if (left instanceof NumberValue && right instanceof NumberValue) {
            if (right.value === 0) {
                err_divide_by_zero();
            }
            return new RuntimeResult().success(
                new NumberValue(left.value % right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof NoneValue) {
            err_divide_by_zero();
        } else if (left instanceof NoneValue && right instanceof NumberValue) {
            if (right.value === 0) {
                err_divide_by_zero();
            }
            return new RuntimeResult().success(
                new NumberValue(0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NoneValue) {
            err_divide_by_zero();
        } else if (left instanceof NumberValue && right instanceof BooleanValue) {
            if (right.state === 0) {
                err_divide_by_zero();
            }
            return new RuntimeResult().success(
                new NumberValue(left.value % right.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof NumberValue) {
            if (right.value === 0) {
                err_divide_by_zero();
            }
            return new RuntimeResult().success(
                new NumberValue(left.state % right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof BooleanValue) {
            if (right.state === 0) {
                err_divide_by_zero();
            }
            return new RuntimeResult().success(
                new NumberValue(left.state % right.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        this.illegal_operation(node, context);
    }

    /**
     * Interprets a power node.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_PowerNode(node: PowerNode, context: Context): RuntimeResult | undefined {
        const res = new RuntimeResult();
        const left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        const right = res.register(this.visit(node.node_b, context));
        if (res.should_return()) return res;

        if (left instanceof NumberValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(left.value ** right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof NoneValue) {
            return new RuntimeResult().success(
                new NumberValue(1).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NoneValue) {
            return new RuntimeResult().success(
                new NumberValue(1).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof BooleanValue) {
            return new RuntimeResult().success(
                new NumberValue(left.value ** right.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(left.state ** right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof BooleanValue) {
            return new RuntimeResult().success(
                new NumberValue(left.state ** right.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        this.illegal_operation(node, context);
    }

    /**
     * Interprets a binary shift to the left (<<)
     * @param node The node.
     * @param context The context to use.
     */
    private visit_BinaryShiftLeftNode(node: BinaryShiftLeftNode, context: Context): RuntimeResult | undefined {
        const res = new RuntimeResult();
        const left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        const right = res.register(this.visit(node.node_b, context));
        if (res.should_return()) return res;

        // number << number            OK
        // number << none              OK
        // none << number              OK
        // number << boolean           OK
        // boolean << number           OK
        // boolean << boolean          OK
        if (left instanceof NumberValue && right instanceof NumberValue) { // number << number 
            return new RuntimeResult().success(
                new NumberValue(left.value << right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof NoneValue) { // number << none
            return new RuntimeResult().success(
                new NumberValue(left.value << 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NumberValue) { // none << number
            return new RuntimeResult().success(
                new NumberValue(0 << right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NoneValue) { // none << none
            return new RuntimeResult().success(
                new NumberValue(0 << 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof BooleanValue) { // number << boolean
            return new RuntimeResult().success(
                new NumberValue(left.value << right.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof NumberValue) { // boolean << number
            return new RuntimeResult().success(
                new NumberValue(left.state << right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof BooleanValue) { // boolean << boolean
            return new RuntimeResult().success(
                new NumberValue(left.state << right.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        this.illegal_operation(node, context);
    }

    /**
     * Interprets a binary shift to the right (>>)
     * @param node The node.
     * @param context The context to use.
     */
    private visit_BinaryShiftRightNode(node: BinaryShiftRightNode, context: Context): RuntimeResult | undefined {
        const res = new RuntimeResult();
        const left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        const right = res.register(this.visit(node.node_b, context));
        if (res.should_return()) return res;

        // number >> number            OK
        // number >> none              OK
        // none >> number              OK
        // number >> boolean           OK
        // boolean >> number           OK
        // boolean >> boolean          OK
        if (left instanceof NumberValue && right instanceof NumberValue) { // number >> number 
            return new RuntimeResult().success(
                new NumberValue(left.value >> right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof NoneValue) { // number >> none
            return new RuntimeResult().success(
                new NumberValue(left.value >> 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NumberValue) { // none >> number
            return new RuntimeResult().success(
                new NumberValue(0 >> right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NoneValue) { // none >> none
            return new RuntimeResult().success(
                new NumberValue(0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof BooleanValue) { // number >> boolean
            return new RuntimeResult().success(
                new NumberValue(left.value >> right.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof NumberValue) { // boolean >> number
            return new RuntimeResult().success(
                new NumberValue(left.state >> right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof BooleanValue) { // boolean >> boolean
            return new RuntimeResult().success(
                new NumberValue(left.state >> right.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        this.illegal_operation(node, context);
    }

    /**
     * Interprets an unsigned binary shift to the right (>>>)
     * @param node The node.
     * @param context The context to use.
     */
    private visit_UnsignedBinaryShiftRightNode(node: UnsignedBinaryShiftRightNode, context: Context): RuntimeResult | undefined {
        const res = new RuntimeResult();
        const left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        const right = res.register(this.visit(node.node_b, context));
        if (res.should_return()) return res;

        // number >>> number            OK
        // number >>> none              OK
        // none >>> number              OK
        // number >>> boolean           OK
        // boolean >>> number           OK
        // boolean >>> boolean          OK
        if (left instanceof NumberValue && right instanceof NumberValue) { // number >>> number 
            return new RuntimeResult().success(
                new NumberValue(left.value >>> right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof NoneValue) { // number >>> none
            return new RuntimeResult().success(
                new NumberValue(left.value >>> 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NumberValue) { // none >>> number
            return new RuntimeResult().success(
                new NumberValue(0 >>> right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NoneValue) { // none >>> none
            return new RuntimeResult().success(
                new NumberValue(0 >>> 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof BooleanValue) { // number >>> boolean
            return new RuntimeResult().success(
                new NumberValue(left.value >>> right.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof NumberValue) { // boolean >>> number
            return new RuntimeResult().success(
                new NumberValue(left.state >>> right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof BooleanValue) { // boolean >>> boolean
            return new RuntimeResult().success(
                new NumberValue(left.state >>> right.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        this.illegal_operation(node, context);
    }

    /**
     * Interprets the logical operation: AND.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_LogicalAndNode(node: LogicalAndNode, context: Context): RuntimeResult | undefined {
        const res = new RuntimeResult();
        const left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        const right = res.register(this.visit(node.node_b, context));
        if (res.should_return()) return res;

        // number & number            OK
        // number & none              OK
        // none & number              OK
        // number & boolean           OK
        // boolean & number           OK
        // boolean & boolean          OK
        if (left instanceof NumberValue && right instanceof NumberValue) { // number & number 
            return new RuntimeResult().success(
                new NumberValue(left.value & right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof NoneValue) { // number & none
            return new RuntimeResult().success(
                new NumberValue(left.value & 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NumberValue) { // none & number
            return new RuntimeResult().success(
                new NumberValue(0 & right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NoneValue) { // none & none
            return new RuntimeResult().success(
                new NumberValue(0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof BooleanValue) { // number & boolean
            return new RuntimeResult().success(
                new NumberValue(left.value & right.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof NumberValue) { // boolean & number
            return new RuntimeResult().success(
                new NumberValue(left.state & right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof BooleanValue) { // boolean & boolean
            return new RuntimeResult().success(
                new NumberValue(left.state & right.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        this.illegal_operation(node, context);
    }

    /**
     * Interprets the logical operation: OR.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_LogicalOrNode(node: LogicalOrNode, context: Context): RuntimeResult | undefined {
        const res = new RuntimeResult();
        const left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        const right = res.register(this.visit(node.node_b, context));
        if (res.should_return()) return res;

        // number | number            OK
        // number | none              OK
        // none | number              OK
        // number | boolean           OK
        // boolean | number           OK
        // boolean | boolean          OK
        if (left instanceof NumberValue && right instanceof NumberValue) { // number | number 
            return new RuntimeResult().success(
                new NumberValue(left.value | right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof NoneValue) { // number | none
            return new RuntimeResult().success(
                new NumberValue(left.value | 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NumberValue) { // none | number
            return new RuntimeResult().success(
                new NumberValue(0 | right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NoneValue) { // none | none
            return new RuntimeResult().success(
                new NumberValue(0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof BooleanValue) { // number | boolean
            return new RuntimeResult().success(
                new NumberValue(left.value | right.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof NumberValue) { // boolean | number
            return new RuntimeResult().success(
                new NumberValue(left.state | right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof BooleanValue) { // boolean | boolean
            return new RuntimeResult().success(
                new NumberValue(left.state | right.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        this.illegal_operation(node, context);
    }

    /**
     * Interprets the logical operation: XOR.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_LogicalXORNode(node: LogicalXORNode, context: Context): RuntimeResult | undefined {
        const res = new RuntimeResult();
        const left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        const right = res.register(this.visit(node.node_b, context));
        if (res.should_return()) return res;

        // number ^ number            OK
        // number ^ none              OK
        // none ^ number              OK
        // number ^ boolean           OK
        // boolean ^ number           OK
        // boolean ^ boolean          OK
        if (left instanceof NumberValue && right instanceof NumberValue) { // number ^ number 
            return new RuntimeResult().success(
                new NumberValue(left.value ^ right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof NoneValue) { // number ^ none
            return new RuntimeResult().success(
                new NumberValue(left.value ^ 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NumberValue) { // none ^ number
            return new RuntimeResult().success(
                new NumberValue(0 ^ right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NoneValue) { // none ^ none
            return new RuntimeResult().success(
                new NumberValue(0 ^ 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof BooleanValue) { // number ^ boolean
            return new RuntimeResult().success(
                new NumberValue(left.value ^ right.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof NumberValue) { // boolean ^ number
            return new RuntimeResult().success(
                new NumberValue(left.state ^ right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof BooleanValue) { // boolean ^ boolean
            return new RuntimeResult().success(
                new NumberValue(left.state ^ right.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        this.illegal_operation(node, context);
    }

    /**
     * Interprets a number with a plus before.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_PlusNode(node: PlusNode, context: Context): RuntimeResult | undefined {
        const res = new RuntimeResult();
        const visited_node = res.register(this.visit(node.node, context));
        if (res.should_return()) return res;

        if (visited_node instanceof NumberValue) {
            return new RuntimeResult().success(
                visited_node
            );
        } else if (visited_node instanceof NoneValue) {
            return new RuntimeResult().success(
                new NumberValue(0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (visited_node instanceof BooleanValue) {
            return new RuntimeResult().success(
                new NumberValue(visited_node.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        this.illegal_operation(node, context);
    }

    /**
     * Interprets a negative number.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_MinusNode(node: MinusNode, context: Context): RuntimeResult | undefined {
        const res = new RuntimeResult();
        const visited_node = res.register(this.visit(node.node, context));
        if (res.should_return()) return res;

        if (visited_node instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(-1 * visited_node.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (visited_node instanceof NoneValue) {
            return new RuntimeResult().success(
                new NumberValue(0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (visited_node instanceof BooleanValue) {
            return new RuntimeResult().success(
                new NumberValue(-1 * visited_node.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        this.illegal_operation(node, context);
    }

    /**
     * Interprets a binary NOT.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_BinaryNotNode(node: BinaryNotNode, context: Context): RuntimeResult | undefined {
        const res = new RuntimeResult();
        const visited_node = res.register(this.visit(node.node, context));
        if (res.should_return()) return res;

        if (visited_node instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(~visited_node.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (visited_node instanceof NoneValue) {
            return new RuntimeResult().success(
                new NumberValue(~0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (visited_node instanceof BooleanValue) {
            return new RuntimeResult().success(
                new NumberValue(~visited_node.state).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        this.illegal_operation(node, context);
    }

    /**
     * Interprets a variable declaration.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_VarAssignNode(node: VarAssignNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const var_name = node.var_name_tok.value;
        const value = res.register(this.visit(node.value_node, context))!;
        if (res.should_return()) return res;

        const given_type = node.type ?? Types.ANY;
        
        if (context.symbol_table!.doesExist(var_name)) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                `Variable "${var_name}" already exists`,
                context
            );
        }

        if (given_type === Types.OBJECT) {
            if (!this.is_value_object(value)) {
                this.type_error(value.type, given_type, node.pos_start, node.pos_end, context);
            }
        } else {
            if (given_type === Types.DYNAMIC) {
                if (value instanceof NoneValue) {
                    this.type_error('none', 'dynamic', node.pos_start, node.pos_end, context);
                }
            } else if (given_type !== Types.ANY) {
                if (given_type !== value.type) {
                    this.type_error(value.type, given_type, node.pos_start, node.pos_end, context);
                }
            }
        }

        value.type = node.type ?? Types.ANY; // if the type is not specified, then it's ANY
        context.symbol_table!.set(var_name, value);

        return res.success(value);
    }

    /**
     * Interprets a variable declaration.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_DefineNode(node: DefineNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const var_name = node.var_name_tok.value as string;
        const value = res.register(this.visit(node.value_node, context))!;
        if (res.should_return()) return res;

        const given_type = node.type ?? Types.ANY;
        
        if (context.symbol_table!.doesConstantExist(var_name)) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                `Constant "${var_name}" already exists`,
                context
            );
        }

        if (given_type === Types.OBJECT) {
            if (!this.is_value_object(value)) {
                this.type_error(value.type, given_type, node.pos_start, node.pos_end, context);
            }
        } else {
            if (given_type === Types.DYNAMIC) {
                if (value instanceof NoneValue) {
                    this.type_error('none', 'dynamic', node.pos_start, node.pos_end, context);
                }
            } else if (given_type !== Types.ANY) {
                if (value.type !== given_type) {
                    this.type_error(value.type, given_type, node.pos_start, node.pos_end, context);
                }
            }
        }

        context.symbol_table!.define_constant(var_name, value); // TODO: check if giving a type to a constant works
        CONSTANTS[var_name] = value; // so that we cannot modify it later

        return new RuntimeResult().success(value);
    }

    /**
     * Interprets a variable call.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_VarAccessNode(node: VarAccessNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const var_name = node.var_name_tok.value;
        let value = context.symbol_table!.get(var_name);

        if (value == null) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                `Variable '${var_name}' is not defined.`,
                context
            );
        }

        value = value.copy().set_pos(node.pos_start, node.pos_end).set_context(context);
        return res.success(value);
    }

    /**
     * Interprets a variable modification.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_VarModifyNode(node: VarModifyNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const var_name = node.var_name_tok.value;
        const value = res.register(this.visit(node.value_node, context))!;
        if (res.should_return()) return res;

        if (is_in(var_name, Object.keys(CONSTANTS))) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "You cannot change the value of a constant.",
                context
            );
        }
        
        const variable = context.symbol_table!.get(var_name);
        if (variable == null) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                `Variable "${var_name}" doesn't exist`,
                context
            );
        }

        if (variable.type === Types.OBJECT) {
            if (!this.is_value_object(value)) {
                this.type_error(value.type, variable.type, node.pos_start, node.pos_end, context);
            }
        } else {
            if (variable.type === Types.DYNAMIC) {
                if (value instanceof NoneValue) {
                    this.type_error('none', 'dynamic', node.pos_start, node.pos_end, context);
                }
            } else if (variable.type !== Types.ANY) {
                if (value.type !== variable.type) {
                    this.type_error(value.type, variable.type, node.pos_start, node.pos_end, context);
                }
            }
        }

        context.symbol_table!.modify(var_name, value);

        return new RuntimeResult().success(value);
    }

    /**
     * Interprets a variable modification only if its null.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_NullishAssignmentNode(node: NullishAssignmentNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const left = res.register(this.visit(node.node_a, context))!;
        if (res.should_return()) return res;

        if (left instanceof NoneValue) {
            if (node.node_a instanceof CallPropertyNode || node.node_a instanceof CallStaticPropertyNode) {
                const new_value = res.register(this.visit(
                    new AssignPropertyNode(
                        node.node_a,
                        node.node_b
                    ),
                    context
                ));
                if (res.should_return()) return res;
                return res.success(new_value);
            } else if (node.node_a instanceof ListAccessNode) {
                const new_value = res.register(this.visit(
                    new ListAssignmentNode(
                        node.node_a,
                        node.node_b
                    ),
                    context
                ));
                if (res.should_return()) return res;
                return res.success(new_value);
            } else if (node.node_a instanceof VarAccessNode) {
                const new_value = res.register(this.visit(
                    new VarModifyNode(
                        node.node_a.var_name_tok,
                        node.node_b
                    ),
                    context
                ));
                if (res.should_return()) return res;
                return res.success(new_value);
            } else {
                throw new RuntimeError(
                    node.pos_start, node.pos_end,
                    "Invalid type of variable for nullish assignment",
                    context
                );
            }
        }

        return res.success(left.copy().set_pos(node.pos_start, node.pos_end).set_context(context));
    }

    /**
     * Interprets a variable modification only if its true.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_AndAssignmentNode(node: AndAssignmentNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const left = res.register(this.visit(node.node_a, context))!;
        if (res.should_return()) return res;

        if (left.is_true()) {
            if (node.node_a instanceof CallPropertyNode || node.node_a instanceof CallStaticPropertyNode) {
                const new_value = res.register(this.visit(
                    new AssignPropertyNode(
                        node.node_a,
                        node.node_b
                    ),
                    context
                ));
                if (res.should_return()) return res;
                return res.success(new_value);
            } else if (node.node_a instanceof ListAccessNode) {
                const new_value = res.register(this.visit(
                    new ListAssignmentNode(
                        node.node_a,
                        node.node_b
                    ),
                    context
                ));
                if (res.should_return()) return res;
                return res.success(new_value);
            } else if (node.node_a instanceof VarAccessNode) {
                const new_value = res.register(this.visit(
                    new VarModifyNode(
                        node.node_a.var_name_tok,
                        node.node_b
                    ),
                    context
                ));
                if (res.should_return()) return res;
                return res.success(new_value);
            } else {
                throw new RuntimeError(
                    node.pos_start, node.pos_end,
                    "Invalid type of variable for and assignment",
                    context
                );
            }
        }

        return res.success(left.copy().set_pos(node.pos_start, node.pos_end).set_context(context));
    }

    /**
     * Interprets a variable modification only if its false.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_OrAssignmentNode(node: OrAssignmentNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const left = res.register(this.visit(node.node_a, context))!;
        if (res.should_return()) return res;

        if (!left.is_true()) {
            if (node.node_a instanceof CallPropertyNode || node.node_a instanceof CallStaticPropertyNode) {
                const new_value = res.register(this.visit(
                    new AssignPropertyNode(
                        node.node_a,
                        node.node_b
                    ),
                    context
                ));
                if (res.should_return()) return res;
                return res.success(new_value);
            } else if (node.node_a instanceof ListAccessNode) {
                const new_value = res.register(this.visit(
                    new ListAssignmentNode(
                        node.node_a,
                        node.node_b
                    ),
                    context
                ));
                if (res.should_return()) return res;
                return res.success(new_value);
            } else if (node.node_a instanceof VarAccessNode) {
                const new_value = res.register(this.visit(
                    new VarModifyNode(
                        node.node_a.var_name_tok,
                        node.node_b
                    ),
                    context
                ));
                if (res.should_return()) return res;
                return res.success(new_value);
            } else {
                throw new RuntimeError(
                    node.pos_start, node.pos_end,
                    "Invalid type of variable for and assignment",
                    context
                );
            }
        }

        return res.success(left.copy().set_pos(node.pos_start, node.pos_end).set_context(context));
    }

    /**
     * Interprets an and node.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_AndNode(node: AndNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const left = res.register(this.visit(node.node_a, context))!;
        if (res.should_return()) return res;

        if (left.is_true()) {
            const right = res.register(this.visit(node.node_b, context))!;
            if (res.should_return()) return res;

            if (right.is_true()) {
                return new RuntimeResult().success(
                    new BooleanValue(1).set_pos(node.pos_start, node.pos_end).set_context(context)
                );
            }
        }

        return new RuntimeResult().success(
            new BooleanValue(0).set_pos(node.pos_start, node.pos_end).set_context(context)
        );
    }

    /**
     * Interprets an or node.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_OrNode(node: OrNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const left = res.register(this.visit(node.node_a, context))!;
        if (res.should_return()) return res;
        const right = res.register(this.visit(node.node_b, context))!;
        if (res.should_return()) return res;

        // returns the thruthly expression
        // not just a boolean unlike 'and'
        const truthly_element = (left.is_true() ? left : right).copy().set_pos(node.pos_start, node.pos_end).set_context(context);

        return new RuntimeResult().success(truthly_element);
    }

    /**
     * Interprets a not node.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_NotNode(node: NotNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const number = res.register(this.visit(node.node, context));
        if (res.should_return()) return res;

        if (number instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(number.value === 0 ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (number instanceof NoneValue) {
            return new RuntimeResult().success(
                new BooleanValue(1).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (number instanceof BooleanValue) {
            return new RuntimeResult().success(
                new BooleanValue(number.state === 0 ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else {
            return new RuntimeResult().success(
                new BooleanValue(0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }
    }

    /**
     * Interprets an equal node.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_EqualsNode(node: EqualsNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const left = res.register(this.visit(node.node_a, context))!;
        if (res.should_return()) return res;
        const right = res.register(this.visit(node.node_b, context))!;
        if (res.should_return()) return res;

        if (left instanceof NumberValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value === right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof ListValue) {
            const is_equal = array_equals(left.elements, right.elements);
            return new RuntimeResult().success(
                new BooleanValue(is_equal ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value === right.value.toString() ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof StringValue) {
            return new RuntimeResult().success(
                new BooleanValue(right.value === left.value.toString() ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof StringValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value === right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionaryValue && right instanceof DictionaryValue) {
            const is_equal = dictionary_equals(left, right);
            return new RuntimeResult().success(
                new BooleanValue(is_equal ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NoneValue) {
            return new RuntimeResult().success(
                new BooleanValue(1).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(right.value === 0 ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof NoneValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value === 0 ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof BooleanValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value === right.state ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.state === right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof BooleanValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.state === right.state ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else {
            return new RuntimeResult().success(
                new BooleanValue(0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }
    }

    /**
     * Interprets a less than node.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_LessThanNode(node: LessThanNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const left = res.register(this.visit(node.node_a, context))!;
        if (res.should_return()) return res;
        const right = res.register(this.visit(node.node_b, context))!;
        if (res.should_return()) return res;

        if (left instanceof NumberValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value < right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.elements.length < right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof ListValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value < right.elements.length ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof ListValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.elements.length < right.elements.length ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value.length < right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof StringValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value < right.value.length ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof StringValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value.length < right.value.length ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionaryValue && right instanceof DictionaryValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.elements.size < right.elements.size ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionaryValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.elements.size < right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof DictionaryValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value < right.elements.size ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NoneValue) {
            return new RuntimeResult().success(
                new BooleanValue(0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(right.value > 0 ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof NoneValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value < 0 ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof BooleanValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value < right.state ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.state < right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof BooleanValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.state < right.state ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else {
            return new RuntimeResult().success(
                new BooleanValue(0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }
    }

    /**
     * Interprets a greater than node.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_GreaterThanNode(node: GreaterThanNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const left = res.register(this.visit(node.node_a, context))!;
        if (res.should_return()) return res;
        const right = res.register(this.visit(node.node_b, context))!;
        if (res.should_return()) return res;

        if (left instanceof NumberValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value > right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.elements.length > right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof ListValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value > right.elements.length ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof ListValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.elements.length > right.elements.length ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value.length > right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof StringValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value > right.value.length ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionaryValue && right instanceof DictionaryValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.elements.size > right.elements.size ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionaryValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.elements.size > right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof DictionaryValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value > right.elements.size ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NoneValue) {
            return new RuntimeResult().success(
                new BooleanValue(0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(right.value < 0 ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof NoneValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value > 0 ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof BooleanValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value > right.state ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.state > right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof BooleanValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.state > right.state ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else {
            return new RuntimeResult().success(
                new BooleanValue(0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }
    }

    /**
     * Interprets a less than or equal node.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_LessThanOrEqualNode(node: LessThanOrEqualNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const left = res.register(this.visit(node.node_a, context))!;
        if (res.should_return()) return res;
        const right = res.register(this.visit(node.node_b, context))!;
        if (res.should_return()) return res;

        if (left instanceof NumberValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value <= right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.elements.length <= right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof ListValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value <= right.elements.length ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof ListValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.elements.length <= right.elements.length ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value.length <= right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof StringValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value <= right.value.length ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionaryValue && right instanceof DictionaryValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.elements.size <= right.elements.size ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionaryValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.elements.size <= right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof DictionaryValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value <= right.elements.size ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NoneValue) {
            return new RuntimeResult().success(
                new BooleanValue(1).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(right.value >= 0 ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof NoneValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value <= 0 ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof BooleanValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value <= right.state ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.state <= right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof BooleanValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.state <= right.state ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else {
            return new RuntimeResult().success(
                new BooleanValue(0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }
    }

    /**
     * Interprets a greater than or equal node.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_GreaterThanOrEqualNode(node: GreaterThanOrEqualNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const left = res.register(this.visit(node.node_a, context))!;
        if (res.should_return()) return res;
        const right = res.register(this.visit(node.node_b, context))!;
        if (res.should_return()) return res;

        if (left instanceof NumberValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value >= right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.elements.length >= right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof ListValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value >= right.elements.length ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof ListValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.elements.length >= right.elements.length ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value.length >= right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof StringValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value >= right.value.length ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionaryValue && right instanceof DictionaryValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.elements.size >= right.elements.size ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionaryValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.elements.size >= right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof DictionaryValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value >= right.elements.size ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NoneValue) {
            return new RuntimeResult().success(
                new BooleanValue(1).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(right.value <= 0 ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof NoneValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value >= 0 ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof BooleanValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value >= right.state ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.state >= right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof BooleanValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.state >= right.state ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else {
            return new RuntimeResult().success(
                new BooleanValue(0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }
    }

    /**
     * Interprets a not equals node.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_NotEqualsNode(node: NotEqualsNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const left = res.register(this.visit(node.node_a, context))!;
        if (res.should_return()) return res;
        const right = res.register(this.visit(node.node_b, context))!;
        if (res.should_return()) return res;

        if (left instanceof NumberValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value !== right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof ListValue) {
            const is_equal = array_equals(left.elements, right.elements);
            return new RuntimeResult().success(
                new BooleanValue(is_equal ? 0 : 1).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value !== right.value.toString() ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof StringValue) {
            return new RuntimeResult().success(
                new BooleanValue(right.value !== left.value.toString() ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof StringValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value !== right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionaryValue && right instanceof DictionaryValue) {
            const is_equal = dictionary_equals(left, right);
            return new RuntimeResult().success(
                new BooleanValue(is_equal ? 0 : 1).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NoneValue) {
            return new RuntimeResult().success(
                new BooleanValue(0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(right.value !== 0 ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof NoneValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value !== 0 ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof BooleanValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value !== right.state ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.state !== right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof BooleanValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.state !== right.state ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else {
            return new RuntimeResult().success(
                new BooleanValue(1).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }
    }

    /**
     * Interprets a nullish coalescing operator
     * @param node The node.
     * @param context The context to use.
     */
    private visit_NullishOperatorNode(node: NullishOperatorNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const left = res.register(this.visit(node.node_a, context))!;
        if (res.should_return()) return res;

        if (left instanceof NoneValue) {
            const right = res.register(this.visit(node.node_b, context));
            if (res.should_return()) return res;
            return new RuntimeResult().success(right);
        } else {
            return new RuntimeResult().success(left);
        }
    }

    /**
     * Interprets a list.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_ListNode(node: ListNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const elements: Value[] = [];
        for (const element_node of node.element_nodes) {
            const value = res.register(this.visit(element_node, context))!;
            if (res.should_return()) return res;
            elements.push(value);
        }

        return res.success(
            new ListValue(elements).set_pos(node.pos_start, node.pos_end).set_context(context)
        );
    }

    /**
     * Interprets a variable call (if the variable is a list).
     * @param node The node.
     * @param context The context to use.
     */
    private visit_ListAccessNode(node: ListAccessNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();

        let value: Value | null = null;
        let var_name: string | null = null;
        if (node.node_to_access instanceof VarModifyNode || node.node_to_access instanceof VarAccessNode || node.node_to_access instanceof VarAssignNode) {
            var_name = node.node_to_access.var_name_tok.value as string;
            value = context.symbol_table!.get(var_name) ?? null;

            if (value == null) {
                throw new RuntimeError(
                    node.pos_start, node.pos_end,
                    `Variable '${var_name}' is not defined.`,
                    context
                );
            }
        } else {
            value = res.register(this.visit(node.node_to_access, context))!;
            if (res.should_return()) return res;
        }

        // just in case the first [] is optional
        // and we are trying to call this first [] on a NoneValue
        if (value instanceof NoneValue && node.list_nodes[0].is_optional) {
            return res.success(
                new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        if (!(value instanceof ListValue) && !(value instanceof DictionaryValue)) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                `Variable '${var_name}' must be a list or a dictionary.`,
                context
            );
        }
        
        value = value.copy().set_pos(node.pos_start, node.pos_end).set_context(context);

        let found_value: Value | null = null;

        for (let i = 0; i < node.list_nodes.length; ++i) {
            const index_node = node.list_nodes[i].node;
            const is_optional = node.list_nodes[i].is_optional;
            let visited_value: StringValue | NumberValue | null = null;
            let binary_selector: [NumberValue, NumberValue | null] | null = null;

            if (index_node instanceof ListBinarySelector) {
                if (value instanceof DictionaryValue) {
                    throw new RuntimeError(
                        node.pos_start, node.pos_end,
                        "Invalid binary selector: cannot get several elements from a dictionary.",
                        context
                    );
                }

                const expr_a: NumberValue = index_node.node_a ? res.register(this.visit(index_node.node_a, context))! : new NumberValue(0);
                if (res.should_return()) return res;

                const expr_b: NumberValue | null = index_node.node_b ? res.register(this.visit(index_node.node_b, context)) : null;
                if (res.should_return()) return res;

                if (!(expr_a instanceof NumberValue) && (expr_b !== null && !(expr_b instanceof NumberValue))) {
                    throw new RuntimeError(
                        index_node.pos_start, index_node.pos_end,
                        `The binary selector of a list must be composed of numbers only.`,
                        context
                    );
                }

                if (expr_a.value < 0) {
                    throw new RuntimeError(
                        expr_a.pos_start, expr_a.pos_end,
                        `The binary selector of a list cannot start with a negative number.`,
                        context
                    );
                }

                binary_selector = [expr_a.copy(), expr_b?.copy() ?? null];
            } else {
                // the visited value is the index between []
                // for example: list[(1+1)], the visited value will be 2
                visited_value = res.register(this.visit(index_node, context));
                if (res.should_return()) return res;
            }

            if (binary_selector && value instanceof ListValue) { // normal
                if (found_value) {
                    if (found_value instanceof ListValue) {
                        if (binary_selector[1] === null) {
                            binary_selector[1] = new NumberValue(found_value.elements.length);
                        } else if (binary_selector[1].value < 0) {
                            binary_selector[1].value = found_value.elements.length + binary_selector[1].value;
                        }

                        found_value = new ListValue(
                            found_value.elements.slice(binary_selector[0].value, binary_selector[1].value)
                        );
                    } else {
                        if (is_optional) {
                            return res.success(
                                new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context)
                            );
                        } else {
                            throw new RuntimeError(
                                index_node.pos_start, index_node.pos_end,
                                `Cannot access value at a certain index if this is not an array.`,
                                context
                            );
                        }
                    }
                } else {
                    if (binary_selector[1] === null) {
                        binary_selector[1] = new NumberValue(value.elements.length);
                    } else if (binary_selector[1].value < 0) {
                        binary_selector[1].value = value.elements.length + binary_selector[1].value;
                    }

                    found_value = new ListValue([...value.elements.slice(binary_selector[0].value, binary_selector[1].value)]);
                }
            } else {
                if (found_value) {
                    if (found_value instanceof ListValue) {
                        if (visited_value instanceof StringValue) {
                            throw new RuntimeError(
                                index_node.pos_start, index_node.pos_end,
                                "Trying to get a key from a non-dictionary value.",
                                context
                            );
                        }

                        if (visited_value!.value < 0) {
                            visited_value!.value = found_value.elements.length + visited_value!.value;
                        }

                        found_value = found_value.elements[visited_value!.value];
                    } else if (found_value instanceof DictionaryValue) {
                        if (visited_value instanceof NumberValue) {
                            throw new RuntimeError(
                                index_node.pos_start, index_node.pos_end,
                                "Cannot retrieve an element from a dictionary with a number",
                                context
                            );
                        }

                        found_value = found_value.elements.get(visited_value!.value as string)!; // TODO: check if this line can put `null` into `found_value`, and would it be a problem?
                    } else {
                        if (is_optional) {
                            return res.success(
                                new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context)
                            );
                        } else {
                            throw new RuntimeError(
                                index_node.pos_start, index_node.pos_end,
                                `Cannot access value at a certain index if this is not an array.`,
                                context
                            );
                        }
                    }
                } else {
                    if (visited_value instanceof NumberValue && value instanceof ListValue && visited_value!.value < 0) {
                        visited_value.value = value.elements.length + visited_value!.value;
                    }

                    if (value instanceof ListValue) {
                        if (!(visited_value instanceof NumberValue)) {
                            throw new RuntimeError(
                                index_node.pos_start, index_node.pos_end,
                                "Unable to retrieve an element from a list without a number as index.",
                                context
                            );
                        }
                        found_value = value.elements[visited_value!.value];
                    } else if (value instanceof DictionaryValue) {
                        if (!(visited_value instanceof StringValue)) {
                            throw new RuntimeError(
                                index_node.pos_start, index_node.pos_end,
                                "Unable to retrieve an element from a dictionary without a string as index.",
                                context
                            );
                        }
                        found_value = value.elements.get((visited_value as StringValue).value)!; // TODO: check if this can be null, and would it be a problem?
                    }
                }

                if (found_value == null) {
                    found_value = new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context);
                }
            }
        }

        return res.success(found_value);
    }

    /**
     * Interprets a variable assignment (if the variable is a list).
     * @param node The node.
     * @param context The context to use.
     */
    private visit_ListAssignmentNode(node: ListAssignmentNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        
        if (!(node.accessor.node_to_access instanceof VarAccessNode)) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "You cannot assign new values to an undeclared list or dictionary.",
                context
            );
        }

        const var_name = node.accessor.node_to_access.var_name_tok.value;
        let value: Value | null = context.symbol_table!.get(var_name);

        if (value == null) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                `Variable '${var_name}' is not defined.`,
                context
            );
        }

        const new_value = res.register(this.visit(node.new_value_node, context))!;
        if (res.should_return()) return res;

        // if the value we are trying to access is already null
        // Example: `list = none; list?.[0] = 5`
        if (value instanceof NoneValue && node.accessor.list_nodes[0].is_optional) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Cannot assign a new value to an optional call",
                context
            );
        }

        if (!(value instanceof ListValue) && !(value instanceof DictionaryValue)) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                `Variable '${var_name}' must be a list or a dictionary.`,
                context
            );
        }
        
        value.set_pos(node.pos_start, node.pos_end).set_context(context);

        const index_per_depth: (NumberValue | StringValue | ListPushBracketsNode | BinarySelectorValues)[] = [];

        for (let i = 0; i < node.accessor.list_nodes.length; ++i) {
            const index_node = node.accessor.list_nodes[i].node;
            const is_optional = node.accessor.list_nodes[i].is_optional;
            if (is_optional) {
                throw new RuntimeError(
                    index_node.pos_start, index_node.pos_end,
                    "Cannot assign a new value to an optional call",
                    context
                );
            }
            const visited_value = index_node instanceof ListPushBracketsNode || index_node instanceof ListBinarySelector ? index_node : res.register(this.visit(index_node, context))!;
            if (res.should_return()) return res;

            if (visited_value instanceof NumberValue || visited_value instanceof StringValue || visited_value instanceof ListPushBracketsNode) {
                index_per_depth.push(visited_value);
            } else if (visited_value instanceof ListBinarySelector) {
                if (value instanceof DictionaryValue) {
                    throw new RuntimeError(
                        node.pos_start, node.pos_end,
                        "Invalid binary selector: cannot get several elements from a dictionary.",
                        context
                    );
                }
                
                const expr_a: NumberValue = visited_value.node_a ? res.register(this.visit(visited_value.node_a, context))! : new NumberValue(0);
                if (res.should_return()) return res;

                const expr_b: NumberValue | null = visited_value.node_b ? res.register(this.visit(visited_value.node_b, context)) : null;
                if (res.should_return()) return res;

                if (!(expr_a instanceof NumberValue) && (expr_b !== null && !(expr_b instanceof NumberValue))) {
                    throw new RuntimeError(
                        index_node.pos_start, index_node.pos_end,
                        `The binary selector of '${var_name}' must be composed of numbers only.`,
                        context
                    );
                }

                if (expr_a.value < 0) {
                    throw new RuntimeError(
                        index_node.pos_start, index_node.pos_end,
                        `The binary selector of '${var_name}' cannot start with a negative number.`,
                        context
                    );
                }

                index_per_depth.push(new BinarySelectorValues(expr_a, expr_b));
            } else {
                throw new RuntimeError(
                    index_node.pos_start, index_node.pos_end,
                    "Unable to interpret an index. It must be a binary selector, empty square brackets, number or string.",
                    context
                );
            }
        }

        let value_to_be_replaced: Value | null = null;
        for (let i = 0; i < index_per_depth.length; i++) {
            // we add something to the array
            // so it's like: `liste[liste.length] = something`
            // but it's ugly so we use `liste[] = something` (like PHP)
            if (index_per_depth[i] instanceof ListPushBracketsNode && value instanceof ListValue) {
                index_per_depth[i].value = value.elements.length;
            }

            const current_index = index_per_depth[i];

            // NumberValue : `list[5] = something` (modify the index 5 by something)
            // ListPushBracketsNode : `list[] = something` (add something to the array)
            // otherwise, it's a binary selector : `list[0:5] = something` (replace the values from index 0 to 5 by something)
            if (current_index instanceof NumberValue || current_index instanceof StringValue || current_index instanceof ListPushBracketsNode) {
                // have we already been searching for a value?
                if (value_to_be_replaced) {
                    // we have several depths, therefore the previous value must be a list
                    if (value_to_be_replaced instanceof ListValue) {
                        // if we are at the last iteration of that loop,
                        // i.e. we have no more values afterwards,
                        // then let's modify our current value by the new value
                        if (i === (index_per_depth.length - 1)) {
                            // once again, we might have `list[1][] = something`
                            if (current_index instanceof StringValue) {
                                throw new RuntimeError(
                                    current_index.pos_start, current_index.pos_end,
                                    "Cannot retrieve an element from a list with a string as index.",
                                    context
                                );
                            }

                            if (current_index instanceof ListPushBracketsNode) {
                                current_index.value = value_to_be_replaced.elements.length;
                            } else if (current_index.value < 0) { // or `list[-1]` === `list[list.length - 1]`
                                current_index.value = value_to_be_replaced.elements.length + current_index.value;
                            }

                            // we have to make sure that every previous values of a selected value is defined (new NoneValue()).
                            if (current_index.value > value_to_be_replaced.elements.length) {
                                for (let e = value_to_be_replaced.elements.length; e < current_index.value; e++) {
                                    value_to_be_replaced.elements[e] = new NoneValue();
                                }
                            }
                            
                            // `value` will be automatically updated
                            value_to_be_replaced.elements[current_index.value] = new_value;
                        } else {
                            if (current_index instanceof StringValue) {
                                throw new RuntimeError(
                                    current_index.pos_start, current_index.pos_end,
                                    "Cannot retrieve an element from a list with a string as index.",
                                    context
                                );
                            }

                            if (current_index.value < 0) {
                                current_index.value = value_to_be_replaced.elements.length + current_index.value;
                            }

                            // this is not the last iteration
                            // so just remember the current value
                            value_to_be_replaced = value_to_be_replaced.elements[current_index.value];
                        }
                    } else if (value_to_be_replaced instanceof DictionaryValue) {
                        // if we are at the last iteration of that loop,
                        // i.e. we have no more values afterwards,
                        // then let's modify our current value by the new value
                        if (i === (index_per_depth.length - 1)) {
                            // once again, we might have `list[1][] = something`
                            if (current_index instanceof ListPushBracketsNode) {
                                if (!(new_value instanceof DictionaryValue)) {
                                    throw new RuntimeError(
                                        current_index.pos_start, current_index.pos_end,
                                        "In order to add an element in a dictionary, the new value must be a dictionary too.",
                                        context
                                    );
                                }
                                // same as dico1 += dico2
                                value_to_be_replaced.elements = new Map(Array.from(value_to_be_replaced.elements.entries()).concat(Array.from(new_value.elements.entries())));
                            } else {
                                if (current_index instanceof StringValue) {
                                    value_to_be_replaced.elements.set(current_index.value, new_value);
                                } else {
                                    throw new RuntimeError(
                                        current_index.pos_start, current_index.pos_end,
                                        "Cannot retrieve an element from a dictionary without a string",
                                        context
                                    );
                                }
                            }
                        } else {
                            if (current_index instanceof StringValue) {
                                value_to_be_replaced = value_to_be_replaced.elements.get(current_index.value) ?? null;
                            } else {
                                throw new RuntimeError(
                                    current_index.pos_start, current_index.pos_end,
                                    "Cannot retrieve an element from a dictionary without a string",
                                    context
                                );
                            }
                        }
                    } else {
                        throw new RuntimeError(
                            current_index.pos_start, current_index.pos_end,
                            `Cannot access value at a certain index if this is not a list or a dictionary.`,
                            context
                        );
                    }
                } else {
                    // if there is only one value, then we can just modify it
                    // that's the easiest case
                    if (index_per_depth.length === 1) {
                        if (value instanceof ListValue) {
                            if (current_index instanceof StringValue) {
                                throw new RuntimeError(
                                    current_index.pos_start, current_index.pos_end,
                                    "Cannot retrieve an element from a list with a string as index.",
                                    context
                                );
                            }

                            if (current_index.value < 0) {
                                current_index.value = value.elements.length + current_index.value;
                            }

                            // we have to make sure that every previous values of a selected value is defined (new NoneValue()).
                            if (current_index.value > value.elements.length) {
                                for (let e = value.elements.length; e < current_index.value; e++) {
                                    value.elements[e] = new NoneValue();
                                }
                            }

                            value.elements[current_index.value] = new_value;
                        } else if (value instanceof DictionaryValue) {
                            if (current_index instanceof ListPushBracketsNode) {
                                if (!(new_value instanceof DictionaryValue)) {
                                    throw new RuntimeError(
                                        new_value.pos_start, new_value.pos_end,
                                        "In order to add an element in a dictionary, the new value must be a dictionary too.",
                                        context
                                    );
                                }
                                value.elements = new Map(Array.from(value.elements.entries()).concat(Array.from(new_value.elements.entries())));
                            } else {
                                if (current_index instanceof StringValue) {
                                    value.elements.set(current_index.value, new_value);
                                } else {
                                    throw new RuntimeError(
                                        current_index.pos_start, current_index.pos_end,
                                        "Cannot retrieve an element from a dictionary without a string",
                                        context
                                    );
                                }
                            }
                        }
                    } else {
                        if (value instanceof ListValue) {
                            // however, we'll have to loop again if we have: `list[0][1]`
                            if (current_index instanceof StringValue) {
                                throw new RuntimeError(
                                    current_index.pos_start, current_index.pos_end,
                                    "Cannot retrieve an element from a list with a string as index.",
                                    context
                                );
                            }

                            if (current_index.value < 0) {
                                current_index.value = value.elements.length + current_index.value;
                            }

                            // so just remember the value `list[0]`
                            // and continue in order to modify `value_to_be_replaced[1]` (value_to_be_replaced = list[0])
                            value_to_be_replaced = value.elements[current_index.value];
                        } else if (value instanceof DictionaryValue) {
                            if (current_index instanceof StringValue) {
                                value_to_be_replaced = value.elements.get(current_index.value) ?? null;
                            } else {
                                throw new RuntimeError(
                                    current_index.pos_start, current_index.pos_end,
                                    "Cannot retrieve an element from a dictionary without a string.",
                                    context
                                );
                            }
                        }
                    }
                }
            } else { // binary selector `list[a:b]`
                if (value instanceof DictionaryValue || value_to_be_replaced instanceof DictionaryValue) {
                    throw new RuntimeError(
                        current_index.a.pos_start, current_index.b?.pos_end ?? current_index.a.pos_end,
                        "Invalid binary selector: cannot get several elements from a dictionary.",
                        context
                    );
                }

                if (value_to_be_replaced) {
                    // if we have already been searching for a list
                    // and we are still not finished with the depths
                    // so it must be a list
                    if (value_to_be_replaced instanceof ListValue) {
                        if (i === (index_per_depth.length - 1)) {
                            if (current_index.b === null) { // the current_index.b might be null if we have "list[1:]"
                                current_index.b = new NumberValue(value_to_be_replaced.elements.length);
                            } else if (current_index.b.value < 0) { // we accept negative numbers only for `b`
                                current_index.b.value = value_to_be_replaced.elements.length + current_index.b.value;
                            }
                            
                            // `a` cannot be greater than the length of the list
                            // therefore we add `none` to the previous values that should have a value already.
                            if (current_index.a.value > value_to_be_replaced.elements.length) {
                                for (let e = value_to_be_replaced.elements.length; e < current_index.a.value; e++) {
                                    value_to_be_replaced.elements[e] = new NoneValue();
                                }
                            }
                            
                            // this is the last depth
                            // therefore, after having searched for the previous values,
                            // we must update the values
                            if (new_value instanceof ListValue) {
                                value_to_be_replaced.elements = [...value_to_be_replaced.elements.slice(0, current_index.a.value), ...new_value.elements, ...value_to_be_replaced.elements.slice(current_index.b.value)];
                            } else {
                                value_to_be_replaced.elements = [...value_to_be_replaced.elements.slice(0, current_index.a.value), new_value, ...value_to_be_replaced.elements.slice(current_index.b.value)];
                            }
                        } else {
                            if (current_index.b === null) { // the current_index.b might be null if we have "list[1:]"
                                current_index.b = new NumberValue(value_to_be_replaced.elements.length);
                            } else if (current_index.b.value < 0) { // we accept negative numbers only for `b`
                                current_index.b.value = value_to_be_replaced.elements.length + current_index.b.value;
                            }
                            
                            // `a` cannot be greater than the length of the list
                            if (current_index.a.value > value_to_be_replaced.elements.length) {
                                throw new RuntimeError(
                                    current_index.a.pos_start, current_index.b.pos_end,
                                    `Cannot access values at this starting index.`,
                                    context
                                );
                            }

                            // value_to_be_replaced is, at every iteration, the previous value
                            // therefore, we imitate the behavior: `((list[0])[1])[2]`
                            value_to_be_replaced = new ListValue(
                                value_to_be_replaced.elements.slice(current_index.a.value, current_index.b.value)
                            );
                        }
                    } else {
                        // if we have `list[1][1]`, but `list[1]` is not an array
                        throw new RuntimeError(
                            current_index.a.pos_start, current_index.b?.pos_end ?? current_index.a.pos_end,
                            `Cannot access value at a certain index if this is not an array.`,
                            context
                        );
                    }
                } else {
                    if (index_per_depth.length === 1) {
                        if (current_index.b === null) { // the current_index.b might be null if we have "list[1:]"
                            current_index.b = new NumberValue(value.elements.length);
                        } else if (current_index.b.value < 0) { // we accept negative numbers only for `b`
                            current_index.b.value = value.elements.length + current_index.b.value;
                        } 

                        // `a` cannot be greater than the length of the list
                        // therefore we add `none` to the previous values that should have a value already.
                        if (current_index.a.value > value.elements.length) {
                            // we have to make sure that every previous values of a selected value is defined (new NoneValue()).
                            for (let e = value.elements.length; e < current_index.a.value; e++) {
                                value.elements[e] = new NoneValue();
                            }
                        }

                        // there is only one depth
                        // therefore, after having searched for the previous values,
                        // we must update the values
                        if (new_value instanceof ListValue) {
                            value.elements = [...value.elements.slice(0, current_index.a.value), ...new_value.elements, ...value.elements.slice(current_index.b.value)]
                        } else {
                            value.elements = [...value.elements.slice(0, current_index.a.value), new_value, ...value.elements.slice(current_index.b.value)]
                        }
                    } else {
                        if (current_index.b === null) { // the current_index.b might be null if we have "list[1:]"
                            current_index.b = new NumberValue(value.elements.length)
                        } else if (current_index.b.value < 0) { // we accept negative numbers only for `b`
                            current_index.b.value = value.elements.length + current_index.b.value;
                        }

                        // `a` cannot be greater than the length of the list
                        if (current_index.a.value > value.elements.length) { 
                            throw new RuntimeError(
                                current_index.a.pos_start, current_index.b.pos_end,
                                `Cannot access values at this starting index.`,
                                context
                            );
                        }

                        // value_to_be_replaced is, at every iteration, the previous value(s)
                        // therefore, we imitate the behavior: `((list[0])[1])[2]`
                        value_to_be_replaced = new ListValue(
                            value.elements.slice(current_index.a.value, current_index.b.value)
                        );
                    }
                }
            }
        }

        context.symbol_table!.set(var_name, value);

        return res.success(new_value);
    }

    /**
     * Interprets a string.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_StringNode(node: StringNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const allow_concatenation = node.allow_concatenation;
        const filename = node.pos_start.fn;
        let interpreted_string = "";

        if (allow_concatenation) {
            for (let i = 0; i < node.token.value.length; ++i) {
                let char = node.token.value[i];
                let code = "";
                let brackets_counter = 1; // so as not to confuse the braces of the concatenation with those of a dictionary inside.
                if (char === "{") {
                    while (true) {
                        ++i;
                        if (i >= node.token.value.length) {
                            throw new RuntimeError(
                                node.pos_start, node.pos_end,
                                "Invalid internal concatenation: the closure '}' is missing",
                                context
                            );
                        }
                        char = node.token.value[i];
                        if (char === "{") brackets_counter++;
                        if (char === "}") brackets_counter--;
                        if (brackets_counter === 0) break;
                        code += char;
                    }
                    if (code.trim().length > 0) {
                        const lexer = new Lexer(code, filename);
                        const tokens = lexer.generate_tokens();
                        const parser = new Parser(tokens);
                        const tree = parser.parse();

                        if (tree == null) {
                            interpreted_string += "{}";
                            continue;
                        }

                        const result = res.register(this.visit(tree, context)) as ListValue;
                        if (res.should_return()) return res; 
                        interpreted_string += result.elements.map(e => e.repr()).join();
                        code = "";
                    } else {
                        interpreted_string += "{" + code + "}";
                    }
                } else {
                    interpreted_string += char;
                }
            }
        } else {
            interpreted_string = node.token.value;
        }

        return res.success(
            new StringValue(interpreted_string).set_context(context).set_pos(node.pos_start, node.pos_end)
        );
    }

    /**
     * Interprets a condition.
     * @param node The node.
     * @param context The context to use.
     */
    public visit_IfNode(node: IfNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const should_return_null = node.should_return_null;

        for (const [condition, expr] of node.cases) {
            const condition_value = res.register(this.visit(condition, context))!;
            if (res.should_return()) return res;

            if (condition_value.is_true()) {
                const expr_value = res.register(this.visit(expr, context));
                if (res.should_return()) return res;
                return res.success(
                    should_return_null && !node.prevent_null_return
                        ? new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context)
                        : expr_value
                );
            }
        }

        if (node.else_case) {
            const else_value = res.register(this.visit(node.else_case, context));
            if (res.should_return()) return res;
            return res.success(
                should_return_null && !node.prevent_null_return
                    ? new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context)
                    : else_value
            );
        }

        return res.success(
            new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context)
        );
    }

    /**
     * Interprets a for node.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_ForNode(node: ForNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const elements: Value[] = []; // we want a loop to return by default a ListValue.

        let start_value = new NumberValue(0);
        if (node.start_value_node) {
            start_value = res.register(this.visit(node.start_value_node, context))!;
            if (res.should_return()) return res;
        }

        const end_value = res.register(this.visit(node.end_value_node, context))!;
        if (res.should_return()) return res;

        // this will automatically decide between 1 or -1
        // based on the values of the starting point and the end point.
        // In other words, if start < end (from 0 to 10 for instance),
        // then we want to increase the variable, otherwise we want to decrease it.
        let step_value = new NumberValue(start_value.value <= end_value.value ? 1 : -1);
        // This default value is overwritten if a value is specified in the program.
        if (node.step_value_node) {
            step_value = res.register(this.visit(node.step_value_node, context))!;
            if (res.should_return()) return res;
        }

        let condition = () => false;
        let i = start_value.value;

        if (step_value.value >= 0) {
            condition = () => i < end_value.value;
        } else {
            condition = () => i > end_value.value;
        }

        while (condition()) {
            context.symbol_table!.set(node.var_name_tok.value, new NumberValue(i));
            const exec_ctx = this.generate_new_context(context, "<for>", node.pos_start);
            
            i += step_value.value;

            const value = res.register(this.visit(node.body_node, exec_ctx))!;
            if (res.should_return() && res.loop_should_continue === false && res.loop_should_break === false) return res;
            if (res.loop_should_continue) continue;
            if (res.loop_should_break) break;

            if (!node.should_return_null && node.prevent_null_return && value instanceof ListValue) {
                // to avoid list of lists (because of 'statements()' on multiline loops)
                // useful inside html structures
                elements.push(...value.elements);
            } else {
                elements.push(value);
            }
        }

        return res.success(
            node.should_return_null
                ? new NoneValue()
                : new ListValue(elements).set_pos(node.pos_start, node.pos_end).set_context(context)
        );
    }

    /**
     * Interprets a foreach node.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_ForeachNode(node: ForeachNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const elements: Value[] = []; // we want a loop to return a ListValue by default.

        let i = 0;
        const list = res.register(this.visit(node.list_node, context));
        if (res.should_return()) return res;

        if (!(list instanceof ListValue) && !(list instanceof DictionaryValue)) {
            throw new RuntimeError(
                node.list_node.pos_start, node.list_node.pos_end,
                "Must loop on a list or dictionary",
                context
            );
        }

        while (true) {
            if (node.key_name_tok !== null) {
                if (list instanceof DictionaryValue) {
                    context.symbol_table!.set(node.key_name_tok.value, new StringValue(Array.from(list.elements.keys())[i]));
                } else {
                    context.symbol_table!.set(node.key_name_tok.value, new NumberValue(i));
                }
            }

            if (list instanceof DictionaryValue) {
                const el = list.elements.get(Array.from(list.elements.keys())[i])!;
                context.symbol_table!.set(node.value_name_tok.value, el);
            } else if (list instanceof ListValue) {
                const el = list.elements[i];
                context.symbol_table!.set(node.value_name_tok.value, el);
            }

            const exec_ctx = this.generate_new_context(context, "<foreach>", node.pos_start);

            const value = res.register(this.visit(node.body_node, exec_ctx))!;
            if (res.should_return() && res.loop_should_continue === false && res.loop_should_break === false) return res;
            if (res.loop_should_continue) continue;
            if (res.loop_should_break) break;

            if (!node.should_return_null && node.prevent_null_return && value instanceof ListValue) {
                // to avoid list of lists (because of 'statements()' on multiline loops)
                // useful inside html structures
                elements.push(...value.elements);
            } else {
                elements.push(value);
            }

            ++i;
            if (list instanceof ListValue) {
                if (i >= list.elements.length) break;
            } else if (list instanceof DictionaryValue) {
                if (i >= list.elements.size) break;
            }
        }

        return res.success(
            node.should_return_null
                ? new NoneValue()
                : new ListValue(elements).set_pos(node.pos_start, node.pos_end).set_context(context)
        );
    }

    /**
     * Interprets a while node.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_WhileNode(node: WhileNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const elements: Value[] = []; // we want a loop to return a custom list by default.

        while (true) {
            const condition = res.register(this.visit(node.condition_node, context))!;
            if (res.should_return()) return res;

            if (!condition.is_true()) break;

            const exec_ctx = this.generate_new_context(context, "<while>", node.pos_start);

            const value = res.register(this.visit(node.body_node, exec_ctx))!;
            if (res.should_return() && res.loop_should_continue === false && res.loop_should_break === false) return res;
            if (res.loop_should_continue) continue;
            if (res.loop_should_break) break;

            elements.push(value);
        }

        return res.success(
            node.should_return_null
                ? new NoneValue()
                : new ListValue(elements).set_pos(node.pos_start, node.pos_end).set_context(context)
        );
    }

    /**
     * Interprets a function definition node.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_FuncDefNode(node: FuncDefNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const func_name = node.var_name_tok ? node.var_name_tok.value : null;
        const body_node = node.body_node;
        const all_args = node.args;

        if (func_name) {
            if (context.symbol_table!.doesExist(func_name)) {
                throw new RuntimeError(
                    node.var_name_tok!.pos_start, node.var_name_tok!.pos_end,
                    `The function '${func_name}' already exists.`,
                    context
                );
            }
        }

        const func_value = new FunctionValue(
            func_name,
            body_node,
            all_args,
            node.should_auto_return)
                .set_context(context)
                .set_pos(node.pos_start, node.pos_end);
            
        // we want to invoke the function with its name
        // so we use it as a variable in our symbole table
        if (func_name) {
            context.symbol_table!.set(func_name, func_value);
        }

        // TODO: if we try and call a function before it is declared in the code, then it will probably throw an error. This needs to be tested and FIXED.

        return res.success(func_value);
    }

    /**
     * Interprets a function call.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_CallNode(node: CallNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const args = [];
        const pos_start = node.pos_start;
        const pos_end = node.pos_end;

        let value_to_call: Value = res.register(this.visit(node.node_to_call, context))!;
        if (res.should_return()) return res;
        

        if (value_to_call instanceof NoneValue && node.is_optional) {
            return res.success(
                new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }


        if (!(value_to_call instanceof FunctionValue) && !(value_to_call instanceof NativeFunction)) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Cannot call a variable that is not a function.",
                context
            );
        }

        value_to_call = value_to_call.copy().set_pos(node.pos_start, node.pos_end);

        for (const arg_node of node.arg_nodes) {
            args.push(res.register(this.visit(arg_node, context)));
            if (res.should_return()) return res;
        }

        let return_value = res.register((value_to_call as BaseFunction).execute(args, pos_start, pos_end))!;
        if (res.should_return()) return res;

        return_value = return_value.copy().set_pos(node.pos_start, node.pos_end).set_context(context);
        
        return res.success(return_value);
    }

    /**
     * Interprets a return node in a function.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_ReturnNode(node: ReturnNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        let value: Value | null = null;

        if (node.node_to_return) {
            value = res.register(this.visit(node.node_to_return, context));
            if (res.should_return()) return res;
        } else {
            value = new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context);
        }

        return res.success_return(value);
    }

    /**
     * Interprets a continue node in a loop.
     */
    private visit_ContinueNode(): RuntimeResult {
        return new RuntimeResult().success_continue();
    }

    /**
     * Interprets a continue node in a loop.
     */
    private visit_BreakNode(): RuntimeResult {
        return new RuntimeResult().success_break();
    }

    /**
     * Interprets a delete node.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_DeleteNode(node: DeleteNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const node_to_delete = node.node_to_delete;
        let var_name: string | null = null;
        
        if (node_to_delete instanceof VarAccessNode) {
            var_name = node_to_delete.var_name_tok.value;
            if (is_in(var_name, Object.keys(CONSTANTS))) {
                throw new RuntimeError(
                    node.pos_start, node.pos_end,
                    "Cannot delete a constant.",
                    context
                );
            }
            context.symbol_table!.remove(var_name);
        } else if (node_to_delete instanceof ListAccessNode) {
            const node_to_access = node_to_delete.node_to_access;
            let var_name: string | null = null;
            let value: Value | null = null;

            if (node_to_access instanceof VarAccessNode) {
                var_name = node_to_access.var_name_tok.value;
                value = context.symbol_table!.get(var_name) ?? null;

                if (value == null) {
                    throw new RuntimeError(
                        node_to_access.pos_start, node_to_access.pos_end,
                        `Variable '${var_name}' is not defined.`,
                        context
                    );
                }

                if (!(value instanceof ListValue) && !(value instanceof DictionaryValue)) {
                    throw new RuntimeError(
                        node_to_access.pos_start, node_to_access.pos_end,
                        `Variable '${var_name}' must be a list or a dictionary.`,
                        context
                    );
                }

                value = value.set_pos(node_to_access.pos_start, node_to_access.pos_end).set_context(context);

                const index_per_depth: (NumberValue | StringValue | BinarySelectorValues | ListPushBracketsNode)[] = [];

                for (let i = 0; i < node_to_delete.list_nodes.length; i++) {
                    const index_node = node_to_delete.list_nodes[i].node;
                    const is_optional = node_to_delete.list_nodes[i].is_optional;
                    if (is_optional) {
                        throw new RuntimeError(
                            node.pos_start, node.pos_end,
                            "Cannot delete an optional call",
                            context
                        );
                    }
                    const visited_value = index_node instanceof ListPushBracketsNode || index_node instanceof ListBinarySelector ? index_node : res.register(this.visit(index_node, context))!;
                    if (res.should_return()) return res;

                    if (visited_value instanceof NumberValue || visited_value instanceof StringValue || visited_value instanceof ListPushBracketsNode) {
                        index_per_depth.push(visited_value);
                    } else if (visited_value instanceof ListBinarySelector) {
                        if (value instanceof DictionaryValue) {
                            throw new RuntimeError(
                                index_node.pos_start, index_node.pos_end,
                                "Invalid binary selector: cannot get several elements from a dictionary.",
                                context
                            );
                        }

                        const expr_a: NumberValue = visited_value.node_a ? res.register(this.visit(visited_value.node_a, context))! : new NumberValue(0);
                        if (res.should_return()) return res;

                        const expr_b = visited_value.node_b ? res.register(this.visit(visited_value.node_b, context)) : null;
                        if (res.should_return()) return res;

                        // TODO: check if this condition works as expected
                        if (!(expr_a instanceof NumberValue) && (expr_b !== null && !(expr_b instanceof NumberValue))) {
                            throw new RuntimeError(
                                index_node.pos_start, index_node.pos_end,
                                `The binary selector of '${var_name}' must be composed of numbers only.`,
                                context
                            );
                        }

                        if (expr_a.value < 0) {
                            throw new RuntimeError(
                                expr_a.pos_start, expr_a.pos_end,
                                `The binary selector of '${var_name}' cannot start with a negative number.`,
                                context
                            );
                        }

                        index_per_depth.push(new BinarySelectorValues(expr_a, expr_b));
                    } else {
                        throw new RuntimeError(
                            index_node.pos_start, index_node.pos_end,
                            `Unable to interpret an index. It must be a binary selector, empty square brackets, number or string.`,
                            context
                        );
                    }
                }

                let value_to_be_replaced: Value | undefined;
                let previous_list_element: Value | undefined; // we need to filter according to the previous depth of the list

                for (let i = 0; i < index_per_depth.length; ++i) {
                    // we add something to the array
                    // so it's like: `liste[liste.length] = something`
                    // but it's ugly so we use `liste[] = something` (like PHP)
                    if (index_per_depth[i] instanceof ListPushBracketsNode && value instanceof ListValue) {
                        index_per_depth[i].value = value.elements.length;
                    }
                    
                    let current_index = index_per_depth[i];

                    // NumberValue : `list[5] = something` (modify the index 5 by something)
                    // ListPushBracketsNode : `list[] = something` (add something to the array)
                    // otherwise, it's a binary selector : `list[0:5] = something` (replace the values from index 0 to 5 by something)
                    if (current_index instanceof NumberValue || current_index instanceof StringValue || current_index instanceof ListPushBracketsNode) {
                        // have we already been searching for a value?
                        if (value_to_be_replaced) {
                            // we have several depths, therefore the previous value must be a list
                            if (value_to_be_replaced instanceof ListValue) {
                                previous_list_element = value_to_be_replaced;

                                if (current_index instanceof StringValue) {
                                    throw new RuntimeError(
                                        current_index.pos_start, current_index.pos_end,
                                        "Cannot retrieve an element from a list with a string as index.",
                                        context
                                    );
                                }

                                // if we are at the last iteration of that loop,
                                // i.e. we have no more values afterwards,
                                // then let's modify our current value by the new value
                                if (i === (index_per_depth.length - 1)) {
                                    // once again, we might have `list[1][] = something`
                                    if (current_index instanceof ListPushBracketsNode) {
                                        current_index.value = value_to_be_replaced.elements.length;
                                    } else if (current_index.value < 0) { // or `list[-1]` === `list[list.length - 1]`
                                        current_index.value = value_to_be_replaced.elements.length + current_index.value;
                                    }

                                    // we have to make sure that every previous values of a selected value is defined (new NoneValue()).
                                    if (current_index.value > value_to_be_replaced.elements.length) {
                                        for (let e = value_to_be_replaced.elements.length; e < current_index.value; ++e) {
                                            value_to_be_replaced.elements[e] = new NoneValue();
                                        }
                                    }
                                    
                                    // `value` will be automatically updated
                                    value_to_be_replaced.elements[current_index.value] = undefined as any; // I know but it will work out at the end
                                } else {
                                    if (current_index.value < 0) {
                                        current_index.value = value_to_be_replaced.elements.length + current_index.value;
                                    }

                                    // this is not the last iteration
                                    // so just remember the current value
                                    value_to_be_replaced = value_to_be_replaced.elements[current_index.value];
                                }
                            } else if (value_to_be_replaced instanceof DictionaryValue) {
                                // if we are at the last iteration of that loop,
                                // i.e. we have no more values afterwards,
                                // then let's modify our current value by the new value
                                if (i === (index_per_depth.length - 1)) {
                                    // once again, we might have `list[1][] = something`
                                    if (current_index instanceof ListPushBracketsNode) {
                                        throw new RuntimeError(
                                            current_index.pos_start, current_index.pos_end,
                                            "Expected an expression between the square brackets ([]).",
                                            context
                                        );
                                    }

                                    if (current_index instanceof StringValue) {
                                        value_to_be_replaced.elements.delete(current_index.value);
                                    } else {
                                        throw new RuntimeError(
                                            current_index.pos_start, current_index.pos_end,
                                            "Cannot retrieve an element from a dictionary without a string",
                                            context
                                        );
                                    }
                                } else {
                                    if (current_index instanceof StringValue) {
                                        value_to_be_replaced = value_to_be_replaced.elements.get(current_index.value);
                                    } else {
                                        throw new RuntimeError(
                                            current_index.pos_start, current_index.pos_end,
                                            "Cannot retrieve an element from a dictionary without a string",
                                            context
                                        );
                                    }
                                }
                            } else {
                                throw new RuntimeError(
                                    current_index.pos_start, current_index.pos_end,
                                    `Cannot access value at a certain index if this is not an array or a dictionary.`,
                                    context
                                );
                            }
                        } else {
                            // if there is only one value, then we can just modify it
                            // that's the easiest case
                            if (index_per_depth.length === 1) {
                                if (value instanceof ListValue) {
                                    previous_list_element = value;

                                    // i == 0
                                    // so it's the same as not using `i`
                                    let index = index_per_depth[0];

                                    if (index instanceof StringValue) {
                                        throw new RuntimeError(
                                            node.pos_start, node.pos_end,
                                            "Cannot retrieve an element from a list with a string as index.",
                                            context
                                        );
                                    }
                                    
                                    if (index.value < 0) {
                                        index.value = value.elements.length + index.value;
                                    }

                                    // we have to make sure that every previous values of a selected value is defined (new NoneValue()).
                                    if (index_per_depth[i].value as number > value.elements.length) {
                                        for (let e = value.elements.length; e < (index_per_depth[i].value as number); ++e) {
                                            value.elements[e] = new NoneValue();
                                        }
                                    }

                                    value.elements[index.value] = undefined as any; // i know i know, just don't worry about it
                                } else if (value instanceof DictionaryValue) {
                                    if (index_per_depth[0] instanceof ListPushBracketsNode) {
                                        throw new RuntimeError(
                                            index_per_depth[0].pos_start, index_per_depth[0].pos_end,
                                            "In order to add an element in a dictionary, the new value must be a dictionary too.",
                                            context
                                        );
                                    } else {
                                        if (index_per_depth[0] instanceof StringValue) {
                                            value.elements.delete(index_per_depth[0].value);
                                        } else {
                                            throw new RuntimeError(
                                                current_index.pos_start, current_index.pos_end,
                                                "Cannot retrieve an element from a dictionary without a string",
                                                context
                                            );
                                        }
                                    }
                                }
                            } else {
                                if (value instanceof ListValue) {
                                    // however, we'll have to loop again if we have: `list[0][1]`
                                    let index = index_per_depth[i];

                                    if (index instanceof StringValue) {
                                        throw new RuntimeError(
                                            node.pos_start, node.pos_end,
                                            "Cannot retrieve an element from a list with a string as index.",
                                            context
                                        );
                                    }

                                    if (index.value < 0) {
                                        index.value = value.elements.length + index.value;
                                    }

                                    // so just remember the value `list[0]`
                                    // and continue in order to modify `value_to_be_replaced[1]` (value_to_be_replaced = list[0])
                                    value_to_be_replaced = value.elements[index.value];
                                } else if (value instanceof DictionaryValue) {
                                    if (current_index instanceof StringValue) {
                                        value_to_be_replaced = value.elements.get(current_index.value);
                                    } else {
                                        throw new RuntimeError(
                                            current_index.pos_start, current_index.pos_end,
                                            "Cannot retrieve an element from a dictionary without a string.",
                                            context
                                        );
                                    }
                                }
                            }
                        }
                    } else { // binary selector `list[a:b]`
                        if (value instanceof DictionaryValue || value_to_be_replaced instanceof DictionaryValue) {
                            throw new RuntimeError(
                                current_index.a.pos_start, current_index.b?.pos_end ?? current_index.a.pos_end,
                                "Invalid binary selector: cannot get several elements from a dictionary.",
                                context
                            );
                        }

                        if (value_to_be_replaced) {
                            // if we have already been searching for a list
                            // and we are still not finished with the depths
                            // so it must be a list
                            if (value_to_be_replaced instanceof ListValue) {
                                previous_list_element = value_to_be_replaced;

                                if (i === (index_per_depth.length - 1)) {
                                    if (current_index.b === null) { // the current_index.b might be null if we have "list[1:]"
                                        current_index.b = new NumberValue(value_to_be_replaced.elements.length);
                                    } else if (current_index.b.value < 0) { // we accept negative numbers only for `b`
                                        current_index.b.value = value_to_be_replaced.elements.length + current_index.b.value;
                                    }
                                    
                                    // `a` cannot be greater than the length of the list
                                    // therefore we add `none` to the previous values that should have a value already.
                                    if (current_index.a.value > value_to_be_replaced.elements.length) {
                                        for (let e = value_to_be_replaced.elements.length; e < current_index.a.value; e++) {
                                            value_to_be_replaced.elements[e] = new NoneValue();
                                        }
                                    }
                                    
                                    // this is the last depth
                                    // therefore, after having searched for the previous values,
                                    // we must update the values
                                    value_to_be_replaced.elements = [...value_to_be_replaced.elements.slice(0, current_index.a.value), undefined as any, ...value_to_be_replaced.elements.slice(current_index.b.value)];
                                } else {
                                    if (current_index.b === null) { // the current_index.b might be null if we have "list[1:]"
                                        current_index.b = new NumberValue(value_to_be_replaced.elements.length);
                                    } else if (current_index.b.value < 0) { // we accept negative numbers only for `b`
                                        current_index.b.value = value_to_be_replaced.elements.length + current_index.b.value;
                                    }
                                    
                                    // `a` cannot be greater than the length of the list
                                    if (current_index.a.value > value_to_be_replaced.elements.length) {
                                        throw new RuntimeError(
                                            current_index.a.pos_start, current_index.a.pos_end,
                                            `Cannot access values at this starting index.`,
                                            context
                                        );
                                    }

                                    // value_to_be_replaced is, at every iteration, the previous value
                                    // therefore, we imitate the behavior: `((list[0])[1])[2]`
                                    value_to_be_replaced = new ListValue(
                                        value_to_be_replaced.elements.slice(current_index.a.value, current_index.b.value)
                                    );
                                }
                            } else {
                                // if we have `list[1][1]`, but `list[1]` is not an array
                                throw new RuntimeError(
                                    current_index.a.pos_start, current_index.b?.pos_end ?? current_index.a.pos_end,
                                    `Cannot access value at a certain index if this is not an array.`,
                                    context
                                );
                            }
                        } else {
                            let list = value as ListValue;

                            if (index_per_depth.length === 1) {
                                previous_list_element = value;

                                if (current_index.b === null) { // the current_index.b might be null if we have "list[1:]"
                                    current_index.b = new NumberValue(list.elements.length);
                                } else if (current_index.b.value < 0) { // we accept negative numbers only for `b`
                                    current_index.b.value = list.elements.length + current_index.b.value;
                                } 

                                // `a` cannot be greater than the length of the list
                                // therefore we add `none` to the previous values that should have a value already.
                                if (current_index.a.value > list.elements.length) {
                                    // we have to make sure that every previous values of a selected value is defined (new NoneValue()).
                                    for (let e = list.elements.length; e < current_index.a.value; e++) {
                                        list.elements[e] = new NoneValue();
                                    }
                                }

                                // there is only one depth
                                // therefore, after having searched for the previous values,
                                // we must update the values
                                list.elements = [...list.elements.slice(0, current_index.a.value), undefined as any, ...list.elements.slice(current_index.b.value)]
                            } else {
                                if (current_index.b === null) { // the current_index.b might be null if we have "list[1:]"
                                    current_index.b = new NumberValue(list.elements.length)
                                } else if (current_index.b.value < 0) { // we accept negative numbers only for `b`
                                    current_index.b.value = list.elements.length + current_index.b.value;
                                }

                                // `a` cannot be greater than the length of the list
                                if (current_index.a.value > list.elements.length) { 
                                    throw new RuntimeError(
                                        current_index.a.pos_start, current_index.a.pos_end,
                                        `Cannot access values at this starting index.`,
                                        context
                                    );
                                }

                                // value_to_be_replaced is, at every iteration, the previous value(s)
                                // therefore, we imitate the behavior: `((list[0])[1])[2]`
                                value_to_be_replaced = new ListValue(
                                    list.elements.slice(current_index.a.value, current_index.b.value)
                                );
                            }
                        }
                    }
                }

                const remove = (arr: ListValue) => {
                    arr.elements = arr.elements.filter((value) => {
                        if (value !== undefined) {
                            return value;
                        }
                    });
                    return arr.elements;
                };

                if (previous_list_element instanceof ListValue) {
                    try {
                        previous_list_element.elements = [...remove(previous_list_element)];
                    } catch(e) {
                        throw new RuntimeError(
                            node_to_delete.pos_start, node_to_delete.pos_end,
                            "Unable to delete this element.",
                            context
                        );
                    }
                }

                context.symbol_table!.set(var_name, value);
            } else {
                throw new RuntimeError(
                    node_to_access.pos_start, node_to_access.pos_end,
                    "Expected a variable to delete.",
                    context
                );
            }
        } else {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Expected a variable to delete.",
                context
            );
        }

        return res.success(new NoneValue());
    }

    /**
     * Interprets an incrementation/decrementation node (++a or --a).
     * @param node The node.
     * @param context The context to use.
     */
    private visit_PrefixOperationNode(node: PrefixOperationNode, context: Context): RuntimeResult | undefined {
        const res = new RuntimeResult();
        const difference = node.difference;
        const visited = res.register(this.visit(node.node, context));
        if (res.should_return()) return res;

        if (visited instanceof NumberValue) {
            return res.success(
                new NumberValue(visited.value + difference).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (visited instanceof NoneValue) {
            return res.success(
                new NumberValue(difference).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        this.illegal_operation(node, context); 
    }

    /**
     * Interprets an incrementation/decrementation node (a++ or a--).
     * @param node The node.
     * @param context The context to use.
     */
    private visit_PostfixOperationNode(node: PostfixOperationNode, context: Context): RuntimeResult | undefined {
        const access_node = node.node;
        const difference = node.difference;
        
        if (!(access_node instanceof VarAccessNode)) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Expected a variable to increment",
                context
            );
        }

        const var_name = access_node.var_name_tok.value;

        if (is_in(var_name, Object.keys(CONSTANTS))) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "You cannot change the value of a constant.",
                context
            );
        }

        const value = context.symbol_table!.get(var_name);
        if (value == null) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                `Variable "${var_name}" doesn't exist`,
                context
            );
        }

        if (value instanceof NumberValue) {
            const new_value = new NumberValue(value.value + difference).set_pos(node.pos_start, node.pos_end).set_context(context);
            context.symbol_table!.modify(var_name, new_value);
            return new RuntimeResult().success(new_value);
        } else if (value instanceof NoneValue) { // None++ == 1
            const new_value = new NumberValue(difference).set_pos(node.pos_start, node.pos_end).set_context(context);
            context.symbol_table!.modify(var_name, new_value);
            return new RuntimeResult().success(new_value);
        }
        
        this.illegal_operation(node, context);
    }

    /**
     * Interprets a dictionary.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_DictionaryNode(node: DictionaryNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const map = new Map<string, Value>();

        for (const element of node.element_nodes) {
            const key = element.key.token.value;
            const value = res.register(this.visit(element.value, context))!;
            if (res.should_return()) return res;

            if (map.has(key)) {
                throw new RuntimeError(
                    node.pos_start, node.pos_end,
                    `The key '${key}' has already been defined.`,
                    context
                );
            }

            map.set(key, value);
        }

        return res.success(
            new DictionaryValue(map).set_pos(node.pos_start, node.pos_end).set_context(context)
        );
    }

    /**
     * Interprets the declaration of a property.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_ClassPropertyDefNode(node: ClassPropertyDefNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const property_name = node.property_name_tok.value;
        const value = res.register(this.visit(node.value_node, context))!;
        if (res.should_return()) return res;

        const given_type = node.type ?? Types.ANY;

        if (context.symbol_table!.doesExist(property_name)) {
            throw new RuntimeError(
                node.property_name_tok.pos_start, node.property_name_tok.pos_end,
                `Property '${property_name}' already exists.`,
                context
            );
        }

        if (given_type === Types.OBJECT) {
            if (!this.is_value_object(value)) {
                this.type_error(value.type, given_type, node.pos_start, node.pos_end, context);
            }
        } else {
            if (given_type === Types.DYNAMIC) {
                if (value instanceof NoneValue) {
                    this.type_error('none', 'dynamic', node.pos_start, node.pos_end, context);
                }
            } else if (given_type !== Types.ANY) {
                if (value.type !== given_type) {
                    this.type_error(value.type, given_type, node.pos_start, node.pos_end, context);
                }
            }
        }

        // add into the context allows me to check if a property, method etc. has already been defined inside the class
        value.type = node.type ?? Types.ANY;
        context.symbol_table!.set(property_name, value);

        return res.success(value);
    }

    /**
     * Interprets a class declaration.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_ClassDefNode(node: ClassDefNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const class_name = node.class_name_tok.value;
        const parent_class_name = node.parent_class_tok ? node.parent_class_tok.value : null;
        let parent_class_value: ClassValue | null = null;

        if (context.symbol_table!.doesExist(class_name)) {
            throw new RuntimeError(
                node.class_name_tok.pos_start, node.class_name_tok.pos_end,
                `Class "${class_name}" already exists`,
                context
            );
        }

        if (parent_class_name !== null) {
            parent_class_value = (context.symbol_table!.get(parent_class_name) as ClassValue | undefined) ?? null;
            if (parent_class_value == null) {
                throw new RuntimeError(
                    node.parent_class_tok!.pos_start, node.parent_class_tok!.pos_end,
                    "Unknown class",
                    context
                );
            }
            if (!(parent_class_value instanceof ClassValue)) {
                throw new RuntimeError(
                    node.parent_class_tok!.pos_start, node.parent_class_tok!.pos_end,
                    "A class must inherit from another class.",
                    context
                );
            }
        }

        // Here we create a copy that contains all the elements that are not Private
        const value = new ClassValue(class_name, parent_class_value ? new Map(Array.from(parent_class_value!.self.entries()).filter(v => v[1].status !== Visibility.Private)) : new Map(), parent_class_value).set_pos(node.pos_start, node.pos_end).set_context(context);
        
        const exec_ctx = this.generate_new_context(context, value.context_name, node.pos_start);
        value.self.set('__name', { static_prop: 1, status: Visibility.Public, value: new StringValue(class_name).set_context(exec_ctx) });
        if (parent_class_value) {
            value.self.set('__parent_name', { static_prop: 1, status: Visibility.Public, value: new StringValue(parent_class_name!) });
        }
        
        exec_ctx.symbol_table!.set("self", value);

        // checks if a property/method/setter/getter already exists
        // useful if we have a parent class (we don't want the child class to declare the same properties as its parent).
        const check_if_already_exists = (name: string, type: string, pos_start: Position, pos_end: Position) => {
            if (name === "__init" || name === "__repr") return;
            if (value.self.has(name)) {
                throw new RuntimeError(
                    pos_start, pos_end,
                    `The ${type} "${name}" already exists.`,
                    exec_ctx
                );
            }
        };

        // Must be before properties
        // so that we can use methods inside properties.
        // Besides, we can use properties as default value for arguments :)
        for (let i = 0; i < node.methods.length; ++i) {
            const method_node = node.methods[i];
            const method_name = method_node.func.var_name_tok!.value;
            const method_status = method_node.status;
            if (method_name === "__name" || method_name === "toString") {
                throw new RuntimeError(
                    method_node.func.var_name_tok!.pos_start, method_node.func.var_name_tok!.pos_end,
                    `The identifier '${method_name}' is already reserved.`,
                    context
                );
            }
            if (method_name === "__init" || method_name === "__repr") {
                if (method_status !== 1) {
                    let status_string = method_status === 0 ? "private" : "protected";
                    throw new RuntimeError(
                        method_node.pos_start, method_node.pos_end,
                        `The ${method_name} method cannot be ${status_string}.`,
                        context
                    );
                }
                if (method_node.override) {
                    throw new RuntimeError(
                        method_node.pos_start, method_node.pos_end,
                        `The ${method_name} method cannot be overwritten.`,
                        context
                    );
                }
                if (method_node.static_prop) {
                    throw new RuntimeError(
                        method_node.pos_start, method_node.pos_end,
                        `The ${method_name} method cannot be static.`,
                        context
                    );
                }
            }
            const method = res.register(this.visit(method_node.func, exec_ctx))! as FunctionValue;
            if (res.should_return()) return res;
            if (method_name === "__repr" && method.args.length > 0) {
                throw new RuntimeError(
                    method_node.pos_start, method_node.pos_end,
                    `The __repr method is not allowed to have arguments.`,
                    context
                );
            }
            method.type_name = "method";
            if (!method_node.override) {
                check_if_already_exists(method_name, "method", method_node.func.var_name_tok!.pos_start, method_node.func.var_name_tok!.pos_end);
            }
            value.self.set(method_name, { static_prop: method_node.static_prop, status: method_status, value: method });
        }

        for (let i = 0; i < node.properties.length; ++i) {
            const property_node = node.properties[i];
            const property_name = property_node.property_name_tok.value;
            if (property_name === "__name" || property_name === "toString") {
                throw new RuntimeError(
                    property_node.pos_start, property_node.pos_end,
                    `The identifier '${property_name}' is already reserved.`,
                    context
                );
            }
            if (property_name === "__init" || property_name === "__repr") {
                throw new RuntimeError(
                    property_node.property_name_tok.pos_start, property_node.property_name_tok.pos_end,
                    `In a class, '${property_name}' must be a method.`,
                    context
                );
            }
            const property_status = property_node.status;
            const property = res.register(this.visit(property_node, exec_ctx))!;
            if (res.should_return()) return res;
            if (!property_node.override) {
                check_if_already_exists(property_name, "property", property_node.property_name_tok.pos_start, property_node.property_name_tok.pos_end);
            }
            value.self.set(property_name, { static_prop: property_node.static_prop, status: property_status, value: property });
        }

        for (let i = 0; i < node.getters.length; i++) {
            const getter_node = node.getters[i];
            const getter_name = getter_node.func.var_name_tok!.value;
            if (getter_name === "__name" || getter_name === "toString") {
                throw new RuntimeError(
                    getter_node.func.var_name_tok!.pos_start, getter_node.func.var_name_tok!.pos_end,
                    `The identifier '${getter_name}' is already reserved.`,
                    context
                );
            }
            if (getter_name === "__init" || getter_name === "__repr") {
                throw new RuntimeError(
                    getter_node.pos_start, getter_node.pos_end,
                    `In a class, '${getter_name}' must be a method.`,
                    context
                );
            }
            if (getter_node.status !== 1) {
                throw new RuntimeError(
                    getter_node.pos_start, getter_node.pos_end,
                    `Invalid status for getter '${getter_name}'. Getters can only be public.`,
                    context
                );
            }
            const getter = res.register(this.visit(getter_node.func, exec_ctx)) as FunctionValue;
            if (res.should_return()) return res;
            getter.type_name = "getter";
            if (!getter_node.override) {
                check_if_already_exists(getter_name, "getter", getter_node.func.var_name_tok!.pos_start, getter_node.func.var_name_tok!.pos_end);
            }
            value.self.set(getter_name, { static_prop: getter_node.static_prop, status: Visibility.Public, value: getter });
        }

        for (let i = 0; i < node.setters.length; ++i) {
            const setter_node = node.setters[i];
            const setter_name = setter_node.func.var_name_tok!.value;
            if (setter_node.static_prop) {
                throw new RuntimeError(
                    setter_node.func.var_name_tok!.pos_start, setter_node.func.var_name_tok!.pos_end,
                    `A setter cannot be static`,
                    context
                );
            }
            if (setter_name === "__name" || setter_name === "toString") {
                throw new RuntimeError(
                    setter_node.pos_start, setter_node.pos_end,
                    `The identifier '${setter_name}' is already reserved.`,
                    context
                );
            }
            if (setter_name === "__init" || setter_name === "__repr") {
                throw new RuntimeError(
                    setter_node.pos_start, setter_node.pos_end,
                    `In a class, '${setter_name}' must be a method.`,
                    context
                );
            }
            if (setter_node.status !== Visibility.Public) {
                throw new RuntimeError(
                    setter_node.pos_start, setter_node.pos_end,
                    `Invalid status for setter '${setter_name}'. Setters can only be public.`,
                    context
                );
            }
            const setter = res.register(this.visit(setter_node.func, exec_ctx)) as FunctionValue;
            if (res.should_return()) return res;
            setter.type_name = "setter";
            if (!setter_node.override) {
                check_if_already_exists(setter_name, "setter", setter_node.func.var_name_tok!.pos_start, setter_node.func.var_name_tok!.pos_end);
            }
            value.self.set(setter_name, { static_prop: 0, status: Visibility.Public, value: setter });
        }

        context.symbol_table!.set(class_name, value);

        return res.success(new NoneValue());
    }

    /**
     * Interprets an instantiation of a class.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_ClassCallNode(node: ClassCallNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const class_name = node.class_name_tok.value;
        const value: Value | null = context.symbol_table!.get(class_name) ?? null;

        if (value == null) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                `Class '${class_name}' is not defined.`,
                context
            );
        }

        if (!(value instanceof ClassValue) && !(value instanceof NativeClassValue)) {
            throw new RuntimeError(
                node.class_name_tok.pos_start, node.class_name_tok.pos_end,
                `Variable ${class_name} is not a class.`,
                context
            );
        }

        // the instance of a class
        // does not heritate the static properties
        // TODO: what about the private properties? Does the instance have access to the private methods/properties from the parent?
        const new_class_value = new ClassValue(class_name, new Map(Array.from(value.self.entries()).filter(v => v[1].static_prop === 0)), value.parent_class).set_pos(node.pos_start, node.pos_end).set_context(context);
        const __init = new_class_value.self.get("__init");
        new_class_value.is_instance = true;
        
        if (__init) {
            const method = __init.value as FunctionValue;
            const args: Value[] = [];
            for (const arg of node.arg_nodes) {
                const value = res.register(this.visit(arg, context))!;
                if (res.should_return()) return res;
                args.push(value);
            }

            if (method.context == null) {
                method.context = new Context(method.name, null, null);
            }

            method.context.symbol_table!.set('self', new_class_value);
            res.register(method.execute(args, node.pos_start, node.pos_end)); // we want to refer to the position of the call, in case there is an error like "too many arguments"
            if (res.should_return()) return res;
        }

        return res.success(new_class_value);
    }

    /**
     * Interprets a property call (`example.property`)
     * @param node The node.
     * @param context The context to use.
     */
    private visit_CallPropertyNode(node: CallPropertyNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const base = res.register(this.visit(node.node_to_call, context))!;
        if (res.should_return()) return res;
        const property_name = node.property_tok.value;

        // Make sure that it's not calling the constructor of a class.
        if (base instanceof ClassValue || base instanceof NativeClassValue || base instanceof TagValue) {
            if (property_name === "__init") {
                throw new RuntimeError(
                    node.property_tok.pos_start, node.property_tok.pos_end,
                    `The __init method cannot be invoked.`,
                    context
                );
            }
        }

        if (base instanceof ClassValue || base instanceof NativeClassValue) {
            const prop = base.self.get(property_name);

            if (prop == null) {
                return res.success(
                    new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context)
                );
            }

            const value = prop.value as FunctionValue;

            // cannot call a static property like that:
            // self.static_property
            if (prop.static_prop) {
                throw new RuntimeError(
                    node.pos_start, node.pos_end,
                    `Cannot call the static property '${property_name}' like that. Use the appropriate syntax '::'.`,
                    context
                );
            }

            if (!context.is_context_in(base.context_name)) {
                // this means that we are outside the class
                if (prop.status === Visibility.Private || prop.status === Visibility.Protected) {
                    // this means that the property we are looking for is not public
                    const status_string = prop.status === Visibility.Private ? "private" : "protected";
                    throw new RuntimeError(
                        node.property_tok.pos_start, node.property_tok.pos_end,
                        `The property '${property_name}' is marked as ${status_string}. You cannot access it outside the class itself.`,
                        context
                    );
                }
            }

            // TODO: not sure if this is every useful
            if (value instanceof NativePropertyValue) {
                if (value.nature === PropertyNature.Property) { 
                    const exec_ctx = this.generate_new_context(context, base.context_name, node.pos_start);
                    exec_ctx.symbol_table!.set("self", base);
                    return res.success(value.behavior(exec_ctx, node.pos_start, node.pos_end).value);
                }
            }

            return res.success(value);
        } else if (base instanceof TagValue) {
            const prop = base.self.get(property_name);

            if (prop == null) {
                return res.success(
                    new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context)
                );
            }

            const value = prop.value;

            return res.success(value);
        } else if (base instanceof EnumValue) {
            const prop = base.properties.get(property_name);
            if (prop == null) {
                throw new RuntimeError(
                    node.pos_start, node.pos_end,
                    "Undefined property",
                    context
                );
            }
            return res.success(prop);
        } else {
            if (node.is_optional) {
                return res.success(
                    new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context)
                );
            } else {
                throw new RuntimeError(
                    node.pos_start, node.pos_end,
                    "Cannot call a property from this type of value.",
                    context
                );
            }
        }
    }

    /**
     * Interprets a static property call (`self::name`)
     * @param node The node.
     * @param context The context to use.
     */
    private visit_CallStaticPropertyNode(node: CallStaticPropertyNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const base = res.register(this.visit(node.node_to_call, context))!;
        if (res.should_return()) return res;
        const property_name = node.property_tok.value;

        if (!(base instanceof ClassValue)) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Cannot call a property from a non-class value.",
                context
            );
        }

        const prop = base.self.get(property_name);
        
        if (prop == null) {
            if (node.is_optional) {
                return res.success(
                    new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context)
                );
            } else {
                throw new RuntimeError(
                    node.pos_start, node.pos_end,
                    "Undefined static property",
                    context
                );
            }
        }

        if (!prop.static_prop) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                `The property '${property_name}' is not static.`,
                context
            );
        }

        const value = prop.value;

        if (!context.is_context_in(base.context_name)) {
            // this means that we are outside the class
            if (prop.status === Visibility.Private || prop.status === Visibility.Protected) {
                // this means that the property we are looking for is not public
                const status_string = prop.status === Visibility.Private ? "private" : "protected";
                throw new RuntimeError(
                    node.property_tok.pos_start, node.property_tok.pos_end,
                    `The property '${property_name}' is marked as ${status_string}. You cannot access it outside the class itself.`,
                    context
                );
            }
        }

        return res.success(value);
    }

    /**
     * Interprets the modification of a property.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_AssignPropertyNode(node: AssignPropertyNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        let new_value = res.register(this.visit(node.value_node, context))!;
        if (res.should_return()) return res;
        const base = res.register(this.visit(node.property.node_to_call, context))!;
        if (res.should_return()) return res;
        const property_name = node.property.property_tok.value;
        
        // TODO: ^^ shouldn't the base be visited first?

        // we cannot do: `example?.thing = 5`
        if (node.property.is_optional) {
            throw new RuntimeError(
                node.property.pos_start, node.property.pos_end,
                `Cannot assign a new value to an optional call.`,
                context
            );
        }

        if (property_name === "__init" || property_name === "__repr") {
            throw new RuntimeError(
                node.property.pos_start, node.property.pos_end,
                `The ${property_name} method cannot be reassigned.`,
                context
            );
        }

        if (base instanceof NativeClassValue) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "You cannot assign new values to native properties.",
                context
            );
        } else if (!(base instanceof ClassValue) && !(base instanceof TagValue)) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Cannot call a property from this type of value.",
                context
            );
        }

        if (base instanceof ClassValue) {
            const prop = base.self.get(property_name);
            let status = Visibility.Public;
            let static_prop = 0;

            // TODO: can the user define new properties to a class?
            // TODO: can the user define new properties to a dictionary?
            // TODO: whoops, rename all "dictionary" to "dictionary"

            // the property does not exist
            // or we call it as a static property
            // that's not good
            if (!prop && node.property instanceof CallStaticPropertyNode) {
                throw new RuntimeError(
                    node.pos_start, node.pos_end,
                    "You cannot assign new static properties to the instance of a class.",
                    context
                );
            }

            if (prop) {
                status = prop.status;
                static_prop = prop.static_prop;
                if (!context.is_context_in(base.context_name)) {
                    // this means that we are outside the class
                    if (status === Visibility.Private || status === Visibility.Protected) {
                        // this means that the property we are looking for is not public
                        let status_string = prop.status === Visibility.Private ? "private" : "protected";
                        throw new RuntimeError(
                            node.property.property_tok.pos_start, node.property.property_tok.pos_end,
                            `The property '${property_name}' is marked as ${status_string}. You cannot access it outside the class itself.`,
                            context
                        );
                    }
                }
            } else {
                // TODO: test assignment to a property that does not exist on a class instance.
                throw new RuntimeError(
                    node.pos_start, node.pos_end,
                    `The property of name '${property_name}' does not exist on type '${base.name}'.`,
                    context
                );
            }

            if (prop.value.type === Types.OBJECT) {
                if (!this.is_value_object(new_value)) {
                    this.type_error(new_value.type, prop.value.type, node.pos_start, node.pos_end, context);
                }
            } else {
                if (prop.value.type === Types.DYNAMIC) {
                    if (new_value instanceof NoneValue) {
                        this.type_error('none', 'dynamic', node.pos_start, node.pos_end, context);
                    }
                } else if (prop.value.type !== Types.ANY) {
                    if (new_value.type !== prop.value.type) {
                        this.type_error(new_value.type, prop.value.type, node.pos_start, node.pos_end, context);
                    }
                }
            }

            new_value = new_value.copy().set_pos(node.value_node.pos_start, node.value_node.pos_end).set_context(context);
            base.self.set(property_name, { static_prop, status, value: new_value });

            return res.success(new_value);
        } else {
            // base is of type TagValue

            const property = base.self.get(property_name);

            // TODO: test this too
            if (property == null) {
                throw new RuntimeError(
                    node.pos_start, node.pos_end,
                    `The property of name '${property_name}' does not exist on tag '${base.name}'.`,
                    context
                );
            }

            const prop = property?.prop ?? 0;
            const state = property?.state ?? 0;
            const optional = property?.optional ?? 0;

            if (property.value.type === Types.OBJECT) {
                if (!this.is_value_object(new_value)) {
                    this.type_error(new_value.type, property.value.type, node.pos_start, node.pos_end, context);
                }
            } else {
                if (property.value.type === Types.DYNAMIC) {
                    if (new_value instanceof NoneValue) {
                        this.type_error('none', 'dynamic', node.pos_start, node.pos_end, context);
                    }
                } else if (property.value.type !== Types.ANY) {
                    if (new_value.type !== property.value.type) {
                        this.type_error(new_value.type, property.value.type, node.pos_start, node.pos_end, context);
                    }
                }
            }

            new_value = new_value.copy().set_pos(node.value_node.pos_start, node.value_node.pos_end).set_context(context);
            base.self.set(property_name, { prop, state, optional, value: new_value });

            return res.success(new_value);
        }
    }

    /**
     * Interprets a method call.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_CallMethodNode(node: CallMethodNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const args: Value[] = [];
        const pos_start = node.pos_start;
        const pos_end = node.pos_end;
        const node_to_call = node.node_to_call as CallNode; // example.thing.prop(args)
        const origin = node.origin; // example

        // origin => self, in the execution context of the function

        const origin_instance = res.register(this.visit(origin, context))!;
        if (res.should_return()) return res;

        if (origin_instance instanceof NoneValue && node.is_optional) {
            return res.success(
                new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        if (origin_instance instanceof ClassValue || origin_instance instanceof TagValue) {
            const exec_ctx = this.generate_new_context(context, origin_instance.context_name, node.pos_start);
            exec_ctx.symbol_table!.set("self", origin_instance);

            // TODO: check if it's possible to chain calls:
            // - prop1.prop2.function()
            // - prop1.function().prop1.prop2.function()
            let value_to_call: Value = res.register(this.visit(node_to_call.node_to_call, context))!;
            if (res.should_return()) return res;

            // it might be a native function
            if (!(value_to_call instanceof FunctionValue) && !(value_to_call instanceof NativeFunction)) {
                if (node.is_optional) {
                    return res.success(
                        new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context)
                    );
                } else {
                    console.log("ERROR THROWN HERE")
                    throw new RuntimeError(
                        node.pos_start, node.pos_end,
                        "Cannot call a variable that is not a function.",
                        context
                    );
                }
            }

            value_to_call = value_to_call.copy().set_pos(node.pos_start, node.pos_end);

            for (let arg_node of node_to_call.arg_nodes) {
                args.push(res.register(this.visit(arg_node, context))!);
                if (res.should_return()) return res;
            }
            
            
            let return_value = res.register((value_to_call.set_context(exec_ctx) as FunctionValue | NativeFunction).execute(args, pos_start, pos_end))!;
            if (res.should_return()) return res;

            return_value = return_value.copy().set_pos(node.pos_start, node.pos_end).set_context(context);

            return res.success(return_value);
        } else if (origin_instance instanceof NativeClassValue) {
            const exec_ctx = this.generate_new_context(context, origin_instance.context_name, node.pos_start);
            exec_ctx.symbol_table!.set("self", origin_instance);

            const value_to_call: Value = res.register(this.visit(node_to_call.node_to_call, context))!;
            if (res.should_return()) return res;

            if (value_to_call == null) {
                throw new RuntimeError(
                    node.pos_start, node.pos_end,
                    "Cannot call a property that does not exist.",
                    context
                );
            }

            if (!(value_to_call instanceof NativePropertyValue)) {
                if (node.is_optional) {
                    return res.success(
                        new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context)
                    );
                } else {
                    throw new RuntimeError(
                        node.pos_start, node.pos_end,
                        "Cannot call a variable that is not a function.",
                        context
                    );
                }
            }

            for (const arg_node of node_to_call.arg_nodes) {
                args.push(res.register(this.visit(arg_node, context))!);
                if (res.should_return()) return res;
            }

            let return_value = res.register(value_to_call.set_context(exec_ctx).execute(args, pos_start, pos_end))!;
            if (res.should_return()) return res;

            return_value = return_value.copy().set_pos(node.pos_start, node.pos_end).set_context(context);

            return res.success(return_value);
        } else {
            throw new RuntimeError(
                pos_start, pos_end,
                "Cannot call a method from a non-class value.",
                context
            );
        }
    }

    /**
     * Interprets a super method.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_SuperNode(node: SuperNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const args: Value[] = [];
        
        // the goal here is to give the parent method the right instance of self
        // for that, we grab self from the current context
        // and we look in the context in order to determine in which class we are
        // We execute the corresponding method for each parent.
        // just a little problem: self::__name (and other constants) will always be a reference to the first class that calls super()
        // It was pretty complicated so the solution might be ugly
        // TODO: investigate ^^

        const err_outside = () => {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "The super function cannot be called outside of a method or in a deeper context inside the method.",
                context
            );
        };

        // the name of the method in wich the super function is used
        const method_name = context.display_name;

        const class_value: ClassValue | null = (context.symbol_table!.get('self') as ClassValue | undefined) ?? null;
        if (class_value == null) {
            err_outside();
        }
        
        if (class_value!.parent_class == null) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "The super function can only be used when the class extends from another one.",
                context
            );
        }

        let parent_name = context.parent!.display_name.replace('<Class', '').replace('>', '').trim();
        
        try {
            parent_name = (context.symbol_table!.get(parent_name) as ClassValue | undefined)!.parent_class!.name!;
        } catch(e) {
            err_outside();
        }

        if (!parent_name) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "The super function cannot be called if the class doesn't extend from another one.",
                context
            );
        }

        const parent_class: ClassValue = context.symbol_table!.get(parent_name) as ClassValue;

        for (const arg_node of node.arg_nodes) {
            args.push(res.register(this.visit(arg_node, context))!);
            if (res.should_return()) return res;
        }

        const parent_method = parent_class.self.get(method_name)?.value?.copy() as FunctionValue;
        if (!parent_method) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Such a method does not exist in the parent class",
                context
            );
        }

        if (parent_method.context == null) {
            parent_method.context = new Context(parent_method.name, null, null);
        }

        parent_method.context.symbol_table!.set('self', class_value!);
        res.register(parent_method.execute(args, node.pos_start, node.pos_end));
        if (res.should_return()) return res;

        return res.success(new NoneValue());
    }

    /**
     * Interprets an enum declaration.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_EnumNode(node: EnumNode, context: Context): RuntimeResult {
        const enum_name = node.enum_name_tok.value;
        const properties = new Map(node.properties.map((v, i) => [v.value, new NumberValue(i)]));

        if (context.symbol_table!.doesConstantExist(enum_name)) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                `Constant "${enum_name}" already exists`,
                context
            );
        }

        const value = new EnumValue(enum_name, properties);
        context.symbol_table!.define_constant(enum_name, value);
        CONSTANTS[enum_name] = value; // so that we cannot modify it later

        return new RuntimeResult().success(
            new NoneValue().set_pos(node.pos_start, node.pos_end)
        );
    }

    /**
     * Interprets a switch statement.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_SwitchNode(node: SwitchNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const cases = node.cases;
        const default_case = node.default_case;

        for (const cas of cases) {
            const conditions = cas.conditions;
            const body = cas.body;
            let pass = false;

            for (const cond of conditions) {
                const condition_value = res.register(this.visit(cond, context))!;
                if (res.should_return()) return res;
                if (condition_value.is_true()) { // we just want one of the conditions to be true
                    pass = true;
                    break;
                }
            }

            if (pass) {
                const exec_ctx = this.generate_new_context(context, "<switch>", body.pos_start);
                const body_value = res.register(this.visit(body, exec_ctx))!;
                if (res.should_return()) return res;
                return res.success(body_value);
            }
        }

        if (default_case) {
            const exec_ctx = this.generate_new_context(context, "<switch>", default_case.pos_start);
            const body_value = res.register(this.visit(default_case, exec_ctx))!;
            if (res.should_return()) return res;
            return res.success(body_value);
        }

        return res.success(
            new NoneValue().set_pos(node.pos_start, node.pos_end)
        );
    }

    /**
     * Interprets a none node.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_NoneNode(node: NoneNode, context: Context): RuntimeResult {
        return new RuntimeResult().success(new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context));
    }

    /**
     * Interprets a boolean node.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_BooleanNode(node: BooleanNode, context: Context): RuntimeResult {
        return new RuntimeResult().success(new BooleanValue(node.state, node.display_name).set_pos(node.pos_start, node.pos_end).set_context(context));
    }

    /**
     * Interprets a typeof node.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_TypeofNode(node: TypeofNode, context: Context): RuntimeResult {
        let res = new RuntimeResult();
        let value = res.register(this.visit(node.node, context))!;
        if (res.should_return()) return res;

        return res.success(
            new StringValue(value.type).set_pos(node.pos_start, node.pos_end).set_context(context)
        );
    }

    /**
     * Interprets an 'instanceof' node.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_InstanceofNode(node: InstanceofNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const value = res.register(this.visit(node.node_a, context))!;
        if (res.should_return()) return res;

        const class_value = context.symbol_table!.get(node.class_name_tok.value);
        
        if (class_value == null) {
            throw new RuntimeError(
                node.class_name_tok.pos_start, node.class_name_tok.pos_end,
                "Undefined class",
                context
            );
        }

        if (!(class_value instanceof ClassValue) && !(class_value instanceof NativeClassValue)) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "'instaneof' checks whether a value is an instance of a class. This is not a class.",
                context
            );
        }

        if (class_value.is_instance) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "With 'instanceof', use the name of the class, not an instance of that class.",
                context
            );
        }

        // TODO: just comparing the direct type, but forgot about the parents if the class has some.
        const state = value.type === class_value.type ? 1 : 0;

        return res.success(
            new BooleanValue(state).set_pos(node.pos_start, node.pos_end).set_context(context)
        );
    }

    /**
     * Interprets the declaration of a prop or a state variable.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_TagProperty(node: TagPropDefNode | TagStateDefNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const property_name = node.property_name_tok.value;
        const value = res.register(this.visit(node.value_node, context))!;
        if (res.should_return()) return res;

        const given_type = node.type ?? Types.ANY;

        if (context.symbol_table!.doesExist(property_name)) {
            throw new RuntimeError(
                node.property_name_tok.pos_start, node.property_name_tok.pos_end,
                `Prop '${property_name}' already exists.`,
                context
            );
        }

        if (given_type === Types.OBJECT) {
            if (!this.is_value_object(value)) {
                this.type_error(value.type, given_type, node.pos_start, node.pos_end, context);
            }
        } else {
            if (given_type === Types.DYNAMIC) {
                if (value instanceof NoneValue) {
                    this.type_error('none', 'dynamic', node.pos_start, node.pos_end, context);
                }
            } else if (given_type !== Types.ANY) {
                if (value.type !== given_type) {
                    this.type_error(value.type, given_type, node.pos_start, node.pos_end, context);
                }
            }
        }

        // add into the context allows me to check if a property, method etc. has already been defined inside the class
        context.symbol_table!.set(property_name, value);

        return res.success(value);
    }

    /**
     * Interprets the declaration of a custom tag.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_TagDefNode(node: TagDefNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const tag_name = node.tag_name_tok.value;

        if (context.symbol_table!.doesExist(tag_name) || is_in(tag_name, Object.values(NATIVE_TAGS).map(v => v.name))) {
            throw new RuntimeError(
                node.tag_name_tok.pos_start, node.tag_name_tok.pos_end,
                `Tag "${tag_name}" already exists`,
                context
            );
        }

        // TODO: define this elsewhere, to make it widely available, do that too for the reserved names of classes
        const native_methods = [
            "__init",
            "render",
            // more incoming
        ];

        const value = new TagValue(tag_name, new Map()).set_pos(node.pos_start, node.pos_end).set_context(context);
        const exec_ctx = this.generate_new_context(context, value.context_name, node.pos_start);
        value.self.set('__name', { prop: 0, state: 0, optional: 0, value: new StringValue(tag_name).set_context(exec_ctx) });
        exec_ctx.symbol_table!.set("self", value);

        for (let i = 0; i < node.methods.length; ++i) {
            const method_node = node.methods[i];
            const method_name = method_node.var_name_tok!.value;
            if (method_name === "__name") {
                throw new RuntimeError(
                    method_node.var_name_tok!.pos_start, method_node.var_name_tok!.pos_end,
                    `The identifier '${method_name}' is already reserved.`,
                    context
                );
            }
            const method = res.register(this.visit(method_node, exec_ctx)) as FunctionValue;
            if (res.should_return()) return res;
            method.type_name = "method";
            value.self.set(method_name, { prop: 0, state: 0, optional: 0, value: method });
        }

        for (let i = 0; i < node.props.length; ++i) {
            const prop_node = node.props[i];
            const prop_name = prop_node.property_name_tok.value;
            const optional = prop_node.optional;
            if (prop_name === "__name") {
                throw new RuntimeError(
                    prop_node.property_name_tok.pos_start, prop_node.property_name_tok.pos_end,
                    `The identifier '${prop_name}' is already reserved.`,
                    context
                );
            }
            if (is_in(prop_name, native_methods)) {
                throw new RuntimeError(
                    prop_node.property_name_tok.pos_start, prop_node.property_name_tok.pos_end,
                    `In a class, '${prop_name}' must be a method.`,
                    context
                );
            }
            const prop = res.register(this.visit_TagProperty(prop_node, exec_ctx))!;
            if (res.should_return()) return res;
            value.self.set(prop_name, { prop: 1, state: 0, optional, value: prop });
        }

        for (let i = 0; i < node.states.length; ++i) {
            const state_node = node.states[i];
            const state_name = state_node.property_name_tok.value;
            if (state_name === "__name") {
                throw new RuntimeError(
                    state_node.property_name_tok.pos_start, state_node.property_name_tok.pos_end,
                    `The identifier '${state_name}' is already reserved.`,
                    context
                );
            }
            if (is_in(state_name, native_methods)) {
                throw new RuntimeError(
                    state_node.property_name_tok.pos_start, state_node.property_name_tok.pos_end,
                    `In a class, '${state_name}' must be a method.`,
                    context
                );
            }
            const state = res.register(this.visit_TagProperty(state_node, exec_ctx))!;
            if (res.should_return()) return res;
            value.self.set(state_name, { prop: 0, state: 1, optional: 0, value: state });
        }

        context.symbol_table!.set(tag_name, value);

        return res.success(
            new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context)
        );
    }

    /**
     * Interprets an html element.
     * @param node The node.
     * @param context The context to use.
     */
    private visit_HtmlNode(node: HtmlNode, context: Context): RuntimeResult {
        const res = new RuntimeResult();
        const tagname = node.tagname_tok?.value ?? null;
        const classes = node.classes;
        const id = node.id;
        const attributes: [string, Value][] = [];
        const events: [string, Value][] = [];
        const children: Value[] = [];
        const is_fragment = tagname == null;

        if (!is_fragment) {
            const native_tagnames = Object.values(NATIVE_TAGS).map(v => v.name);
            let is_native = false;
            let reftag: NativeTag | TagValue;

            if (is_in(tagname, native_tagnames)) {
                is_native = true;
                reftag = NATIVE_TAGS[Object.keys(NATIVE_TAGS).find(v => NATIVE_TAGS[v].name === tagname)!]!;
            } else {
                const value = context.symbol_table!.get(tagname);
                if (value == null || !(value instanceof TagValue)) {
                    throw new RuntimeError(
                        node.tagname_tok!.pos_start, node.tagname_tok!.pos_end,
                        "This tagname doesn't exist",
                        context
                    );
                }
                reftag = value;
            }

            const visited_args: string[] = []; // prevents duplicates
            const given_mandatory_args: string[] = [];

            for (let attr of node.attributes) {
                const name = attr[0].value;
                const attr_pos_start = attr[0].pos_start;
                const attr_pos_end = attr[0].pos_end;
                if (is_in(name, visited_args)) {
                    throw new RuntimeError(
                        attr[0].pos_start, attr[0].pos_end,
                        `The prop '${name}' has already been defined.`,
                        context
                    );
                }
                let defined_type: string;
                let original_prop: TagMember | null = null;
                if (is_native) {
                    if (!is_in(name, (reftag as NativeTag).props)) {
                        throw new RuntimeError(
                            attr[0].pos_start, attr[0].pos_end,
                            "This attribute doesn't exist in the original definition of the native tag.",
                            context
                        );
                    }
                    defined_type = Types.DYNAMIC;
                } else {
                    original_prop = (reftag as TagValue).self.get(name)!; // reference of the prop declared in the tag itself
                    if (original_prop && original_prop.prop === 0) {
                        throw new RuntimeError(
                            attr_pos_start, attr_pos_end,
                            "This attribute doesn't exist in the original definition of the tag.",
                            context
                        );
                    }
                    defined_type = original_prop.value.type; // .value = { type, value }
                }
                const value = res.register(this.visit(attr[1], context))!;
                if (res.should_return()) return res;
                if (defined_type === Types.OBJECT) {
                    if (!this.is_value_object(value)) {
                        this.type_error(value.type, defined_type, attr_pos_start, attr_pos_end, context);
                    }
                } else {
                    if (defined_type === Types.DYNAMIC) {
                        if (value instanceof NoneValue) {
                            this.type_error('none', 'dynamic', attr_pos_start, attr_pos_end, context);
                        }
                    } else if (defined_type !== Types.ANY) {
                        if (defined_type !== value.type) {
                            this.type_error(value.type, defined_type, attr_pos_start, attr_pos_end, context);
                        }
                    }
                }
                attributes.push([name, value]);
                visited_args.push(name);
                if (original_prop?.optional === 0) {
                    given_mandatory_args.push(name);
                }
            }

            // TODO: here, on native props, we check if a prop is optional, but we didn't specify anything on that in the NativeTag type!!
            // Because "props" is just an array of strings!!
            //const mandatory_props = is_native ? (reftag as NativeTag).props.filter(v => v.optional === 0).map((v) => v.name) : Array.from(reftag.self.entries()).filter((v) => v[1].prop === 1 && v[1].optional === 0).map(v => v[0]);
            // temporary patch here, saying that all native props don't have mandatory props
            const mandatory_props = is_native ? [] : Array.from((reftag as TagValue).self.entries()).filter(v => v[1].prop === 1 && v[1].optional === 0).map(v => v[0]);
            const given_props_names = node.attributes.map(v => v[0].value);

            if (mandatory_props.length !== given_mandatory_args.length) {
                const missing_args = mandatory_props.filter((_, i) => !is_in(given_props_names[i], mandatory_props));
                throw new InvalidSyntaxError(
                    node.tagname_tok!.pos_start, node.tagname_tok!.pos_end,
                    `The following mandatory props are missing for this tag: ${missing_args.join(', ')}`
                );
            }

            const visited_events: string[] = [];

            for (const event of node.events) {
                const name = event[0].value;
                const event_pos_start = event[0].pos_start;
                const event_pos_end = event[0].pos_end;
                if (is_in(name, visited_events)) {
                    throw new RuntimeError(
                        event_pos_start, event_pos_end,
                        `The event '${name}' has already been defined.`,
                        context
                    );
                }
                const value = res.register(this.visit(event[1], context))!;
                if (res.should_return()) return res;
                if (!(value instanceof BaseFunction)) {
                    throw new RuntimeError(
                        value.pos_start, value.pos_end,
                        "An event expects a function as value",
                        context
                    );
                }
                visited_events.push(name);
                events.push([name, value]);
            }
        }

        for (const child of node.children) {
            const value = res.register(this.visit(child, context))!;
            if (res.should_return()) return res;
            if (value instanceof ListValue) {
                children.push(...value.elements);
            } else {
                children.push(value);
            }
        }

        return res.success(
            new HtmlValue(
                tagname,
                classes,
                id,
                attributes,
                events,
                children
            ).set_pos(node.pos_start, node.pos_end).set_context(context)
        );
    }
}