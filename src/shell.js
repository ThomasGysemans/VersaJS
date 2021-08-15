"use strict";

import prompt from 'prompt-sync';
import { run } from './run.js';
import { ListValue } from './values.js';

while (true) {
    const text = prompt({sigint: false})("run > ");
    if (text === null) {
        // if the user uses the shortcut Ctrl + C
        const want_to_exit = prompt({sigint: false})("Do you want to exit the program ? (Y|N) ");
        // if want_to_exit is null, that means that the user uses the shortcut Ctrl + C again
        if (want_to_exit) {
            if (want_to_exit.toUpperCase() === "Y") {
                break;
            }
        } else {
            break;
        }
    } else {
        if (text.trim()) {
            const result = run(text, "<stdin>");
            if (result) {
                if (result.value.elements.length === 1) {
                    let first_element = result.value.elements[0];
                    if (first_element.repr !== undefined && !(first_element instanceof ListValue)) {
                        console.log(first_element.repr());
                    } else {
                        console.log(first_element.toString());
                    }
                } else {
                    console.log(result.value.toString());
                }
            }
        }
    }
}