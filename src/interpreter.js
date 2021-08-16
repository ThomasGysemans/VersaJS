"use strict";

import { CustomNode, NumberNode, AddNode, SubtractNode, MultiplyNode, DivideNode, PlusNode, MinusNode, PowerNode, ModuloNode, VarAssignNode, VarAccessNode, VarModifyNode, AndNode, OrNode, NotNode, EqualsNode, LessThanNode, GreaterThanNode, LessThanOrEqualNode, GreaterThanOrEqualNode, NotEqualsNode, NullishOperatorNode, ListNode, ListAccessNode, ListAssignmentNode, ListPushBracketsNode, ListBinarySelector, StringNode, IfNode, ForNode, WhileNode, FuncDefNode, CallNode, ReturnNode, ContinueNode, BreakNode, DefineNode, DeleteNode, PrefixOperationNode, PostfixOperationNode, DictionnaryNode, ForeachNode, ClassDefNode, ClassPropertyDefNode, ClassCallNode, CallPropertyNode, AssignPropertyNode, CallMethodNode, CallStaticPropertyNode, SuperNode, EnumNode, SwitchNode, NoneNode, BooleanNode, BinaryShiftLeftNode, BinaryShiftRightNode, UnsignedBinaryShiftRightNode, NullishAssignmentNode, LogicalAndNode, LogicalOrNode, LogicalXORNode, BinaryNotNode, AndAssignmentNode, OrAssignmentNode, TypeofNode, InstanceofNode, TagDefNode, TagPropDefNode, TagStateDefNode, HtmlNode } from './nodes.js';
import { BaseFunction, BooleanValue, ClassValue, DictionnaryValue, EnumValue, FunctionValue, HtmlValue, ListValue, NativeClassValue, NativeFunction, NativePropertyValue, NoneValue, NumberValue, StringValue, TagValue, Value } from './values.js';
import { RuntimeResult } from './runtime.js';
import { CustomTypeError, InvalidSyntaxError, RuntimeError } from './Exceptions.js';
import { Context } from './context.js';
import { Lexer } from './lexer.js';
import { CONSTANTS, SymbolTable } from './symbol_table.js';
import { is_in } from './miscellaneous.js';
import { Position } from './position.js';
import { Types } from './tokens.js';
import { NATIVE_TAGS } from './native.js';
import {Parser} from "./parser.js";

class BinarySelectorValues {
    /**
     * @param {NumberValue} a 
     * @param {NumberValue} b 
     */
    constructor(a, b) {
        this.a = a;
        this.b = b;
        this.value = 0;
    }
}

/**
 * Checks if two arrays are equal. [Stackoverflow](@link https://stackoverflow.com/a/14853974)
 * @param {Array} a
 * @param {Array} b
 * @returns {boolean}
 */
function array_equals(a, b) {
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
            } else if (a_element instanceof DictionnaryValue) {
                return dictionnary_equals(a_element, b_element);
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
 * @param {DictionnaryValue} left 
 * @param {DictionnaryValue} right 
 * @returns {boolean}
 */
function dictionnary_equals(left, right) {
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
            } else if (left_value instanceof DictionnaryValue && right_value instanceof DictionnaryValue) {
                is_equal = dictionnary_equals(left_value, right_value);
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
     * @constructs Interpreter
     * @param {CustomNode} node The node to be interpreted.
     * @param {Context} context The root context.
     * @return {RuntimeResult}
     */
    visit(node, context) {
        if (node instanceof NumberNode) {
            return this.visit_NumberNode(node, context);
        } else if (node instanceof AddNode) {
            return this.visit_AddNode(node, context);
        } else if (node instanceof SubtractNode) {
            return this.visit_SubtractNode(node, context);
        } else if (node instanceof MultiplyNode) {
            return this.visit_MultiplyNode(node, context);
        } else if (node instanceof DivideNode) {
            return this.visit_DivideNode(node, context);
        } else if (node instanceof PlusNode) {
            return this.visit_PlusNode(node, context);
        } else if (node instanceof MinusNode) {
            return this.visit_MinusNode(node, context);
        } else if (node instanceof PowerNode) {
            return this.visit_PowerNode(node, context);
        } else if (node instanceof ModuloNode) {
            return this.visit_ModuloNode(node, context);
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
            return this.visit_ContinueNode(node, context);
        } else if (node instanceof BreakNode) {
            return this.visit_BreakNode(node, context);
        } else if (node instanceof DefineNode) {
            return this.visit_DefineNode(node, context);
        } else if (node instanceof DeleteNode) {
            return this.visit_DeleteNode(node, context);
        } else if (node instanceof PrefixOperationNode) {
            return this.visit_PrefixOperationNode(node, context);
        } else if (node instanceof PostfixOperationNode) {
            return this.visit_PostfixOperationNode(node, context);
        } else if (node instanceof DictionnaryNode) {
            return this.visit_DictionnaryNode(node, context);
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
            return this.visit_BinaryShiftLeftNode(node, context);
        } else if (node instanceof BinaryShiftRightNode) {
            return this.visit_BinaryShiftRightNode(node, context);
        } else if (node instanceof UnsignedBinaryShiftRightNode) {
            return this.visit_UnsignedBinaryShiftRightNode(node, context);
        } else if (node instanceof NullishAssignmentNode) {
            return this.visit_NullishAssignmentNode(node, context);
        } else if (node instanceof LogicalAndNode) {
            return this.visit_LogicalAndNode(node, context);
        } else if (node instanceof LogicalOrNode) {
            return this.visit_LogicalOrNode(node, context);
        } else if (node instanceof LogicalXORNode) {
            return this.visit_LogicalXORNode(node, context);
        } else if (node instanceof BinaryNotNode) {
            return this.visit_BinaryNotNode(node, context);
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
     * @param {Context} parent_context
     * @param {string} context_name 
     * @param {Position} pos_start 
     * @returns {Context}
     */
    generate_new_context(parent_context, context_name, pos_start) {
        let new_context = new Context(context_name, parent_context, pos_start);
        new_context.symbol_table = new SymbolTable(new_context.parent.symbol_table);
        return new_context;
    }

    /**
     * Trying to operate an illegal operation between two values.
     * @param {CustomNode} node
     * @param {Context} context 
     * @throws {RuntimeError}
     */
    illegal_operation(node, context) {
        throw new RuntimeError(
            node.pos_start, node.pos_end,
            "Illegal operation",
            context
        );
    }

    /**
     * @param {Value} value Checks if the type of that value corresponds to an object.
     */
    is_value_object(value) {
        // Enum is an object and its type remains Types.OBJECT so we're good
        return value.type === Types.OBJECT || value instanceof NativeClassValue || value instanceof ClassValue;
    }

    /**
     * Interprets a number as a NumberValue.
     * @param {NumberNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_NumberNode(node, context) {
        return new RuntimeResult().success(
            new NumberValue(node.value).set_pos(node.pos_start, node.pos_end).set_context(context)
        );
    }

    /**
     * Interprets an addition.
     * @param {AddNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_AddNode(node, context) {
        let res = new RuntimeResult();
        let left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        let right = res.register(this.visit(node.node_b, context));
        if (res.should_return()) return res;

        // there are so many types of values
        // I keep forgetting some combinations
        // therefore, I designed this solution
        // just to keep my mind safe
        // I test every scenario in `./test/interpreter.test.js`

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
                new StringValue(left.value + right.display_name).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof StringValue) { // boolean + string
            return new RuntimeResult().success(
                new StringValue(left.display_name + right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
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
            let new_values = [...left.elements, right];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof ListValue) { // number + list
            let new_values = [left, ...right.elements];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof StringValue) { // list + string
            let new_values = [...left.elements, right];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof ListValue) { // string + list
            let new_values = [left, ...right.elements];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof ListValue) { // list + list
            let new_values = [...left.elements, ...right.elements];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof DictionnaryValue) { // list + dict
            let new_values = [...left.elements, right];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionnaryValue && right instanceof ListValue) { // dict + list
            let new_values = [left, ...right.elements];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof ClassValue) { // list + class
            let new_values = [...left.elements, right];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ClassValue && right instanceof ListValue) { // class + list
            let new_values = [left, ...right.elements];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof EnumValue) { // list + enum
            let new_values = [...left.elements, right];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof EnumValue && right instanceof ListValue) { // enum + list
            let new_values = [left, ...right.elements];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof NoneValue) { // list + none
            let new_values = [...left.elements, right];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NoneValue && right instanceof ListValue) { // none + list
            let new_values = [left, ...right.elements];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof BooleanValue) { // list + boolean
            let new_values = [...left.elements, right];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof BooleanValue && right instanceof ListValue) { // boolean + list
            let new_values = [left, ...right.elements];
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        // ---
        // Every possible addition which returns a dictionnary
        // ---
        // dict + dict
        if (left instanceof DictionnaryValue && right instanceof DictionnaryValue) {
            return new RuntimeResult().success(
                new DictionnaryValue(new Map(Array.from(left.elements.entries()).concat(Array.from(right.elements.entries())))).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        this.illegal_operation(node, context);
    }

    /**
     * Interprets a subtraction.
     * @param {SubtractNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_SubtractNode(node, context) {
        let res = new RuntimeResult();
        let left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        let right = res.register(this.visit(node.node_b, context));
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
        } else {
            this.illegal_operation(node, context);
        }
    }

    /**
     * Interprets a multiplication.
     * @param {MultiplyNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_MultiplyNode(node, context) {
        let res = new RuntimeResult();
        let left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        let right = res.register(this.visit(node.node_b, context));
        if (res.should_return()) return res;

        if (left instanceof NumberValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(left.value * right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof NumberValue) {
            let new_values = [];
            for (let i = 0; i < right.value; i++) new_values.push(...left.elements);
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof ListValue) {
            let new_values = [];
            for (let i = 0; i < left.value; i++) new_values.push(...right.elements);
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
        } else {
            this.illegal_operation(node, context);
        }
    }

    /**
     * Interprets a division.
     * @param {DivideNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_DivideNode(node, context) {
        let res = new RuntimeResult();
        let left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        let right = res.register(this.visit(node.node_b, context));
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
        } else {
            this.illegal_operation(node, context);
        }
    }

    /**
     * Interprets a division.
     * @param {ModuloNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_ModuloNode(node, context) {
        let res = new RuntimeResult();
        let left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        let right = res.register(this.visit(node.node_b, context));
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
        } else {
            this.illegal_operation(node, context);
        }
    }

    /**
     * Interprets a power node.
     * @param {PowerNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_PowerNode(node, context) {
        let res = new RuntimeResult();
        let left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        let right = res.register(this.visit(node.node_b, context));
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
                new NumberValue(1).set_pos(node.pos_start, node.pos_end).set_context(context)
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
        } else {
            this.illegal_operation(node, context);
        }
    }

    /**
     * Interprets a binary shift to the left (<<)
     * @param {BinaryShiftLeftNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_BinaryShiftLeftNode(node, context) {
        let res = new RuntimeResult();
        let left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        let right = res.register(this.visit(node.node_b, context));
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
        } else {
            this.illegal_operation(node, context);
        }
    }

    /**
     * Interprets a binary shift to the right (>>)
     * @param {BinaryShiftRightNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_BinaryShiftRightNode(node, context) {
        let res = new RuntimeResult();
        let left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        let right = res.register(this.visit(node.node_b, context));
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
                new NumberValue(0 >> 0).set_pos(node.pos_start, node.pos_end).set_context(context)
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
        } else {
            this.illegal_operation(node, context);
        }
    }

    /**
     * Interprets an unsigned binary shift to the right (>>>)
     * @param {UnsignedBinaryShiftRightNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_UnsignedBinaryShiftRightNode(node, context) {
        let res = new RuntimeResult();
        let left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        let right = res.register(this.visit(node.node_b, context));
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
        } else {
            this.illegal_operation(node, context);
        }
    }

    /**
     * Interprets the logical operation: AND.
     * @param {LogicalAndNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_LogicalAndNode(node, context) {
        let res = new RuntimeResult();
        let left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        let right = res.register(this.visit(node.node_b, context));
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
                new NumberValue(0 & 0).set_pos(node.pos_start, node.pos_end).set_context(context)
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
        } else {
            this.illegal_operation(node, context);
        }
    }

    /**
     * Interprets the logical operation: OR.
     * @param {LogicalOrNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_LogicalOrNode(node, context) {
        let res = new RuntimeResult();
        let left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        let right = res.register(this.visit(node.node_b, context));
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
                new NumberValue(0 | 0).set_pos(node.pos_start, node.pos_end).set_context(context)
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
        } else {
            this.illegal_operation(node, context);
        }
    }

    /**
     * Interprets the logical operation: XOR.
     * @param {LogicalXORNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_LogicalXORNode(node, context) {
        let res = new RuntimeResult();
        let left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        let right = res.register(this.visit(node.node_b, context));
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
        } else {
            this.illegal_operation(node, context);
        }
    }

    /**
     * Interprets a number with a plus before.
     * @param {PlusNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_PlusNode(node, context) {
        let res = new RuntimeResult();
        let visited_node = res.register(this.visit(node.node, context));
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
        } else {
            this.illegal_operation(node, context);
        }
    }

    /**
     * Interprets a negative number.
     * @param {MinusNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_MinusNode(node, context) {
        let res = new RuntimeResult();
        let visited_node = res.register(this.visit(node.node, context));
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
        } else {
            this.illegal_operation(node, context);
        }
    }

    /**
     * Interprets a binary NOT.
     * @param {BinaryNotNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_BinaryNotNode(node, context) {
        let res = new RuntimeResult();
        let visited_node = res.register(this.visit(node.node, context));
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
        } else {
            this.illegal_operation(node, context);
        }
    }

    /**
     * Interprets a variable declaration.
     * @param {VarAssignNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_VarAssignNode(node, context) {
        let res = new RuntimeResult();
        let var_name = node.var_name_tok.value;
        let value = res.register(this.visit(node.value_node, context));
        if (res.should_return()) return res;

        let given_type = node.type ?? Types.ANY;
        
        if (context.symbol_table.doesExist(var_name)) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                `Variable "${var_name}" already exists`,
                context
            );
        }

        const type_error = (value_type, expected_type) => {
            throw new CustomTypeError(
                node.pos_start, node.pos_end,
                `Type '${value_type}' is not assignable to type '${expected_type}'`,
                context
            );
        };

        if (given_type === Types.OBJECT) {
            if (!this.is_value_object(value)) {
                type_error(value.type, given_type);
            }
        } else {
            if (given_type === Types.DYNAMIC) {
                if (value instanceof NoneValue) {
                    type_error('none', 'dynamic');
                }
            } else if (given_type !== Types.ANY) {
                if (given_type !== value.type) {
                    type_error(value.type, given_type);
                }
            }
        }

        context.symbol_table.set(var_name, { type: node.type ? node.type : value.type, value });

        return res.success(value);
    }

    /**
     * Interprets a variable declaration.
     * @param {DefineNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_DefineNode(node, context) {
        let res = new RuntimeResult();
        let var_name = node.var_name_tok.value;
        let value = res.register(this.visit(node.value_node, context));
        if (res.should_return()) return res;

        let given_type = node.type ?? Types.ANY;
        
        if (context.symbol_table.doesConstantExist(var_name)) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                `Constant "${var_name}" already exists`,
                context
            );
        }

        const type_error = (value_type, expected_type) => {
            throw new CustomTypeError(
                node.pos_start, node.pos_end,
                `Type '${value_type}' is not assignable to type '${expected_type}'`,
                context
            );
        };

        if (given_type === Types.OBJECT) {
            if (!this.is_value_object(value)) {
                type_error(value.type, given_type);
            }
        } else {
            if (given_type === Types.DYNAMIC) {
                if (value instanceof NoneValue) {
                    type_error('none', 'dynamic');
                }
            } else if (given_type !== Types.ANY) {
                if (value.type !== given_type) {
                    type_error(value.type, given_type);
                }
            }
        }

        context.symbol_table.define_constant(var_name, { type: node.type ? node.type : value.type, value });
        CONSTANTS[var_name] = value; // so that we cannot modify it later

        return new RuntimeResult().success(value);
    }

    /**
     * Interprets a variable call.
     * @param {VarAccessNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_VarAccessNode(node, context) {
        let res = new RuntimeResult();
        let var_name = node.var_name_tok.value;
        let value = context.symbol_table.get(var_name)?.value;

        if (value === undefined || value === null) {
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
     * @param {VarModifyNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_VarModifyNode(node, context) {
        let res = new RuntimeResult();
        let var_name = node.var_name_tok.value;
        let value = res.register(this.visit(node.value_node, context));
        if (res.should_return()) return res;

        if (is_in(var_name, Object.keys(CONSTANTS))) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "You cannot change the value of a constant.",
                context
            );
        }
        
        let variable = context.symbol_table.get(var_name);
        if (variable === null || variable === undefined) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                `Variable "${var_name}" doesn't exist`,
                context
            );
        }

        const type_error = (value_type, expected_type) => {
            throw new CustomTypeError(
                node.pos_start, node.pos_end,
                `Type '${value_type}' is not assignable to type '${expected_type}'`,
                context
            );
        };

        if (variable.type === Types.OBJECT) {
            if (!this.is_value_object(value)) {
                type_error(value.type, variable.type);
            }
        } else {
            if (variable.type === Types.DYNAMIC) {
                if (value.type instanceof NoneValue) {
                    type_error('none', 'dynamic');
                }
            } else if (variable.type !== Types.ANY) {
                if (value.type !== variable.type) {
                    type_error(value.type, variable.type);
                }
            }
        }

        context.symbol_table.modify(var_name, value);

        return new RuntimeResult().success(value);
    }

    /**
     * Interprets a variable modification only if its null.
     * @param {NullishAssignmentNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_NullishAssignmentNode(node, context) {
        let res = new RuntimeResult();
        let left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;

        if (left instanceof NoneValue) {
            if (node.node_a instanceof CallPropertyNode || node.node_a instanceof CallStaticPropertyNode) {
                let new_value = res.register(this.visit(
                    new AssignPropertyNode(
                        node.node_a,
                        node.node_b
                    ),
                    context
                ));
                if (res.should_return()) return res;
                return res.success(new_value);
            } else if (node.node_a instanceof ListAccessNode) {
                let new_value = res.register(this.visit(
                    new ListAssignmentNode(
                        node.node_a,
                        node.node_b
                    ),
                    context
                ));
                if (res.should_return()) return res;
                return res.success(new_value);
            } else if (node.node_a instanceof VarAccessNode) {
                let new_value = res.register(this.visit(
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
     * @param {AndAssignmentNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_AndAssignmentNode(node, context) {
        let res = new RuntimeResult();
        let left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;

        if (left.is_true()) {
            if (node.node_a instanceof CallPropertyNode || node.node_a instanceof CallStaticPropertyNode) {
                let new_value = res.register(this.visit(
                    new AssignPropertyNode(
                        node.node_a,
                        node.node_b
                    ),
                    context
                ));
                if (res.should_return()) return res;
                return res.success(new_value);
            } else if (node.node_a instanceof ListAccessNode) {
                let new_value = res.register(this.visit(
                    new ListAssignmentNode(
                        node.node_a,
                        node.node_b
                    ),
                    context
                ));
                if (res.should_return()) return res;
                return res.success(new_value);
            } else if (node.node_a instanceof VarAccessNode) {
                let new_value = res.register(this.visit(
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
     * @param {OrAssignmentNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_OrAssignmentNode(node, context) {
        let res = new RuntimeResult();
        let left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;

        if (!left.is_true()) {
            if (node.node_a instanceof CallPropertyNode || node.node_a instanceof CallStaticPropertyNode) {
                let new_value = res.register(this.visit(
                    new AssignPropertyNode(
                        node.node_a,
                        node.node_b
                    ),
                    context
                ));
                if (res.should_return()) return res;
                return res.success(new_value);
            } else if (node.node_a instanceof ListAccessNode) {
                let new_value = res.register(this.visit(
                    new ListAssignmentNode(
                        node.node_a,
                        node.node_b
                    ),
                    context
                ));
                if (res.should_return()) return res;
                return res.success(new_value);
            } else if (node.node_a instanceof VarAccessNode) {
                let new_value = res.register(this.visit(
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
     * @param {AndNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_AndNode(node, context) {
        let res = new RuntimeResult();
        let left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;

        if (left.is_true()) {
            let right = res.register(this.visit(node.node_b, context));
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
     * @param {OrNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_OrNode(node, context) {
        let res = new RuntimeResult();
        let left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        let right = res.register(this.visit(node.node_b, context));
        if (res.should_return()) return res;

        // returns the thruthly expression
        // not just a boolean unlike 'and'
        let truthly_element = (left.is_true() ? left : right).copy().set_pos(node.pos_start, node.pos_end).set_context(context);

        return new RuntimeResult().success(truthly_element);
    }

    /**
     * Interprets a not node.
     * @param {NotNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_NotNode(node, context) {
        let res = new RuntimeResult();
        let number = res.register(this.visit(node.node, context));
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
     * @param {EqualsNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_EqualsNode(node, context) {
        let res = new RuntimeResult();
        let left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        let right = res.register(this.visit(node.node_b, context));
        if (res.should_return()) return res;

        if (left instanceof NumberValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value === right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof ListValue) {
            let is_equal = array_equals(left.elements, right.elements);
            return new RuntimeResult().success(
                new BooleanValue(is_equal ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value == right.value.toString() ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof StringValue) {
            return new RuntimeResult().success(
                new BooleanValue(right.value == left.value.toString() ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof StringValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value === right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionnaryValue && right instanceof DictionnaryValue) {
            let is_equal = dictionnary_equals(left, right);
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
     * @param {LessThanNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_LessThanNode(node, context) {
        let res = new RuntimeResult();
        let left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        let right = res.register(this.visit(node.node_b, context));
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
        } else if (left instanceof DictionnaryValue && right instanceof DictionnaryValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.elements.size < right.elements.size ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionnaryValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.elements.size < right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof DictionnaryValue) {
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
     * @param {GreaterThanNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_GreaterThanNode(node, context) {
        let res = new RuntimeResult();
        let left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        let right = res.register(this.visit(node.node_b, context));
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
        } else if (left instanceof DictionnaryValue && right instanceof DictionnaryValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.elements.size > right.elements.size ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionnaryValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.elements.size > right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof DictionnaryValue) {
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
     * @param {LessThanOrEqualNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_LessThanOrEqualNode(node, context) {
        let res = new RuntimeResult();
        let left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        let right = res.register(this.visit(node.node_b, context));
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
        } else if (left instanceof DictionnaryValue && right instanceof DictionnaryValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.elements.size <= right.elements.size ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionnaryValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.elements.size <= right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof DictionnaryValue) {
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
     * @param {GreaterThanOrEqualNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_GreaterThanOrEqualNode(node, context) {
        let res = new RuntimeResult();
        let left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        let right = res.register(this.visit(node.node_b, context));
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
        } else if (left instanceof DictionnaryValue && right instanceof DictionnaryValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.elements.size >= right.elements.size ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionnaryValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.elements.size >= right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof DictionnaryValue) {
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
     * @param {NotEqualsNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_NotEqualsNode(node, context) {
        let res = new RuntimeResult();
        let left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        let right = res.register(this.visit(node.node_b, context));
        if (res.should_return()) return res;

        if (left instanceof NumberValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new BooleanValue(left.value !== right.value ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof ListValue) {
            let is_equal = array_equals(left.elements, right.elements);
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
        } else if (left instanceof DictionnaryValue && right instanceof DictionnaryValue) {
            let is_equal = dictionnary_equals(left, right);
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
     * @param {NullishOperatorNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_NullishOperatorNode(node, context) {
        let res = new RuntimeResult();
        let left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;

        if (left instanceof NoneValue) {
            let right = res.register(this.visit(node.node_b, context));
            if (res.should_return()) return res;
            return new RuntimeResult().success(right);
        } else {
            return new RuntimeResult().success(left);
        }
    }

    /**
     * Interprets a list.
     * @param {ListNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_ListNode(node, context) {
        let res = new RuntimeResult();
        let elements = [];
        for (let element_node of node.element_nodes) {
            let value = res.register(this.visit(element_node, context));
            if (res.should_return()) return res;
            elements.push(value);
        }

        return res.success(
            new ListValue(elements).set_pos(node.pos_start, node.pos_end).set_context(context)
        );
    }

    /**
     * Interprets a variable call (if the variable is a list).
     * @param {ListAccessNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_ListAccessNode(node, context) {
        let res = new RuntimeResult();

        /** @type {ListValue|DictionnaryValue} */
        let value = null;
        let var_name = null;
        if (node.node_to_access instanceof VarModifyNode || node.node_to_access instanceof VarAccessNode || node.node_to_access instanceof VarAssignNode) {
            var_name = node.node_to_access.var_name_tok.value;
            value = context.symbol_table.get(var_name)?.value;

            if (value === undefined || value === null) {
                throw new RuntimeError(
                    node.pos_start, node.pos_end,
                    `Variable '${var_name}' is not defined.`,
                    context
                );
            }
        } else {
            value = res.register(this.visit(node.node_to_access, context));
            if (res.should_return()) return res;
        }

        // just in case the first [] is optional
        // and we are trying to call this first [] on a NoneValue
        if (value instanceof NoneValue && node.list_nodes[0].is_optional) {
            return res.success(
                new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        if (!(value instanceof ListValue) && !(value instanceof DictionnaryValue)) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                `Variable '${var_name}' must be a list or a dictionnary.`,
                context
            );
        }
        
        value = value.copy().set_pos(node.pos_start, node.pos_end).set_context(context);

        let found_value = null;

        for (let i = 0; i < node.list_nodes.length; i++) {
            let index_node = node.list_nodes[i].node;
            let is_optional = node.list_nodes[i].is_optional;
            /** @type {StringValue|NumberValue} */
            let visited_value = null;
            let binary_selector = null;

            if (index_node instanceof ListBinarySelector) {
                if (value instanceof DictionnaryValue) {
                    throw new RuntimeError(
                        node.pos_start, node.pos_end,
                        "Invalid binary selector: cannot get several elements from a dictionnary.",
                        context
                    );
                }

                /** @type {NumberValue} */
                let expr_a = index_node.node_a ? res.register(this.visit(index_node.node_a, context)) : new NumberValue(0);
                if (res.should_return()) return res;

                /** @type {NumberValue} */
                let expr_b = index_node.node_b ? res.register(this.visit(index_node.node_b, context)) : null;
                if (res.should_return()) return res;

                if (!(expr_a instanceof NumberValue) && (expr_b !== null && expr_b instanceof NumberValue)) {
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

                binary_selector = [expr_a, expr_b];
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
                                "Trying to get a key from a non-dictionnary value.",
                                context
                            );
                        }

                        if (visited_value.value < 0) {
                            visited_value.value = found_value.elements.length + visited_value.value;
                        }

                        found_value = found_value.elements[visited_value.value];
                    } else if (found_value instanceof DictionnaryValue) {
                        if (visited_value instanceof NumberValue) {
                            throw new RuntimeError(
                                index_node.pos_start, index_node.pos_end,
                                "Cannot retrieve an element from a dictionnary with a number",
                                context
                            );
                        }

                        found_value = found_value.elements.get(visited_value.value);
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
                    if (visited_value instanceof NumberValue && value instanceof ListValue && visited_value.value < 0) {
                        visited_value.value = value.elements.length + visited_value.value;
                    }

                    if (value instanceof ListValue) {
                        if (!(visited_value instanceof NumberValue)) {
                            throw new RuntimeError(
                                index_node.pos_start, index_node.pos_end,
                                "Unable to retrieve an element from a list without a number as index.",
                                context
                            );
                        }
                        found_value = value.elements[visited_value.value];
                    } else if (value instanceof DictionnaryValue) {
                        if (!(visited_value instanceof StringValue)) {
                            throw new RuntimeError(
                                index_node.pos_start, index_node.pos_end,
                                "Unable to retrieve an element from a dictionnary without a string as index.",
                                context
                            );
                        }
                        found_value = value.elements.get(visited_value.value);
                    }
                }

                if (found_value === undefined) {
                    found_value = new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context);
                }
            }
        }

        return res.success(found_value);
    }

    /**
     * Interprets a variable assignment (if the variable is a list).
     * @param {ListAssignmentNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_ListAssignmentNode(node, context) {
        let res = new RuntimeResult();
        
        if (!(node.accessor.node_to_access instanceof VarAccessNode)) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "You cannot assign new values to an undeclared list or dictionnary.",
                context
            );
        }

        let var_name = node.accessor.node_to_access.var_name_tok.value;
        /** @type {ListValue|DictionnaryValue} */
        let value = context.symbol_table.get(var_name)?.value;

        if (value === undefined || value === null) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                `Variable '${var_name}' is not defined.`,
                context
            );
        }

        const new_value = res.register(this.visit(node.new_value_node, context));
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

        if (!(value instanceof ListValue) && !(value instanceof DictionnaryValue)) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                `Variable '${var_name}' must be a list or a dictionnary.`,
                context
            );
        }
        
        value = value.set_pos(node.pos_start, node.pos_end).set_context(context);

        let index_per_depth = [];

        for (let i = 0; i < node.accessor.list_nodes.length; i++) {
            let index_node = node.accessor.list_nodes[i].node;
            let is_optional = node.accessor.list_nodes[i].is_optional;
            if (is_optional) {
                throw new RuntimeError(
                    index_node.pos_start, index_node.pos_end,
                    "Cannot assign a new value to an optional call",
                    context
                );
            }
            let visited_value = index_node instanceof ListPushBracketsNode || index_node instanceof ListBinarySelector ? index_node : res.register(this.visit(index_node, context));
            if (res.should_return()) return res;

            if (visited_value instanceof NumberValue || visited_value instanceof StringValue || visited_value instanceof ListPushBracketsNode) {
                index_per_depth.push(visited_value);
            } else if (visited_value instanceof ListBinarySelector) {
                if (value instanceof DictionnaryValue) {
                    throw new RuntimeError(
                        node.pos_start, node.pos_end,
                        "Invalid binary selector: cannot get several elements from a dictionnary.",
                        context
                    );
                }
                
                /** @type {NumberValue} */
                let expr_a = visited_value.node_a ? res.register(this.visit(visited_value.node_a, context)) : new NumberValue(0);
                if (res.should_return()) return res;

                /** @type {NumberValue} */
                let expr_b = visited_value.node_b ? res.register(this.visit(visited_value.node_b, context)) : null;
                if (res.should_return()) return res;

                if (!(expr_a instanceof NumberValue) && (expr_b !== null && expr_b instanceof NumberValue)) {
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

        let value_to_be_replaced;
        for (let i = 0; i < index_per_depth.length; i++) {
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
                    } else if (value_to_be_replaced instanceof DictionnaryValue) {
                        // if we are at the last iteration of that loop,
                        // i.e. we have no more values afterwards,
                        // then let's modify our current value by the new value
                        if (i === (index_per_depth.length - 1)) {
                            // once again, we might have `list[1][] = something`
                            if (current_index instanceof ListPushBracketsNode) {
                                if (!(new_value instanceof DictionnaryValue)) {
                                    throw new RuntimeError(
                                        current_index.pos_start, current_index.pos_end,
                                        "In order to add an element in a dictionnary, the new value must be a dictionnary too.",
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
                                        "Cannot retrieve an element from a dictionnary without a string",
                                        context
                                    );
                                }
                            }
                        } else {
                            if (current_index instanceof StringValue) {
                                value_to_be_replaced = value_to_be_replaced.elements.get(current_index.value);
                            } else {
                                throw new RuntimeError(
                                    current_index.pos_start, current_index.pos_end,
                                    "Cannot retrieve an element from a dictionnary without a string",
                                    context
                                );
                            }
                        }
                    } else {
                        throw new RuntimeError(
                            current_index.pos_start, current_index.pos_end,
                            `Cannot access value at a certain index if this is not a list or a dictionnary.`,
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
                        } else if (value instanceof DictionnaryValue) {
                            if (current_index instanceof ListPushBracketsNode) {
                                if (!(new_value instanceof DictionnaryValue)) {
                                    throw new RuntimeError(
                                        new_value.pos_start, new_value.pos_end,
                                        "In order to add an element in a dictionnary, the new value must be a dictionnary too.",
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
                                        "Cannot retrieve an element from a dictionnary without a string",
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
                        } else if (value instanceof DictionnaryValue) {
                            if (current_index instanceof StringValue) {
                                value_to_be_replaced = value.elements.get(current_index.value);
                            } else {
                                throw new RuntimeError(
                                    current_index.pos_start, current_index.pos_end,
                                    "Cannot retrieve an element from a dictionnary without a string.",
                                    context
                                );
                            }
                        }
                    }
                }
            } else { // binary selector `list[a:b]`
                if (value instanceof DictionnaryValue || value_to_be_replaced instanceof DictionnaryValue) {
                    throw new RuntimeError(
                        current_index.a.pos_start, current_index.b.pos_end,
                        "Invalid binary selector: cannot get several elements from a dictionnary.",
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
                            current_index.a.pos_start, current_index.b.pos_end,
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

        context.symbol_table.set(var_name, { type: value.type, value });

        return res.success(new_value);
    }

    /**
     * Interprets a string.
     * @param {StringNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_StringNode(node, context) {
        let interpreted_string = "";
        let filename = node.pos_start.fn;
        let allow_concatenation = node.allow_concatenation;

        if (allow_concatenation) {
            for (let i = 0; i < node.token.value.length; i++) {
                let char = node.token.value[i];
                let code = "";
                let brackets_counter = 1; // so as not to confuse the braces of the concatenation with those of a dictionary inside.
                if (char === "{") {
                    while (true) {
                        i++;
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

                        if (!tree) {
                            interpreted_string += "{}";
                            continue;
                        }

                        const result = this.visit(tree, context);
                        interpreted_string += result.value.elements.join();
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

        return new RuntimeResult().success(
            new StringValue(interpreted_string).set_context(context).set_pos(node.pos_start, node.pos_end)
        );
    }

    /**
     * Interprets a condition.
     * @param {IfNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_IfNode(node, context) {
        let res = new RuntimeResult();
        let should_return_null = node.should_return_null;

        for (let [condition, expr] of node.cases) {
            let condition_value = res.register(this.visit(condition, context));
            if (res.should_return()) return res;

            if (condition_value.is_true()) {
                let expr_value = res.register(this.visit(expr, context));
                if (res.should_return()) return res;
                return res.success(
                    should_return_null && !node.prevent_null_return
                        ? new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context)
                        : expr_value
                );
            }
        }

        if (node.else_case) {
            let else_value = res.register(this.visit(node.else_case, context));
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
     * @param {ForNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_ForNode(node, context) {
        let res = new RuntimeResult();
        let elements = []; // we want a loop to return by default a ListValue.

        let start_value = new NumberValue(0);
        if (node.start_value_node) {
            start_value = res.register(this.visit(node.start_value_node, context));
            if (res.should_return()) return res;
        }

        let end_value = res.register(this.visit(node.end_value_node, context));
        if (res.should_return()) return res;

        // this will automatically decide between 1 or -1
        // based on the values of the starting point and the end point.
        // In other words, if start < end (from 0 to 10 for instance),
        // then we want to increase the variable, otherwise we want to decrease it.
        let step_value = new NumberValue(start_value.value < end_value.value ? 1 : -1);
        // This default value is overwritten if a value is specified in the program.
        if (node.step_value_node) {
            step_value = res.register(this.visit(node.step_value_node, context));
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
            context.symbol_table.set(node.var_name_tok.value, { type: Types.NUMBER, value: new NumberValue(i) });
            const exec_ctx = this.generate_new_context(context, "<for>", node.pos_start);
            
            i += step_value.value;

            let value = res.register(this.visit(node.body_node, exec_ctx));
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
     * @param {ForeachNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_ForeachNode(node, context) {
        let res = new RuntimeResult();
        let elements = []; // we want a loop to return by default a ListValue.

        let i = 0;
        let list = res.register(this.visit(node.list_node, context));
        if (res.should_return()) return res;

        if (!(list instanceof ListValue) && !(list instanceof DictionnaryValue)) {
            throw new RuntimeError(
                node.list_node.pos_start, node.list_node.pos_end,
                "Must loop on a list or dictionnary",
                context
            );
        }

        while (true) {
            if (node.key_name_tok) {
                if (list instanceof DictionnaryValue) {
                    context.symbol_table.set(node.key_name_tok.value, { type: Types.STRING, value: new StringValue(Array.from(list.elements.keys())[i]) });
                } else {
                    context.symbol_table.set(node.key_name_tok.value, { type: Types.NUMBER, value: new NumberValue(i) });
                }
            }

            if (list instanceof DictionnaryValue) {
                let el = list.elements.get(Array.from(list.elements.keys())[i]);
                context.symbol_table.set(node.value_name_tok.value, { type: el.type, value: el });
            } else if (list instanceof ListValue) {
                let el = list.elements[i];
                context.symbol_table.set(node.value_name_tok.value, { type: el.type, value: el });
            }

            const exec_ctx = this.generate_new_context(context, "<foreach>", node.pos_start);

            let value = res.register(this.visit(node.body_node, exec_ctx));
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

            i++;
            if (list instanceof ListValue) {
                if (i >= list.elements.length) break;
            } else if (list instanceof DictionnaryValue) {
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
     * @param {WhileNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_WhileNode(node, context) {
        let res = new RuntimeResult();
        let elements = []; // we want a loop to return a custom list by default.

        while (true) {
            let condition = res.register(this.visit(node.condition_node, context));
            if (res.should_return()) return res;

            if (!condition.is_true()) break;

            const exec_ctx = this.generate_new_context(context, "<while>", node.pos_start);

            let value = res.register(this.visit(node.body_node, exec_ctx));
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
     * @param {FuncDefNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_FuncDefNode(node, context) {
        let res = new RuntimeResult();
        let func_name = node.var_name_tok ? node.var_name_tok.value : null;
        let body_node = node.body_node;
        let all_args = node.args;

        if (func_name) {
            if (context.symbol_table.doesExist(func_name)) {
                throw new RuntimeError(
                    node.var_name_tok.pos_start, node.var_name_tok.pos_end,
                    `The function '${func_name}' already exists.`,
                    context
                );
            }
        }

        let func_value = new FunctionValue(
            func_name,
            body_node,
            all_args,
            node.should_auto_return)
                .set_context(context)
                .set_pos(node.pos_start, node.pos_end);
        
        // we want to invoke the function with its name
        // so we use it as a variable in our symbole table
        if (func_name) {
            context.symbol_table.set(func_name, { type: Types.FUNCTION, value: func_value });
        }

        return res.success(func_value);
    }

    /**
     * Interprets a function call.
     * @param {CallNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_CallNode(node, context) {
        let res = new RuntimeResult();
        let args = [];
        let pos_start = node.pos_start;
        let pos_end = node.pos_end;

        /** @type {FunctionValue|NativeFunction} */
        let value_to_call = res.register(this.visit(node.node_to_call, context));
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

        for (let arg_node of node.arg_nodes) {
            args.push(res.register(this.visit(arg_node, context)));
            if (res.should_return()) return res;
        }

        let return_value = res.register(value_to_call.execute(args, pos_start, pos_end));
        if (res.should_return()) return res;

        return_value = return_value.copy().set_pos(node.pos_start, node.pos_end).set_context(context);
        
        return res.success(return_value);
    }

    /**
     * Interprets a return node in a function.
     * @param {ReturnNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_ReturnNode(node, context) {
        let res = new RuntimeResult();
        let value = null;

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
     * @param {ContinueNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_ContinueNode(node, context) {
        return new RuntimeResult().success_continue();
    }

    /**
     * Interprets a continue node in a loop.
     * @param {BreakNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_BreakNode(node, context) {
        return new RuntimeResult().success_break();
    }

    /**
     * Interprets a delete node.
     * @param {DeleteNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_DeleteNode(node, context) {
        let res = new RuntimeResult();
        let var_name = null;
        let node_to_delete = node.node_to_delete
        
        if (node_to_delete instanceof VarAccessNode) {
            var_name = node_to_delete.var_name_tok.value;
            if (is_in(var_name, Object.keys(CONSTANTS))) {
                throw new RuntimeError(
                    node.pos_start, node.pos_end,
                    "Cannot delete a constant.",
                    context
                );
            }
            context.symbol_table.remove(var_name);
        } else if (node_to_delete instanceof ListAccessNode) {
            /** @type {ListValue|DictionnaryValue} */
            let value = null;
            let var_name = null;
            let node_to_access = node_to_delete.node_to_access;

            if (node_to_access instanceof VarAccessNode) {
                var_name = node_to_access.var_name_tok.value;
                value = context.symbol_table.get(var_name)?.value;

                if (value === undefined || value === null) {
                    throw new RuntimeError(
                        node_to_access.pos_start, node_to_access.pos_end,
                        `Variable '${var_name}' is not defined.`,
                        context
                    );
                }

                if (!(value instanceof ListValue) && !(value instanceof DictionnaryValue)) {
                    throw new RuntimeError(
                        node_to_access.pos_start, node_to_access.pos_end,
                        `Variable '${var_name}' must be a list or a dictionnary.`,
                        context
                    );
                }

                value = value.set_pos(node_to_access.pos_start, node_to_access.pos_end).set_context(context);

                let index_per_depth = [];

                for (let i = 0; i < node_to_delete.list_nodes.length; i++) {
                    let index_node = node_to_delete.list_nodes[i].node;
                    let is_optional = node_to_delete.list_nodes[i].is_optional;
                    if (is_optional) {
                        throw new RuntimeError(
                            node.pos_start, node.pos_end,
                            "Cannot delete an optional call",
                            context
                        );
                    }
                    let visited_value = index_node instanceof ListPushBracketsNode || index_node instanceof ListBinarySelector ? index_node : res.register(this.visit(index_node, context));
                    if (res.should_return()) return res;

                    if (visited_value instanceof NumberValue || visited_value instanceof StringValue || visited_value instanceof ListPushBracketsNode) {
                        index_per_depth.push(visited_value);
                    } else if (visited_value instanceof ListBinarySelector) {
                        if (value instanceof DictionnaryValue) {
                            throw new RuntimeError(
                                index_node.pos_start, index_node.pos_end,
                                "Invalid binary selector: cannot get several elements from a dictionnary.",
                                context
                            );
                        }

                        /** @type {NumberValue} */
                        let expr_a = visited_value.node_a ? res.register(this.visit(visited_value.node_a, context)) : new NumberValue(0);
                        if (res.should_return()) return res;

                        /** @type {NumberValue} */
                        let expr_b = visited_value.node_b ? res.register(this.visit(visited_value.node_b, context)) : null;
                        if (res.should_return()) return res;

                        if (!(expr_a instanceof NumberValue) && (expr_b !== null && expr_b instanceof NumberValue)) {
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

                let value_to_be_replaced;
                let previous_list_element; // we need to filter according to the previous depth of the list

                for (let i = 0; i < index_per_depth.length; i++) {
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
                                        for (let e = value_to_be_replaced.elements.length; e < current_index.value; e++) {
                                            value_to_be_replaced.elements[e] = new NoneValue();
                                        }
                                    }
                                    
                                    // `value` will be automatically updated
                                    value_to_be_replaced.elements[current_index.value] = undefined;
                                } else {
                                    if (current_index.value < 0) {
                                        current_index.value = value_to_be_replaced.elements.length + current_index.value;
                                    }

                                    // this is not the last iteration
                                    // so just remember the current value
                                    value_to_be_replaced = value_to_be_replaced.elements[current_index.value];
                                }
                            } else if (value_to_be_replaced instanceof DictionnaryValue) {
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
                                            "Cannot retrieve an element from a dictionnary without a string",
                                            context
                                        );
                                    }
                                } else {
                                    if (current_index instanceof StringValue) {
                                        value_to_be_replaced = value_to_be_replaced.elements.get(current_index.value);
                                    } else {
                                        throw new RuntimeError(
                                            current_index.pos_start, current_index.pos_end,
                                            "Cannot retrieve an element from a dictionnary without a string",
                                            context
                                        );
                                    }
                                }
                            } else {
                                throw new RuntimeError(
                                    current_index.pos_start, current_index.pos_end,
                                    `Cannot access value at a certain index if this is not an array or a dictionnary.`,
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
                                    if (index_per_depth[i].value > value.elements.length) {
                                        for (let e = value.elements.length; e < index_per_depth[i].value; e++) {
                                            value.elements[e] = new NoneValue();
                                        }
                                    }

                                    value.elements[index.value] = undefined;
                                } else if (value instanceof DictionnaryValue) {
                                    if (index_per_depth[0] instanceof ListPushBracketsNode) {
                                        throw new RuntimeError(
                                            index_per_depth[0].pos_start, index_per_depth[0].pos_end,
                                            "In order to add an element in a dictionnary, the new value must be a dictionnary too.",
                                            context
                                        );
                                    } else {
                                        if (index_per_depth[0] instanceof StringValue) {
                                            value.elements.delete(index_per_depth[0].value);
                                        } else {
                                            throw new RuntimeError(
                                                current_index.pos_start, current_index.pos_end,
                                                "Cannot retrieve an element from a dictionnary without a string",
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
                                } else if (value instanceof DictionnaryValue) {
                                    if (current_index instanceof StringValue) {
                                        value_to_be_replaced = value.elements.get(current_index.value);
                                    } else {
                                        throw new RuntimeError(
                                            current_index.pos_start, current_index.pos_end,
                                            "Cannot retrieve an element from a dictionnary without a string.",
                                            context
                                        );
                                    }
                                }
                            }
                        }
                    } else { // binary selector `list[a:b]`
                        if (value instanceof DictionnaryValue || value_to_be_replaced instanceof DictionnaryValue) {
                            throw new RuntimeError(
                                current_index.a.pos_start, current_index.b.pos_end,
                                "Invalid binary selector: cannot get several elements from a dictionnary.",
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
                                    value_to_be_replaced.elements = [...value_to_be_replaced.elements.slice(0, current_index.a.value), undefined, ...value_to_be_replaced.elements.slice(current_index.b.value)];
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
                                    current_index.a.pos_start, current_index.b.pos_end,
                                    `Cannot access value at a certain index if this is not an array.`,
                                    context
                                );
                            }
                        } else {
                            if (index_per_depth.length === 1) {
                                previous_list_element = value;

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
                                value.elements = [...value.elements.slice(0, current_index.a.value), undefined, ...value.elements.slice(current_index.b.value)]
                            } else {
                                if (current_index.b === null) { // the current_index.b might be null if we have "list[1:]"
                                    current_index.b = new NumberValue(value.elements.length)
                                } else if (current_index.b.value < 0) { // we accept negative numbers only for `b`
                                    current_index.b.value = value.elements.length + current_index.b.value;
                                }

                                // `a` cannot be greater than the length of the list
                                if (current_index.a.value > value.elements.length) { 
                                    throw new RuntimeError(
                                        current_index.a.pos_start, current_index.a.pos_end,
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

                /** @param {ListValue} arr */
                const remove = (arr) => {
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

                context.symbol_table.set(var_name, { type: value.type, value });
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
     * @param {PrefixOperationNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_PrefixOperationNode(node, context) {
        let res = new RuntimeResult();
        let difference = node.difference;
        let visited = res.register(this.visit(node.node, context));
        if (res.should_return()) return res;

        if (visited instanceof NumberValue) {
            return res.success(
                new NumberValue(visited.value + difference).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (visited instanceof NoneValue) {
            return res.success(
                new NumberValue(0 + difference).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else {
            this.illegal_operation(node, context); 
        }
    }

    /**
     * Interprets an incrementation/decrementation node (a++ or a--).
     * @param {PostfixOperationNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_PostfixOperationNode(node, context) {
        let access_node = node.node;
        let difference = node.difference;
        
        if (!(access_node instanceof VarAccessNode)) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Expected a variable to increment",
                context
            );
        }

        let var_name = access_node.var_name_tok.value;

        if (is_in(var_name, Object.keys(CONSTANTS))) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "You cannot change the value of a constant.",
                context
            );
        }

        let value = context.symbol_table.get(var_name)?.value;
        if (value === null || value === undefined) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                `Variable "${var_name}" doesn't exist`,
                context
            );
        }

        if (value instanceof NumberValue) {
            let new_value = new NumberValue(value.value + difference).set_pos(node.pos_start, node.pos_end).set_context(context);
            context.symbol_table.modify(var_name, new_value);
            return new RuntimeResult().success(new_value);
        } else if (value instanceof NoneValue) {
            let new_value = new NumberValue(0 + difference).set_pos(node.pos_start, node.pos_end).set_context(context);
            context.symbol_table.modify(var_name, new_value);
            return new RuntimeResult().success(new_value);
        } else {
            this.illegal_operation(node, context);
        }
    }

    /**
     * Interprets a dictionnary.
     * @param {DictionnaryNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_DictionnaryNode(node, context) {
        let res = new RuntimeResult();
        let map = new Map();

        for (let element of node.element_nodes) {
            let key = element.key.token.value;
            let value = res.register(this.visit(element.value, context));
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
            new DictionnaryValue(map).set_pos(node.pos_start, node.pos_end).set_context(context)
        );
    }

    /**
     * Interprets the declaration of a property.
     * @param {ClassPropertyDefNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_ClassPropertyDefNode(node, context) {
        let res = new RuntimeResult();
        let property_name = node.property_name_tok.value;
        let value = res.register(this.visit(node.value_node, context));
        if (res.should_return()) return res;

        let given_type = node.type ?? Types.ANY;

        if (context.symbol_table.doesExist(property_name)) {
            throw new RuntimeError(
                node.property_name_tok.pos_start, node.property_name_tok.pos_end,
                `Property '${property_name}' already exists.`,
                context
            );
        }

        const type_error = (value_type, expected_type) => {
            throw new CustomTypeError(
                node.pos_start, node.pos_end,
                `Type '${value_type}' is not assignable to type '${expected_type}'`,
                context
            );
        };

        if (given_type === Types.OBJECT) {
            if (!this.is_value_object(value)) {
                type_error(value.type, given_type);
            }
        } else {
            if (given_type === Types.DYNAMIC) {
                if (value instanceof NoneValue) {
                    type_error('none', 'dynamic');
                }
            } else if (given_type !== Types.ANY) {
                if (value.type !== given_type) {
                    type_error(value.type, given_type);
                }
            }
        }

        // add into the context allows us to check if a property, method etc. has already been defined inside the class
        context.symbol_table.set(property_name, { type: node.type ? node.type : value.type, value });

        return res.success(value);
    }

    /**
     * Interprets a class.
     * @param {ClassDefNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_ClassDefNode(node, context) {
        let res = new RuntimeResult();
        let class_name = node.class_name_tok.value;
        /** @type {string|null} */
        let parent_class_name = node.parent_class_tok ? node.parent_class_tok.value : null;
        let parent_class_value;

        if (context.symbol_table.doesExist(class_name)) {
            throw new RuntimeError(
                node.class_name_tok.pos_start, node.class_name_tok.pos_end,
                `Class "${class_name}" already exists`,
                context
            );
        }

        if (parent_class_name) {
            parent_class_value = context.symbol_table.get(parent_class_name)?.value;
            if (parent_class_value === null || parent_class_value === undefined) {
                throw new RuntimeError(
                    node.parent_class_tok.pos_start, node.parent_class_tok.pos_end,
                    "Undefined class",
                    context
                );
            }
            if (!(parent_class_value instanceof ClassValue)) {
                throw new RuntimeError(
                    node.parent_class_tok.pos_start, node.parent_class_tok.pos_end,
                    "A class must inherit from another class.",
                    context
                );
            }
        }

        let value = new ClassValue(class_name, parent_class_value ? new Map(Array.from(parent_class_value.self.entries()).map((v) => v[1].status !== 0 ? v : null).filter((v) => v !== null)) : new Map(), parent_class_value).set_pos(node.pos_start, node.pos_end).set_context(context);
        let exec_ctx = this.generate_new_context(context, value.context_name, node.pos_start);
        value.self.set('__name', { static_prop: 1, status: 1, value: { type: Types.STRING, value: new StringValue(class_name).set_context(exec_ctx) } });
        if (parent_class_value) value.self.set('__parent_name', { static_prop: 1, status: 1, value: { type: Types.STRING, value: new StringValue(parent_class_name) } });
        exec_ctx.symbol_table.set("self", { type: value.type, value });

        // checks if a property/method/setter/getter already exists
        // useful if we have a parent class (we don't want the child class to declare the same properties as its parent).
        const check_if_already_exists = (name, type, pos_start, pos_end) => {
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
        for (let i = 0; i < node.methods.length; i++) {
            let method_node = node.methods[i];
            let method_name = method_node.func.var_name_tok.value;
            let method_status = method_node.status;
            if (method_name === "__name") {
                throw new RuntimeError(
                    method_node.func.var_name_tok.pos_start, method_node.func.var_name_tok.pos_end,
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
            let method = res.register(this.visit(method_node.func, exec_ctx));
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
                check_if_already_exists(method_name, "method", method_node.func.var_name_tok.pos_start, method_node.func.var_name_tok.pos_end);
            }
            value.self.set(method_name, { static_prop: method_node.static_prop, status: method_status, value: { type: Types.FUNCTION, value: method } });
        }

        for (let i = 0; i < node.properties.length; i++) {
            let property_node = node.properties[i];
            let property_name = property_node.property_name_tok.value;
            if (property_name === "__name") {
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
            let property_status = property_node.status;
            let property = res.register(this.visit(property_node, exec_ctx));
            if (res.should_return()) return res;
            if (!property_node.override) {
                check_if_already_exists(property_name, "property", property_node.property_name_tok.pos_start, property_node.property_name_tok.pos_end);
            }
            value.self.set(property_name, { static_prop: property_node.static_prop, status: property_status, value: { type: property_node.type ? property_node.type : property.type, value: property } });
        }

        for (let i = 0; i < node.getters.length; i++) {
            let getter_node = node.getters[i];
            let getter_name = getter_node.func.var_name_tok.value;
            if (getter_name === "__name") {
                throw new RuntimeError(
                    getter_node.func.var_name_tok.pos_start, getter_node.func.var_name_tok.pos_end,
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
            let getter = res.register(this.visit(getter_node.func, exec_ctx));
            if (res.should_return()) return res;
            getter.type_name = "getter";
            if (!getter_node.override) {
                check_if_already_exists(getter_name, "getter", getter_node.func.var_name_tok.pos_start, getter_node.func.var_name_tok.pos_end);
            }
            value.self.set(getter_name, { static_prop: getter_node.static_prop, status: 1, value: { type: Types.FUNCTION, value: getter } });
        }

        for (let i = 0; i < node.setters.length; i++) {
            let setter_node = node.setters[i];
            let setter_name = setter_node.func.var_name_tok.value;
            if (setter_node.static_prop) {
                throw new RuntimeError(
                    setter_node.func.var_name_tok.pos_start, setter_node.func.var_name_tok.pos_end,
                    `A setter cannot be static`,
                    context
                );
            }
            if (setter_name === "__name") {
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
            if (setter_node.status !== 1) {
                throw new RuntimeError(
                    setter_node.pos_start, setter_node.pos_end,
                    `Invalid status for setter '${setter_name}'. Setters can only be public.`,
                    context
                );
            }
            let setter = res.register(this.visit(setter_node.func, exec_ctx));
            if (res.should_return()) return res;
            setter.type_name = "setter";
            if (!setter_node.override) {
                check_if_already_exists(setter_name, "setter", setter_node.func.var_name_tok.pos_start, setter_node.func.var_name_tok.pos_end);
            }
            value.self.set(setter_name, { static_prop: 0, status: 1, value: { type: Types.FUNCTION, value: setter } });
        }

        context.symbol_table.set(class_name, { type: value.type, value });

        return res.success(new NoneValue());
    }

    /**
     * Interprets an instantiation of a class.
     * @param {ClassCallNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_ClassCallNode(node, context) {
        let res = new RuntimeResult();
        let class_name = node.class_name_tok.value;
        /** @type {ClassValue|NativeClassValue} */
        let value = context.symbol_table.get(class_name)?.value;

        if (value === undefined || value === null) {
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
        // does not heritate the static properties, methods
        let new_class_value = new ClassValue(class_name, new Map(Array.from(value.self.entries()).map((v) => v[1].static_prop === 0 ? v : null).filter((v) => v !== null)), value.parent_class).set_pos(node.pos_start, node.pos_end).set_context(context);
        let __init = new_class_value.self.get("__init");
        new_class_value.is_instance = true;
        
        if (__init) {
            let method = __init.value.value;
            let args = [];
            for (let arg of node.arg_nodes) {
                let value = res.register(this.visit(arg, context));
                if (res.should_return()) return res;
                args.push(value);
            }

            method.context.symbol_table.set('self', { type: new_class_value.type, value: new_class_value });

            // @ts-ignore
            method.execute(args);
        }

        return res.success(new_class_value);
    }

    /**
     * Interprets a property call (`example.property`)
     * @param {CallPropertyNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_CallPropertyNode(node, context) {
        let res = new RuntimeResult();
        let base = res.register(this.visit(node.node_to_call, context));
        if (res.should_return()) return res;
        let property_name = node.property_tok.value;

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
            let prop = base.self.get(property_name);

            if (prop === undefined || prop === null) {
                return res.success(
                    new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context)
                );
            }

            let value = prop.value.value;

            // cannot call a static property like that:
            // self.static_property
            if (prop.static_prop) {
                throw new RuntimeError(
                    node.pos_start, node.pos_end,
                    `Cannot call the static property '${property_name}' like that. Use the appropriate syntax '::'`,
                    context
                );
            }

            if (!context.is_context_in(base.context_name)) {
                // this means that we are outside the class
                if (prop.status === 0 || prop.status === 2) {
                    // this means that the property we are looking for is not public
                    let status_string = prop.status === 0 ? "private" : "protected";
                    throw new RuntimeError(
                        node.property_tok.pos_start, node.property_tok.pos_end,
                        `The property '${property_name}' is marked as ${status_string}. You cannot access it outside the class itself.`,
                        context
                    );
                }
            }

            if (value instanceof NativePropertyValue) {
                if (value.nature === "property") {
                    let exec_ctx = this.generate_new_context(context, base.context_name, node.pos_start);
                    exec_ctx.symbol_table.set("self", { type: base.type, value: base });
                    return res.success(value.behavior(exec_ctx, node.pos_start, node.pos_end).value);
                }
            }

            return res.success(value);
        } else if (base instanceof TagValue) {
            let prop = base.self.get(property_name);

            if (prop === undefined || prop === null) {
                return res.success(
                    new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context)
                );
            }

            let value = prop.value.value;

            return res.success(value);
        } else if (base instanceof EnumValue) {
            let prop = base.properties.get(property_name);
            if (prop === undefined || prop === null) {
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
     * @param {CallStaticPropertyNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_CallStaticPropertyNode(node, context) {
        let res = new RuntimeResult();
        let base = res.register(this.visit(node.node_to_call, context));
        if (res.should_return()) return res;
        let property_name = node.property_tok.value;

        if (!(base instanceof ClassValue)) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Cannot call a property from a non-class value.",
                context
            );
        }

        let prop = base.self.get(property_name);
        
        if (prop === undefined || prop === null) {
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

        let value = prop.value.value;

        if (!context.is_context_in(base.context_name)) {
            // this means that we are outside the class
            if (prop.status === 0 || prop.status === 2) {
                // this means that the property we are looking for is not public
                let status_string = prop.status === 0 ? "private" : "protected";
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
     * @param {AssignPropertyNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_AssignPropertyNode(node, context) {
        let res = new RuntimeResult();
        let new_value = res.register(this.visit(node.value_node, context));
        if (res.should_return()) return res;
        let base = res.register(this.visit(node.property.node_to_call, context));
        if (res.should_return()) return res;
        let property_name = node.property.property_tok.value;

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

        const type_error = (value_type, expected_type) => {
            throw new CustomTypeError(
                node.pos_start, node.pos_end,
                `Type '${value_type}' is not assignable to type '${expected_type}'`,
                context
            );
        };

        if (base instanceof ClassValue) {
            let prop = base.self.get(property_name);
            let status = 1;
            let static_prop = 0;

            // the property does not exist
            // and we call it as a static property
            // that's not good
            if (!prop && node.property instanceof CallStaticPropertyNode) {
                throw new RuntimeError(
                    node.pos_start, node.pos_end,
                    "You cannot assign new static properties to the instance of a class",
                    context
                );
            }

            if (prop) {
                status = prop.status;
                static_prop = prop.static_prop;
                if (!context.is_context_in(base.context_name)) {
                    // this means that we are outside the class
                    if (status === 0 || status === 2) {
                        // this means that the property we are looking for is not public
                        let status_string = prop.status === 0 ? "private" : "protected";
                        throw new RuntimeError(
                            node.property.property_tok.pos_start, node.property.property_tok.pos_end,
                            `The property '${property_name}' is marked as ${status_string}. You cannot access it outside the class itself.`,
                            context
                        );
                    }
                }
            }

            if (prop.value.type === Types.OBJECT) {
                if (!this.is_value_object(new_value)) {
                    type_error(new_value.type, prop.value.type);
                }
            } else {
                if (prop.value.type === Types.DYNAMIC) {
                    if (new_value.type instanceof NoneValue) {
                        type_error('none', 'dynamic');
                    }
                } else if (prop.value.type !== Types.ANY) {
                    if (new_value.type !== prop.value.type) {
                        type_error(new_value.type, prop.value.type);
                    }
                }
            }

            new_value = new_value.copy().set_pos(node.value_node.pos_start, node.value_node.pos_end).set_context(context);
            base.self.set(property_name, { static_prop, status, value: { type: prop.value.type, value: new_value } });

            return res.success(new_value);
        } else {
            let property = base.self.get(property_name);
            let prop = property.prop ?? 0;
            let state = property.state ?? 0;
            let optional = property.optional ?? 0;

            if (property.value.type === Types.OBJECT) {
                if (!this.is_value_object(new_value)) {
                    type_error(new_value.type, property.value.type);
                }
            } else {
                if (property.value.type === Types.DYNAMIC) {
                    if (new_value.type instanceof NoneValue) {
                        type_error('none', 'dynamic');
                    }
                } else if (property.value.type !== Types.ANY) {
                    if (new_value.type !== property.value.type) {
                        type_error(new_value.type, property.value.type);
                    }
                }
            }

            new_value = new_value.copy().set_pos(node.value_node.pos_start, node.value_node.pos_end).set_context(context);
            base.self.set(property_name, { prop, state, optional, value: { type: property.value.type, value: new_value } });

            return res.success(new_value);
        }
    }

    /**
     * Interprets a method call.
     * @param {CallMethodNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_CallMethodNode(node, context) {
        let res = new RuntimeResult();
        let args = [];
        let pos_start = node.pos_start;
        let pos_end = node.pos_end;
        let node_to_call = node.node_to_call; // example.thing.prop(args)
        let origin = node.origin; // example

        // origin => self, in the execution context of the function

        let origin_instance = res.register(this.visit(origin, context));
        if (res.should_return()) return res;

        if (origin_instance instanceof NoneValue && node.is_optional) {
            return res.success(
                new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        if (origin_instance instanceof ClassValue || origin_instance instanceof TagValue) {
            let exec_ctx = this.generate_new_context(context, origin_instance.context_name, node.pos_start);
            exec_ctx.symbol_table.set("self", { type: origin_instance.type, value: origin_instance });

            /** @type {FunctionValue|NativeFunction} */
            let value_to_call = res.register(this.visit(node_to_call.node_to_call, context));
            if (res.should_return()) return res;

            // surprisingly, it might be a native function
            if (!(value_to_call instanceof FunctionValue) && !(value_to_call instanceof NativeFunction)) {
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

            value_to_call = value_to_call.copy().set_pos(node.pos_start, node.pos_end);

            for (let arg_node of node_to_call.arg_nodes) {
                args.push(res.register(this.visit(arg_node, context)));
                if (res.should_return()) return res;
            }

            let return_value = res.register(value_to_call.set_context(exec_ctx).execute(args, pos_start, pos_end));
            if (res.should_return()) return res;

            return_value = return_value.copy().set_pos(node.pos_start, node.pos_end).set_context(context);

            return res.success(return_value);
        } else if (origin_instance instanceof NativeClassValue) {
            let exec_ctx = this.generate_new_context(context, origin_instance.context_name, node.pos_start);
            exec_ctx.symbol_table.set("self", { type: origin_instance.type, value: origin_instance });

            /** @type {NativePropertyValue} */
            let value_to_call = res.register(this.visit(node_to_call.node_to_call, context));
            if (res.should_return()) return res;

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

            for (let arg_node of node_to_call.arg_nodes) {
                args.push(res.register(this.visit(arg_node, context)));
                if (res.should_return()) return res;
            }

            let return_value = res.register(value_to_call.set_context(exec_ctx).execute(args, pos_start, pos_end));
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
     * @param {SuperNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_SuperNode(node, context) {
        let res = new RuntimeResult();
        let args = [];
        
        // the goal here is to give the parent method the right instance of self
        // for that, we grab self from the current context
        // and we look in the context in order to determin in which class we are
        // We execute the corresponding method for each parent.
        // just a little problem: self::__name (and other constants) will always be a reference to the first class that calls super()
        // It was pretty complicated so the solution might be ugly

        const err_outside = () => {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "The super function cannot be called outside of a method or in a deeper context inside the method.",
                context
            );
        };

        // the name of the method in wich the super function is used
        let method_name = context.display_name;

        /** @type {ClassValue} */
        let class_value = context.symbol_table.get('self')?.value;
        if (class_value === undefined || class_value === null) err_outside();
        let parent_name = context.parent.display_name.replace('<Class', '').replace('>', '').trim();
        
        try {
            parent_name = context.symbol_table.get(parent_name).value.parent_class.name;
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

        /** @type {ClassValue} */
        // @ts-ignore
        let parent_class = context.symbol_table.get(parent_name)?.value;

        for (let arg_node of node.arg_nodes) {
            args.push(res.register(this.visit(arg_node, context)));
            if (res.should_return()) return res;
        }

        let parent_method = parent_class.self.get(method_name)?.value.value.copy();
        if (!parent_method) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Such a method does not exist in the parent class",
                context
            );
        }
        parent_method.context.symbol_table.set('self', { type: class_value.type, value: class_value });
        // @ts-ignore
        parent_method.execute(args);

        return res.success(new NoneValue());
    }

    /**
     * Interprets an enum declaration.
     * @param {EnumNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_EnumNode(node, context) {
        let enum_name = node.enum_name_tok.value;
        let properties = new Map(node.properties.map((v, i) => [v.value, new NumberValue(i)]));

        if (context.symbol_table.doesConstantExist(enum_name)) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                `Constant "${enum_name}" already exists`,
                context
            );
        }

        let value = new EnumValue(enum_name, properties);
        context.symbol_table.define_constant(enum_name, { type: value.type, value });
        CONSTANTS[enum_name] = value; // so that we cannot modify it later

        return new RuntimeResult().success(new NoneValue());
    }

    /**
     * Interprets a switch statement.
     * @param {SwitchNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_SwitchNode(node, context) {
        let res = new RuntimeResult();
        let cases = node.cases;
        let default_case = node.default_case;

        for (let cas of cases) {
            let conditions = cas.conditions;
            let body = cas.body;
            let pass = false;

            for (let cond of conditions) {
                let condition_value = res.register(this.visit(cond, context));
                if (res.should_return()) return res;
                if (condition_value.is_true()) { // we just want one of the conditions to be true
                    pass = true;
                    break;
                }
            }

            if (pass) {
                const exec_ctx = this.generate_new_context(context, "<switch>", body.pos_start);
                let body_value = res.register(this.visit(body, exec_ctx));
                if (res.should_return()) return res;
                return res.success(body_value);
            }
        }

        if (default_case) {
            const exec_ctx = this.generate_new_context(context, "<switch>", default_case.pos_start);
            let body_value = res.register(this.visit(default_case, exec_ctx));
            if (res.should_return()) return res;
            return res.success(body_value);
        }

        return res.success(new NoneValue());
    }

    /**
     * Interprets a none node.
     * @param {NoneNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_NoneNode(node, context) {
        return new RuntimeResult().success(new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context));
    }

    /**
     * Interprets a boolean node.
     * @param {BooleanNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_BooleanNode(node, context) {
        return new RuntimeResult().success(new BooleanValue(node.state, node.display_name).set_pos(node.pos_start, node.pos_end).set_context(context));
    }

    /**
     * Interprets a typeof node.
     * @param {TypeofNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_TypeofNode(node, context) {
        let res = new RuntimeResult();
        let value = res.register(this.visit(node.node, context));
        if (res.should_return()) return res;

        return res.success(
            new StringValue(value.type).set_pos(node.pos_start, node.pos_end).set_context(context)
        );
    }

    /**
     * Interprets an 'instanceof' node.
     * @param {InstanceofNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_InstanceofNode(node, context) {
        let res = new RuntimeResult();
        let value = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;

        let class_value = context.symbol_table.get(node.class_name_tok.value)?.value;
        
        if (class_value === null || class_value === undefined) {
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

        let state = value.type === class_value.type ? 1 : 0;

        return res.success(
            new BooleanValue(state).set_pos(node.pos_start, node.pos_end).set_context(context)
        );
    }

    /**
     * Interprets the declaration of a prop or a state variable.
     * @param {TagPropDefNode|TagStateDefNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_TagProperty(node, context) {
        let res = new RuntimeResult();
        let property_name = node.property_name_tok.value;
        let value = res.register(this.visit(node.value_node, context));
        if (res.should_return()) return res;

        let given_type = node.type ?? Types.ANY;

        if (context.symbol_table.doesExist(property_name)) {
            throw new RuntimeError(
                node.property_name_tok.pos_start, node.property_name_tok.pos_end,
                `Prop '${property_name}' already exists.`,
                context
            );
        }

        const type_error = (value_type, expected_type) => {
            throw new CustomTypeError(
                node.pos_start, node.pos_end,
                `Type '${value_type}' is not assignable to type '${expected_type}'`,
                context
            );
        };

        if (given_type === Types.OBJECT) {
            if (!this.is_value_object(value)) {
                type_error(value.type, given_type);
            }
        } else {
            if (given_type === Types.DYNAMIC) {
                if (value instanceof NoneValue) {
                    type_error('none', 'dynamic');
                }
            } else if (given_type !== Types.ANY) {
                if (value.type !== given_type) {
                    type_error(value.type, given_type);
                }
            }
        }

        // add into the context allows us to check if a property, method etc. has already been defined inside the class
        context.symbol_table.set(property_name, { type: node.type ? node.type : value.type, value });

        return res.success(value);
    }

    /**
     * Interprets the declaration of a custom tag.
     * @param {TagDefNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_TagDefNode(node, context) {
        let res = new RuntimeResult();
        let tag_name = node.tag_name_tok.value;

        if (context.symbol_table.doesExist(tag_name) || is_in(tag_name, Object.values(NATIVE_TAGS).map((v) => v.name))) {
            throw new RuntimeError(
                node.tag_name_tok.pos_start, node.tag_name_tok.pos_end,
                `Tag "${tag_name}" already exists`,
                context
            );
        }

        let native_methods = [
            "__init",
            "render",
            // more incoming
        ]

        let value = new TagValue(tag_name, new Map()).set_pos(node.pos_start, node.pos_end).set_context(context);
        let exec_ctx = this.generate_new_context(context, value.context_name, node.pos_start);
        value.self.set('__name', { prop: 0, state: 0, optional: 0, value: { type: Types.STRING, value: new StringValue(tag_name).set_context(exec_ctx) } });
        exec_ctx.symbol_table.set("self", { type: value.type, value });

        for (let i = 0; i < node.methods.length; i++) {
            let method_node = node.methods[i];
            let method_name = method_node.var_name_tok.value;
            if (method_name === "__name") {
                throw new RuntimeError(
                    method_node.var_name_tok.pos_start, method_node.var_name_tok.pos_end,
                    `The identifier '${method_name}' is already reserved.`,
                    context
                );
            }
            let method = res.register(this.visit(method_node, exec_ctx));
            if (res.should_return()) return res;
            method.type_name = "method";
            value.self.set(method_name, { prop: 0, state: 0, optional: 0, value: { type: method.type, value: method } });
        }

        for (let i = 0; i < node.props.length; i++) {
            let prop_node = node.props[i];
            let prop_name = prop_node.property_name_tok.value;
            let optional = prop_node.optional;
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
            let prop = res.register(this.visit_TagProperty(prop_node, exec_ctx));
            if (res.should_return()) return res;
            value.self.set(prop_name, { prop: 1, state: 0, optional, value: { type: prop.type, value: prop } });
        }

        for (let i = 0; i < node.states.length; i++) {
            let state_node = node.states[i];
            let state_name = state_node.property_name_tok.value;
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
            let state = res.register(this.visit_TagProperty(state_node, exec_ctx));
            if (res.should_return()) return res;
            value.self.set(state_name, { prop: 0, state: 1, optional: 0, value: { type: state.type, value: state } });
        }

        context.symbol_table.set(tag_name, { type: value.type, value });

        return res.success(
            new NoneValue().set_pos(node.pos_start, node.pos_end).set_context(context)
        );
    }

    /**
     * Interprets an html element.
     * @param {HtmlNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_HtmlNode(node, context) {
        let res = new RuntimeResult();
        let tagname = node.tagname_tok?.value ?? null;
        let classes = node.classes;
        let id = node.id;
        let attributes = [];
        let events = [];
        let children = [];
        let is_fragment = tagname === null || tagname === undefined;

        if (!is_fragment) {
            const native_tagnames = Object.values(NATIVE_TAGS).map((v) => v.name);
            let is_native = false;
            let reftag;

            if (is_in(tagname, native_tagnames)) {
                is_native = true;
                reftag = NATIVE_TAGS[Object.keys(NATIVE_TAGS).find((v) => NATIVE_TAGS[v].name === tagname)];
            } else {
                reftag = context.symbol_table.get(tagname)?.value;
                if (!reftag) {
                    throw new RuntimeError(
                        node.tagname_tok.pos_start, node.tagname_tok.pos_end,
                        "This tagname doesn't exist",
                        context
                    );
                }
            }

            const type_error = (value_type, expected_type, pos_start, pos_end) => {
                throw new CustomTypeError(
                    pos_start, pos_end,
                    `Type '${value_type}' is not assignable to type '${expected_type}'`,
                    context
                );
            };

            let visited_args = []; // prevents duplicates
            let given_mandatory_args = [];

            for (let attr of node.attributes) {
                let name = attr[0].value;
                let attr_pos_start = attr[0].pos_start;
                let attr_pos_end = attr[0].pos_end;
                if (is_in(name, visited_args)) {
                    throw new RuntimeError(
                        attr[0].pos_start, attr[0].pos_end,
                        `The prop '${name}' has already been defined.`,
                        context
                    );
                }
                let defined_type;
                let original_prop;
                if (is_native) {
                    if (!is_in(name, reftag.props)) {
                        throw new RuntimeError(
                            attr[0].pos_start, attr[0].pos_end,
                            "This attribute doesn't exist in the original definition of the tag",
                            context
                        );
                    }
                    defined_type = Types.DYNAMIC;
                } else {
                    original_prop = reftag.self.get(name);
                    if (original_prop && original_prop.prop === 0) {
                        throw new RuntimeError(
                            attr_pos_start, attr_pos_end,
                            "This attribute doesn't exist in the original definition of the tag",
                            context
                        );
                    }
                    defined_type = original_prop.value.type; // .value = { type, value }
                }
                let value = res.register(this.visit(attr[1], context));
                if (res.should_return()) return res;
                if (defined_type === Types.OBJECT) {
                    if (!this.is_value_object(value)) {
                        type_error(value.type, defined_type, attr_pos_start, attr_pos_end);
                    }
                } else {
                    if (defined_type === Types.DYNAMIC) {
                        if (value instanceof NoneValue) {
                            type_error('none', 'dynamic', attr_pos_start, attr_pos_end);
                        }
                    } else if (defined_type !== Types.ANY) {
                        if (defined_type !== value.type) {
                            type_error(value.type, defined_type, attr_pos_start, attr_pos_end);
                        }
                    }
                }
                attributes.push([name, value]);
                visited_args.push(name);
                if (original_prop?.optional === 0) given_mandatory_args.push(name);
            }

            const mandatory_props = is_native ? reftag.props.filter((v) => v.optional === 0).map((v) => v.name) : Array.from(reftag.self.entries()).filter((v) => v[1].prop === 1 && v[1].optional === 0).map((v) => v[0]);
            const given_props_names = node.attributes.map((v) => v[0].value);

            if (mandatory_props.length !== given_mandatory_args.length) {
                const missing_args = mandatory_props.filter((v, i) => !is_in(given_props_names[i], mandatory_props));
                throw new InvalidSyntaxError(
                    node.tagname_tok.pos_start, node.tagname_tok.pos_end,
                    `The following mandatory props are missing for this tag: ${missing_args.join(', ')}`,
                    context
                );
            }

            let visited_events = [];

            for (let event of node.events) {
                let name = event[0].value;
                let event_pos_start = event[0].pos_start;
                let event_pos_end = event[0].pos_end;
                if (is_in(name, visited_events)) {
                    throw new RuntimeError(
                        event_pos_start, event_pos_end,
                        `The event '${name}' has already been defined.`,
                        context
                    );
                }
                let value = res.register(this.visit(event[1], context));
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

        for (let child of node.children) {
            let value = res.register(this.visit(child, context));
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