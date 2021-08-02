import process from 'process';
import { Context } from "./context.js";
import { RuntimeError } from "./Exceptions.js";
import { ArgumentNode } from "./nodes.js";
import { Position } from "./position.js";
import { RuntimeResult } from "./runtime.js";
import { Token, TokenType } from "./tokens.js";
import { BaseFunction, ClassValue, DictionnaryValue, ListValue, NativeClassValue, NativePropertyValue, NoneValue, NumberValue, StringValue, Value } from "./values.js";

/**
 * A shortcut to create arguments for native functions faster.
 * @param {string} name The name of the argument.
 * @param {boolean} is_rest Is a rest parameter?
 * @param {boolean} is_optional Is optional?
 * @param {Value} default_value The default value.
 */
export function argNode(name, is_rest=false, is_optional=false, default_value=null) {
    return new ArgumentNode(new Token(TokenType.STRING, name), is_rest, is_optional, default_value);
};

/**
 * Gets a property that belongs to the executed native class.
 * @param {Context} exec_ctx The execution context
 * @param {Position} pos_start The starting position
 * @param {Position} pos_end The end position
 * @param {string} property_name The property we want to get
 * @returns {any} It can return any sort of Value
 */
export function getInsideProperty(exec_ctx, pos_start, pos_end, property_name) {
    return exec_ctx.symbol_table.get('self').self.get(property_name).value.behavior(exec_ctx, pos_start, pos_end).value;
}

export const NATIVE_CLASSES = {
    console_: {
        name: "console",
        properties: [
            {
                name: "log",
                nature: 'method',
                status: 1,
                static_prop: 0,
                value: {
                    args: [
                        argNode("value", true)
                    ],
                    /**
                     * Equivalent of `console.log`.
                     * @param {Context} exec_ctx The execution context.
                     */
                    behavior: (exec_ctx, pos_start, pos_end) => {
                        /** @type {ListValue} */
                        let value = exec_ctx.symbol_table.get('value');
                        let str = "";
                        // @ts-ignore
                        for (let el of value.elements) str += el.repr ? el.repr() + " " : el.toString() + " ";
                        console.log(str); // normal
                        return new RuntimeResult().success(new NoneValue()); // useless to define the position or the context of NoneValue here
                    }
                }
            },
            {
                name: "assert",
                nature: "method",
                status: 1,
                static_prop: 0,
                value: {
                    args: [
                        argNode("expression"), // test a boolean
                        argNode("message", false, true, new StringValue("")), // any
                        argNode("optionalParams", true, true, new ListValue([])), // any[]
                    ],
                    /**
                     * Equivalent of `console.assert`.
                     * @param {Context} exec_ctx The execution context.
                     */
                    behavior: (exec_ctx, pos_start, pos_end) => {
                        let expression = exec_ctx.symbol_table.get('expression');
                        let message = exec_ctx.symbol_table.get('message');
                        let optionalParams = exec_ctx.symbol_table.get('optionalParams');

                        if (message instanceof BaseFunction || message instanceof NativeClassValue || message instanceof ClassValue || message instanceof NativePropertyValue) {
                            throw new RuntimeError(
                                pos_start, pos_end,
                                "Invalid Type for argument 'message'",
                                exec_ctx
                            );
                        }

                        console.assert(expression.is_true(), message.equivalent(), ...optionalParams.elements.map(v => v.equivalent()));
                        return new RuntimeResult().success(new NoneValue());
                    }
                }
            }
        ],
    }
}

export const NATIVE_FUNCTIONS = {
    log: {
        args: [ // all the args
            argNode("value", true),
        ],
        /**
         * Equivalent of `console.log`.
         * @param {Context} exec_ctx The execution context.
         */
        behavior: (exec_ctx, pos_start, pos_end) => {
            /** @type {ListValue} */
            let value = exec_ctx.symbol_table.get('value');
            let str = "";
            // @ts-ignore
            for (let el of value.elements) str += el.repr ? el.repr() + " " : el.toString() + " ";
            console.log(str); // normal
            return new RuntimeResult().success(new NoneValue());
        }
    },
    len: {
        args: [
            argNode("s")
        ],
        /**
         * Equivalent of `len()` in python.
         * @param {Context} exec_ctx The execution context.
         */
        behavior: (exec_ctx, pos_start, pos_end) => {
            let s = exec_ctx.symbol_table.get('s');
            let length = 0;
            if (s instanceof StringValue) {
                length = s.value.length;
            } else if (s instanceof ListValue) {
                length = s.elements.length;
            } else if (s instanceof DictionnaryValue) {
                length = s.elements.size;
            } else {
                throw new RuntimeError(
                    pos_start, pos_end,
                    "Invalid type of argument for function len()",
                    exec_ctx
                );
            }
            return new RuntimeResult().success(new NumberValue(length));
        }
    },
    exit: {
        /**
         * Exists the entire program
         */
        behavior: (exec_ctx, pos_start, pos_end) => {
            process.exit()
        }
    }
}