import prompt from 'prompt-sync';
import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { Interpreter } from './interpreter.js';

while (true) {
    const text = prompt()("run > ");
    if (text === null) {
        // if the user uses the shortcut Ctrl + C
        const want_to_exit = prompt()("Do you want to exit the program ? (Y|N) ");
        // if want_to_exit is null, that means that the user uses the shortcut Ctrl + C again
        if (want_to_exit) {
            if (want_to_exit.toUpperCase() === "Y") {
                break;
            } else {
                continue;
            }
        } else {
            break;
        }
    } else {
        // console.log(Array.from(tokens).map((v) => v.toString()));

        if (text.trim()) {
            try {
                const lexer = new Lexer(text);
                const tokens = lexer.generate_tokens();

                const parser = new Parser(tokens);
                const tree = parser.parse();

                if (!tree) {
                    continue;
                }

                const interpreter = new Interpreter();
                const result = interpreter.visit(tree);

                console.log(result.toString());
            } catch(e) {
                console.log(e);
            }
        } else {
            continue;
        }
    }
}