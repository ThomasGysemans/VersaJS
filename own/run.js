/*
*
* CONSTANTS
*
*/

const DIGITS = '0123456789';

/*
*
* ERRORS
*
*/

/**
 * @classdesc Creates a custom error that happens during the execution of our program.
 */
class CustomError {
    /**
     * @constructs CustomError
     * @param {Position} pos_start The starting position of the error in the file.
     * @param {Position} pos_end The end position of the error in the file.
     * @param {string} error_name The name of the error.
     * @param {string} details Details about the error.
     */
    constructor(pos_start, pos_end, error_name, details) {
        this.pos_start = pos_start;
        this.pos_end = pos_end;
        this.error_name = error_name;
        this.details = details;
    }

    toString() {
        let result = `${this.error_name}: ${this.details}\n`;
        result    += `File ${this.pos_start.fn}, line ${this.pos_start.ln + 1}`
        return result;
    }
}

/**
 * @classdesc Error thrown when there is an illegal or unexpected character.
 */
class IllegalCharError extends CustomError {
    /**
     * @constructs IllegalCharError
     * @param {Position} pos_start The starting position.
     * @param {Position} pos_end The end position.
     * @param {string} details Details about the error.
     */
    constructor(pos_start, pos_end, details) {
        super(pos_start, pos_end, "Illegal Character", details);
    }
}

/*
*
* TOKENS
*
*/

const TOKENS = {
    INT: 'INT',
    FLOAT: 'FLOAT',
    PLUS: 'PLUS',
    MINUS: 'MINUS',
    MUL: 'MUL',
    DIV: 'DIV',
    LPAREN: 'LPAREN',
    RPAREN: 'RPAREN',
    EOF: 'EOF',
};

/***
 * @classdesc Creates a token (that represents a keyword, such as "+", "-", etc.)
 */
class Token {
    /**
     * @constructs Token
     * @param {string} type The type of the token.
     * @param {any} value The value.
     */
    constructor(type, value=null) {
        this.type = type;
        this.value = value;
    }

    toString() {
        if (this.value) return `${this.type}:${this.value}`;
        return `${this.type}`;
    }
}

/*
*
* POSITION
*
*/

/**
 * @classdesc Describes the position of the lexer while it is reading the file.
 */
class Position {
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
     * @param {number} steps The number of steps to be taken forward.
     * @returns {Position} this.
     */
    advance(current_char=null, steps=1) {
        this.idx += steps;
        this.col += steps;

        if (current_char == "\n") {
            this.ln += 1;
            this.col = 0;
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
}

/*
*
* LEXER
*
*/

/**
 * @classdesc The object that will read our code & creates the tokens accordingly.
 */
class Lexer {
    /**
     * @constructs Lexer
     * @param {string} filename The name of the file to be read.
     * @param {string} text The source code.
     */
    constructor(filename, text) {
        this.filename = filename;
        this.text = text.trim();
        this.pos = new Position(-1, 0, -1, filename, text);
        this.current_char = null;
        this.advance();
    }

    /**
     * The lexer reads our code character by character.
     */
    advance(steps=1) {
        this.pos.advance(this.current_char, steps);
        this.current_char = this.pos.idx < this.text.length ? this.text[this.pos.idx] : null;
    }

    /**
     * Checks if the lexer is reading a registered keyword.
     * @param {string} keyword The keyword we are looking for.
     * @returns {boolean}
     */
    sequence(keyword) {
        let read_sequence = this.text.substr(this.pos.idx, keyword.length);
        return read_sequence === keyword;
    }

    /**
     * Reads the code and create the tokens accordingly.
     */
    make_tokens() {
        let tokens = [];

        while (this.current_char !== null) {
            if (this.current_char === " " || this.current_char === "\t") {
                this.advance();
            } else if (this.current_char in Array.from(DIGITS)) {
                tokens.push(this.make_number());
            } else {
                let found = false;
                const keywords = [{
                    symbol: "+",
                    token: TOKENS.PLUS
                }, {
                    symbol: "-",
                    token: TOKENS.MINUS
                }, {
                    symbol: "*",
                    token: TOKENS.MUL
                }, {
                    symbol: "/",
                    token: TOKENS.DIV
                }, {
                    symbol: "(",
                    token: TOKENS.LPAREN
                }, {
                    symbol: ")",
                    token: TOKENS.RPAREN
                }];

                for (let keyword of keywords) {
                    if (this.sequence(keyword.symbol)) {
                        tokens.push(new Token(keyword.token));
                        this.advance(keyword.symbol.length);
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    let char = this.current_char;
                    let pos_start = this.pos.copy();
                    this.advance();
                    return { tokens: [], error: new IllegalCharError(pos_start, this.pos, "'" + char + "'") };
                }
            }
        }

        tokens.push(new Token(TOKENS.EOF));
        return { tokens, error: null };
    }

    /**
     * Creates a number (int or float).
     * @returns {Token}
     */
    make_number() {
        let str_num = "";
        let dot_count = 0;

        while (this.current_char !== null && this.current_char in Array.from(DIGITS + ".")) {
            if (this.current_char === ".") {
                if (dot_count === 1) break;
                dot_count += 1;
                str_num += ".";
            } else {
                str_num += this.current_char;
            }
            this.advance();
        }

        if (dot_count === 0) {
            return new Token(TOKENS.INT, parseInt(str_num, 10));
        } else {
            return new Token(TOKENS.FLOAT, parseFloat(str_num));
        }
    }
}

/**
 * Executes the program.
 * @param {string} filename The filename.
 * @param {string} text The source code.
 */
export default function run(filename, text) {
    const lexer = new Lexer(filename, text);
    const { tokens, error } = lexer.make_tokens();

    return { result: tokens, error };
}