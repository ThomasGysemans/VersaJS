import { CustomNode, NumberNode, AddNode, SubtractNode, MultiplyNode, DivideNode, PlusNode, MinusNode, PowerNode, ModuloNode } from './nodes.js';
import { NumberValue } from './values.js';

/**
 * @classdesc Reads the nodes and perform the calculations.
 */
export class Interpreter {
    /**
     * @constructs Interpreter
     * @param {CustomNode} node The node to be interpreted.
     */
    visit(node) {
        if (node instanceof NumberNode) {
            return this.visit_NumberNode(node);
        } else if (node instanceof AddNode) {
            return this.visit_AddNode(node);
        } else if (node instanceof SubtractNode) {
            return this.visit_SubtractNode(node);
        } else if (node instanceof MultiplyNode) {
            return this.visit_MultiplyNode(node);
        } else if (node instanceof DivideNode) {
            return this.visit_DivideNode(node);
        } else if (node instanceof PlusNode) {
            return this.visit_PlusNode(node);
        } else if (node instanceof MinusNode) {
            return this.visit_MinusNode(node);
        } else if (node instanceof PowerNode) {
            return this.visit_PowerNode(node);
        } else if (node instanceof ModuloNode) {
            return this.visit_ModuloNode(node);
        } else {
            throw new Error(`There is no visit method for node ${node.constructor.name}`);
        }
    }

    /**
     * Interprets a number as a NumberValue.
     * @param {NumberNode} node The node.
     */
    visit_NumberNode(node) {
        return new NumberValue(node.value);
    }

    /**
     * Interprets an addition.
     * @param {AddNode} node The node.
     */
    visit_AddNode(node) {
        return new NumberValue(this.visit(node.node_a).value + this.visit(node.node_b).value);
    }

    /**
     * Interprets a subtraction.
     * @param {SubtractNode} node The node.
     */
    visit_SubtractNode(node) {
        return new NumberValue(this.visit(node.node_a).value - this.visit(node.node_b).value);
    }

    /**
     * Interprets a multiplication.
     * @param {MultiplyNode} node The node.
     */
    visit_MultiplyNode(node) {
        return new NumberValue(this.visit(node.node_a).value * this.visit(node.node_b).value);
    }

    /**
     * Interprets a division.
     * @param {DivideNode} node The node.
     */
    visit_DivideNode(node) {
        try {
            return new NumberValue(this.visit(node.node_a).value / this.visit(node.node_b).value);
        } catch (e) {
            throw new Error("Runtime math error");
        }
    }

    /**
     * Interprets a division.
     * @param {ModuloNode} node The node.
     */
    visit_ModuloNode(node) {
        try {
            return new NumberValue(this.visit(node.node_a).value % this.visit(node.node_b).value);
        } catch (e) {
            throw new Error("Runtime math error");
        }
    }

    /**
     * Interprets a power node.
     * @param {PowerNode} node The node.
     */
    visit_PowerNode(node) {
        return new NumberValue(this.visit(node.node_a).value ** this.visit(node.node_b).value);
    }

    /**
     * Interprets a number with a plus before.
     * @param {PlusNode} node The node.
     */
    visit_PlusNode(node) {
        return this.visit(node.node);
    }

    /**
     * Interprets a negative number.
     * @param {MinusNode} node The node.
     */
    visit_MinusNode(node) {
        return new NumberValue(-1 * this.visit(node.node).value);
    }
}