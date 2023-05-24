"use strict";

import { string_with_arrows } from "./miscellaneous.js";
import Position from "./position.js";
import Context from "./context.js";

/**
 * @classdesc Creates a custom error that happens during the execution of our program.
 */
export class CustomError {
    public readonly pos_start: Position;
    public readonly pos_end: Position;
    public readonly error_name: string;
    public readonly details: string;

    /**
     * @param pos_start The starting position of the error in the file.
     * @param pos_end The end position of the error in the file.
     * @param error_name The name of the error.
     * @param details Details about the error.
     */
    constructor(pos_start: Position, pos_end: Position, error_name: string, details: string) {
        this.pos_start = pos_start;
        this.pos_end = pos_end;
        this.error_name = error_name;
        this.details = details;
    }

    public toString() {
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
     * @param pos_start The starting position.
     * @param pos_end The end position.
     * @param details Details about the error.
     */
    constructor(pos_start: Position, pos_end: Position, details: string) {
        super(pos_start, pos_end, "Illegal Character", details);
    }
}

/**
 * @classdesc Error thrown when there is an illegal or unexpected character.
 */
export class ExpectedCharError extends CustomError {
    /**
     * @param pos_start The starting position.
     * @param pos_end The end position.
     * @param details Details about the error.
     */
    constructor(pos_start: Position, pos_end: Position, details: string = "") {
        super(pos_start, pos_end, "Expected Character", details);
    }
}

/**
 * @classdesc Error thrown when there is an invalid syntax.
 */
export class InvalidSyntaxError extends CustomError {
    /**
     * @param pos_start The starting position.
     * @param pos_end The end position.
     * @param details Details about the error.
     */
    constructor(pos_start: Position, pos_end: Position, details: string) {
        super(pos_start, pos_end, "Invalid Syntax", details);
    }
}

class BaseRuntime extends CustomError {
    public readonly context: Context | null;

    /**
     * @param pos_start The starting position.
     * @param pos_end The end position.
     * @param name The name of the error.
     * @param details Details about the error.
     * @param context The context where the error occured.
     */
    constructor(pos_start: Position, pos_end: Position, name: string, details: string, context: Context | null) {
        super(pos_start, pos_end, name, details);
        this.context = context;
    }

    public toString() {
        let result = this.generate_traceback();
        result    += `${this.error_name}: ${this.details}\n\n`;
        result    += string_with_arrows(this.pos_start.ftxt, this.pos_start, this.pos_end);
        return result;
    }

    public generate_traceback() {
        let ctx: Context | null = this.context;
        let pos = this.pos_start;
        let result = "";

        while (ctx) {
            result = `   File ${pos.fn}, line ${pos.ln + 1}, in ${ctx.display_name}\n` + result;
            pos = ctx.parent_entry_pos!;
            ctx = ctx.parent;
        }

        return 'Traceback (most recent call last):\n' + result;
    }
}

/**
 * @classdesc Error thrown when there is an error during runtime.
 */
export class RuntimeError extends BaseRuntime {
    /**
     * @param pos_start The starting position.
     * @param pos_end The end position.
     * @param details Details about the error.
     * @param context The context where the error occured.
     */
    constructor(pos_start: Position, pos_end: Position, details: string, context: Context | null) {
        super(pos_start, pos_end, "Runtime Error", details, context);
    }
}

/**
 * @classdesc Error thrown when there is inconsistency between types of variables.
 */
export class CustomTypeError extends BaseRuntime {
    /**
     * @constructs CustomTypeError
     * @param pos_start The starting position.
     * @param pos_end The end position.
     * @param details Details about the error.
     * @param context The context where the error occured.
     */
    constructor(pos_start: Position, pos_end: Position, details: string, context: Context | null) {
        super(pos_start, pos_end, "Type Error", details, context);
    }
}

/**
 * @classdesc Error thrown during the compilation of vjs
 */
export class CompilerError extends CustomError {
    /**
     * @param pos_start The starting position.
     * @param pos_end The end position.
     * @param details Details about the error.
     */
    constructor(pos_start: Position, pos_end: Position, details: string) {
        super(pos_start, pos_end, "Compiler Error", details);
    }
}