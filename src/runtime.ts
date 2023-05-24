"use strict";

import type { Value } from "./values.js";
import type { CustomError } from "./Exceptions.js";

/**
 * @classdesc Keeps track of an error during runtime, or if we should return/break/continue in a node.
 */
export default class RuntimeResult {
    public value: Value<any> | null = null;
    public error: CustomError | null = null;
    public func_return_value: Value | null = null;
    public loop_should_break: boolean = false;
    public loop_should_continue: boolean = false;

    constructor() {
        this.reset();
    }

    public reset() {
        this.value = null;
        this.error = null;
        this.func_return_value = null;
        this.loop_should_break = false;
        this.loop_should_continue = false;
    }

    /**
     * Registers an action during runtime and checks if an error has been thrown.
     * @returns The value passed to the original RuntimeResult `res`.
     */
    public register(res: RuntimeResult): Value<any> | null {
        this.error = res.error;
        this.func_return_value = res.func_return_value;
        this.loop_should_continue = res.loop_should_continue;
        this.loop_should_break = res.loop_should_break;
        return res.value;
    }

    /**
     * Registers a successful action during runtime.
     * @param value The correct value.
     */
    public success(value: any): this {
        this.reset();
        this.value = value;
        return this;
    }

    /**
     * Registers a successful action when returning a value (through a function).
     * @param value The value we are returning.
     */
   public success_return(value: any): this {
        this.reset();
        this.func_return_value = value;
        return this;
    }

    /**
     * Registers a successful action when continueing a loop.
     */
    public success_continue(): this {
        this.reset();
        this.loop_should_continue = true;
        return this;
    }

    /**
     * Registers a successful action when breaking a loop.
     */
    public success_break(): this {
        this.reset();
        this.loop_should_break = true;
        return this;
    }

    /**
     * Registers an unsuccessful action during runtime.
     * @param error The error.
     */
    public failure(error: CustomError): this {
        this.reset();
        this.error = error;
        return this;
    }

    /**
     * Stops the program if there is an error, or if we should return, continue or break.
     */
    public should_return(): boolean {
        return this.error != null
                || this.func_return_value != null
                || this.loop_should_continue
                || this.loop_should_break
    }

    public toString() {
        return `RuntimeResult(value = ${this.value?.toString() ?? "empty"})`;
    }
}