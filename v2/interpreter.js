import { CustomNode, NumberNode, AddNode, SubtractNode, MultiplyNode, DivideNode, PlusNode, MinusNode, PowerNode, ModuloNode, VarAssignNode, VarAccessNode, VarModifyNode, AndNode, OrNode, NotNode, EqualsNode, LessThanNode, GreaterThanNode, LessThanOrEqualNode, GreaterThanOrEqualNode, NotEqualsNode, ElseAssignmentNode, ListNode, ListAccessNode, ListAssignmentNode, ListPushBracketsNode, ListBinarySelector, StringNode, IfNode, ForNode, WhileNode, FuncDefNode, CallNode, ReturnNode, ContinueNode, BreakNode, DefineNode, DeleteNode, PrefixOperationNode, PostfixOperationNode, DictionnaryNode, ForeachNode } from './nodes.js';
import { BaseFunction, DictionnaryValue, FunctionValue, ListValue, NativeFunction, NumberValue, StringValue } from './values.js';
import { RuntimeResult } from './runtime.js';
import { RuntimeError } from './Exceptions.js';
import { Context } from './context.js';
import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { CONSTANTS, SymbolTable } from './symbol_table.js';
import { is_in } from './miscellaneous.js';

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
    if (a.length != b.length)
        return false;

    for (var i = 0, l=a.length; i < l; i++) {
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
        } else if (node instanceof ElseAssignmentNode) {
            return this.visit_ElseAssignmentNode(node, context);
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
        } else {
            throw new Error(`There is no visit method for node '${node.constructor.name}'`);
        }
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

        if (left instanceof NumberValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(left.value + right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof NumberValue) {
            let new_values = [];
            new_values.push(...left.elements, right);

            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof ListValue) {
            let new_values = [];
            new_values.push(...right.elements, left);
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof ListValue) {
            let new_values = [];
            new_values.push(...left.elements, ...right.elements);
            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new StringValue(left.value + right.value.toString()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof StringValue) {
            return new RuntimeResult().success(
                new StringValue(left.value.toString() + right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof StringValue) {
            return new RuntimeResult().success(
                new StringValue(left.value + right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof ListValue) {
            return new RuntimeResult().success(
                new StringValue(left.value + right.repr()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof StringValue) {
            return new RuntimeResult().success(
                new StringValue(left.repr() + right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionnaryValue && right instanceof DictionnaryValue) {
            return new RuntimeResult().success(
                new DictionnaryValue(new Map(Array.from(left.elements.entries()).concat(Array.from(right.elements.entries())))).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Illegal operation",
                context
            );
        }
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
        } else {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Illegal operation",
                context
            );
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
        } else {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Illegal operation",
                context
            );
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

        if (left instanceof NumberValue && right instanceof NumberValue) {
            if (right.value === 0) {
                throw new RuntimeError(
                    node.pos_start, node.pos_end,
                    'Division by Zero',
                    context
                );
            }

            return new RuntimeResult().success(
                new NumberValue(left.value / right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Illegal operation",
                context
            );
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

        if (left instanceof NumberValue && right instanceof NumberValue) {
            if (right.value === 0) {
                throw new RuntimeError(
                    node.pos_start, node.pos_end,
                    'Division by Zero',
                    context
                );
            }
            
            return new RuntimeResult().success(
                new NumberValue(left.value % right.value).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Illegal operation",
                context
            );
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
        } else if (left instanceof ListValue && right instanceof NumberValue) {
            let new_values = [];
            for (let i = 0; i < left.elements.length; i++) {
                let list_element = left.elements[i];
                if (list_element instanceof NumberValue) {
                    new_values.push(new NumberValue(list_element.value ** right.value).set_pos(node.pos_start, node.pos_end).set_context(context));
                } else {
                    throw new RuntimeError(
                        node.pos_start, node.pos_end,
                        "Illegal operation",
                        context
                    );
                }
            }

            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof ListValue) {
            let new_values = [];
            for (let i = 0; i < right.elements.length; i++) {
                let list_element = right.elements[i];
                if (list_element instanceof NumberValue) {
                    new_values.push(new NumberValue(list_element.value ** left.value).set_pos(node.pos_start, node.pos_end).set_context(context));
                } else {
                    throw new RuntimeError(
                        node.pos_start, node.pos_end,
                        "Illegal operation",
                        context
                    );
                }
            }

            return new RuntimeResult().success(
                new ListValue(new_values).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Illegal operation",
                context
            );
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
        } else {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Illegal operation",
                context
            );
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
        } else {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Illegal operation",
                context
            );
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
        
        if (context.symbol_table.doesExist(var_name)) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                `Variable "${var_name}" already exists`,
                context
            );
        }

        context.symbol_table.set(var_name, value);

        return new RuntimeResult().success(value);
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
        
        if (context.symbol_table.doesConstantExist(var_name)) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                `Constant "${var_name}" already exists`,
                context
            );
        }

        context.symbol_table.define_constant(var_name, value);
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
        let value = context.symbol_table.get(var_name);

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
     * Interprets a variable declaration.
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

        context.symbol_table.modify(var_name, value);

        return new RuntimeResult().success(value);
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

        const truthly = () => {
            return new RuntimeResult().success(
                new NumberValue(1).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        const falsy = () => {
            return new RuntimeResult().success(
                new NumberValue(0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        }

        if (left.is_true()) {
            let right = res.register(this.visit(node.node_b, context));
            if (res.should_return()) return res;

            if (right.is_true()) {
                return truthly();
            }
        }

        return falsy();
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

        return new RuntimeResult().success(
            new NumberValue(new Number(left.is_true() || right.is_true()).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
        );
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
                new NumberValue(number.value == 0 ? 1 : 0).set_context(context)
            );
        } else {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Illegal operation",
                context
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
                new NumberValue(new Number(left.value === right.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.elements.length === right.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof ListValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.value === right.elements.length).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof ListValue) {
            let is_equal = array_equals(left.elements, right.elements);
            return new RuntimeResult().success(
                new NumberValue(is_equal ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.value.length === right.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof StringValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(right.value.length === left.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof StringValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.value === right.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionnaryValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.elements.size === right.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof DictionnaryValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(right.elements.size === left.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionnaryValue && right instanceof DictionnaryValue) {
            let is_equal = dictionnary_equals(left, right);
            return new RuntimeResult().success(
                new NumberValue(is_equal ? 1 : 0).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Illegal operation",
                context
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
                new NumberValue(new Number(left.value < right.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.elements.length < right.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof ListValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.value < right.elements.length).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof ListValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.elements.length < right.elements.length).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.value.length < right.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof StringValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(right.value.length < left.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionnaryValue && right instanceof DictionnaryValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.elements.size < right.elements.size).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionnaryValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.elements.size < right.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof DictionnaryValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.value < right.elements.size).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Illegal operation",
                context
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
                new NumberValue(new Number(left.value > right.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.elements.length > right.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof ListValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.value > right.elements.length).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof ListValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.elements.length > right.elements.length).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.value.length > right.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof StringValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(right.value.length > left.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionnaryValue && right instanceof DictionnaryValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.elements.size > right.elements.size).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionnaryValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.elements.size > right.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof DictionnaryValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.value > right.elements.size).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Illegal operation",
                context
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
                new NumberValue(new Number(left.value <= right.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.elements.length <= right.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof ListValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.value <= right.elements.length).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof ListValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.elements.length <= right.elements.length).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.value.length <= right.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof StringValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(right.value.length <= left.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionnaryValue && right instanceof DictionnaryValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.elements.size <= right.elements.size).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionnaryValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.elements.size <= right.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof DictionnaryValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.value <= right.elements.size).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Illegal operation",
                context
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
                new NumberValue(new Number(left.value >= right.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.elements.length >= right.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof ListValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.value >= right.elements.length).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof ListValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.elements.length >= right.elements.length).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.value.length >= right.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof StringValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(right.value.length >= left.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionnaryValue && right instanceof DictionnaryValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.elements.size >= right.elements.size).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionnaryValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.elements.size >= right.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof DictionnaryValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.value >= right.elements.size).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Illegal operation",
                context
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
                new NumberValue(new Number(left.value !== right.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.elements.length !== right.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof ListValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.value !== right.elements.length).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof ListValue && right instanceof ListValue) {
            let is_equal = array_equals(left.elements, right.elements);
            return new RuntimeResult().success(
                new NumberValue(is_equal ? 0 : 1).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof StringValue && right instanceof NumberValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(left.value.length !== right.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof NumberValue && right instanceof StringValue) {
            return new RuntimeResult().success(
                new NumberValue(new Number(right.value.length !== left.value).valueOf()).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else if (left instanceof DictionnaryValue && right instanceof DictionnaryValue) {
            let is_equal = dictionnary_equals(left, right);
            return new RuntimeResult().success(
                new NumberValue(is_equal ? 0 : 1).set_pos(node.pos_start, node.pos_end).set_context(context)
            );
        } else {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Illegal operation",
                context
            );
        }
    }

    /**
     * Interprets an else assignment node.
     * @param {ElseAssignmentNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_ElseAssignmentNode(node, context) {
        let res = new RuntimeResult();
        let left = res.register(this.visit(node.node_a, context));
        if (res.should_return()) return res;
        
        // might be null or false if it's a number
        if (left instanceof NumberValue) {
            var is_left_node_null = left.value === NumberValue.none.value;
            if (is_left_node_null) {
                let right = res.register(this.visit(node.node_b, context));
                if (res.should_return()) return res;
                return new RuntimeResult().success(right);
            } else {
                return new RuntimeResult().success(left);
            }
        } else {
            return new RuntimeResult().success(left);
        }
    }

    /**
     * Interprets an else assignment node.
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
            value = context.symbol_table.get(var_name);

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
            let index_node = node.list_nodes[i];
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
                        node.pos_start, node.pos_end,
                        `The binary selector of a list must be composed of numbers only.`,
                        context
                    );
                }

                if (expr_a.value < 0) {
                    throw new RuntimeError(
                        node.pos_start, node.pos_end,
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
                        } else if (binary_selector[1].value > found_value.elements.length) {
                            throw new RuntimeError(
                                node.pos_start, node.pos_end,
                                `Element at this index could not be retrieved from the list because index is out of bounds.`,
                                context
                            );
                        } else if (binary_selector[1].value < 0) {
                            binary_selector[1].value = found_value.elements.length + binary_selector[1].value;
                        }

                        found_value = new ListValue(
                            found_value.elements.slice(binary_selector[0].value, binary_selector[1].value)
                        );
                    } else {
                        throw new RuntimeError(
                            node.pos_start, node.pos_end,
                            `Can't access value at a certain index if this is not an array.`,
                            context
                        );
                    }
                } else {
                    if (binary_selector[1] === null) {
                        binary_selector[1] = new NumberValue(value.elements.length);
                    } else if (binary_selector[1].value > value.elements.length) {
                        throw new RuntimeError(
                            node.pos_start, node.pos_end,
                            `Element at this index could not be retrieved from the list because index is out of bounds.`,
                            context
                        );
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
                                node.pos_start, node.pos_end,
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
                                node.pos_start, node.pos_end,
                                "Cannot retrieve an element from a dictionnary with a number",
                                context
                            );
                        }

                        found_value = found_value.elements.get(visited_value.value);
                    } else {
                        throw new RuntimeError(
                            node.pos_start, node.pos_end,
                            `Can't access value at a certain index if this is not an array.`,
                            context
                        );
                    }
                } else {
                    if (visited_value instanceof NumberValue && value instanceof ListValue && visited_value.value < 0) {
                        visited_value.value = value.elements.length + visited_value.value;
                    }

                    if (value instanceof ListValue) {
                        if (!(visited_value instanceof NumberValue)) {
                            throw new RuntimeError(
                                node.pos_start, node.pos_end,
                                "Unable to retrieve an element from a list without a number as index.",
                                context
                            );
                        }
                        found_value = value.elements[visited_value.value];
                    } else if (value instanceof DictionnaryValue) {
                        if (!(visited_value instanceof StringValue)) {
                            throw new RuntimeError(
                                node.pos_start, node.pos_end,
                                "Unable to retrieve an element from a dictionnary without a string as index.",
                                context
                            );
                        }
                        found_value = value.elements.get(visited_value.value);
                    }
                }

                if (found_value === undefined) {
                    throw new RuntimeError(
                        node.pos_start, node.pos_end,
                        `Element at this index could not be retrieved from the list because index is out of bounds.`,
                        context
                    );
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
        let value = context.symbol_table.get(var_name);

        if (value === undefined || value === null) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                `Variable '${var_name}' is not defined.`,
                context
            );
        }

        const new_value = res.register(this.visit(node.new_value_node, context));
        if (res.should_return()) return res;

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
            let index_node = node.accessor.list_nodes[i];
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
                        node.pos_start, node.pos_end,
                        `The binary selector of '${var_name}' must be composed of numbers only.`,
                        context
                    );
                }

                if (expr_a.value < 0) {
                    throw new RuntimeError(
                        node.pos_start, node.pos_end,
                        `The binary selector of '${var_name}' cannot start with a negative number.`,
                        context
                    );
                }

                index_per_depth.push(new BinarySelectorValues(expr_a, expr_b));
            } else {
                throw new RuntimeError(
                    node.pos_start,  node.pos_end,
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

            // NumberValue : `list[5] = something` (modify the index 5 by something)
            // ListPushBracketsNode : `list[] = something` (add something to the array)
            // otherwise, it's a binary selector : `list[0:5] = something` (replace the values from index 0 to 5 by something)
            if (index_per_depth[i] instanceof NumberValue || index_per_depth[i] instanceof StringValue || index_per_depth[i] instanceof ListPushBracketsNode) {
                // have we already been searching for a value?
                if (value_to_be_replaced) {
                    // we have several depths, therefore the previous value must be a list
                    if (value_to_be_replaced instanceof ListValue) {
                        // if we are at the last iteration of that loop,
                        // i.e. we have no more values afterwards,
                        // then let's modify our current value by the new value
                        if (i === (index_per_depth.length - 1)) {
                            // once again, we might have `list[1][] = something`
                            let index = index_per_depth[i];

                            if (index instanceof StringValue) {
                                throw new RuntimeError(
                                    node.pos_start, node.pos_end,
                                    "Cannot retrieve an element from a list with a string as index.",
                                    context
                                );
                            }

                            if (index instanceof ListPushBracketsNode) {
                                index.value = value_to_be_replaced.elements.length;
                            } else if (index.value < 0) { // or `list[-1]` === `list[list.length - 1]`
                                index.value = value_to_be_replaced.elements.length + index.value;
                            }

                            // we have to make sure that every previous values of a selected value is defined (NumberValue.none).
                            if (index.value > value_to_be_replaced.elements.length) {
                                for (let e = value_to_be_replaced.elements.length; e < index.value; e++) {
                                    value_to_be_replaced.elements[e] = NumberValue.none;
                                }
                            }
                            
                            // `value` will be automatically updated
                            value_to_be_replaced.elements[index.value] = new_value;
                        } else {
                            let index = index_per_depth[i];

                            if (index instanceof StringValue) {
                                throw new RuntimeError(
                                    node.pos_start, node.pos_end,
                                    "Cannot retrieve an element from a list with a string as index.",
                                    context
                                );
                            }

                            if (index.value < 0) {
                                index.value = value_to_be_replaced.elements.length + index.value;
                            }

                            // this is not the last iteration
                            // so just remember the current value
                            value_to_be_replaced = value_to_be_replaced.elements[index.value];
                        }
                    } else if (value_to_be_replaced instanceof DictionnaryValue) {
                        // if we are at the last iteration of that loop,
                        // i.e. we have no more values afterwards,
                        // then let's modify our current value by the new value
                        if (i === (index_per_depth.length - 1)) {
                            // once again, we might have `list[1][] = something`
                            if (index_per_depth[i] instanceof ListPushBracketsNode) {
                                if (!(new_value instanceof DictionnaryValue)) {
                                    throw new RuntimeError(
                                        node.pos_start, node.pos_end,
                                        "In order to add an element in a dictionnary, the new value must be a dictionnary too.",
                                        context
                                    );
                                }
                                // same as dico1 += dico2
                                value_to_be_replaced.elements = new Map(Array.from(value_to_be_replaced.elements.entries()).concat(Array.from(new_value.elements.entries())));
                            } else {
                                let index = index_per_depth[i];
                                if (index instanceof StringValue) {
                                    value_to_be_replaced.elements.set(index.value, new_value);
                                } else {
                                    throw new RuntimeError(
                                        node.pos_start, node.pos_end,
                                        "Cannot retrieve an element from a dictionnary with a number",
                                        context
                                    );
                                }
                            }
                        } else {
                            let index = index_per_depth[i];
                            if (index instanceof StringValue) {
                                value_to_be_replaced = value_to_be_replaced.elements.get(index.value);
                            } else {
                                throw new RuntimeError(
                                    node.pos_start, node.pos_end,
                                    "Cannot retrieve an element from a dictionnary with a number",
                                    context
                                );
                            }
                        }
                    } else {
                        throw new RuntimeError(
                            node.pos_start, node.pos_end,
                            `Can't access value at a certain index if this is not a list or a dictionnary.`,
                            context
                        );
                    }
                } else {
                    // if there is only one value, then we can just modify it
                    // that's the easiest case
                    if (index_per_depth.length === 1) {
                        if (value instanceof ListValue) {
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

                            // we have to make sure that every previous values of a selected value is defined (NumberValue.none).
                            if (index_per_depth[i].value > value.elements.length) {
                                for (let e = value.elements.length; e < index_per_depth[i].value; e++) {
                                    value.elements[e] = NumberValue.none;
                                }
                            }

                            value.elements[index.value] = new_value;
                        } else if (value instanceof DictionnaryValue) {
                            if (index_per_depth[0] instanceof ListPushBracketsNode) {
                                if (!(new_value instanceof DictionnaryValue)) {
                                    throw new RuntimeError(
                                        node.pos_start, node.pos_end,
                                        "In order to add an element in a dictionnary, the new value must be a dictionnary too.",
                                        context
                                    );
                                }
                                value.elements = new Map(Array.from(value.elements.entries()).concat(Array.from(new_value.elements.entries())));
                            } else {
                                if (index_per_depth[0] instanceof StringValue) {
                                    value.elements.set(index_per_depth[0].value, new_value);
                                } else {
                                    throw new RuntimeError(
                                        node.pos_start, node.pos_end,
                                        "Cannot retrieve an element from a dictionnary with a number",
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
                            let index = index_per_depth[i];
                            if (index instanceof StringValue) {
                                value_to_be_replaced = value.elements.get(index.value);
                            } else {
                                throw new RuntimeError(
                                    node.pos_start, node.pos_end,
                                    "Cannot retrieve an element from a dictionnary with a number.",
                                    context
                                );
                            }
                        }
                    }
                }
            } else { // binary selector `list[a:b]`
                if (value instanceof DictionnaryValue || value_to_be_replaced instanceof DictionnaryValue) {
                    throw new RuntimeError(
                        node.pos_start, node.pos_end,
                        "Invalid binary selector: cannot get several elements from a dictionnary.",
                        context
                    );
                }

                if (value_to_be_replaced) {
                    // if we have already been searching for a list
                    // and we are still not finished with the depths
                    // so it must be a list
                    if (value_to_be_replaced instanceof ListValue) {
                        /** @type {BinarySelectorValues} */
                        // @ts-ignore
                        let current_index = index_per_depth[i];

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
                                    value_to_be_replaced.elements[e] = NumberValue.none;
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
                                    node.pos_start, node.pos_end,
                                    `Can't access values at this starting index.`,
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
                            node.pos_start, node.pos_end,
                            `Can't access value at a certain index if this is not an array.`,
                            context
                        );
                    }
                } else {
                    if (index_per_depth.length === 1) {
                        /** @type {BinarySelectorValues} */
                        // @ts-ignore
                        let first_index = index_per_depth[0];

                        if (first_index.b === null) { // the current_index.b might be null if we have "list[1:]"
                            first_index.b = new NumberValue(value.elements.length);
                        } else if (first_index.b.value < 0) { // we accept negative numbers only for `b`
                            first_index.b.value = value.elements.length + first_index.b.value;
                        } 

                        // `a` cannot be greater than the length of the list
                        // therefore we add `none` to the previous values that should have a value already.
                        if (first_index.a.value > value.elements.length) {
                            // we have to make sure that every previous values of a selected value is defined (NumberValue.none).
                            for (let e = value.elements.length; e < first_index.a.value; e++) {
                                value.elements[e] = NumberValue.none;
                            }
                        }

                        // there is only one depth
                        // therefore, after having searched for the previous values,
                        // we must update the values
                        if (new_value instanceof ListValue) {
                            value.elements = [...value.elements.slice(0, first_index.a.value), ...new_value.elements, ...value.elements.slice(first_index.b.value)]
                        } else {
                            value.elements = [...value.elements.slice(0, first_index.a.value), new_value, ...value.elements.slice(first_index.b.value)]
                        }
                    } else {
                        /** @type {BinarySelectorValues} */
                        // @ts-ignore
                        let current_index = index_per_depth[i]; // intellisense is often annoying

                        if (current_index.b === null) { // the current_index.b might be null if we have "list[1:]"
                            current_index.b = new NumberValue(value.elements.length)
                        } else if (current_index.b.value < 0) { // we accept negative numbers only for `b`
                            current_index.b.value = value.elements.length + current_index.b.value;
                        }

                        // `a` cannot be greater than the length of the list
                        if (current_index.a.value > value.elements.length) { 
                            throw new RuntimeError(
                                node.pos_start, node.pos_end,
                                `Can't access values at this starting index.`,
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

        context.symbol_table.set(var_name, value);

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
        let filename = node.filename;
        let opening_quote = node.opening_quote;

        // in order to write strings inside interpretations ({})
        // we'll have to write: "My name is {\"Thomas\"}."

        if (opening_quote === '"') {
            for (let i = 0; i < node.token.value.length; i++) {
                let char = node.token.value[i];
                let code = "";
                let opening_brackets = 0;
                if (char === "{") {
                    opening_brackets++;
                    while (true) {
                        i++;
                        if (i >= node.token.value.length) break;
                        if (node.token.value[i] === "{") opening_brackets++;
                        if (node.token.value[i] === "}") opening_brackets--;
                        if (opening_brackets <= 0) break;
                        char = node.token.value[i];
                        code += char;
                    }
                    if (code.trim()) {
                        const lexer = new Lexer(code, filename);
                        const tokens = lexer.generate_tokens();

                        const parser = new Parser(tokens);
                        const tree = parser.parse();

                        if (!tree) {
                            throw new RuntimeError(
                                node.pos_start, node.pos_end,
                                "Unable to concatenate the string.",
                                context
                            );
                        }

                        const interpreter = new Interpreter();
                        const result = interpreter.visit(tree, context);

                        if (result.value.repr !== undefined) {
                            interpreted_string += result.value.repr();
                        } else {
                            interpreted_string += result.value.toString();
                        }
                    } else {
                        interpreted_string += "{}";
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

        for (let [condition, expr, should_return_null] of node.cases) {
            let condition_value = res.register(this.visit(condition, context));
            if (res.should_return()) return res;

            if (condition_value.is_true()) {
                let expr_value = res.register(this.visit(expr, context));
                if (res.should_return()) return res;
                return res.success(should_return_null ? NumberValue.none : expr_value);
            }
        }

        if (node.else_case.code) {
            let code = node.else_case.code;
            let should_return_null = node.else_case.should_return_null;
            let else_value = res.register(this.visit(code, context));
            if (res.should_return()) return res;
            return res.success(should_return_null ? NumberValue.none : else_value);
        }

        return res.success(NumberValue.none);
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

        const generate_new_context = (parent_context) => {
            let new_context = new Context("<for>", parent_context, node.pos_start);
            new_context.symbol_table = new SymbolTable(new_context.parent.symbol_table);
            return new_context;
        }

        while (condition()) {
            context.symbol_table.set(node.var_name_tok.value, new NumberValue(i));
            const exec_ctx = generate_new_context(context);
            
            i += step_value.value;

            let value = res.register(this.visit(node.body_node, exec_ctx));
            if (res.should_return() && res.loop_should_continue === false && res.loop_should_break === false) return res;
            if (res.loop_should_continue) continue;
            if (res.loop_should_break) break;

            elements.push(value);
        }

        return res.success(
            node.should_return_null
                ? NumberValue.none
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

        const generate_new_context = (parent_context) => {
            let new_context = new Context("<foreach>", parent_context, node.pos_start);
            new_context.symbol_table = new SymbolTable(new_context.parent.symbol_table);
            return new_context;
        }

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
                    context.symbol_table.set(node.key_name_tok.value, new StringValue(Array.from(list.elements.keys())[i]));
                } else {
                    context.symbol_table.set(node.key_name_tok.value, new NumberValue(i));
                }
            }

            if (list instanceof DictionnaryValue) {
                context.symbol_table.set(node.value_name_tok.value, list.elements.get(Array.from(list.elements.keys())[i]));
            } else if (list instanceof ListValue) {
                context.symbol_table.set(node.value_name_tok.value, list.elements[i]);
            }

            const exec_ctx = generate_new_context(context);

            let value = res.register(this.visit(node.body_node, exec_ctx));
            if (res.should_return() && res.loop_should_continue === false && res.loop_should_break === false) return res;
            if (res.loop_should_continue) continue;
            if (res.loop_should_break) break;

            elements.push(value);

            i++;
            if (list instanceof ListValue) {
                if (i >= list.elements.length) break;
            } else if (list instanceof DictionnaryValue) {
                if (i >= list.elements.size) break;
            }
        }

        return res.success(
            node.should_return_null
                ? NumberValue.none
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

        const generate_new_context = (parent_context) => {
            let new_context = new Context("<while>", parent_context, node.pos_start);
            new_context.symbol_table = new SymbolTable(new_context.parent.symbol_table);
            return new_context;
        }

        while (true) {
            let condition = res.register(this.visit(node.condition_node, context));
            if (res.should_return()) return res;

            if (!condition.is_true()) break;

            const exec_ctx = generate_new_context(context);

            let value = res.register(this.visit(node.body_node, exec_ctx));
            if (res.should_return() && res.loop_should_continue === false && res.loop_should_break === false) return res;
            if (res.loop_should_continue) continue;
            if (res.loop_should_break) break;

            elements.push(value);
        }

        return res.success(
            node.should_return_null
                ? NumberValue.none
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
        let arg_names = [];
        let optional_arg_names = [];
        let mandatory_arg_names = [];
        let default_values = [];

        for (let arg_name of node.arg_name_toks) arg_names.push(arg_name.value);
        for (let optional_arg of node.optional_arg_name_toks) optional_arg_names.push(optional_arg.value);
        for (let mandatory_arg of node.mandatory_arg_name_toks) mandatory_arg_names.push(mandatory_arg.value);
        for (let df of node.default_values_nodes) {
            let value = res.register(this.visit(df, context));
            if (res.should_return()) return res;
            default_values.push(value);
        }

        let func_value = new FunctionValue(
            func_name,
            body_node,
            arg_names,
            mandatory_arg_names,
            optional_arg_names,
            default_values,
            node.should_auto_return)
                .set_context(context)
                .set_pos(node.pos_start, node.pos_end);
        
        // we want to invoke the function with its name
        // so we use it as a variable in our symbole table
        if (node.var_name_tok) {
            context.symbol_table.set(func_name, func_value);
        }

        return res.success(func_value);
    }

    /**
     * Interprets a function definition node.
     * @param {CallNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_CallNode(node, context) {
        let res = new RuntimeResult();
        let args = [];

        let pos_start = node.pos_start;
        let pos_end = node.pos_end;

        let value_to_call = res.register(this.visit(node.node_to_call, context));
        if (res.should_return()) return res;

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
            value = NumberValue.none;
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
                value = context.symbol_table.get(var_name);

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
                    let index_node = node_to_delete.list_nodes[i];
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
                                node.pos_start, node.pos_end,
                                `The binary selector of '${var_name}' must be composed of numbers only.`,
                                context
                            );
                        }

                        if (expr_a.value < 0) {
                            throw new RuntimeError(
                                node.pos_start, node.pos_end,
                                `The binary selector of '${var_name}' cannot start with a negative number.`,
                                context
                            );
                        }

                        index_per_depth.push(new BinarySelectorValues(expr_a, expr_b));
                    } else {
                        throw new RuntimeError(
                            node.pos_start, node.pos_end,
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

                    // NumberValue : `list[5] = something` (modify the index 5 by something)
                    // ListPushBracketsNode : `list[] = something` (add something to the array)
                    // otherwise, it's a binary selector : `list[0:5] = something` (replace the values from index 0 to 5 by something)
                    if (index_per_depth[i] instanceof NumberValue || index_per_depth[i] instanceof StringValue || index_per_depth[i] instanceof ListPushBracketsNode) {
                        // have we already been searching for a value?
                        if (value_to_be_replaced) {
                            // we have several depths, therefore the previous value must be a list
                            if (value_to_be_replaced instanceof ListValue) {
                                previous_list_element = value_to_be_replaced;

                                let index = index_per_depth[i];

                                if (index instanceof StringValue) {
                                    throw new RuntimeError(
                                        node.pos_start, node.pos_end,
                                        "Cannot retrieve an element from a list with a string as index.",
                                        context
                                    );
                                }

                                // if we are at the last iteration of that loop,
                                // i.e. we have no more values afterwards,
                                // then let's modify our current value by the new value
                                if (i === (index_per_depth.length - 1)) {
                                    // once again, we might have `list[1][] = something`
                                    if (index instanceof ListPushBracketsNode) {
                                        index.value = value_to_be_replaced.elements.length;
                                    } else if (index.value < 0) { // or `list[-1]` === `list[list.length - 1]`
                                        index.value = value_to_be_replaced.elements.length + index.value;
                                    }

                                    // we have to make sure that every previous values of a selected value is defined (NumberValue.none).
                                    if (index.value > value_to_be_replaced.elements.length) {
                                        for (let e = value_to_be_replaced.elements.length; e < index.value; e++) {
                                            value_to_be_replaced.elements[e] = NumberValue.none;
                                        }
                                    }
                                    
                                    // `value` will be automatically updated
                                    value_to_be_replaced.elements[index.value] = undefined;
                                } else {
                                    if (index.value < 0) {
                                        index.value = value_to_be_replaced.elements.length + index.value;
                                    }

                                    // this is not the last iteration
                                    // so just remember the current value
                                    value_to_be_replaced = value_to_be_replaced.elements[index.value];
                                }
                            } else if (value_to_be_replaced instanceof DictionnaryValue) {
                                // if we are at the last iteration of that loop,
                                // i.e. we have no more values afterwards,
                                // then let's modify our current value by the new value
                                if (i === (index_per_depth.length - 1)) {
                                    // once again, we might have `list[1][] = something`
                                    if (index_per_depth[i] instanceof ListPushBracketsNode) {
                                        throw new RuntimeError(
                                            node.pos_start, node.pos_end,
                                            "Expected an expression between the square brackets ([]).",
                                            context
                                        );
                                    }

                                    let index = index_per_depth[i];
                                    if (index instanceof StringValue) {
                                        // value_to_be_replaced.elements.set(index.value, undefined);
                                        value_to_be_replaced.elements.delete(index.value);
                                    } else {
                                        throw new RuntimeError(
                                            node.pos_start, node.pos_end,
                                            "Cannot retrieve an element from a dictionnary with a number",
                                            context
                                        );
                                    }
                                } else {
                                    let index = index_per_depth[i];
                                    if (index instanceof StringValue) {
                                        value_to_be_replaced = value_to_be_replaced.elements.get(index.value);
                                    } else {
                                        throw new RuntimeError(
                                            node.pos_start, node.pos_end,
                                            "Cannot retrieve an element from a dictionnary with a number",
                                            context
                                        );
                                    }
                                }
                            } else {
                                throw new RuntimeError(
                                    node.pos_start, node.pos_end,
                                    `Can't access value at a certain index if this is not an array or a dictionnary.`,
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

                                    // we have to make sure that every previous values of a selected value is defined (NumberValue.none).
                                    if (index_per_depth[i].value > value.elements.length) {
                                        for (let e = value.elements.length; e < index_per_depth[i].value; e++) {
                                            value.elements[e] = NumberValue.none;
                                        }
                                    }

                                    value.elements[index.value] = undefined;
                                } else if (value instanceof DictionnaryValue) {
                                    if (index_per_depth[0] instanceof ListPushBracketsNode) {
                                        throw new RuntimeError(
                                            node.pos_start, node.pos_end,
                                            "In order to add an element in a dictionnary, the new value must be a dictionnary too.",
                                            context
                                        );
                                    } else {
                                        if (index_per_depth[0] instanceof StringValue) {
                                            value.elements.delete(index_per_depth[0].value);
                                        } else {
                                            throw new RuntimeError(
                                                node.pos_start, node.pos_end,
                                                "Cannot retrieve an element from a dictionnary with a number",
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
                                    let index = index_per_depth[i];
                                    if (index instanceof StringValue) {
                                        value_to_be_replaced = value.elements.get(index.value);
                                    } else {
                                        throw new RuntimeError(
                                            node.pos_start, node.pos_end,
                                            "Cannot retrieve an element from a dictionnary with a number.",
                                            context
                                        );
                                    }
                                }
                            }
                        }
                    } else { // binary selector `list[a:b]`
                        if (value instanceof DictionnaryValue || value_to_be_replaced instanceof DictionnaryValue) {
                            throw new RuntimeError(
                                node.pos_start, node.pos_end,
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

                                /** @type {BinarySelectorValues} */
                                // @ts-ignore
                                let current_index = index_per_depth[i];

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
                                            value_to_be_replaced.elements[e] = NumberValue.none;
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
                                            node.pos_start, node.pos_end,
                                            `Can't access values at this starting index.`,
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
                                    node.pos_start, node.pos_end,
                                    `Can't access value at a certain index if this is not an array.`,
                                    context
                                );
                            }
                        } else {
                            if (index_per_depth.length === 1) {
                                previous_list_element = value;

                                /** @type {BinarySelectorValues} */
                                // @ts-ignore
                                let first_index = index_per_depth[0];

                                if (first_index.b === null) { // the current_index.b might be null if we have "list[1:]"
                                    first_index.b = new NumberValue(value.elements.length);
                                } else if (first_index.b.value < 0) { // we accept negative numbers only for `b`
                                    first_index.b.value = value.elements.length + first_index.b.value;
                                } 

                                // `a` cannot be greater than the length of the list
                                // therefore we add `none` to the previous values that should have a value already.
                                if (first_index.a.value > value.elements.length) {
                                    // we have to make sure that every previous values of a selected value is defined (NumberValue.none).
                                    for (let e = value.elements.length; e < first_index.a.value; e++) {
                                        value.elements[e] = NumberValue.none;
                                    }
                                }

                                // there is only one depth
                                // therefore, after having searched for the previous values,
                                // we must update the values
                                value.elements = [...value.elements.slice(0, first_index.a.value), undefined, ...value.elements.slice(first_index.b.value)]
                            } else {
                                /** @type {BinarySelectorValues} */
                                // @ts-ignore
                                let current_index = index_per_depth[i]; // intellisense is often annoying

                                if (current_index.b === null) { // the current_index.b might be null if we have "list[1:]"
                                    current_index.b = new NumberValue(value.elements.length)
                                } else if (current_index.b.value < 0) { // we accept negative numbers only for `b`
                                    current_index.b.value = value.elements.length + current_index.b.value;
                                }

                                // `a` cannot be greater than the length of the list
                                if (current_index.a.value > value.elements.length) { 
                                    throw new RuntimeError(
                                        node.pos_start, node.pos_end,
                                        `Can't access values at this starting index.`,
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

                context.symbol_table.set(var_name, value);
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

        return res.success(NumberValue.none);
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
        } else {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Illegal operation",
                context
            ); 
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

        let value = context.symbol_table.get(var_name);
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
        } else {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                "Illegal operation",
                context
            );
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
}