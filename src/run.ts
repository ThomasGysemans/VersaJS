"use strict";

import type RuntimeResult from './runtime.js';
import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { Interpreter } from './interpreter.js';
import { CustomError } from './Exceptions.js';
import Context, { init_global_context } from './context.js';

/**
 * Runs the program.
 * @param text The source code.
 * @param filename The name of the file.
 * @param context A custom context used only in tests.
 */
export const run = (text: string, filename: string, context: Context | null = null): RuntimeResult | undefined => {
    try {
        // the main context will get modified by visiting the different user's actions.
        if (!context) {
            context = init_global_context();
        }

        const lexer = new Lexer(text, filename);
        const tokens = lexer.generate_tokens();

        const parser = new Parser(tokens);
        const tree = parser.parse();

        // console.log(`tree = ${tree}`);

        if (!tree) {
            return;
        }

        const interpreter = new Interpreter();
        const result = interpreter.visit(tree, context);

        return result;
    } catch(e) {
        if (e instanceof CustomError) {
            console.error(e.toString());
        } else {
            console.error((e as Error).message);
        }
    }
};