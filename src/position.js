/**
 * @classdesc Describes the position of the lexer while it is reading the file.
 */
export class Position {
    /**
     * @constructs Position
     * @param {number} idx The index.
     * @param {number} ln The line number.
     * @param {number} col The column number.
     * @param {string} fn The filename.
     * @param {string} ftxt The source code.
     */
    constructor(idx, ln, col, fn, ftxt) {
        this.idx = idx;
        this.ln = ln;
        this.col = col;
        this.fn = fn;
        this.ftxt = ftxt;
    }

    /**
     * Moves forward.
     * @param {string|null} current_char The current character (we need to check if this is a new line).
     * @returns {Position} this.
     */
    advance(current_char) {
        this.idx += 1;
        this.col += 1;

        if (current_char === "\n") {
            this.ln += 1;
            this.col = -1;
        }

        return this;
    }

    /**
     * A copy of that position.
     * @returns {Position}
     */
    copy() {
        return new Position(this.idx, this.ln, this.col, this.fn, this.ftxt);
    }

    toString() {
        return `${this.ln}:${this.col}, idx=${this.idx}`;
    }
}