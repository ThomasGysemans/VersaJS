import prompt from 'prompt-sync';
import { Lexer } from './lexer.js';

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
        if (text.trim()) {
            const lexer = new Lexer(text);
            const tokens = lexer.generate_tokens();
            console.log(Array.from(tokens).map((v) => v.toString()));
        } else {
            continue;
        }
    }
}