import { Token, TokenType } from './tokens.js';
import { is_in } from './miscellaneous.js';

const WHITESPACE = " \r\n\t";
const DIGITS     = "0123456789";

/**
 * @classdesc Reads the code and creates the tokens.
 */
export class Lexer {
    /**
     * @constructs Lexer
     * @param {string} text The source code.
     */
    constructor(text) {
        this.text = text[Symbol.iterator]();
        this.advance();
    }

    advance() {
        let iterator = this.text.next();
        /** @type {string|null} */
        this.current_char = iterator.done ? null : iterator.value;
    }

    /**
     * Generates the tokens.
     */
    * generate_tokens() {
        while (this.current_char !== null) {
            if (is_in(this.current_char, WHITESPACE)) {
                this.advance();
            } else if (this.current_char === "." || is_in(this.current_char, DIGITS)) {
                yield this.generate_number();
            } else if (this.current_char === "+") {
                this.advance();
                yield new Token(TokenType.PLUS);
            } else if (this.current_char === "-") {
                this.advance();
                yield new Token(TokenType.MINUS);
            } else if (this.current_char === "*") {
                this.advance();
                yield new Token(TokenType.MULTIPLY);
            } else if (this.current_char === "/") {
                this.advance();
                yield new Token(TokenType.DIVIDE);
            } else if (this.current_char === "(") {
                this.advance();
                yield new Token(TokenType.LPAREN);
            } else if (this.current_char === ")") {
                this.advance();
                yield new Token(TokenType.RPAREN);
            } else {
                throw new Error(`Illegal Character '${this.current_char}'`);
            }
        }
    }

    /**
     * Generates a number when the `generate_tokens` method has found a digit or a decimal point.
     * @returns {Token}
     */
    generate_number() {
        let number_str = this.current_char;
        let decimal_point_count = 0;
        this.advance();
        
        while (this.current_char !== null && is_in(this.current_char, DIGITS + ".")) {
            if (this.current_char === ".") {
                decimal_point_count += 1;
                if (decimal_point_count > 1) {
                    break;
                }
            }

            number_str += this.current_char;
            this.advance();
        }

        if (number_str.startsWith('.')) {
            number_str = '0' + number_str;
        } else if (number_str.endsWith('.')) {
            number_str += '0';
        }

        let is_int = number_str.indexOf('.') === -1;
        return new Token(TokenType.NUMBER, is_int ? parseInt(number_str, 10) : parseFloat(number_str));
    }
}