import { Position } from "./position.js";
import { Context } from "./context.js";

export class Value {
    constructor() {
        this.set_pos();
        this.set_context();
    }

    /**
     * Sets the position of the value in the code.
     * @param {Position} pos_start Starting position of the value.
     * @param {Position} pos_end End position of the value.
     * @returns {this}
     */
    set_pos(pos_start=null, pos_end=null) {
        this.pos_start = pos_start;
        this.pos_end = pos_end;
        return this;
    }

    /**
     * Saves the context.
     * @param {Context|null} context The current context.
     * @return {this}
     */
    set_context(context=null) {
        this.context = context;
        return this;
    }
}

/**
 * @classdesc A number in our program.
 */
export class NumberValue extends Value {
    /**
     * @constructs NumberValue
     * @param {number} value The value.
     */
    constructor(value) {
        super();
        this.value = value;
    }

    toString() {
        return `${this.value}`;
    }
}