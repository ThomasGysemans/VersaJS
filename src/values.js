"use strict";

import { Position } from "./position.js";
import { Context } from "./context.js";
import { ArgumentNode, CustomNode, NoneNode } from "./nodes.js";
import { SymbolTable } from "./symbol_table.js";
import { RuntimeResult } from "./runtime.js";
import { CustomTypeError, RuntimeError } from "./Exceptions.js";
import { Interpreter } from "./interpreter.js";
import { NATIVE_FUNCTIONS } from "./native.js";
import { Types } from "./tokens.js";

export class Value {
    /**
     * @constructs Value
     * @param {Types} type The type of value
     */
    constructor(type) {
        this.type = type;
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

    equivalent() {
        throw new Error("No equivalent method defined.");
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
        super(Types.NUMBER);
        this.value = value;
    }

    toString() {
        return `${this.value}`;
    }

    is_true() {
        return this.value !== 0;
    }

    equivalent() {
        return this.value;
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

export class ListValue extends Value {
    /**
     * @constructs ListValue
     * @param {Array<Value>} elements The elements inside the list.
     */
    constructor(elements) {
        super(Types.LIST);
        this.elements = elements;
    }

    toString() {
        return `[${this.elements.join(', ')}]`;
    }

    is_true() {
        return this.elements.length > 0;
    }

    equivalent() {
        return this.elements.map(v => v.equivalent());
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
        if (this.elements.length === 0) {
            return '[]';
        } else {
            // we want a one dimensional array
            let new_table = this.merge_into_1d_arr(this.elements);
            return `${new_table.join(', ')}`;
        }
    }
}

export class DictionnaryValue extends Value {
    /**
     * @constructs DictionnaryValue
     * @param {Map<string, Value>} elements The elements inside the list.
     */
    constructor(elements) {
        super(Types.DICT);
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

    equivalent() {
        return Array.from(this.elements.entries()).map(v => [v[0], v[1].equivalent()]);
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
        super(Types.STRING);
        this.value = value;
    }

    toString() {
        return `"${this.value}"`;
    }

    is_true() {
        return this.value.length > 0;
    }

    equivalent() {
        return this.value;
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
        super(Types.FUNCTION);
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
     * Checks if one of the arguments is a rest parameter.
     * @param {Array<ArgumentNode>} args 
     */
    has_rest_arg(args) {
        for (let a of args) {
            if (a.is_rest) return true;
        }
        return false;
    }

    /**
     * Checks if the number of arguments correspond.
     * @param {Array<ArgumentNode>} args The names of the arguments.
     * @param {Array<Value>} given_args The values of the given arguments (the function has been called by the user).
     */
    check_args(args, given_args) {
        // checks types
        for (let i = 0; i < given_args.length; i++) {
            if (i > args.length) break;
            let given_arg = given_args[i];
            let arg = args[i];
            // a rest parameter can only be of type 'list'
            if (arg.is_rest && arg.type !== Types.LIST) {
                throw new CustomTypeError(
                    arg.pos_start, arg.pos_end,
                    `A rest parameter must be of type 'list'`,
                    this.context
                );
            }
            // we must not check if the given arguments are list too
            if (arg.is_rest) break;
            // a dynamic argument can't be optional without any default value (except none)
            if (arg.is_optional && arg.type === Types.DYNAMIC) {
                if (arg.default_value_node instanceof NoneNode) {
                    throw new CustomTypeError(
                        arg.pos_start, arg.pos_end,
                        `A dynamic optional argument can't be of type 'none'`,
                        this.context
                    );
                }
            }
            if (arg.type === Types.DYNAMIC) {
                if (given_arg instanceof NoneValue) {
                    throw new CustomTypeError(
                        given_arg.pos_start, given_arg.pos_end,
                        `Type 'none' is not assignable to type 'dynamic'`,
                        this.context
                    );
                }
            } else if (arg.type !== Types.ANY) {
                if (given_arg.type !== arg.type && !arg.is_rest) {
                    if (arg.is_optional && given_arg instanceof NoneValue) {
                        continue;
                    }
                    throw new CustomTypeError(
                        given_arg.pos_start, given_arg.pos_end,
                        `Type '${given_arg.type}' is not assignable to type '${arg.type}'`,
                        this.context
                    );
                }
            }
        }

        // too many arguments
        if (!this.has_rest_arg(args)) { // just if there is no rest parameter
            if (given_args.length > args.length) {
                throw new RuntimeError(
                    this.pos_start, this.pos_end,
                    `(${given_args.length - args.length}) too many args passed into '${this.name}'`,
                    this.context
                );
            }
        }

        const mandatory_args = args.filter((v) => v.is_optional === false);

        // too few arguments
        if (given_args.length < mandatory_args.length) {
            throw new RuntimeError(
                this.pos_start, this.pos_end,
                `(${mandatory_args.length - given_args.length}) too few args passed into '${this.name}'`,
                this.context
            );
        }
    }

    /**
     * Puts the arguments in the symbol table (gives the values to their identifier).
     * @param {Array<ArgumentNode>} args The names of the arguments.
     * @param {Array<Value>} default_values The default values of the optional arguments.
     * @param {Array<Value>} given_args The values of the arguments.
     * @param {Context} exec_ctx The context.
     */
    populate_args(args, default_values, given_args, exec_ctx) {
        // we have the names of the arguments,
        // we get the values of our arguments

        for (let i = 0, e = 0; i < args.length; i++) {
            if (args[i].is_rest) {
                let arg_name = args[i].arg_name_tok.value;
                let arg_value = new ListValue(given_args.slice(i)); // all the given arguments from here
                arg_value.set_context(exec_ctx);
                if (i < given_args.length) {
                    arg_value.set_pos(given_args[i].pos_start, given_args[given_args.length - 1].pos_end);
                } else {
                    arg_value.set_pos(args[i].pos_start, args[i].pos_end);
                }
                exec_ctx.symbol_table.set(arg_name, { type: Types.LIST, value: arg_value });
                break; // the rest parameter is the last argument
            }

            // while there are given arguments
            if (i < given_args.length) {
                let arg_name = args[i].arg_name_tok.value;
                let arg_value = given_args[i];
                arg_value.set_context(exec_ctx);
                exec_ctx.symbol_table.set(arg_name, { type: Types.ANY, value: arg_value }); // create the variables (= args)
            } else {
                // there is more arguments
                // than the given arguments
                // so there are two options: rest parameter or optional arguments
                // however, rest parameter is already handled above
                if (args[i].is_optional) {
                    let arg_name = args[i].arg_name_tok.value;
                    let arg_value = default_values[e];
                    arg_value.set_context(exec_ctx);
                    exec_ctx.symbol_table.set(arg_name, { type: Types.ANY, value: arg_value }); // create the variables (with their default value)
                    e++;
                }
            }
        }
    }

    /**
     * Checks the arguments & puts them in the symbol table (gives the values to their identifier).
     * @param {Array<ArgumentNode>} args The names of the arguments.
     * @param {Array<Value>} default_values The values of the optional arguments.
     * @param {Array} given_args The values of the arguments.
     * @param {Context} exec_ctx The context.
     */
    check_and_populate_args(args, default_values, given_args, exec_ctx) {
        this.check_args(args, given_args)
        this.populate_args(args, default_values, given_args, exec_ctx);
    }
}

export class ClassValue extends Value {
    /**
     * @constructs ClassValue
     * @param {string} name The name of the class.
     * @param {Map<string, {status:number, value: { type: string, value: Value }, static_prop:number}>} value The class that has been instantiated.
     * @param {ClassValue} parent_class The parent class.
     */
    constructor(name, value, parent_class) {
        super(name);
        this.name = name;
        this.is_instance = false;
        this.parent_class = parent_class;
        this.context_name = `<Class ${this.name}>`; // we do it here because this name cannot be changed, it's very important
        this.self = value;
    }

    is_true() {
        return true;
    }

    equivalent() {
        return {}; // todo
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

export class TagValue extends Value {
    /**
     * @constructs TagValue
     * @param {string} name The name of the class.
     * @param {Map<string, { prop: number, state: number, optional: number, value: { type: string, value: Value } }>} value Value of 'self'. Note: "optional" is just for "prop".
     */
    constructor(name, value) {
        super(Types.TAG);
        this.name = name;
        this.context_name = `<Tag ${this.name}>`; // we do it here because this name cannot be changed, it's very important
        this.self = value;
    }

    is_true() {
        return true;
    }

    equivalent() {
        return {}; // todo
    }

    /**
     * @override
     * @return {TagValue} A copy of that instance.
     */
    copy() {
        let copy = new TagValue(this.name, this.self);
        copy.set_context(this.context);
        copy.set_pos(this.pos_start, this.pos_end);
        return copy;
    }

    toString() {
        return `<Tag ${this.name}>`;
    }
}

export class NativeClassValue extends Value {
    /**
     * @constructs NativeClassValue
     * @param {string} name The name of the class.
     * @param {Map<string, {status:number, value: { type: string, value: NativePropertyValue }, static_prop:number}>} value The class that has been instantiated.
     * @param {NativeClassValue} parent_class The parent class.
     */
    constructor(name, value, parent_class) {
        super(name);
        this.name = name;
        this.is_instance = false;
        this.parent_class = parent_class;
        this.context_name = `<NativeClass ${this.name}>`; // we do it here because this name cannot be changed, it's very important
        this.self = value;
    }

    is_true() {
        return true;
    }

    equivalent() {
        return {};
    }

    /**
     * @override
     * @return {NativeClassValue} A copy of that instance.
     */
    copy() {
        let copy = new NativeClassValue(this.name, this.self, this.parent_class);
        copy.set_context(this.context);
        copy.set_pos(this.pos_start, this.pos_end);
        return copy;
    }

    toString() {
        return `<NativeClass ${this.name}>`;
    }
}

/**
 * @classdesc native methods that belong to a native class.
 */
export class NativePropertyValue extends BaseFunction {
    /**
     * @constructs NativePropertyValue
     * @param {string} name The name of the native property.
     * @param {string} nature The nature of the property (method or property)
     * @param {string} from The name of the native class
     * @param {number} status The status of the property (public, private, protected)
     * @param {number} static_prop Is static?
     * @param {(exec_ctx: Context, pos_start: Position, pos_end: Position) => RuntimeResult} behavior The native behavior
     * @param {Array<ArgumentNode>} method_args The necessary arguments if this is a method
     */
    constructor(name, nature, from, status, static_prop, behavior, method_args=[]) {
        super(name);
        this.status = status;
        this.nature = nature;
        this.from = from;
        this.static_prop = static_prop;
        this.behavior = behavior;
        this.method_args = method_args;
    }

    /**
     * Executes a native method.
     * @param {Array} args The arguments
     * @param {Position} pos_start The starting position of the call node.
     * @param {Position} pos_end The end position of the call node.
     * @return {RuntimeResult}
     */
    execute(args, pos_start, pos_end) {
        let res = new RuntimeResult();
        let exec_ctx = this.generate_new_context();

        // essentially for intellisense
        // but I know that all the default values are instances of Value
        let default_values = this.method_args.map((v) => v.default_value_node instanceof Value ? v.default_value_node.copy().set_pos(pos_start, pos_end) : null).filter((v) => v !== null);

        this.check_and_populate_args(this.method_args, default_values, args, exec_ctx)

        exec_ctx.symbol_table.set('arguments', { type: Types.LIST, value: new ListValue([...args]) });

        let return_value = res.register(this.behavior(exec_ctx, pos_start, pos_end));
        if (res.should_return()) return res;

        return res.success(return_value);
    }

    is_true() {
        return true;
    }

    equivalent() {
        return {};
    }

    /**
     * @override
     * @return {NativePropertyValue} A copy of that instance.
     */
    copy() {
        let copy = new NativePropertyValue(this.name, this.nature, this.from, this.status, this.static_prop, this.behavior);
        copy.set_context(this.context);
        copy.set_pos(this.pos_start, this.pos_end);
        return copy;
    }

    /**
     * @override
     * @returns {string}
     */
    toString() {
        return `<native-${this.nature} ${this.from}.${this.name}>`;
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
     * @param {Array<ArgumentNode>} args The list of arguments.
     * @param {boolean} should_auto_return Should auto return? Yes for inline functions because the `return` keyword is the arrow.
     */
    constructor(name, body_node, args, should_auto_return) {
        super(name);
        this.body_node = body_node;
        this.args = args;
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

        let default_values_nodes = this.args.map((v) => v.default_value_node).filter((v) => v !== null);
        let default_values = [];
        for (let df of default_values_nodes) {
            let value = res.register(interpreter.visit(df, exec_ctx));
            if (res.should_return()) return res;
            default_values.push(value);
        }

        this.check_and_populate_args(this.args, default_values, args, exec_ctx)

        exec_ctx.symbol_table.set('arguments', { type: Types.LIST, value: new ListValue([...args]) });

        let value = res.register(interpreter.visit(this.body_node, exec_ctx));
        if (res.should_return() && res.func_return_value == null) return res;

        let ret_value = (this.should_auto_return ? value : null) || res.func_return_value || new NoneValue();
        return res.success(ret_value);
    }

    is_true() {
        return true;
    }

    equivalent() {
        return {};
    }

    /**
     * @override
     * @return {FunctionValue} A copy of that instance.
     */
    copy() {
        let copy = new FunctionValue(this.name, this.body_node, this.args, this.should_auto_return);
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

    /**
     * Executes a native function.
     * @param {Array} args The arguments
     * @param {Position} pos_start The starting position of the call node.
     * @param {Position} pos_end The end position of the call node.
     * @return {RuntimeResult}
     */
    execute(args, pos_start, pos_end) {
        let res = new RuntimeResult();
        let interpreter = new Interpreter();
        let exec_ctx = this.generate_new_context();
        let native_function = NATIVE_FUNCTIONS[this.name];
        if (!native_function) throw new Error(`No native function '${this.name}' defined.`);

        let method = native_function.behavior;
        let registered_args = native_function.args ?? [];

        let default_values_nodes = registered_args.map((v) => v.default_value_node).filter((v) => v !== null);
        let default_values = [];
        for (let df of default_values_nodes) {
            let value = res.register(interpreter.visit(df, exec_ctx));
            if (res.should_return()) return res;
            default_values.push(value);
        }

        this.check_and_populate_args(registered_args, default_values, args, exec_ctx)

        exec_ctx.symbol_table.set('arguments', { type: Types.LIST, value: new ListValue([...args]) });

        let return_value = res.register(method(exec_ctx, pos_start, pos_end));
        if (res.should_return()) return res;

        return res.success(return_value);
    }

    is_true() {
        return true;
    }

    equivalent() {
        return {};
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

export class EnumValue extends Value {
    /**
     * @constructs EnumValue
     * @param {string} name The name of the enum.
     * @param {Map<string, NumberValue>} properties The properties of the enum.
     */
    constructor(name, properties) {
        super(Types.OBJECT);
        this.name = name;
        this.properties = properties;
    }

    is_true() {
        return true;
    }

    equivalent() {
        return Object.fromEntries(this.properties.entries());
    }

    /**
     * @override
     * @return {EnumValue} A copy of that instance.
     */
    copy() {
        let copy = new EnumValue(this.name, this.properties);
        copy.set_context(this.context);
        copy.set_pos(this.pos_start, this.pos_end);
        return copy;
    }

    toString() {
        return `<Enum ${this.name}>`;
    }
}

export class NoneValue extends Value {
    /**
     * @constructs NoneValue
     */
    constructor() {
        super(Types.ANY);
    }

    is_true() {
        return false;
    }

    equivalent() {
        return null;
    }

    /**
     * @override
     * @return {NoneValue} A copy of that instance.
     */
    copy() {
        let copy = new NoneValue();
        copy.set_context(this.context);
        copy.set_pos(this.pos_start, this.pos_end);
        return copy;
    }

    toString() {
        return `none`;
    }
}

export class BooleanValue extends Value {
    /**
     * @constructs BooleanValue
     * @param {number} state false or true?
     * @param {string} display_name "yes", "true", "no" or "false"
     */
    constructor(state, display_name=null) {
        super(Types.BOOLEAN);
        this.state = state;
        this.display_name = display_name ? display_name : (this.state === 1 ? 'yes' : 'no');
    }

    is_true() {
        return this.state === 1 ? true : false;
    }

    equivalent() {
        return this.state === 1 ? true : false;
    }

    /**
     * @override
     * @return {BooleanValue} A copy of that instance.
     */
    copy() {
        let copy = new BooleanValue(this.state, this.display_name);
        copy.set_context(this.context);
        copy.set_pos(this.pos_start, this.pos_end);
        return copy;
    }

    toString() {
        return `${this.display_name}`;
    }
}

export class HtmlValue extends Value {
    /**
     * @constructs HtmlValue
     * @param {string|null} tagname The name of the tag
     * @param {string[]} classes The CSS classes attached to this tag.
     * @param {string|null} id The ID attached to this tag.
     * @param {[string, Value][]} attributes 
     * @param {Value[]} children The list of children for that tag.
     */
    constructor(tagname, classes, id, attributes, children) {
        super(Types.HTML);
        this.tagname = tagname;
        this.classes = classes;
        this.id = id;
        this.attributes = attributes;
        this.children = children;
    }

    is_true() {
        return true;
    }

    equivalent() {
        return {};
    }

    /**
     * @override
     * @return {HtmlValue} A copy of that instance.
     */
    copy() {
        let copy = new HtmlValue(this.tagname, this.classes, this.id, this.attributes, this.children);
        copy.set_context(this.context);
        copy.set_pos(this.pos_start, this.pos_end);
        return copy;
    }

    indent(n) {
        return '\t'.repeat(n);
    }

    toString() {
        return `[Tag ${this.tagname ?? 'Fragment'}]`;
    }
}