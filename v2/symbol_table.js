import { NativeFunction, NumberValue } from "./values.js";

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
            this.symbols.set(name, new_value);
        } else {
            var parent = this.parent;
            while (parent) {
                if (parent.symbols.has(name)) {
                    parent.symbols.set(name, new_value);
                    break;
                }
                parent = parent.parent;
            }
        }
    }

    /**
     * Creates a variable.
     * @param {string} name The name of the variable to create.
     * @param {any} value The value of that variable.
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
     * @param {any} value The value of that constant.
     */
    define_constant(name, value) {
        let table = this.getHighestParentContext();
        table.symbols.set(name, value);
    }
}

const global_symbol_table = new SymbolTable();

export const CONSTANTS = {};

// comment that if you want to execute `./test/interpreter.test.js` or `./test/maths.test.js`
// indeed, there is a glitch: apparently mocha doesn't want to us to use static properties from classes outside the classes themselves.
// Because of that, we cannot use any native function in the tests
for (let i = 0; i < Object.keys(NativeFunction.NATIVE_FUNCTIONS).length; i++) {
    let name = Object.keys(NativeFunction.NATIVE_FUNCTIONS)[i];
    global_symbol_table.set(name, new NativeFunction(name));
}

export default global_symbol_table;