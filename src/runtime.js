"use strict";

import { CustomError } from "./Exceptions.js";

/**
 * @classdesc Keeps track of an error during runtime.
 */
export class RuntimeResult {
    constructor() {
        this.reset();
    }

    reset() {
        /** @type {any} */
        this.value = null;
        /** @type {CustomError|null} */
        this.error = null;

        this.func_return_value = null;
        this.loop_should_break = false;
        this.loop_should_continue = false;
    }

    /**
     * Registers an action during runtime and checks if an error has been thrown.
     * @param {RuntimeResult} res
     */
    register(res) {
        this.error = res.error;
        this.func_return_value = res.func_return_value;
        this.loop_should_continue = res.loop_should_continue;
        this.loop_should_break = res.loop_should_break;
        return res.value;
    }

    /**
     * Registers a successful action during runtime.
     * @param {any} value The correct value.
     * @return {this}
     */
    success(value) {
        this.reset();
        this.value = value;
        return this;
    }

    /**
     * Registers a successful action when returning a value (through a function).
     * @param {any} value The value we are returning.
     * @return {this}
     */
    success_return(value) {
        this.reset();
        this.func_return_value = value;
        return this;
    }

    /**
     * Registers a successful action when continueing a loop.
     * @returns {this}
     */
    success_continue() {
        this.reset();
        this.loop_should_continue = true;
        return this;
    }

    /**
     * Registers a successful action when breaking a loop.
     * @returns {this}
     */
    success_break() {
        this.reset();
        this.loop_should_break = true;
        return this;
    }

    /**
     * Registers an unsuccessful action during runtime.
     * @param {CustomError} error The error.
     * @return {this}
     */
    failure(error) {
        this.reset();
        this.error = error;
        return this;
    }

    /**
     * Stops the program if there is an error, or if we should return, continue or break.
     * @returns {boolean}
     */
    should_return() {
        return this.error
                || this.func_return_value
                || this.loop_should_continue
                || this.loop_should_break
    }

    toString() {
        return `RuntimeResult(value = ${this.value})`;
    }
}