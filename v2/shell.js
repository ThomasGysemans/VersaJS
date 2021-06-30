import prompt from 'prompt-sync';
import { run } from './run.js';

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
            run(text, "<stdin>");
        } else {
            continue;
        }
    }
}