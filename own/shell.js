import run from './run.js';
import prompt from 'prompt-sync';

let exit = false;
while (!exit) {
    const text = prompt()("run > ");
    if (text) {
        const { result, error } = run('<stdin>', text);

        if (error) {
            console.log(error.toString());
        } else {
            console.log(result.toString());
        }
    } else {
        exit = true;
    }
}