import { Token, TokenType } from './tokens.js';
import { Position } from './position.js';
import { is_in } from './miscellaneous.js';
import { IllegalCharError } from './Exceptions.js';

const WHITESPACE = " \r\n\t";
const DIGITS     = "0123456789_"; // we want to allow 100_000 === 100000

/**
 * @classdesc Reads the code and creates the tokens.
 */
export class Lexer {
    /**
     * @constructs Lexer
     * @param {string} text The source code.
     * @param {string} filename The filename.
     */
    constructor(text, filename="<stdin>") {
        this.text = text[Symbol.iterator]();
        this.pos = new Position(-1, 0, -1, filename, text);
        this.advance();
    }

    advance() {
        let iterator = this.text.next();
        /** @type {string|null} */
        this.current_char = iterator.done ? null : iterator.value;
        this.pos.advance(this.current_char);
    }

    /**
     * Generates the tokens.
     */
    * generate_tokens() {
        while (this.current_char !== null) {
            if (is_in(this.current_char, WHITESPACE)) {
                this.advance();
            } else if (this.current_char === "." || is_in(this.current_char, DIGITS)) {
                yield this.make_number();
            } else if (this.current_char === "+") {
                this.advance();
                yield new Token(TokenType.PLUS, null, this.pos);
            } else if (this.current_char === "-") {
                this.advance();
                yield new Token(TokenType.MINUS, null, this.pos);
            } else if (this.current_char === "*") {
                this.advance();
                yield new Token(TokenType.MULTIPLY, null, this.pos);
            } else if (this.current_char === "/") {
                this.advance();
                yield new Token(TokenType.DIVIDE, null, this.pos);
            } else if (this.current_char === "^") {
                this.advance();
                yield new Token(TokenType.POWER, null, this.pos);
            } else if (this.current_char === "%") {
                this.advance();
                yield new Token(TokenType.MODULO, null, this.pos);
            } else if (this.current_char === "(") {
                this.advance();
                yield new Token(TokenType.LPAREN, null, this.pos);
            } else if (this.current_char === ")") {
                this.advance();
                yield new Token(TokenType.RPAREN, null, this.pos);
            } else {
                let char = this.current_char;
                let pos_start = this.pos.copy();
                this.advance();
                throw new IllegalCharError(pos_start, this.pos, `'${char}'`);
            }
        }

        yield new Token(TokenType.EOF, null, this.pos);
    }

    /**
     * Builds a number when the `generate_tokens` method has found a digit or a decimal point.
     * @returns {Token}
     */
    make_number() {
        let pos_start = this.pos.copy();
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

        number_str = number_str.replace(/_/g, "");
        let is_int = number_str.indexOf('.') === -1;
        return new Token(TokenType.NUMBER, is_int ? parseInt(number_str, 10) : parseFloat(number_str), pos_start, this.pos);
    }
}