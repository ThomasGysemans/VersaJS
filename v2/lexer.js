import KEYWORDS, { Token, TokenType } from './tokens.js';
import { Position } from './position.js';
import { is_in } from './miscellaneous.js';
import { ExpectedCharError, IllegalCharError } from './Exceptions.js';

const WHITESPACE     = " \r\n\t";
const DIGITS         = "0123456789_"; // we want to allow 100_000 === 100000
const LETTERS        = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LETTERS_DIGITS = LETTERS + DIGITS;

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
            } else if (is_in(this.current_char, LETTERS + "_")) { // has to be before digits
                yield this.make_identifier();
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
            } else if (this.current_char === "=") {
                yield this.make_equal();
            } else if (this.current_char === "!") {
                yield this.make_not_equal();
            } else if (this.current_char === "<") {
                yield this.make_less_than_or_equal();
            } else if (this.current_char === ">") {
                yield this.make_greater_than_or_equal();
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

    make_identifier() {
        let pos_start = this.pos.copy();
        let identifier = this.current_char;
        this.advance();

        while (this.current_char !== null && is_in(this.current_char, LETTERS_DIGITS + "_")) {
            identifier += this.current_char;
            this.advance();
        }

        var is_keyword = is_in(identifier, KEYWORDS);
        var token_type = is_keyword ? TokenType.KEYWORD : TokenType.IDENTIFIER
        return new Token(token_type, identifier, pos_start, this.pos);
    }

    make_equal() {
        let pos_start = this.pos.copy();
        let tok_type = TokenType.EQUALS;
        this.advance();

        if (this.current_char === "=") {
            tok_type = TokenType.DOUBLE_EQUALS;
            this.advance();
        }

        return new Token(tok_type, null, pos_start, this.pos);
    }

    make_not_equal() {
        let pos_start = this.pos.copy();
        this.advance();

        if (this.current_char === "=") {
            this.advance();
            return new Token(TokenType.NOT_EQUAL, null, pos_start, this.pos);
        }

        this.advance();
        throw new ExpectedCharError(
            pos_start, this.pos,
            "'=' after '!'"
        );
    }

    make_less_than_or_equal() {
        let pos_start = this.pos.copy();
        let tok_type = TokenType.LT;
        this.advance();

        if (this.current_char === "=") {
            this.advance();
            tok_type = TokenType.LTE;
        }

        return new Token(tok_type, null, pos_start, this.pos);
    }

    make_greater_than_or_equal() {
        let pos_start = this.pos.copy();
        let tok_type = TokenType.GT;
        this.advance();

        if (this.current_char === "=") {
            this.advance();
            tok_type = TokenType.GTE;
        }

        return new Token(tok_type, null, pos_start, this.pos);
    }
}