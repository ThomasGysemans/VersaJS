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

    // meant to be overwritten
    copy() {
        throw new Error("No copy method defined.");
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

    is_true() {
        return this.value === 1;
    }

    /**
     * @override
     * @return {NumberValue}
     */
    copy() {
        let copy = new NumberValue(this.value);
        copy.set_pos(this.pos_start, this.pos_end);
        copy.set_context(this.context);
        return copy;
    }
}

NumberValue.none = new NumberValue(0);
NumberValue.yes = new NumberValue(1);
NumberValue.no = new NumberValue(0);

export class ListValue extends Value {
    /**
     * @constructs ListValue
     * @param {Array<Value>} elements The elements inside the list.
     */
    constructor(elements) {
        super();
        this.elements = elements;
    }

    toString() {
        return `[${this.elements.join(', ')}]`;
    }

    is_true() {
        return this.elements.length > 0;
    }

    /**
     * @override
     * @return {ListValue}
     */
    copy() {
        let copy = new ListValue(this.elements);
        copy.set_pos(this.pos_start, this.pos_end);
        copy.set_context(this.context);
        return copy;
    }

    /**
     * Converts an array into a one dimensional array.
     * @returns {Array}
     */
    merge_into_1d_arr(arr) {
        return arr.reduce((acc, val) => acc.concat(val instanceof ListValue ? this.merge_into_1d_arr(val.elements) : (val.repr !== undefined ? val.repr() : val)), []);
    }

    repr() {
        // we want a one dimensional array
        let new_table = this.merge_into_1d_arr(this.elements);
        return `${new_table.join(', ')}`;
    }
}

/**
 * @classdesc A number in our program.
 */
export class StringValue extends Value {
    /**
     * @constructs StringValue
     * @param {string} value The value.
     */
    constructor(value) {
        super();
        this.value = value;
    }

    toString() {
        return `"${this.value}"`;
    }

    is_true() {
        return this.value.length > 0;
    }

    // We don't want the quotes when we console.log a string
    // So we need another function instead of toString()
    repr() {
        return `${this.value}`;
    }

    /**
     * @override
     * @return {StringValue}
     */
    copy() {
        let copy = new StringValue(this.value);
        copy.set_pos(this.pos_start, this.pos_end);
        copy.set_context(this.context);
        return copy;
    }
}