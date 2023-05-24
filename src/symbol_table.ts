"use strict";

import { Value } from "./values.js";

/**
 * @classdesc Keeps track of all the declared variables in our program.
 */
export class SymbolTable {
    private symbols: Map<String, Value>;
    private parent: SymbolTable | null;

    /**
     * @param parent The parent symbol table.
     */
    constructor(parent: SymbolTable | null = null) {
        this.symbols = new Map();
        // a parent symbol table (for a function for example)
        // we'll be able to remove all the variables after the execution of a function
        this.parent = parent;
    }

    /**
     * Checks if a variable already exists in the current context.
     * Therefore, it's possible to redeclare variables.
     * @param var_name The variable name.
     */
    public doesExist(var_name: string) {
        return this.symbols.has(var_name);
    }

    /**
     * Gets a variable.
     * @param name The name of a variable.
     * @returns The value with its type.
     */
    public get<T = any>(name: string): Value<T> | null {
        const value = this.symbols.has(name) ? this.symbols.get(name) as Value<T> : null;
        // we check for the parent symbol table
        if (value == null && this.parent) {
            return this.parent.get(name);
        }
        return value;
    }

    /**
     * Modifies the value of a variable.
     * @param name The name of the variable to modify.
     * @param new_value The new value of that variable.
     */
    public modify(name: string, new_value: Value) {
        // TODO: did you make sure that the this new value matches the specified type?
        if (this.symbols.has(name)) {
            // const type = this.symbols.get(name)!.type;
            this.symbols.set(name, new_value);
        } else {
            let parent = this.parent;
            while (parent) {
                if (parent.symbols.has(name)) {
                    // const type = parent.symbols.get(name)!.type;
                    parent.symbols.set(name, new_value);
                    break;
                }
                parent = parent.parent;
            }
        }
    }

    /**
     * Creates a variable.
     * @param name The name of the variable to create.
     * @param value The value of that variable.
     */
    public set(name: string, value: Value) {
        this.symbols.set(name, value);
    }

    /**
     * Removes a variable.
     * @param name The name of the variable to remove.
     */
    public remove(name: string) {
        if (this.symbols.has(name)) {
            this.symbols.delete(name);
        } else {
            let parent = this.parent;
            while (parent) {
                if (parent.symbols.has(name)) {
                    parent.symbols.delete(name);
                    break;
                }
                parent = parent.parent;
            }
        }
    }

    private getHighestParentContext(): SymbolTable | this {
        let parent = this.parent;
        if (parent) {
            while (true) {
                let next_parent: SymbolTable | null = parent!.parent;
                if (next_parent !== null) {
                    parent = next_parent;
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
     * Constants will always be in the highest parent context.
     * @param name The name.
     */
    public doesConstantExist(name: string): boolean {
        return this.getHighestParentContext().symbols.has(name);
    }

    /**
     * Creates a constant.
     * @param name The name of the constant to create.
     * @param value The value of that constant.
     */
    public define_constant(name: string, value: Value) {
        const table = this.getHighestParentContext();
        table.symbols.set(name, value);
    }

    /**
     * Clears all variables of the current context.
     */
    public clear() {
        this.symbols.clear();
    }
}

const global_symbol_table = new SymbolTable();

export const CONSTANTS: { [key: string]: Value } = {};

export default global_symbol_table;
