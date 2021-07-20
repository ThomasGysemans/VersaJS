import { Position } from "./position.js";
import { string_with_arrows } from "./miscellaneous.js";
import { Context } from "./context.js";

/**
 * @classdesc Creates a custom error that happens during the execution of our program.
 */
export class CustomError {
    /**
     * @constructs CustomError
     * @param {Position} pos_start The starting position of the error in the file.
     * @param {Position} pos_end The end position of the error in the file.
     * @param {string} error_name The name of the error.
     * @param {string} details Details about the error.
     */
    constructor(pos_start, pos_end, error_name, details) {
        this.pos_start = pos_start;
        this.pos_end = pos_end;
        this.error_name = error_name;
        this.details = details;
    }

    toString() {
        let result = `${this.error_name}: ${this.details}\n`;
        result    += `File ${this.pos_start.fn}, line ${this.pos_start.ln + 1}\n\n`;
        result    += string_with_arrows(this.pos_start.ftxt, this.pos_start, this.pos_end);
        return result;
    }
}

/**
 * @classdesc Error thrown when there is an illegal or unexpected character.
 */
export class IllegalCharError extends CustomError {
    /**
     * @constructs IllegalCharError
     * @param {Position} pos_start The starting position.
     * @param {Position} pos_end The end position.
     * @param {string} details Details about the error.
     */
    constructor(pos_start, pos_end, details) {
        super(pos_start, pos_end, "Illegal Character", details);
    }
}

/**
 * @classdesc Error thrown when there is an illegal or unexpected character.
 */
export class ExpectedCharError extends CustomError {
    /**
     * @constructs ExpectedCharError
     * @param {Position} pos_start The starting position.
     * @param {Position} pos_end The end position.
     * @param {string} details Details about the error.
     */
    constructor(pos_start, pos_end, details='') {
        super(pos_start, pos_end, "Expected Character", details);
    }
}

/**
 * @classdesc Error thrown when there is an invalid syntax.
 */
export class InvalidSyntaxError extends CustomError {
    /**
     * @constructs InvalidSyntaxError
     * @param {Position} pos_start The starting position.
     * @param {Position} pos_end The end position.
     * @param {string} details Details about the error.
     */
    constructor(pos_start, pos_end, details) {
        super(pos_start, pos_end, "Invalid Syntax", details);
    }
}

/**
 * @classdesc Error thrown when there is an invalid syntax.
 */
export class RuntimeError extends CustomError {
    /**
     * @constructs RuntimeError
     * @param {Position} pos_start The starting position.
     * @param {Position} pos_end The end position.
     * @param {string} details Details about the error.
     * @param {Context} context The context where the error occured.
     */
    constructor(pos_start, pos_end, details, context) {
        super(pos_start, pos_end, "Runtime Error", details);
        this.context = context;
    }

    toString() {
        let result = this.generate_traceback();
        result    += `${this.error_name}: ${this.details}\n\n`;
        result    += string_with_arrows(this.pos_start.ftxt, this.pos_start, this.pos_end);
        return result;
    }

    generate_traceback() {
        let result = "";
        let pos = this.pos_start;
        let ctx = this.context;

        while (ctx) {
            result = `   File ${pos.fn}, line ${pos.ln + 1}, in ${ctx.display_name}\n` + result;
            pos = ctx.parent_entry_pos;
            ctx = ctx.parent;
        }

        return 'Traceback (most recent call last):\n' + result;
    }
}