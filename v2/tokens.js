export class TokenType {
    static NUMBER   = 'NUMBER'
    static PLUS     = 'PLUS'
    static MINUS    = 'MINUS'
    static MULTIPLY = 'MULTIPLY'
    static DIVIDE   = 'DIVIDE'
    static LPAREN   = 'LPAREN'
    static RPAREN   = 'RPAREN'
}

/**
 * @classdesc Describes what a token is.
 */
export class Token {
    /**
     * @constructs Token
     * @param {string} type The type of token.
     * @param {any} value The value of the token.
     */
    constructor(type, value=null) {
        this.type = type;
        this.value = value;
    }

    toString() {
        return this.type + (this.value !== null ? `:${this.value}` : '');
    }
}