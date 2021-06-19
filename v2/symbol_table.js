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
     * Gets a variable.
     * @param {string} name The name of a variable.
     */
    get(name) {
        let value = this.symbols.has(name) ? this.symbols.get(name) : null;
        // we check for the parent symbol table
        if (value === null && this.parent) {
            return this.parent.get(name);
        }
        return value;
    }

    /**
     * Modifies the value of a variable.
     * @param {string} name The name of the variable to modify.
     * @param {any} value The new value of that variable.
     */
    set(name, value) {
        this.symbols.set(name, value);
    }

    /**
     * Removes a variable.
     * @param {string} name The name of the variable to remove.
     */
    remove(name) {
        this.symbols.delete(name);
    }
}

const global_symbol_table = new SymbolTable();
export default global_symbol_table;