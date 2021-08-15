"use strict";

import KEYWORDS, { Token, TokenType } from './tokens.js';
import { Position } from './position.js';
import { is_in } from './miscellaneous.js';
import { ExpectedCharError, IllegalCharError } from './Exceptions.js';

export const SPACES_FOR_INDENTATION = 4;
export const DIGITS                 = "0123456789_"; // we want to allow 100_000 === 100000
export const LETTERS                = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const LETTERS_DIGITS         = LETTERS + DIGITS;
export const ESCAPE_CHARACTERS      = new Map([['n', '\n'], ['t', '\t'], ['r', '\r']]);

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
        this.filename = filename;
        this.pos = new Position(-1, 0, -1, filename, text);
        this.wait_of_chevron = false; // true when we detect a left chevron
        this.pause_in_chevron_search = false; // if we detect '{' while `wait_for_chevron` is true
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
            if (this.current_char === " ") {
                let pos_start = this.pos.copy();
                let count = 0;
                
                while (this.current_char === " ") {
                    count++;
                    this.advance();
                    if (count === SPACES_FOR_INDENTATION) {
                        yield new Token(TokenType.INDENTATION, "\t", pos_start);
                        break;
                    }
                }
            } else if (this.current_char === "\t") {
                let pos = this.pos.copy();
                this.advance();
                yield new Token(TokenType.INDENTATION, "\t", pos);
            } else if (this.current_char === "\n" || this.current_char === "\r") {
                let pos_start = this.pos.copy();
                if (this.current_char === "\r") {
                    this.advance(); // a newline can be sometimes : '\r\n'
                }
                this.advance();
                yield new Token(TokenType.NEWLINE, "\n", pos_start);
            } else if (this.current_char === ";") {
                let pos = this.pos.copy();
                this.advance();
                yield new Token(TokenType.SEMICOLON, ";", pos);
            } else if (is_in(this.current_char, LETTERS + "_")) { // has to be before digits
                yield this.make_identifier();
            } else if (this.current_char === "." || is_in(this.current_char, DIGITS)) {
                yield this.make_number();
            } else if (this.current_char === "+") {
                yield this.make_plus_or_increment();
            } else if (this.current_char === "-") {
                yield this.make_minus_decrement_or_arrow();
            } else if (this.current_char === "*") {
                yield this.make_mul_or_power();
            } else if (this.current_char === "/") {
                let pos = this.pos.copy();
                this.advance();
                yield new Token(TokenType.SLASH, "/", pos);
            } else if (this.current_char === "%") {
                let pos = this.pos.copy();
                this.advance();
                yield new Token(TokenType.MODULO, "%", pos);
            } else if (this.current_char === "(") {
                let pos = this.pos.copy();
                this.advance();
                yield new Token(TokenType.LPAREN, "(", pos);
            } else if (this.current_char === ")") {
                let pos = this.pos.copy();
                this.advance();
                yield new Token(TokenType.RPAREN, ")", pos);
            } else if (this.current_char === "=") {
                yield this.make_doublearrow_or_equal();
            } else if (this.current_char === "!") {
                yield this.make_not_equal();
            } else if (this.current_char === "<") {
                yield this.make_less_than_or_equal_or_binary();
            } else if (this.current_char === ">") {
                if (this.wait_of_chevron && !this.pause_in_chevron_search) {
                    let pos = this.pos.copy();
                    this.wait_of_chevron = false;
                    this.advance();
                    yield new Token(TokenType.RCHEVRON, ">", pos);
                } else {
                    yield this.make_greater_than_or_equal_or_binary();
                }
            } else if (this.current_char === "?") {
                yield* this.make_qmark_or_nullish_or_ocp();
            } else if (this.current_char === "'") {
                yield this.make_string();
            } else if (this.current_char === '"') {
                yield this.make_string();
            } else if (this.current_char === '`') {
                yield this.make_string();
            } else if (this.current_char === ":") {
                yield this.make_colon_or_doublecolon();
            } else if (this.current_char === "[") {
                let pos = this.pos.copy();
                this.advance();
                yield new Token(TokenType.LSQUARE, "[", pos);
            } else if (this.current_char === "]") {
                let pos = this.pos.copy();
                this.advance();
                yield new Token(TokenType.RSQUARE, "]", pos);
            } else if (this.current_char === "{") {
                let pos = this.pos.copy();
                this.advance();
                if (this.wait_of_chevron) {
                    this.pause_in_chevron_search = true;
                }
                yield new Token(TokenType.LBRACK, "{", pos);
            } else if (this.current_char === "}") {
                let pos = this.pos.copy();
                this.advance();
                if (this.wait_of_chevron) {
                    this.pause_in_chevron_search = false;
                }
                yield new Token(TokenType.RBRACK, "}", pos);
            } else if (this.current_char === ",") {
                let pos = this.pos.copy();
                this.advance();
                yield new Token(TokenType.COMMA, ",", pos);
            } else if (this.current_char === "&") {
                yield this.make_and();
            } else if (this.current_char === "|") {
                yield this.make_or();
            } else if (this.current_char === "^") {
                let pos = this.pos.copy();
                this.advance();
                yield new Token(TokenType.LOGICAL_XOR, "^", pos);
            } else if (this.current_char === "~") {
                let pos = this.pos.copy();
                this.advance();
                yield new Token(TokenType.BIN_NOT, "~", pos);
            } else if (this.current_char === "@") {
                let pos = this.pos.copy();
                this.advance();
                yield new Token(TokenType.ARROBASE, "@", pos);
            } else if (this.current_char === "#") {
                let pos = this.pos.copy();
                this.advance();
                if (this.current_char === " ") {
                    this.skip_comment(); // a comment has to be followed by a whitespace
                } else {
                    yield new Token(TokenType.HASH, "#", pos); // otherwise it's an "hash"
                }
            } else {
                let char = this.current_char;
                let pos_start = this.pos.copy();
                this.advance();
                throw new IllegalCharError(pos_start, this.pos, `'${char}'`);
            }
        }

        yield new Token(TokenType.EOF, "EOF", this.pos);
    }

    /**
     * Builds a number when the `generate_tokens` method has found a digit or a decimal point.
     * @returns {Token}
     */
    make_number() {
        let pos_start = this.pos.copy();
        let number_str = this.current_char;
        let decimal_point_count = 0;
        let is_beginning_with_a_dot = this.current_char === ".";
        this.advance();

        // handles console.log (the dot)
        // and triple dots: '...'
        // i.e. if there is one dot or three dots, there cannot be two dots.
        if (is_beginning_with_a_dot && this.current_char === ".") {
            this.advance();
            if (this.current_char === ".") {
                this.advance();
                return new Token(TokenType.TRIPLE_DOTS, "...", pos_start, this.pos);
            } else {
                throw new ExpectedCharError(
                    pos_start, this.pos,
                    "Expected one more point ('...')"
                )
            }
        } else if (is_beginning_with_a_dot && !is_in(this.current_char, DIGITS.replace('_', ''))) {
            return new Token(TokenType.DOT, ".", pos_start);
        }
        
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

    make_doublearrow_or_equal() {
        let pos_start = this.pos.copy();
        let tok_type = TokenType.EQUALS;
        let value = "=";
        this.advance();

        if (this.current_char === "=") {
            tok_type = TokenType.DOUBLE_EQUALS;
            value = "==";
            this.advance();
        } else if (this.current_char === ">") {
            tok_type = TokenType.DOUBLE_ARROW;
            value = "=>";
            this.advance();
        }

        return new Token(tok_type, value, pos_start, this.pos);
    }

    make_not_equal() {
        let pos_start = this.pos.copy();
        this.advance();

        if (this.current_char === "=") {
            this.advance();
            return new Token(TokenType.NOT_EQUAL, "!=", pos_start, this.pos);
        }

        throw new ExpectedCharError(
            pos_start, this.pos,
            "'=' after '!'"
        );
    }

    make_less_than_or_equal_or_binary() {
        let pos_start = this.pos.copy();
        let tok_type = TokenType.LT;
        let value = "<";
        this.advance();

        if (this.current_char === "=") { // <=
            this.advance();
            tok_type = TokenType.LTE;
            value = "<=";
        } else if (this.current_char === "<") { // <<
            this.advance();
            tok_type = TokenType.BINARY_LEFT;
            value = "<<";
        } else if (is_in(this.current_char, LETTERS) || this.current_char === "/" || this.current_char === ">") { // <a or <> or </
            // we don't advance
            tok_type = TokenType.LCHEVRON;
            value = "<";
            this.wait_of_chevron = true;
        }

        return new Token(tok_type, value, pos_start, this.pos);
    }

    make_greater_than_or_equal_or_binary() {
        let pos_start = this.pos.copy();
        let tok_type = TokenType.GT;
        let value = ">";
        this.advance();

        if (this.current_char === "=") { // >=
            this.advance();
            tok_type = TokenType.GTE;
            value = ">=";
        } else if (this.current_char === ">") { // >>
            this.advance();
            tok_type = TokenType.BINARY_RIGHT;
            value = ">>";
            if (this.current_char === ">") { // >>>
                this.advance();
                tok_type = TokenType.BINARY_UNSIGNED_RIGHT;
                value = ">>>";
            }
        }

        return new Token(tok_type, value, pos_start, this.pos);
    }

    // much more complex than expected
    // because I forgot that '?:' could be used with optional argument and a specified type on function declaration
    * make_qmark_or_nullish_or_ocp() {
        let pos_start = this.pos.copy();
        let tok_type = TokenType.QMARK;
        let value = "?";
        this.advance();

        // we want "??", or "?." or "?::" (OR "?" & ":" for optional argument & specified type on function declaration)
        if (this.current_char === "?") {
            this.advance();
            tok_type = TokenType.NULLISH_OPERATOR;
            value = "??";
        } else if (this.current_char === ".") {
            this.advance();
            tok_type = TokenType.OPTIONAL_CHAINING_OPERATOR;
            value = "?.";
        } else if (this.current_char === ":") {
            let colon_pos_start = this.pos.copy();
            this.advance();
            if (this.current_char === ":") {
                this.advance();
                tok_type = TokenType.OPTIONAL_STATIC_CALL;
                value = "?::";
            } else {
                yield new Token(TokenType.QMARK, "?", pos_start, colon_pos_start);
                yield new Token(TokenType.COLON, ":", colon_pos_start, this.pos);
                return;
            }
        }

        yield new Token(tok_type, value, pos_start, this.pos);
    }

    make_string() {
        let string = "";
        let pos_start = this.pos.copy();
        let escape_character = false; // do we have to escape the following character?
        let opening_quote = this.current_char; // ', " or `
        this.advance();

        // if we have to escape a character,
        // even if we have a '"',
        // we don't stop the loop
        while (this.current_char !== null && (this.current_char !== opening_quote || escape_character)) {
            if (escape_character) {
                string += ESCAPE_CHARACTERS.has(this.current_char) ? ESCAPE_CHARACTERS.get(this.current_char) : this.current_char;
                escape_character = false;
            } else {
                if (this.current_char === '\\') {
                    escape_character = true;
                } else {
                    string += this.current_char;
                }
            }
            this.advance();
        }

        // end of the string
        this.advance();
        return new Token(TokenType.STRING, string, pos_start, this.pos);
    }

    make_minus_decrement_or_arrow() {
        let pos_start = this.pos.copy();
        let tok_type = TokenType.MINUS;
        let value = "-";
        this.advance();

        if (this.current_char === ">") {
            this.advance();
            tok_type = TokenType.ARROW;
            value = "->";
        } else if (this.current_char === "-") {
            this.advance();
            tok_type = TokenType.DEC;
            value = "--";
        }

        return new Token(tok_type, value, pos_start, this.pos);
    }

    make_plus_or_increment() {
        let pos_start = this.pos.copy();
        let tok_type = TokenType.PLUS;
        let value = "+";
        this.advance();

        if (this.current_char === "+") {
            this.advance();
            tok_type = TokenType.INC;
            value = "++";
        }

        return new Token(tok_type, value, pos_start, this.pos);
    }

    make_colon_or_doublecolon() {
        let pos_start = this.pos.copy();
        let tok_type = TokenType.COLON;
        let value = ":";
        this.advance();

        if (this.current_char === ":") {
            this.advance();
            tok_type = TokenType.DOUBLE_COLON;
            value = "::";
        }

        return new Token(tok_type, value, pos_start, this.pos);
    }

    make_mul_or_power() {
        let pos_start = this.pos.copy();
        let tok_type = TokenType.MULTIPLY;
        let value = "*";
        this.advance();

        if (this.current_char === "*") {
            this.advance();
            tok_type = TokenType.POWER;
            value = "**";
        }

        return new Token(tok_type, value, pos_start, this.pos);
    }

    make_or() {
        let pos_start = this.pos.copy();
        let tok_type = TokenType.LOGICAL_OR;
        let value = "|";
        this.advance();

        if (this.current_char === "|") { // ||
            this.advance();
            tok_type = TokenType.OR;
            value = "||";
        }

        return new Token(tok_type, value, pos_start, this.pos);
    }

    make_and() {
        let pos_start = this.pos.copy();
        let tok_type = TokenType.LOGICAL_AND;
        let value = "&";
        this.advance();

        if (this.current_char === "&") { // &&
            this.advance();
            tok_type = TokenType.AND;
            value = "&&";
        }

        return new Token(tok_type, value, pos_start, this.pos);
    }

    skip_comment() {
        this.advance();
        while (this.current_char !== "\n" && this.current_char !== null) {
            this.advance();
        }
    }
}