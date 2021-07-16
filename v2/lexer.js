import KEYWORDS, { Token, TokenType } from './tokens.js';
import { Position } from './position.js';
import { is_in } from './miscellaneous.js';
import { ExpectedCharError, IllegalCharError } from './Exceptions.js';

export const WHITESPACE        = " \t";
export const DIGITS            = "0123456789_"; // we want to allow 100_000 === 100000
export const LETTERS           = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const LETTERS_DIGITS    = LETTERS + DIGITS;
export const ESCAPE_CHARACTERS = new Map([['n', '\n'], ['t', '\t']]);

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
            } else if (this.current_char === "\n" || this.current_char === "\r") {
                let pos_start = this.pos.copy();
                if (this.current_char === "\r") {
                    this.advance(); // a newline can be sometimes : '\r\n'
                }
                this.advance();
                yield new Token(TokenType.NEWLINE, null, pos_start);
            } else if (this.current_char === ";") {
                this.advance();
                yield new Token(TokenType.SEMICOLON, null, this.pos);
            } else if (is_in(this.current_char, LETTERS + "_")) { // has to be before digits
                yield this.make_identifier();
            } else if (this.current_char === "." || is_in(this.current_char, DIGITS)) {
                yield this.make_number();
            } else if (this.current_char === "+") {
                // this.advance();
                // yield new Token(TokenType.PLUS, null, this.pos);
                yield this.make_plus_or_increment();
            } else if (this.current_char === "-") {
                yield this.make_minus_decrement_or_arrow();
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
                yield this.make_doublearrow_or_equal();
            } else if (this.current_char === "!") {
                yield this.make_not_equal();
            } else if (this.current_char === "<") {
                yield this.make_less_than_or_equal();
            } else if (this.current_char === ">") {
                yield this.make_greater_than_or_equal();
            } else if (this.current_char === "?") {
                yield this.make_qmark_or_else_assign();
            } else if (this.current_char === "'") {
                yield this.make_string();
            } else if (this.current_char === '"') {
                yield this.make_string();
            } else if (this.current_char === '`') {
                yield this.make_string();
            } else if (this.current_char === ":") {
                yield this.make_colon_or_doublecolon();
            } else if (this.current_char === "[") {
                this.advance();
                yield new Token(TokenType.LSQUARE, null, this.pos);
            } else if (this.current_char === "]") {
                this.advance();
                yield new Token(TokenType.RSQUARE, null, this.pos);
            } else if (this.current_char === "{") {
                this.advance();
                yield new Token(TokenType.LBRACK, null, this.pos);
            } else if (this.current_char === "}") {
                this.advance();
                yield new Token(TokenType.RBRACK, null, this.pos);
            } else if (this.current_char === ",") {
                this.advance();
                yield new Token(TokenType.COMMA, null, this.pos);
            } else if (this.current_char === "#") {
                this.skip_comment();
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

            // avoid `class.__init ` to become a number (._ == 0)
            if (number_str === "." && this.current_char === "_") break;

            number_str += this.current_char;
            this.advance();
        }

        if (number_str === ".") {
            return new Token(TokenType.DOT, null, pos_start);
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
        this.advance();

        if (this.current_char === "=") {
            tok_type = TokenType.DOUBLE_EQUALS;
            this.advance();
        } else if (this.current_char === ">") {
            tok_type = TokenType.DOUBLE_ARROW;
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

    make_qmark_or_else_assign() {
        let pos_start = this.pos.copy();
        let tok_type = TokenType.QMARK;
        this.advance();

        // we want "??"
        if (this.current_char === "?") {
            this.advance();
            tok_type = TokenType.ELSE_ASSIGN;
        }

        return new Token(tok_type, null, pos_start, this.pos);
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
        this.advance();

        if (this.current_char === ">") {
            this.advance();
            tok_type = TokenType.ARROW;
        } else if (this.current_char === "-") {
            this.advance();
            tok_type = TokenType.DEC;
        }

        return new Token(tok_type, null, pos_start, this.pos);
    }

    make_plus_or_increment() {
        let pos_start = this.pos.copy();
        let tok_type = TokenType.PLUS;
        this.advance();

        if (this.current_char === "+") {
            this.advance();
            tok_type = TokenType.INC;
        }

        return new Token(tok_type, null, pos_start, this.pos);
    }

    make_colon_or_doublecolon() {
        let pos_start = this.pos.copy();
        let tok_type = TokenType.COLON;
        this.advance();

        if (this.current_char === ":") {
            this.advance();
            tok_type = TokenType.DOUBLE_COLON;
        }

        return new Token(tok_type, null, pos_start, this.pos);
    }

    skip_comment() {
        this.advance();
        while (this.current_char !== "\n" && this.current_char !== null) {
            this.advance();
        }
    }
}