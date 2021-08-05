import { NATIVE_CLASSES, NATIVE_FUNCTIONS } from "./native.js";
import { Types } from "./tokens.js";
import { NativeClassValue, NativeFunction, NativePropertyValue } from "./values.js";

/**
 * @classdesc Keeps track of all the declared variables in our program.
 */
export class SymbolTable {
    /**
     * @constructs SymbolTable
     * @param {SymbolTable|null} parent The parent symbol table.
     */
    constructor(parent=null) {
        this.symbols = new Map();
        // a parent symbol table (for a function for example)
        // we'll be able to remove all the variables after the execution of a function
        this.parent = parent;
    }

    /**
     * Checks if a variable already exists in the current context.
     * Therefore, it's possible to redeclare variables.
     * @param {string} var_name The variable name.
     */
    doesExist(var_name) {
        return this.symbols.has(var_name);
    }

    /**
     * Gets a variable.
     * @param {string} name The name of a variable.
     * @returns {{type: Types, value: any}|null}
     */
    get(name) {
        let value = this.symbols.has(name) ? this.symbols.get(name) : null;
        // we check for the parent symbol table
        if ((value === null || value === undefined) && this.parent) {
            return this.parent.get(name);
        }
        return value;
    }

    /**
     * Modifies the value of a variable.
     * @param {string} name The name of the variable to modify.
     * @param {any} new_value The new value of that variable.
     */
    modify(name, new_value) {
        if (this.symbols.has(name)) {
            let type = this.symbols.get(name).type;
            this.symbols.set(name, { type, value: new_value });
        } else {
            var parent = this.parent;
            while (parent) {
                if (parent.symbols.has(name)) {
                    let type = parent.symbols.get(name).type;
                    parent.symbols.set(name, { type, value: new_value });
                    break;
                }
                parent = parent.parent;
            }
        }
    }

    /**
     * Creates a variable.
     * @param {string} name The name of the variable to create.
     * @param {{type: Types, value: any}} value The value of that variable.
     */
    set(name, value) {
        this.symbols.set(name, value);
    }

    /**
     * Removes a variable.
     * @param {string} name The name of the variable to remove.
     */
    remove(name) {
        if (this.symbols.has(name)) {
            this.symbols.delete(name);
        } else {
            var parent = this.parent;
            while (parent) {
                if (parent.symbols.has(name)) {
                    parent.symbols.delete(name);
                    break;
                }
                parent = parent.parent;
            }
        }
    }

    getHighestParentContext() {
        let parent = this.parent;
        if (parent) {
            while (true) {
                let next_parent = parent.parent;
                
                if (next_parent) {
                    parent = parent.parent;
                } else {
                    break;
                }
            }
            return parent;
        } else {
            return this;
        }
    }

    /**
     * Checks if a constant exists.
     * @param {string} name The name.
     */
    doesConstantExist(name) {
        let table = this.getHighestParentContext();
        return table.symbols.has(name);
    }

    /**
     * Creates a constant.
     * @param {string} name The name of the constant to create.
     * @param {{type: Types, value: any}} value The value of that constant.
     */
    define_constant(name, value) {
        let table = this.getHighestParentContext();
        table.symbols.set(name, { type: value.type, value: value.value });
    }

    clear() {
        this.symbols.clear();
    }
}

const global_symbol_table = new SymbolTable();

export const CONSTANTS = {};

for (let i = 0; i < Object.keys(NATIVE_FUNCTIONS).length; i++) {
    let name = Object.keys(NATIVE_FUNCTIONS)[i];
    global_symbol_table.set(name, { type: Types.FUNCTION, value: new NativeFunction(name) });
}

for (let i = 0; i < Object.keys(NATIVE_CLASSES).length; i++) {
    let native = Object.values(NATIVE_CLASSES)[i];
    let name = native.name;
    let self = new Map(native.properties.map((v) => [v.name, {
        status: v.status,
        static_prop: v.static_prop,
        value: {
            type: v.type,
            value: new NativePropertyValue(
                v.name,
                v.nature,
                name,
                v.status,
                v.static_prop,
                v.value.behavior,
                v.value.args,
            )
        }
    }]));
    global_symbol_table.set(name, { type: name, value: new NativeClassValue(name, self, null) });
}

export default global_symbol_table;