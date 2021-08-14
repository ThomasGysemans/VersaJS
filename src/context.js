"use strict";

import { Position } from "./position.js";
import { SymbolTable } from "./symbol_table.js";

/**
 * @classdesc Creates a context to keep track of the user's actions.
 */
export class Context {
    /**
     * @constructs Context
     * @param {string} display_name The name of the context (the name of the function where an error has occured for example).
     * @param {Context} parent The parent context of the current context.
     * @param {Position} parent_entry_pos The position in the code where the paren context has been created.
     */
    constructor(display_name, parent=null, parent_entry_pos=null) {
        this.display_name = display_name;
        this.parent = parent;
        this.parent_entry_pos = parent_entry_pos;
        /** @type {SymbolTable|null} */
        this.symbol_table = null;
    }

    /**
     * Checks if the current context is contained in another one.
     * @param {string} context_name The name of the context we are searching for.
     * @returns {boolean}
     */
    is_context_in(context_name) {
        if (this.display_name === context_name) return true;
        let parent = this.parent;
        if (parent) {
            while (parent) {
                if (parent.display_name === context_name) {
                    return true;
                }
                parent = parent.parent;
            }
            return false;
        } else {
            return this.display_name === context_name;
        }
    }
}