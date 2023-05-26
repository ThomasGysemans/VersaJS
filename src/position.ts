"use strict";

/**
 * @classdesc Describes the position of the lexer while it is reading the file.
 */
export default class Position {
    public idx: number;
    public ln: number;
    public col: number;
    public fn: string;

    /**
     * @param idx The index.
     * @param ln The line number.
     * @param col The column number.
     * @param fn The filename.
     */
    constructor(idx: number, ln: number, col: number, fn: string) {
        this.idx = idx;
        this.ln = ln;
        this.col = col;
        this.fn = fn;
    }

    /**
     * Moves forward.
     * @param current_char The current character (we need to check if this is a new line).
     * @returns
     */
    public advance(current_char: string | null): this {
        this.idx += 1;
        this.col += 1;

        if (current_char === "\n") {
            this.ln += 1;
            this.col = -1;
        }

        return this;
    }

    /**
     * Creates a copy of this particular position.
     */
    public copy(): Position {
        return new Position(this.idx, this.ln, this.col, this.fn);
    }

    public toString(): String {
        return `${this.ln}:${this.col}, idx=${this.idx}`;
    }
}

/**
 * Gets a position to be given as default value.
 * This position shall always be overwritten.
 * @returns An instance of Position
 */
export function getDefaultPos() {
    return new Position(0, 0, 0, "<hidden>");
}