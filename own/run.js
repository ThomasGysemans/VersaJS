/*
*
* MISCELLANEOUS
*
*/

/**
 * Draws a line of arrows below an error in the shell.
 * @param {string} text The source code.
 * @param {Position} pos_start The starting position of the error.
 * @param {Position} pos_end The end position of the error.
 */
function string_with_arrows(text, pos_start, pos_end) {
    let result = '';

    // Calculate the indices
    let index_start = Math.max(text.substring(0, pos_start.idx).lastIndexOf('\n'), 0);
    let index_end = text.indexOf('\n', index_start + 1);
    if (index_end < 0) index_end = text.length;

    // Generate each line
    let line_count = pos_end.ln - pos_start.ln + 1;
    for (let i = 0; i < line_count; i++) {
        // Calculate line columns
        let line = text.substring(index_start, index_end);
        let col_start = i == 0 ? pos_start.col : 0;
        let col_end = i == line_count - 1 ? pos_end.col : line.length - 1;

        // Append to result
        result += line + '\n';
        result += ' '.repeat(col_start) + '^'.repeat(col_end - col_start);

        // Re-calculate indices
        index_start = index_end;
        index_end = text.substring(index_start + 1).indexOf('\n');
        if (index_end < 0) index_end = text.length;
    }

    return result.replace(/\\\t/gm, '');
}

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
        result    += `File ${this.pos_start.fn}, line ${this.pos_start.ln + 1}\n\n`;
        result    += string_with_arrows(this.pos_start.ftxt, this.pos_start, this.pos_end);
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

/**
 * @classdesc Error thrown when there is an invalid syntax.
 */
class InvalidSyntaxError extends CustomError {
    /**
     * @constructs InvalidSyntaxError
     * @param {Position} pos_start The starting position.
     * @param {Position} pos_end The end position.
     * @param {string} details Details about the error.
     */
    constructor(pos_start, pos_end, details) {
        super(pos_start, pos_end, "Invalid Syntax", details);
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
     * @param {Position|null} pos_start The starting position of the token in the program.
     * @param {Position|null} pos_end The end position of the toke in the program.
     */
    constructor(type, value=null, pos_start=null, pos_end=null) {
        this.type = type;
        this.value = value;

        if (pos_start) {
            this.pos_start = pos_start.copy();
            this.pos_end = pos_start.copy();
            this.pos_end.advance();
        }

        if (pos_end) this.pos_end = pos_end.copy();
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
                        tokens.push(new Token(keyword.token, null, this.pos));
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

        tokens.push(new Token(TOKENS.EOF, null, this.pos));
        return { tokens, error: null };
    }

    /**
     * Creates a number (int or float).
     * @returns {Token}
     */
    make_number() {
        let str_num = "";
        let dot_count = 0;
        let pos_start = this.pos.copy();

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
            return new Token(TOKENS.INT, parseInt(str_num, 10), pos_start, this.pos);
        } else {
            return new Token(TOKENS.FLOAT, parseFloat(str_num), pos_start, this.pos);
        }
    }
}

/*
*
* NODES
*
*/

/**
 * @classdesc This node represents a single number while reading the tokens.
 */
class NumberNode {
    /**
     * @constructs NumberNode
     * @param {Token} tok The token that represents a number.
     */
    constructor(tok) {
        this.tok = tok;
    }

    toString() {
        return `${this.tok.toString()}`;
    }
}

/**
 * @classdesc Describes an operation between a left node and a right node.
 */
class BinOpNode {
    /**
     * @constructs BinOpNode
     * @param {NumberNode} left_node The left side of an operation.
     * @param {Token} op_tok The type of operation (+, -, etc.)
     * @param {NumberNode|BinOpNode} right_node The right side of an operation.
     */
    constructor(left_node, op_tok, right_node) {
        this.left_node = left_node;
        this.op_tok = op_tok;
        this.right_node = right_node;
    }

    toString() {
        return `(${this.left_node.toString()}, ${this.op_tok.type.toString()}, ${this.right_node.toString()})`;
    }
}

/**
 * @classdesc Describes an unary operation (-1).
 */
class UnaryOpNode {
    /**
     * @constructs UnaryOpNode
     * @param {Token} op_tok The type of operation.
     * @param {NumberNode} node The node.
     */
    constructor(op_tok, node) {
        this.op_tok = op_tok;
        this.node = node;
    }

    toString() {
        return `(${this.op_tok}, ${this.node})`;
    }
}

/*
*
* PARSE RESULT
*
*/

/**
 * @classdesc Each created node comes here in order to verify if there has been an error while parsing the tokens.
 */
class ParseResult {
    /**
     * @constructs ParseResult
     */
    constructor() {
        /** @var {CustomError|null} */
        this.error = null;
        /** @var {UnaryOpNode|NumberNode|BinOpNode|null} */
        this.node = null;
    }

    /**
     * Registers a new node in order to verify if there is an error.
     * @param {any} res The result of an executed function.
     * @return {ParseResult|UnaryOpNode|NumberNode|BinOpNode} res.node or res.
     */
    register(res) {
        if (res instanceof ParseResult) {
            if (res.error) this.error = res.error;
            return res.node;
        } 

        return res;
    }

    /**
     * A new node is correct.
     * @param {UnaryOpNode|NumberNode|BinOpNode} node The errorless node.
     * @return {ParseResult} this.
     */
    success(node) {
        this.node = node;
        return this;
    }

    /**
     * A new node is incorrect. An error has occcured.
     * @param {CustomError} error An error thrown during the parsing.
     * @returns {ParseResult} this.
     */
    failure(error) {
        this.error = error;
        return this;
    }
}

/*
*
* Parser
*
*/

/**
 * @classdesc Read the tokens and creates the hierarchy between the operations.
 */
class Parser {
    /**
     * @constructs
     * @param {Array<Token>} tokens The tokens of the program.
     */
    constructor(tokens) {
        this.tokens = tokens;
        this.tok_idx = -1; 
        this.advance(); // we begin the token index at 2
    }

    advance() {
        this.tok_idx += 1;
        if (this.tok_idx < this.tokens.length) {
            this.current_tok = this.tokens[this.tok_idx];
        }
        return this.current_tok;
    }

    parse() {
        let res = this.expr();
        if (res instanceof ParseResult) {
            if (!res.error && this.current_tok.type !== TOKENS.EOF) {
                return res.failure(new InvalidSyntaxError(
                    this.current_tok.pos_start, this.current_tok.pos_end,
                    "Expected '+', '-', '*', '/'"
                ));
            }
        } 
        return res;
    }

    // -------------

    factor() {
        let res = new ParseResult();
        let tok = this.current_tok;

        if ([TOKENS.PLUS, TOKENS.MINUS].includes(tok.type)) {
            res.register(this.advance());
            let factor = res.register(this.factor());
            if (res.error) return res;
            // @ts-ignore
            return res.success(new UnaryOpNode(tok, factor));
        } else if ([TOKENS.INT, TOKENS.FLOAT].includes(tok.type)) {
            res.register(this.advance());
            return res.success(new NumberNode(tok));
        } else if (tok.type === TOKENS.LPAREN) {
            res.register(this.advance());
            let expr = res.register(this.expr());
            if (res.error) return res;
            if (this.current_tok.type === TOKENS.RPAREN) {
                res.register(this.advance());
                // @ts-ignore
                return res.success(expr);
            } else {
                return res.failure(new InvalidSyntaxError(
                    this.current_tok.pos_start, this.current_tok.pos_end,
                    "Expected ')'"
                ));
            }
        }

        return res.failure(new InvalidSyntaxError(
            tok.pos_start, tok.pos_end,
            "Expected int or float"
        ));
    }

    term() {
        return this.bin_op(this.factor.bind(this), [TOKENS.MUL, TOKENS.DIV]); // evaluate a binary operation between two factors separated by MUL or DIV.
    }

    expr() {
        return this.bin_op(this.term.bind(this), [TOKENS.PLUS, TOKENS.MINUS]); // evaluate a binary operation between two terms separated by PLUS or MINUS.
    }

    // -------------

    /**
     * Evaluate a binary operation (a term or an expr).
     * @param {Function} func A function a the Parser.
     * @param {Array<string>} ops The possible operations.
     * @return {ParseResult}
     */
    bin_op(func, ops) {
        let res = new ParseResult();
        let left = res.register(func());
        if (res.error) return res;

        while (ops.includes(this.current_tok.type)) {
            let op_tok = this.current_tok;
            res.register(this.advance());
            let right = res.register(func());
            if (res.error) return res;
            // the left member of the operation becomes a binary operation
            // of the previous left and right members.
            // @ts-ignore
            left = new BinOpNode(left, op_tok, right);
        }

        // @ts-ignore
        return res.success(left);
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
    if (error) return { result: null, error };

    // Generate abstract syntax tree
    const parser = new Parser(tokens);
    const ast = parser.parse();

    return { result: ast.node, error: ast.error };
}