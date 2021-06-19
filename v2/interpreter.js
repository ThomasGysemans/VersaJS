import { CustomNode, NumberNode, AddNode, SubtractNode, MultiplyNode, DivideNode, PlusNode, MinusNode, PowerNode, ModuloNode, VarAssignNode, VarAccessNode, VarModifyNode } from './nodes.js';
import { NumberValue } from './values.js';
import { RuntimeResult } from './runtime.js';
import { RuntimeError } from './Exceptions.js';
import { Context } from './context.js';

/**
 * @classdesc Reads the nodes and perform the calculations.
 */
export class Interpreter {
    /**
     * @constructs Interpreter
     * @param {CustomNode} node The node to be interpreted.
     * @param {Context} context The root context.
     */
    visit(node, context) {
        if (node instanceof NumberNode) {
            return this.visit_NumberNode(node, context).value;
        } else if (node instanceof AddNode) {
            return this.visit_AddNode(node, context).value;
        } else if (node instanceof SubtractNode) {
            return this.visit_SubtractNode(node, context).value;
        } else if (node instanceof MultiplyNode) {
            return this.visit_MultiplyNode(node, context).value;
        } else if (node instanceof DivideNode) {
            return this.visit_DivideNode(node, context).value;
        } else if (node instanceof PlusNode) {
            return this.visit_PlusNode(node, context).value;
        } else if (node instanceof MinusNode) {
            return this.visit_MinusNode(node, context).value;
        } else if (node instanceof PowerNode) {
            return this.visit_PowerNode(node, context).value;
        } else if (node instanceof ModuloNode) {
            return this.visit_ModuloNode(node, context).value;
        } else if (node instanceof VarAssignNode) {
            return this.visit_VarAssignNode(node, context).value;
        } else if (node instanceof VarAccessNode) {
            return this.visit_VarAccessNode(node, context).value;
        } else if (node instanceof VarModifyNode) {
            return this.visit_VarModifyNode(node, context).value;
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
        return new RuntimeResult().success(
            new NumberValue(this.visit(node.node_a, context).value + this.visit(node.node_b, context).value).set_pos(node.pos_start, node.pos_end).set_context(context)
        );
    }

    /**
     * Interprets a subtraction.
     * @param {SubtractNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_SubtractNode(node, context) {
        return new RuntimeResult().success(
            new NumberValue(this.visit(node.node_a, context).value - this.visit(node.node_b, context).value).set_pos(node.pos_start, node.pos_end).set_context(context)
        );
    }

    /**
     * Interprets a multiplication.
     * @param {MultiplyNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_MultiplyNode(node, context) {
        return new RuntimeResult().success(
            new NumberValue(this.visit(node.node_a, context).value * this.visit(node.node_b, context).value).set_pos(node.pos_start, node.pos_end).set_context(context)
        );
    }

    /**
     * Interprets a division.
     * @param {DivideNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_DivideNode(node, context) {
        let left_node = this.visit(node.node_b, context).value;
        if (left_node === 0) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                'Division by Zero',
                context
            );
        }
        return new RuntimeResult().success(
            new NumberValue(this.visit(node.node_a, context).value / left_node).set_pos(node.pos_start, node.pos_end).set_context(context)
        );
    }

    /**
     * Interprets a division.
     * @param {ModuloNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_ModuloNode(node, context) {
        let left_node = this.visit(node.node_b, context).value;
        if (left_node === 0) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                'Division by Zero',
                context
            );
        }
        return new RuntimeResult().success(
            new NumberValue(this.visit(node.node_a, context).value % left_node).set_pos(node.pos_start, node.pos_end).set_context(context)
        );
    }

    /**
     * Interprets a power node.
     * @param {PowerNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_PowerNode(node, context) {
        return new RuntimeResult().success(
            new NumberValue(this.visit(node.node_a, context).value ** this.visit(node.node_b, context).value).set_pos(node.pos_start, node.pos_end).set_context(context)
        );
    }

    /**
     * Interprets a number with a plus before.
     * @param {PlusNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_PlusNode(node, context) {
        return new RuntimeResult().success(
            this.visit(node.node, context)
        );
    }

    /**
     * Interprets a negative number.
     * @param {MinusNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_MinusNode(node, context) {
        return new RuntimeResult().success(
            new NumberValue(-1 * this.visit(node.node, context).value).set_pos(node.pos_start, node.pos_end).set_context(context)
        );
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
        let value = this.visit(node.value_node, context);
        
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
     * Interprets a variable call.
     * @param {VarAccessNode} node The node.
     * @param {Context} context The context to use.
     * @returns {RuntimeResult}
     */
    visit_VarAccessNode(node, context) {
        let res = new RuntimeResult();
        let var_name = node.var_name_tok.value;
        let value = context.symbol_table.get(var_name);

        if (!context.symbol_table.doesExist(var_name)) {
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
        let value = this.visit(node.value_node, context);
        
        if (!context.symbol_table.doesExist(var_name)) {
            throw new RuntimeError(
                node.pos_start, node.pos_end,
                `Variable "${var_name}" doesn't exist`,
                context
            );
        }

        context.symbol_table.set(var_name, value);

        return new RuntimeResult().success(value);
    }
}