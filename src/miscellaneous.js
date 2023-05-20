"use strict";

import { Position } from "./position.js";

/**
 * Draws a line of arrows below an error in the shell.
 * @param {string} text The source code.
 * @param {Position} pos_start The starting position of the error.
 * @param {Position} pos_end The end position of the error.
 */
export function string_with_arrows(text, pos_start, pos_end) {
    let result = '';

    // Calculate the indices
    let index_start = Math.max(text.substring(0, pos_start.idx).lastIndexOf('\n'), 0);
    let index_end = text.indexOf('\n', index_start + 1);
    if (index_end < 0) index_end = text.length;

    // Generate each line
    let line_count = pos_end.ln - pos_start.ln + 1;
    for (let i = 0; i < line_count; i++) {
        // Calculate line columns
        let line = text.substring(index_start, index_end);
        let col_start = i === 0 ? pos_start.col : 0;
        let col_end = i === line_count - 1 ? pos_end.col : line.length - 1;
        let n = col_end - col_start;

        // Append to result
        result += line + '\n';
        result += ' '.repeat(col_start) + '^'.repeat(n > 0 ? n : 1);

        // Re-calculate indices
        index_start = index_end;
        index_end = text.indexOf('\n', index_start + 1);
        if (index_end < 0) index_end = text.length;
    }

    return result.replace(/\\\t/gm, '');
}

/**
 * Checks if the value is in the list.
 * @param {string} value The value.
 * @param {Array|string} list The list.
 */
export function is_in(value, list) {
    if (typeof list === "string") {
        list = Array.from(list);
    }

    for (let list_value of list) {
        if (list_value === value) {
            return true;
        }
    }

    return false;
}