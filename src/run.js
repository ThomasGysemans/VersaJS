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
 * @param {Context|null} context A custom context used only in tests.
 */
export const run = (text, filename, context=null) => {
    try {
        // the context will get modified by visiting the different user's actions.
        if (!context) {
            context = new Context('<program>'); 
            context.symbol_table = global_symbol_table;
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
            console.error(e);
        }
    }
};