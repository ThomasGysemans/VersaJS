"use strict";

import global_symbol_table, { SymbolTable } from "./symbol_table.js";
import { init_native_values } from "./native.js";
import Position from "./position.js";

/**
 * @classdesc Creates a context to keep track of the user's actions.
 */
export default class Context {
    public readonly display_name: string;
    public readonly parent: Context | null;
    public readonly parent_entry_pos: Position | null;
    public symbol_table: SymbolTable | null;

    /**
     * @param display_name The name of the context (the name of the function where an error has occured for example).
     * @param parent The parent context of the current context.
     * @param parent_entry_pos The position in the code where the paren context has been created.
     */
    constructor(display_name: string, parent: Context | null = null, parent_entry_pos: Position | null = null) {
        this.display_name = display_name;
        this.parent = parent;
        this.parent_entry_pos = parent_entry_pos;
        this.symbol_table = null;
    }

    /**
     * Checks if the current context is contained in another one.
     * @param context_name The name of the context we are searching for.
     * @returns True if the current context has a parent context of that name, or if the given name is the current context itself.
     */
    public is_context_in(context_name: string): boolean {
        if (this.display_name === context_name) return true;
        let parent = this.parent;
        if (parent) {
            while (parent) {
                if (parent.display_name === context_name) {
                    return true;
                }
                parent = parent.parent;
            }
        }
        return false;
    }
}

export function init_global_context(custom_name: string = "<program>"): Context {
    const context = new Context(custom_name);
    context.symbol_table = global_symbol_table;
    init_native_values(context);
    return context;
}