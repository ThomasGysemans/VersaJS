import run from './run.js';
import prompt from 'prompt-sync';

let exit = false;
while (!exit) {
    const text = prompt()("run > ");
    if (text) {
        const { result, error } = run('<stdin>', text);

        if (error) {
            console.log(error.toString());
        } else if (result) { // there is a chance that result is null because of the if statement
            console.log(result.toString());
        }
    } else {
        exit = true;
    }
}