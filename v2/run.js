import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { Interpreter } from './interpreter.js';
import { CustomError } from './Exceptions.js';
import global_symbol_table from './symbol_table.js';
import { Context } from './context.js';

/**
 * Runs the program.
 * @param {string} text The source code.
 * @param {string} filename The name of the file.
 */
export const run = (text, filename) => {
    try {
        // We generate the context here
        // because we might need it inside strings
        // Indeed, if there is "{var}", then we need to interpret that code
        // before the creation of the variable.
        // However, we want the same context everywhere
        const context = new Context('<program>'); // the context will get modified by visiting the different user's actions.
        context.symbol_table = global_symbol_table;

        const lexer = new Lexer(text, filename, context);
        const tokens = lexer.generate_tokens();

        const parser = new Parser(tokens);
        const tree = parser.parse();

        if (!tree) {
            return;
        }

        const interpreter = new Interpreter();
        const result = interpreter.visit(tree, context);

        if (result.elements.length === 1) {
            console.log(result.elements[0].toString());
        } else {
            console.log(result.toString());
        }
    } catch(e) {
        if (e instanceof CustomError) {
            console.error(e.toString());
        } else {
            console.error(e);
        }
    }
};