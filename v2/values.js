export class Value {}

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