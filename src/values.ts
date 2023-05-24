"use strict";

import { ArgumentNode, CustomNode, NoneNode } from "./nodes.js";
import { CustomTypeError, RuntimeError } from "./Exceptions.js";
import { PropertyNature } from "./lib/PropertyNature.js";
import { SymbolTable } from "./symbol_table.js";
import { Interpreter } from "./interpreter.js";
import { NATIVE_FUNCTIONS } from "./native.js";
import { Types } from "./tokens.js";
import Position, { getDefaultPos } from "./position.js";
import RuntimeResult from "./runtime.js";
import Context from "./context.js";

export class Value<T = any> {
    public type: string; // I don't have another choice but to say it's a string because it might be a custom Type, which cannot be in the Types enum
    public value: T | undefined = undefined;
    public context: Context | null = null;
    public pos_start: Position;
    public pos_end: Position;

    /**
     * @param type The type of value
     */
    constructor(type: string) {
        this.type = type;
        this.pos_start = getDefaultPos();
        this.pos_end = getDefaultPos();
        this.set_context();
    }

    /**
     * Sets the position of the value in the code.
     * @param pos_start Starting position of the value.
     * @param pos_end End position of the value.
     */
    public set_pos(pos_start: Position, pos_end: Position): this {
        this.pos_start = pos_start;
        this.pos_end = pos_end;
        return this;
    }

    /**
     * Indicates how this particular value can evaluate to true if used in a condition.
     * @returns A boolean
     */
    public is_true() {
        return true;
    }

    /**
     * Returns what needs to be use for comparison with another Value.
     */
    public equivalent(): any {
        throw new Error("No equivalent method defined.");
    }

    /**
     * Saves the context.
     * @param context The current context.
     * @return
     */
    public set_context(context: Context | null = null): this {
        this.context = context;
        return this;
    }

    // meant to be overwritten
    public copy(): Value {
        throw new Error("No copy method defined.");
    }

    /**
     * Transforms the value into a String.
     * @returns The string representation of this value.
     */
    public toString(): String {
        return this.value?.toString() ?? "";
    }

    /**
     * We don't always want the same string representation when used in a concatenation or printed to the screen.
     * @returns The string to be printed when used on a console.log
     */
    public repr(): String {
        return this.toString();
    }
}

/**
 * @classdesc A number in our program.
 */
export class NumberValue extends Value<number> {
    public value: number;

    /**
     * @param value The value.
     */
    constructor(value: number) {
        super(Types.NUMBER);
        this.value = value;
    }

    /**
     * Evaluates the truthiness of this number.
     * @returns True if the value is different from 0.
     */
    public is_true() {
        return this.value !== 0;
    }

    public equivalent() {
        return this.value;
    }

    /**
     * @override
     */
    public copy(): NumberValue {
        const copy = new NumberValue(this.value!);
        copy.set_pos(this.pos_start, this.pos_end);
        copy.set_context(this.context);
        return copy;
    }
}

export class ListValue extends Value {
    public elements: Value[];

    /**
     * @param elements The elements inside the list.
     */
    constructor(elements: Value[]) {
        super(Types.LIST);
        this.elements = elements;
    }

    /**
     * @returns [element1, element2, element3, ...]
     */
    public toString() {
        return `[${this.elements.join(', ')}]`;
    }

    /**
     * @returns `true` if the length of `elements` is not empty.
     */
    public is_true() {
        return this.elements.length > 0;
    }

    public equivalent() {
        return this.elements.map(v => v.equivalent());
    }

    /**
     * @override
     */
    public copy(): ListValue {
        const copy = new ListValue(this.elements);
        copy.set_pos(this.pos_start, this.pos_end);
        copy.set_context(this.context);
        return copy;
    }

    /**
     * Converts an array into a one dimensional array.
     */
    private merge_into_1d_arr(arr: any[]): any[] {
        return arr.reduce((acc, val) => acc.concat(val instanceof ListValue ? this.merge_into_1d_arr(val.elements) : val), []);
    }

    /**
     * @override
     * @returns The string representation of the elements on one dimension.
     */
    public repr() {
        if (this.elements.length === 0) {
            return '[]';
        } else {
            // we want a one dimensional array
            const new_table = this.merge_into_1d_arr(this.elements);
            return `${new_table.join(', ')}`;
        }
    }
}

export class DictionaryValue extends Value {
    public elements: Map<string, Value>;

    /**
     * @param elements The elements inside the list.
     */
    constructor(elements: Map<string, Value>) {
        super(Types.DICT);
        this.elements = elements;
    }

    /**
     * @returns "{ key: value, ... }"
     */
    public toString() {
        return "{" + Array.from(this.elements).map(v => {
            return `${v[0]}: ${v[1]}`;
        }).join(',') + "}";
    }

    /**
     * @returns `true` if the value is not empty.
     */
    public is_true() {
        return this.elements.size > 0;
    }

    public equivalent() {
        return Array.from(this.elements.entries()).map(v => [v[0], v[1].equivalent()]);
    }

    /**
     * @override
     */
    public copy(): DictionaryValue {
        const copy = new DictionaryValue(this.elements);
        copy.set_pos(this.pos_start, this.pos_end);
        copy.set_context(this.context);
        return copy;
    }
}

/**
 * @classdesc A string in our program.
 */
export class StringValue extends Value<string> {
    public value: string;

    /**
     * @param value The value.
     */
    constructor(value: string) {
        super(Types.STRING);
        this.value = value;
    }

    public toString() {
        return `"${this.value}"`;
    }

    public is_true() {
        return this.value!.length > 0;
    }

    public equivalent() {
        return this.value;
    }

    // We don't want the quotes when we console.log a string
    // So we need another function instead of toString()
    public repr() {
        return `${this.value}`;
    }

    /**
     * @override
     * @return {StringValue}
     */
    public copy(): StringValue {
        const copy = new StringValue(this.value!);
        copy.set_pos(this.pos_start, this.pos_end);
        copy.set_context(this.context);
        return copy;
    }
}

/**
 * @classdesc A class shared between CustomFunction & NativeFunction.
 */
export class BaseFunction extends Value {
    public readonly name: string;

    /**
     * @param name The name of the function.
     */
    constructor(name: string | null) {
        super(Types.FUNCTION);
        this.name = name ?? "<anonymous>";
    }

    /**
     * Generates a new context.
     */
    public generate_new_context(): Context {
        const new_context = new Context(this.name, this.context, this.pos_start);
        new_context.symbol_table = new SymbolTable(new_context.parent?.symbol_table ?? null);
        return new_context;
    }

    /**
     * Checks if one of the arguments is a rest parameter.
     * @param args 
     */
    public has_rest_arg(args: ArgumentNode[]): boolean {
        for (const a of args) {
            if (a.is_rest) return true;
        }
        return false;
    }

    /**
     * The execution process of the function or method.
     */
    public execute(..._: any[]): RuntimeResult {
        throw new Error("Unimplemented method.");
    }

    /**
     * Checks if the given arguments correspond to the function's definition.
     * @param args The names of the arguments.
     * @param given_args The values of the given arguments (the function was called by the user).
     */
    public check_args(args: ArgumentNode[], given_args: Value[], pos_start: Position, pos_end: Position) {
        // checks types
        for (let i = 0; i < given_args.length; ++i) {
            if (i >= args.length) break;
            const given_arg = given_args[i];
            const arg = args[i];
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
                    pos_start, pos_end,
                    `Too many args passed into '${this.name}': ${given_args.length}, but expected at most ${args.length}`,
                    this.context
                );
            }
        }

        const mandatory_args = args.filter(v => !v.is_optional);

        // too few arguments
        if (given_args.length < mandatory_args.length) {
            throw new RuntimeError(
                pos_start, pos_end,
                `Too few args passed into '${this.name}': ${given_args.length}, but expected at least ${mandatory_args.length}`,
                this.context
            );
        }
    }

    /**
     * Puts the arguments in the symbol table (gives the values to their identifier).
     * @param args The names of the arguments.
     * @param default_values The default values of the optional arguments.
     * @param given_args The values of the arguments.
     * @param exec_ctx The context.
     */
    public populate_args(args: ArgumentNode[], default_values: Value[], given_args: Value[], exec_ctx: Context) {
        // we have the names of the arguments,
        // we get the values of our arguments

        for (let i = 0, e = 0; i < args.length; ++i) {
            if (args[i].is_rest) {
                const arg_name = args[i].arg_name_tok.value;
                const arg_value = new ListValue(given_args.slice(i)); // all the given arguments from here
                arg_value.set_context(exec_ctx);
                if (i < given_args.length) {
                    arg_value.set_pos(given_args[i].pos_start, given_args[given_args.length - 1].pos_end);
                } else {
                    arg_value.set_pos(args[i].pos_start, args[i].pos_end);
                }
                exec_ctx.symbol_table!.set(arg_name, arg_value);
                break; // the rest parameter is the last argument
            }

            // while there are given arguments
            if (i < given_args.length) {
                const arg_name = args[i].arg_name_tok.value;
                const arg_value = given_args[i];
                arg_value.set_context(exec_ctx);
                // arg_value.type = Types.ANY;
                exec_ctx.symbol_table!.set(arg_name, arg_value); // create the variables (= args)
            } else {
                // there is more arguments
                // than the given arguments
                // so there are two options: rest parameter or optional arguments
                // however, rest parameter is already handled above
                if (args[i].is_optional) {
                    const arg_name = args[i].arg_name_tok.value;
                    const arg_value = default_values[e];
                    arg_value.set_context(exec_ctx);
                    // arg_value.type = Types.ANY;
                    exec_ctx.symbol_table!.set(arg_name, arg_value); // create the variables (with their default value)
                    ++e;
                }
            }
        }
    }

    /**
     * Checks the arguments & puts them in the symbol table (gives the values to their identifier).
     * @param args The names of the arguments.
     * @param default_values The values of the optional arguments.
     * @param given_args The values of the arguments.
     * @param exec_ctx The context.
     * @param pos_start The starting position of the call in case of a native method (for clearer error messages).
     * @param pos_end The ending position of the call in case of a native method (for clearer error messages).
     */
    public check_and_populate_args(args: ArgumentNode[], default_values: Value[], given_args: Value[], exec_ctx: Context, pos_start?: Position, pos_end?: Position) {
        this.check_args(args, given_args, pos_start ?? this.pos_start, pos_end ?? this.pos_end)
        this.populate_args(args, default_values, given_args, exec_ctx);
    }
}

// Used for the class definition itself,
// but also for the individual instanctions when is_instance is set to true
export class ClassValue extends Value {
    public readonly name: string;
    public readonly parent_class: ClassValue | null;
    public readonly context_name: string;
    public readonly self: ClassInstanciation; // a Map containing all properties and methods
    public is_instance: boolean;

    /**
     * @constructs ClassValue
     * @param name The name of the class.
     * @param value The class that has been instantiated.
     * @param parent_class The parent class.
     */
    constructor(name: string, value: ClassInstanciation, parent_class: ClassValue | null) {
        super(name);
        this.name = name;
        this.is_instance = false;
        this.parent_class = parent_class;
        this.context_name = `<Class ${this.name}>`; // we do it here because this name cannot be changed, it's very important
        this.self = value;
    }

    /**
     * @returns `true` because this value is not null.
     */
    public is_true() {
        return true;
    }

    public equivalent() {
        return {}; // todo
    }

    /**
     * @override
     */
    public copy(): ClassValue {
        const copy = new ClassValue(this.name, this.self, this.parent_class);
        copy.set_context(this.context);
        copy.set_pos(this.pos_start, this.pos_end);
        return copy;
    }

    public toString() {
        const __repr = this.self.get("__repr"); // get the method named "__repr"
        if (__repr) {
            const method = __repr.value as FunctionValue;
            const return_value = method.execute([], method.pos_start, method.pos_end).value!;
            return return_value.repr();
        }
        return `<Class ${this.name}>`;
    }
}

export class TagValue extends Value {
    public readonly name: string;
    public readonly context_name: string;
    public readonly self: TagInstanciation;

    /**
     * @param name The name of the class.
     * @param value Value of 'self'. Note: "optional" is just for "prop".
     */
    constructor(name: string, value: TagInstanciation) {
        super(Types.TAG);
        this.name = name;
        this.context_name = `<Tag ${this.name}>`; // we do it here because this name cannot be changed, it's very important
        this.self = value;
    }

    /**
     * @returns `true` because the value is not null
     */
    public is_true() {
        return true;
    }

    public equivalent() {
        return {}; // todo
    }

    /**
     * @override
     */
    public copy(): TagValue {
        const copy = new TagValue(this.name, this.self);
        copy.set_context(this.context);
        copy.set_pos(this.pos_start, this.pos_end);
        return copy;
    }

    public toString() {
        return this.context_name;
    }
}

export class NativeClassValue extends Value {
    public readonly name: string;
    public readonly is_instance: boolean;
    public readonly parent_class: NativeClassValue | null;
    public readonly context_name: string;
    public readonly self: NativeClassInstanciation;

    /**
     * @param name The name of the class.
     * @param value The class that has been instantiated.
     * @param parent_class The parent class.
     */
    constructor(name: string, value: NativeClassInstanciation, parent_class: NativeClassValue | null) {
        super(name);
        this.name = name;
        this.is_instance = false;
        this.parent_class = parent_class;
        this.context_name = `<NativeClass ${this.name}>`; // we do it here because this name cannot be changed, it's very important
        this.self = value;
    }

    /**
     * @returns `true` because the value is not null
     */
    public is_true() {
        return true;
    }

    public equivalent() {
        return {};
    }

    /**
     * @override
     * @return {NativeClassValue} A copy of that instance.
     */
    public copy(): NativeClassValue {
        const copy = new NativeClassValue(this.name, this.self, this.parent_class);
        copy.set_context(this.context);
        copy.set_pos(this.pos_start, this.pos_end);
        return copy;
    }

    public toString() {
        return this.context_name;
    }
}

/**
 * @classdesc native methods that belong to a native class.
 */
export class NativePropertyValue extends BaseFunction {
    public readonly nature: PropertyNature; // "method" or "property"
    public readonly from: string; // the name of the native class
    public readonly status: number; // public, private, protected
    public readonly static_prop: number; // static?
    public readonly behavior: NativeBehavior;
    public readonly method_args: ArgumentNode[];

    /**
     * @param name The name of the native property.
     * @param nature The nature of the property (method or property)
     * @param from The name of the native class
     * @param status The status of the property (public, private, protected)
     * @param static_prop Is static?
     * @param behavior The native behavior
     * @param method_args The necessary arguments if this is a method
     */
    constructor(name: string, nature: PropertyNature, from: string, status: number, static_prop: number, behavior: NativeBehavior, method_args: ArgumentNode[] = []) {
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
     * @param args The value of the given arguments.
     * @param pos_start The starting position of the call node.
     * @param pos_end The end position of the call node.
     */
    public execute(args: Value[], pos_start: Position, pos_end: Position): RuntimeResult {
        const res = new RuntimeResult();
        const exec_ctx = this.generate_new_context();
        const default_values = this.method_args.map(v => v.default_value_node instanceof Value ? v.default_value_node.copy().set_pos(pos_start, pos_end) : null).filter(v => v !== null) as Value[];

        this.check_and_populate_args(this.method_args, default_values, args, exec_ctx, pos_start, pos_end)

        exec_ctx.symbol_table!.set('arguments', new ListValue([...args]));

        const return_value = res.register(this.behavior(exec_ctx, pos_start, pos_end));
        if (res.should_return()) return res;

        return res.success(return_value);
    }

    /**
     * @returns `true` because the value itself is not null.
     */
    public is_true() {
        return true;
    }

    public equivalent() {
        return {};
    }

    /**
     * @override
     */
    public copy(): NativePropertyValue {
        const copy = new NativePropertyValue(this.name, this.nature, this.from, this.status, this.static_prop, this.behavior);
        copy.set_context(this.context);
        copy.set_pos(this.pos_start, this.pos_end);
        return copy;
    }

    /**
     * @override
     */
    public toString() {
        return `<native-${this.nature} ${this.from}.${this.name}>`;
    }
}

/**
 * @classdesc A function of the program.
 */
export class FunctionValue extends BaseFunction {
    public readonly body_node: CustomNode;
    public readonly args: ArgumentNode[];
    public readonly should_auto_return: boolean;
    public type_name: string = "function"; // because native functions needs to be printed like this: <native NAME>, but functions are <function NAME>

    /**
     * @param name The name of the variable.
     * @param body_node The body.
     * @param args The list of arguments.
     * @param should_auto_return Should auto return? Yes for inline functions because the `return` keyword is the arrow.
     */
    constructor(name: string | null, body_node: CustomNode, args: ArgumentNode[], should_auto_return: boolean) {
        super(name);
        this.body_node = body_node;
        this.args = args;
        this.should_auto_return = should_auto_return;
    }

    /**
     * Executes a custom function (this function was called by the user).
     * @param args The given arguments.
     */
    public execute(args: Value[], pos_start: Position, pos_end: Position): RuntimeResult {
        const res = new RuntimeResult();
        const interpreter = new Interpreter();
        const exec_ctx = this.generate_new_context();

        const default_values_nodes = this.args.map(v => v.default_value_node).filter(v => v !== null);
        const default_values: Value[] = [];
        for (const df of default_values_nodes) {
            if (df instanceof Value) {
                default_values.push(df);
            } else {
                const value = res.register(interpreter.visit(df!, exec_ctx));
                if (res.should_return()) return res;
                default_values.push(value!);
            }
        }

        this.check_and_populate_args(this.args, default_values, args, exec_ctx, pos_start, pos_end);

        // Create a variable "arguments" that hold all the arguments
        exec_ctx.symbol_table!.set('arguments', new ListValue([...args]));

        const value = res.register(interpreter.visit(this.body_node, exec_ctx));
        if (res.should_return() && res.func_return_value == null) return res;

        const ret_value = (this.should_auto_return ? value : null) || res.func_return_value || new NoneValue();
        return res.success(ret_value);
    }

    public is_true() {
        return true;
    }

    public equivalent() {
        return {};
    }

    /**
     * @override
     */
    public copy(): FunctionValue {
        const copy = new FunctionValue(this.name, this.body_node, this.args, this.should_auto_return);
        copy.set_context(this.context);
        copy.set_pos(this.pos_start, this.pos_end);
        return copy;
    }

    public toString() {
        return `<${this.type_name} ${this.name}>`;
    }
}

/**
 * @classdesc native functions.
 */
export class NativeFunction extends BaseFunction {
    /**
     * @param name The name of the native function.
     */
    constructor(name: string) {
        super(name);
    }

    /**
     * Executes a native function.
     * @param args The arguments
     * @param pos_start The starting position of the call node.
     * @param pos_end The end position of the call node.
     */
    public execute(args: Value[], pos_start: Position, pos_end: Position): RuntimeResult {
        const res = new RuntimeResult();
        const interpreter = new Interpreter();
        const exec_ctx = this.generate_new_context();
        const native_function = NATIVE_FUNCTIONS[this.name];
        if (!native_function) throw new Error(`No native function '${this.name}' defined.`);

        const method = native_function.behavior as NativeBehavior;
        const registered_args = native_function.args ?? [];

        const default_values_nodes = registered_args.map(v => v.default_value_node).filter(v => v !== null);
        const default_values: Value[] = [];
        for (const df of default_values_nodes) {
            if (df instanceof Value) {
                default_values.push(df);
            } else {
                const value = res.register(interpreter.visit(df!, exec_ctx));
                if (res.should_return()) return res;
                default_values.push(value!);
            }
        }

        this.check_and_populate_args(registered_args, default_values, args, exec_ctx)

        exec_ctx.symbol_table!.set('arguments', new ListValue([...args]));

        const return_value = res.register(method(exec_ctx, pos_start, pos_end));
        if (res.should_return()) return res;

        return res.success(return_value);
    }

    public is_true() {
        return true;
    }

    public equivalent() {
        return {};
    }

    /**
     * @override
     */
    public copy(): NativeFunction {
        const copy = new NativeFunction(this.name);
        copy.set_context(this.context);
        copy.set_pos(this.pos_start, this.pos_end);
        return copy;
    }

    /**
     * @override
     */
    public toString() {
        return `<native-function ${this.name}>`;
    }
}

export class EnumValue extends Value {
    public readonly name: string;
    public readonly properties: EnumProperties;

    /**
     * @constructs EnumValue
     * @param name The name of the enum.
     * @param properties The properties of the enum.
     */
    constructor(name: string, properties: EnumProperties) {
        super(Types.OBJECT);
        this.name = name;
        this.properties = properties;
    }

    public is_true() {
        return true;
    }

    public equivalent() {
        return Object.fromEntries(this.properties.entries());
    }

    /**
     * @override
     */
    public copy(): EnumValue {
        const copy = new EnumValue(this.name, this.properties);
        copy.set_context(this.context);
        copy.set_pos(this.pos_start, this.pos_end);
        return copy;
    }

    public toString() {
        return `<Enum ${this.name}>`;
    }
}

export class NoneValue extends Value {
    constructor() {
        super(Types.ANY);
    }

    public is_true() {
        return false;
    }

    public equivalent() {
        return null;
    }

    /**
     * @override
     */
    public copy(): NoneValue {
        const copy = new NoneValue();
        copy.set_context(this.context);
        copy.set_pos(this.pos_start, this.pos_end);
        return copy;
    }

    public toString() {
        return `none`;
    }
}

export class BooleanValue extends Value {
    public readonly state: number; // 0 for false, 1 for true
    public readonly display_name: string; // "yes", "true", "no", or "false"

    /**
     * @param state 0 for false, 1 for true
     * @param display_name "yes", "true", "no" or "false"
     */
    constructor(state: number, display_name: string | null = null) {
        super(Types.BOOLEAN);
        this.state = state;
        this.display_name = display_name !== null ? display_name : (this.state === 1 ? 'yes' : 'no');
    }

    public is_true() {
        return this.state === 1;
    }

    public equivalent() {
        return this.state === 1;
    }

    /**
     * @override
     */
    public copy(): BooleanValue {
        const copy = new BooleanValue(this.state, this.display_name);
        copy.set_context(this.context);
        copy.set_pos(this.pos_start, this.pos_end);
        return copy;
    }

    public toString() {
        return `${this.display_name}`;
    }
}

export class HtmlValue extends Value {
    public readonly tagname: string | null; // can be null if this is a Fragment
    public readonly classes: string[];
    public readonly id: string | null;
    public readonly attributes: [string, Value][];
    public readonly events: [string, Value][];
    public readonly children: Value[];

    /**
     * @param tagname The name of the tag
     * @param classes The CSS classes attached to this tag.
     * @param id The ID attached to this tag.
     * @param attributes The attributes attached to this tag.
     * @param events The events attached to this tag.
     * @param children The list of children for that tag.
     */
    constructor(tagname: string | null, classes: string[], id: string | null, attributes: [string, Value][], events: [string, Value][], children: Value[]) {
        super(Types.HTML);
        this.tagname = tagname;
        this.classes = classes;
        this.id = id;
        this.attributes = attributes;
        this.events = events;
        this.children = children;
    }

    public is_true() {
        return true;
    }

    public equivalent() {
        return {};
    }

    /**
     * @override
     */
    public copy(): HtmlValue {
        const copy = new HtmlValue(this.tagname, this.classes, this.id, this.attributes, this.events, this.children);
        copy.set_context(this.context);
        copy.set_pos(this.pos_start, this.pos_end);
        return copy;
    }

    public toString() {
        return `[Tag ${this.tagname ?? 'Fragment'}]`;
    }
}