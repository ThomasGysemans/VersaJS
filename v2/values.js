import process from 'process';

import { Position } from "./position.js";
import { Context } from "./context.js";
import { SymbolTable } from "./symbol_table.js";
import { RuntimeResult } from "./runtime.js";
import { RuntimeError } from "./Exceptions.js";
import { CustomNode } from "./nodes.js";
import { Interpreter } from "./interpreter.js";

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

    is_true() {
        return true;
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
    /** @return {Value} */
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

export class DictionnaryValue extends Value {
    /**
     * @constructs DictionnaryValue
     * @param {Map<string, Value>} elements The elements inside the list.
     */
    constructor(elements) {
        super();
        this.elements = elements;
    }

    toString() {
        return "{" + Array.from(this.elements).map(v => {
            return `${v[0]}: ${v[1]}`;
        }).join(',') + "}";
    }

    is_true() {
        return this.elements.size > 0;
    }

    /**
     * @override
     * @return {DictionnaryValue}
     */
    copy() {
        let copy = new DictionnaryValue(this.elements);
        copy.set_pos(this.pos_start, this.pos_end);
        copy.set_context(this.context);
        return copy;
    }
}

/**
 * @classdesc A string in our program.
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

/**
 * @classdesc A class shared between CustomFunction & NativeFunction.
 */
export class BaseFunction extends Value {
    /**
     * @constructs BaseFunction
     * @param {string} name The name of the function.
     */
    constructor(name) {
        super();
        this.name = name || "<anonymous>";
    }

    /**
     * Generates a new context.
     * @returns {Context}
     */
    generate_new_context() {
        let new_context = new Context(this.name, this.context, this.pos_start);
        new_context.symbol_table = new SymbolTable(new_context.parent.symbol_table);
        return new_context;
    }

    /**
     * Checks if the number of arguments correspond.
     * @param {Array<string>} arg_names The names of the arguments.
     * @param {Array<string>} mandatory_arg_names The names of the mandatory arguments.
     * @param {Array<Value>} given_args The values of the given arguments (the function has been called by the user).
     * @return {RuntimeResult}
     */
    check_args(arg_names, mandatory_arg_names, given_args) {
        let res = new RuntimeResult();

        // too many arguments
        if (given_args.length > arg_names.length) {
            throw new RuntimeError(
                this.pos_start, this.pos_end,
                `(${given_args.length - arg_names.length}) too many args passed into '${this.name}'`,
                this.context
            );
        }

        // too few arguments
        if (given_args.length < mandatory_arg_names.length) {
            throw new RuntimeError(
                this.pos_start, this.pos_end,
                `(${mandatory_arg_names.length - given_args.length}) too few args passed into '${this.name}'`,
                this.context
            );
        }

        return res.success(null);
    }

    /**
     * Puts the arguments in the symbol table (gives the values to their identifier).
     * @param {Array<string>} arg_names The names of the arguments.
     * @param {Array<string>} mandatory_arg_names The names of the mandatory arguments.
     * @param {Array<string>} optional_arg_names The names of the optional arguments.
     * @param {Array} default_values The default values of the optional arguments.
     * @param {Array<Value>} given_args The values of the arguments.
     * @param {Context} exec_ctx The context.
     */
    populate_args(arg_names, mandatory_arg_names, optional_arg_names, default_values, given_args, exec_ctx) {
        // we have the names of the arguments,
        // we get the values of our arguments

        for (let i = 0; i < given_args.length; i++) {
            let arg_name = arg_names[i];
            let arg_value = given_args[i];
            arg_value.set_context(exec_ctx);
            exec_ctx.symbol_table.set(arg_name, arg_value); // create the variables (= args)
        }

        // there cannot be any optional arguments after mandatory arguments
        let total_of_possible_arguments = optional_arg_names.length + mandatory_arg_names.length;
        if (given_args.length < total_of_possible_arguments) {
            // optional_arg_names.length === default_values.length
            // Avoid replacing default values because both arrays (mandatory args & optional args) don't start at the same index
            let index_start = given_args.length - mandatory_arg_names.length;
            for (let i = index_start; i < optional_arg_names.length; i++) {
                let arg_name = optional_arg_names[i];
                let arg_value = default_values[i];
                arg_value.set_context(exec_ctx);
                exec_ctx.symbol_table.set(arg_name, arg_value);
            }
        }
    }

    /**
     * Checks the arguments & puts them in the symbol table (gives the values to their identifier).
     * @param {Array<string>} arg_names The names of the arguments.
     * @param {Array<string>} mandatory_arg_names The names of the mandatory arguments.
     * @param {Array<string>} optional_arg_names The names of the optional arguments.
     * @param {Array<Value>} default_values The values of the optional arguments.
     * @param {Array} given_args The values of the arguments.
     * @param {Context} exec_ctx The context.
     */
    check_and_populate_args(arg_names, mandatory_arg_names, optional_arg_names, default_values, given_args, exec_ctx) {
        let res = new RuntimeResult();
        res.register(this.check_args(arg_names, mandatory_arg_names, given_args));
        if (res.should_return()) return res;

        this.populate_args(arg_names, mandatory_arg_names, optional_arg_names, default_values, given_args, exec_ctx);
        return res.success(null);
    }
}

export class ClassValue extends Value {
    /**
     * @constructs ClassValue
     * @param {string} name The name of the class.
     * @param {Map<string, {status:number, value:Value, static_prop:number}>} value The class that has been instantiated.
     * @param {ClassValue} parent_class The parent class.
     */
    constructor(name, value, parent_class) {
        super();
        this.name = name;
        this.parent_class = parent_class;
        this.context_name = `<Class ${this.name}>`; // we do it here because this name cannot be changed, it's very important
        this.self = value;
    }

    is_true() {
        return true;
    }

    /**
     * @override
     * @return {ClassValue} A copy of that instance.
     */
    copy() {
        let copy = new ClassValue(this.name, this.self, this.parent_class);
        copy.set_context(this.context);
        copy.set_pos(this.pos_start, this.pos_end);
        return copy;
    }

    toString() {
        let __repr = this.self.get("__repr");
        if (__repr) {
            let method = __repr.value;
            // @ts-ignore
            let return_value = method.execute([]).value;
            if (return_value.repr !== undefined) {
                return return_value.repr();
            }
            return return_value.toString();
        }
        return `<Class ${this.name}>`;
    }
}

/**
 * @classdesc A function of the program.
 */
export class FunctionValue extends BaseFunction {
    /**
     * @constructs CustomFunction 
     * @param {string} name The name of the variable.
     * @param {CustomNode} body_node The body.
     * @param {Array<string>} arg_names The list of arguments.
     * @param {Array<string>} mandatory_arg_name_toks The list of mandatory arguments.
     * @param {Array<string>} optional_args The list of optional args.
     * @param {Array<CustomNode>} default_values_nodes The values of the optional args.
     * @param {boolean} should_auto_return Should auto return? Yes for inline functions because the `return` keyword is the arrow.
     */
    constructor(name, body_node, arg_names, mandatory_arg_name_toks, optional_args, default_values_nodes, should_auto_return) {
        super(name);
        this.body_node = body_node;
        this.arg_names = arg_names;
        this.mandatory_arg_name_toks = mandatory_arg_name_toks;
        this.optional_args = optional_args;
        this.default_values_nodes = default_values_nodes;
        this.should_auto_return = should_auto_return;
        this.type_name = "function";
    }

    /**
     * Executes a custom function (this function has been called by the user).
     * @param {Array<Value>} args The given arguments.
     * @return {RuntimeResult}
     */
    execute(args) {
        let res = new RuntimeResult();
        let interpreter = new Interpreter();
        let exec_ctx = this.generate_new_context();

        let default_values = [];
        for (let df of this.default_values_nodes) {
            let value = res.register(interpreter.visit(df, exec_ctx));
            if (res.should_return()) return res;
            default_values.push(value);
        }

        res.register(this.check_and_populate_args(this.arg_names, this.mandatory_arg_name_toks, this.optional_args, default_values, args, exec_ctx));
        if (res.should_return()) return res;

        exec_ctx.symbol_table.set('arguments', new ListValue([...args]));

        let value = res.register(interpreter.visit(this.body_node, exec_ctx));
        if (res.should_return() && res.func_return_value == null) return res;

        let ret_value = (this.should_auto_return ? value : null) || res.func_return_value || NumberValue.none;
        return res.success(ret_value);
    }

    is_true() {
        return true;
    }

    /**
     * @override
     * @return {FunctionValue} A copy of that instance.
     */
    copy() {
        let copy = new FunctionValue(this.name, this.body_node, this.arg_names, this.mandatory_arg_name_toks, this.optional_args, this.default_values_nodes, this.should_auto_return);
        copy.set_context(this.context);
        copy.set_pos(this.pos_start, this.pos_end);
        return copy;
    }

    toString() {
        return `<${this.type_name} ${this.name}>`;
    }
}

/**
 * @classdesc native functions.
 */
export class NativeFunction extends BaseFunction {
    /**
     * @constructs NativeFunction
     * @param {string} name The name of the native function.
     */
    constructor(name) {
        super(name);
    }

    // This static property will have all the arguments of every native functions
    // and their associated behavior
    static NATIVE_FUNCTIONS = {
        log: {
            args: {
                names: ["value"],
                mandatories: ["value"],
                optional: [],
                default_values: []
            },
            /**
             * Equivalent of `console.log`.
             * @param {Context} exec_ctx The execution context.
             */
            behavior: (exec_ctx, pos_start, pos_end) => {
                let value = exec_ctx.symbol_table.get('value');
                if (value instanceof StringValue) {
                    value = value.repr();
                }
                console.log(value.toString()); // normal
                return new RuntimeResult().success(NumberValue.none);
            }
        },
        len: {
            args: {
                names: ["s"],
                mandatories: ["s"],
                optional: [],
                default_values: []
            },
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
                } else if (s instanceof BaseFunction || s instanceof NumberValue) {
                    throw new RuntimeError(
                        pos_start, pos_end,
                        "Invalid type of argument for method len()",
                        exec_ctx
                    );
                } else {
                    throw new RuntimeError(
                        pos_start, pos_end,
                        "Unknown type of argument",
                        exec_ctx
                    );
                }
                return new RuntimeResult().success(new NumberValue(length));
            }
        },
        exit: {
            args: {},
            /**
             * Exists the entire program
             */
            behavior: (exec_ctx, pos_start, pos_end) => {
                process.exit()
            }
        }
    };

    /**
     * Executes a native function.
     * @param {Array} args The arguments
     * @param {Position} pos_start The starting position of the call node.
     * @param {Position} pos_end The end position of the call node.
     * @return {RuntimeResult}
     */
    execute(args, pos_start, pos_end) {
        let res = new RuntimeResult();
        let exec_ctx = this.generate_new_context();
        let native_function = NativeFunction.NATIVE_FUNCTIONS[this.name];
        if (!native_function) throw new Error(`No method '${this.name}' defined.`);

        let method = native_function.behavior;

        let registered_args = native_function.args;
        if (registered_args) {
            res.register(this.check_and_populate_args(registered_args.names || [], registered_args.mandatories || [], registered_args.optional || [], registered_args.default_values || [], args, exec_ctx));
        } else {
            res.register(this.check_and_populate_args([], [], [], [], args, exec_ctx));
        }
        if (res.should_return()) return res;

        let return_value = res.register(method(exec_ctx, pos_start, pos_end));
        if (res.should_return()) return res;

        return res.success(return_value);
    }

    is_true() {
        return true;
    }

    /**
     * @override
     * @return {NativeFunction} A copy of that instance.
     */
    copy() {
        let copy = new NativeFunction(this.name);
        copy.set_context(this.context);
        copy.set_pos(this.pos_start, this.pos_end);
        return copy;
    }

    /**
     * @override
     * @returns {string}
     */
    toString() {
        return `<native-function ${this.name}>`;
    }
}