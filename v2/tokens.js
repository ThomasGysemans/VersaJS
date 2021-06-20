import { Position } from "./position.js";

export class TokenType {
    static NUMBER      = 'NUMBER'
    static PLUS        = 'PLUS'
    static MINUS       = 'MINUS'
    static MULTIPLY    = 'MULTIPLY'
    static DIVIDE      = 'DIVIDE'
    static POWER       = 'POWER'
    static MODULO      = 'MODULO'
    static LPAREN      = 'LPAREN'
    static RPAREN      = 'RPAREN'
    static IDENTIFIER  = 'IDENTIFIER'
    static KEYWORD     = 'KEYWORD'
    static EQUALS      = 'EQUALS'
    static EOF         = 'EOF'
}

const KEYWORDS = [
    "var",
    "and",
    "or",
    "not"
];

export default KEYWORDS;

/**
 * @classdesc Describes what a token is.
 */
export class Token {
    /**
     * @constructs Token
     * @param {string} type The type of token.
     * @param {any} value The value of the token.
     * @param {Position} pos_start The starting position of the token in the code.
     * @param {Position} pos_end The end position of the token in our code.
     */
    constructor(type, value=null, pos_start=null, pos_end=null) {
        this.type = type;
        this.value = value;

        if (pos_start) {
            this.pos_start = pos_start.copy();
            this.pos_end = pos_end ? pos_end.copy() : pos_start.copy();
        }
    }

    /**
     * Checks if a the type and the value of a token correspond.
     * @param {string} type The type of token (TOKENS.KEYWORD for example).
     * @param {string} value The value that has to correspond.
     * @returns {boolean} `true` if the type & value of a token correspond with `type` and `value`.
     */
    matches(type, value) {
        return this.type === type && this.value === value;
    }

    toString() {
        return this.type + (this.value !== null ? `:${this.value}` : '');
    }
}