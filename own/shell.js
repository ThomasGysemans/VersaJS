import run from './run.js';
import prompt from 'prompt-sync';

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
            const { result, error } = run('<stdin>', text);

            if (error) {
                console.log(error.toString());
            } else if (result) { // there is a chance that result is null because of the if statement
                // an element per line (per statement* because we can use ';')
                if (result.elements.length === 1) {
                    console.log(result.elements[0].toString());
                } else {
                    console.log(result.toString());
                }
            }
        } else {
            continue;
        }
    }
}