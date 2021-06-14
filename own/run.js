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
const LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LETTERS_DIGITS = LETTERS + DIGITS;

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
    constructor(pos_start, pos_end, details='') {
        super(pos_start, pos_end, "Illegal Character", details);
    }
}

/**
 * @classdesc Error thrown when there is an illegal or unexpected character.
 */
class ExpectedCharError extends CustomError {
    /**
     * @constructs ExpectedCharError
     * @param {Position} pos_start The starting position.
     * @param {Position} pos_end The end position.
     * @param {string} details Details about the error.
     */
    constructor(pos_start, pos_end, details='') {
        super(pos_start, pos_end, "Expected Character", details);
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
    constructor(pos_start, pos_end, details='') {
        super(pos_start, pos_end, "Invalid Syntax", details);
    }
}

/**
 * @classdesc Error thrown when there is an invalid syntax.
 */
class RTError extends CustomError {
    /**
     * @constructs RTError
     * @param {Position} pos_start The starting position.
     * @param {Position} pos_end The end position.
     * @param {string} details Details about the error.
     * @param {Context} context The context where the error occured.
     */
    constructor(pos_start, pos_end, details, context) {
        super(pos_start, pos_end, "Runtime Error", details);
        this.context = context;
    }

    toString() {
        let result = this.generate_traceback();
        result    += `${this.error_name}: ${this.details}\n\n`;
        result    += string_with_arrows(this.pos_start.ftxt, this.pos_start, this.pos_end);
        return result;
    }

    generate_traceback() {
        let result = "";
        let pos = this.pos_start;
        let ctx = this.context;

        while (ctx) {
            result = `   File ${pos.fn}, line ${pos.ln + 1}, in ${ctx.display_name}\n` + result;
            pos = ctx.parent_entry_pos;
            ctx = ctx.parent;
        }

        return 'Traceback (most recent call last):\n' + result;
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
    POWER: 'POWER',
    IDENTIFIER: 'IDENTIFIER',
    KEYWORD: 'KEYWORD',
    EQ: 'EQUALS',
    EE: 'DOUBLE_EQUALS',
    NE: 'NOT EQUALS',
    LT: 'LESS THAN',
    GT: 'GREATER THAN',
    LTE: 'LESS THAN OR EQUALS',
    GTE: 'GREATER THAN OR EQUALS',
    EOF: 'EOF',
};

const KEYWORDS = [
    "VAR",
    "AND",
    "OR",
    "NOT",
    "IF",
    "THEN",
    "ELIF",
    "ELSE"
];

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

    /**
     * Checks if a the type and the value of this token corresponds with `type` and `value`.
     * @param {string} type The type of token (TOKENS.KEYWORD for example).
     * @param {string} value The value that has to correspond.
     * @returns {boolean} `true` if the type & value of this token correspond with `type` and `value`.
     */
    matches(type, value) {
        return this.type === type && this.value === value;
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
            } else if (Array.from(DIGITS).includes(this.current_char)) {
                tokens.push(this.make_number());
            } else if (Array.from(LETTERS).includes(this.current_char)) {
                tokens.push(this.make_identifier());
            } else if (this.current_char === "!") {
                const { tok, error } = this.make_not_equals();
                if (error) return { tokens: [], error };
                tokens.push(tok);
            } else if (this.current_char === "=") {
                tokens.push(this.make_equals());
            } else if (this.current_char === "<") {
                tokens.push(this.make_less_than()); // less than / less than or equals
            } else if (this.current_char === ">") {
                tokens.push(this.make_greater_than()); // greater than / greater than or equals
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
                }, {
                    symbol: "^",
                    token: TOKENS.POWER
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

        while (this.current_char !== null && Array.from(DIGITS + ".").includes(this.current_char)) {
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

    make_identifier() {
        let id_str = '';
        let pos_start = this.pos.copy();

        while (this.current_char !== null && Array.from(LETTERS_DIGITS + "_").includes(this.current_char)) {
            id_str += this.current_char;
            this.advance();
        }

        let tok_type = Array.from(KEYWORDS).includes(id_str) ? TOKENS.KEYWORD : TOKENS.IDENTIFIER;
        return new Token(tok_type, id_str, pos_start, this.pos);
    }

    make_not_equals() {
        let pos_start = this.pos.copy();
        this.advance();

        if (this.current_char === '=') {
            this.advance();
            return { tok: new Token(TOKENS.NE, null, pos_start=pos_start, this.pos), error: null };
        }

        this.advance();
        return { tok: null, error: new ExpectedCharError(
            pos_start, this.pos,
            "'=' (after '!')"
        ) };
    }

    make_equals() {
        let tok_type = TOKENS.EQ;
        let pos_start = this.pos.copy();
        this.advance();

        // do we have "==" ?
        if (this.current_char === '=') {
            this.advance();
            tok_type = TOKENS.EE;
        }

        return new Token(tok_type, null, pos_start, this.pos);
    }

    make_less_than() {
        let tok_type = TOKENS.LT;
        let pos_start = this.pos.copy();
        this.advance();

        // do we have "==" ?
        if (this.current_char === '=') {
            this.advance();
            tok_type = TOKENS.LTE;
        }

        return new Token(tok_type, null, pos_start, this.pos);
    }

    make_greater_than() {
        let tok_type = TOKENS.GT;
        let pos_start = this.pos.copy();
        this.advance();

        // do we have "==" ?
        if (this.current_char === '=') {
            this.advance();
            tok_type = TOKENS.GTE;
        }

        return new Token(tok_type, null, pos_start, this.pos);
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
        this.pos_start = this.tok.pos_start;
        this.pos_end = this.tok.pos_end;
    }

    toString() {
        return `${this.tok.toString()}`;
    }
}

/**
 * @classdesc Allows our program to access existing variables.
 */
class VarAccessNode {
    /**
     * @constructs VarAccessNode
     * @param {Token} var_name_tok The token that represents a variable.
     */
    constructor(var_name_tok) {
        this.var_name_tok = var_name_tok;
        this.pos_start = var_name_tok.pos_start;
        this.pos_end = var_name_tok.pos_end;
    }
}

/**
 * @classdesc Creates a variable by saving its name and its value.
 */
class VarAssignNode {
    /**
     * @constructs VarAssignNode
     * @param {Token} var_name_tok The name of the variable.
     * @param {NumberNode|BinOpNode|UnaryOpNode} value_node The value of the variable.
     */
    constructor(var_name_tok, value_node) {
        this.var_name_tok = var_name_tok;
        this.value_node = value_node;
        this.pos_start = this.var_name_tok.pos_start;
        this.pos_end = this.value_node.pos_end;
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
     * @param {NumberNode} right_node The right side of an operation.
     */
    constructor(left_node, op_tok, right_node) {
        this.left_node = left_node;
        this.op_tok = op_tok;
        this.right_node = right_node;

        this.pos_start = this.left_node.pos_start;
        this.pos_end = this.right_node.pos_end;
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

        this.pos_start = this.op_tok.pos_start;
        this.pos_end = this.node.pos_end;
    }

    toString() {
        return `(${this.op_tok}, ${this.node})`;
    }
}

/**
 * @classdesc Describes a condition (if, elif, else).
 */
class IfNode {
    /**
     * @constructs IfNode
     * @param {Array<Array<UnaryOpNode|NumberNode|BinOpNode|VarAssignNode|VarAccessNode|IfNode>>} cases The cases [[condition, expr]].
     * @param {UnaryOpNode|NumberNode|BinOpNode|VarAssignNode|VarAccessNode|IfNode} else_case The else case.
     */
    constructor(cases, else_case) {
        this.cases = cases;
        this.else_case = else_case;

        this.pos_start = this.cases[0][0].pos_start;
        this.pos_end = (this.else_case || this.cases[this.cases.length - 1][0]).pos_end;
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
        /** @var {UnaryOpNode|NumberNode|BinOpNode|VarAssignNode|VarAccessNode|IfNode|null} */
        this.node = null;
        this.advance_count = 0;
    }

    register_advancement() {
        this.advance_count += 1;
    }

    /**
     * Registers a new node in order to verify if there is an error.
     * @param {any} res The result of an executed function.
     * @return {ParseResult|UnaryOpNode|NumberNode|BinOpNode|VarAssignNode|VarAccessNode|IfNode} res.node.
     */
    register(res) {
        this.advance_count += res.advance_count;
        if (res.error) this.error = res.error;
        return res.node;
    }

    /**
     * A new node is correct.
     * @param {ParseResult|UnaryOpNode|NumberNode|BinOpNode|VarAssignNode|VarAccessNode|IfNode} node The errorless node.
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
        if (!this.error || this.advance_count === 0) { // overwrite an error
            this.error = error;
        }
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
        this.advance();
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
        if (!res.error && this.current_tok.type !== TOKENS.EOF) {
            return res.failure(new InvalidSyntaxError(
                this.current_tok.pos_start, this.current_tok.pos_end,
                "Expected '+', '-', '*', '/' or '^'"
            ));
        }
        return res;
    }

    // -------------

    // an expression is looking for terms.
    expr() {
        // first of all, we need to check if this is a variable declaration
        let res = new ParseResult();
        if (this.current_tok.matches(TOKENS.KEYWORD, 'VAR')) {
            res.register_advancement();
            this.advance();

            // after the "VAR" keyword, we need to check if there is an identifier
            if (this.current_tok.type !== TOKENS.IDENTIFIER) {
                return res.failure(new InvalidSyntaxError(
                    this.current_tok.pos_start, this.current_tok.pos_end,
                    "Expected identifier"
                ));
            }

            let var_name_tok = this.current_tok;
            res.register_advancement();
            this.advance();

            // now we want the equals token
            if (this.current_tok.type !== TOKENS.EQ) {
                return res.failure(new InvalidSyntaxError(
                    this.current_tok.pos_start, this.current_tok.pos_end,
                    "Expected '='"
                ));
            }

            res.register_advancement();
            this.advance();

            // we need to check if there is now an expr
            let expr = res.register(this.expr());
            if (res.error) return res;

            // @ts-ignore
            return res.success(new VarAssignNode(var_name_tok, expr));
        }

        // evaluate a binary operation between two terms separated by PLUS or MINUS.
        let node = res.register(this.bin_op(this.comp_expr.bind(this), [[TOKENS.KEYWORD, "AND"], [TOKENS.KEYWORD, "OR"]]));
        
        if (res.error) {
            return res.failure(new InvalidSyntaxError(
                this.current_tok.pos_start, this.current_tok.pos_end,
                "Expected 'VAR', int, float, identifier, '+', '-', '(' or 'NOT'"
            ));
        }

        return res.success(node);
    }

    // a term is looking for a factor
    term() {
        return this.bin_op(this.factor.bind(this), [TOKENS.MUL, TOKENS.DIV]); // evaluate a binary operation between two factors separated by MUL or DIV.
    }

    arith_expr() {
        return this.bin_op(this.term.bind(this), [TOKENS.PLUS, TOKENS.MINUS]);
    }

    comp_expr() {
        let res = new ParseResult();
        
        if (this.current_tok.matches(TOKENS.KEYWORD, 'NOT')) {
            let op_tok = this.current_tok;
            res.register_advancement();
            this.advance();

            let node = res.register(this.comp_expr());
            if (res.error) return res;
            
            // @ts-ignore
            return res.success(new UnaryOpNode(op_tok, node));
        }

        let node = res.register(this.bin_op(this.arith_expr.bind(this), [TOKENS.EE, TOKENS.NE, TOKENS.LT, TOKENS.GT, TOKENS.LTE, TOKENS.GTE]));
        
        if (res.error) {
            return res.failure(new InvalidSyntaxError(
                this.current_tok.pos_start, this.current_tok.pos_end,
                "Expected int, float, identifier, '+', '-', '(' or 'NOT'"
            ));
        }

        return res.success(node);
    }

    factor() {
        let res = new ParseResult();
        let tok = this.current_tok;

        if ([TOKENS.PLUS, TOKENS.MINUS].includes(tok.type)) {
            res.register_advancement();
            this.advance();
            let factor = res.register(this.factor());
            if (res.error) return res;
            // @ts-ignore
            return res.success(new UnaryOpNode(tok, factor));
        }

        return this.power();
    }

    // a power operation is looking for atoms
    power() {
        return this.bin_op(this.atom.bind(this), [TOKENS.POWER], this.factor.bind(this));
    }

    atom() {
        let res = new ParseResult();
        let tok = this.current_tok;

        if ([TOKENS.INT, TOKENS.FLOAT].includes(tok.type)) {
            res.register_advancement();
            this.advance();
            return res.success(new NumberNode(tok));
        } else if (tok.type === TOKENS.IDENTIFIER) {
            res.register_advancement();
            this.advance();
            return res.success(new VarAccessNode(tok));
        } else if (tok.type === TOKENS.LPAREN) {
            res.register_advancement();
            this.advance();
            let expr = res.register(this.expr());
            if (res.error) return res;
            if (this.current_tok.type === TOKENS.RPAREN) {
                res.register_advancement();
                this.advance();
                // @ts-ignore
                return res.success(expr);
            } else {
                return res.failure(new InvalidSyntaxError(
                    this.current_tok.pos_start, this.current_tok.pos_end,
                    "Expected ')'"
                ));
            }
        } else if (tok.matches(TOKENS.KEYWORD, "IF")) {
            let if_expr = res.register(this.if_expr());
            if (res.error) return res;
            return res.success(if_expr);
        }

        return res.failure(new InvalidSyntaxError(
            tok.pos_start, tok.pos_end,
            "Expected int, float, identifier, '+', '-', or '('"
        ));
    }

    if_expr() {
        let res = new ParseResult();
        let cases = [];
        let else_case = null;

        // we must have a "IF" keyword

        if (!this.current_tok.matches(TOKENS.KEYWORD, "IF")) {
            return res.failure(new InvalidSyntaxError(
                this.current_tok.pos_start, this.current_tok.pos_end,
                "Expected 'IF'"
            ));
        }

        // we continue

        res.register_advancement();
        this.advance();

        // we must have a "THEN" keyword now

        let condition = res.register(this.expr());
        if (res.error) return res;

        if (!this.current_tok.matches(TOKENS.KEYWORD, "THEN")) {
            return res.failure(new InvalidSyntaxError(
                this.current_tok.pos_start, this.current_tok.pos_end,
                "Expected 'THEN'"
            ));
        }

        res.register_advancement();
        this.advance();

        // followed by an expression

        let expr = res.register(this.expr());
        if (res.error) return res;
        cases.push([condition, expr]);

        // now we check for ELIFs

        while (this.current_tok.matches(TOKENS.KEYWORD, "ELIF")) {
            res.register_advancement();
            this.advance();

            // after an ELIF, there must be a condition

            condition = res.register(this.expr());
            if (res.error) return res;

            // then a "THEN"
            
            if (!this.current_tok.matches(TOKENS.KEYWORD, "THEN")) {
                return res.failure(new InvalidSyntaxError(
                    this.current_tok.pos_start, this.current_tok.pos_end,
                    "Expected 'THEN'"
                ));
            }

            // we need now another expression

            res.register_advancement();
            this.advance();

            expr = res.register(this.expr());
            if (res.error) return res;
            cases.push([condition, expr]);
        }

        if (this.current_tok.matches(TOKENS.KEYWORD, "ELSE")) {
            res.register_advancement();
            this.advance();

            else_case = res.register(this.expr());
            if (res.error) return res;
        }

        // @ts-ignore
        return res.success(new IfNode(cases, else_case));
    }

    // -------------

    /**
     * Evaluate a binary operation (a term or an expr).
     * @param {Function} func_a A function of the Parser.
     * @param {Array<string>|Array<Array<string>>} ops The possible operations.
     * @param {Function} func_b Another function of the Parser.
     * @return {ParseResult}
     */
    bin_op(func_a, ops, func_b=null) {
        if (func_b === null) {
            func_b = func_a; 
        }

        let res = new ParseResult();
        let left = res.register(func_a());
        if (res.error) return res;

        // Array.protoype.includes is crap ;(
        const check_combination = (comb) => {
            for (let combination of ops) {
                if (combination[0] === comb[0] && combination[1] === comb[1]) {
                    return true;
                }
            }

            return false;
        };

        // @ts-ignore
        while (ops.includes(this.current_tok.type) || check_combination([this.current_tok.type, this.current_tok.value])) {
            let op_tok = this.current_tok;
            res.register_advancement();
            this.advance();
            let right = res.register(func_b());
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

/*
*
* RUNTIME ERROR
*
*/

/**
 * @classdesc Keeps track of an error during runtime.
 */
class RTResult {
    /**
     * @constructs RTResult
     */
    constructor() {
        /** @var {any} */
        this.value = null;
        /** @var {null|CustomError} */
        this.error = null;
    }

    /**
     * Registers an action during runtime and checks if an error has been thrown.
     * @param {any} res The value to be registered.
     * @return {any} The value.
     */
    register(res) {
        if (res.error) this.error = res.error;
        return res.value;
    }

    /**
     * Registers a successful action during runtime.
     * @param {any} value The correct value.
     * @return {RTResult} this.
     */
    success(value) {
        this.value = value;
        return this;
    }

    /**
     * Registers an unsuccessful action during runtime.
     * @param {CustomError} error The error.
     * @return {RTResult} this.
     */
    failure(error) {
        this.error = error;
        return this;
    }
}

/*
*
* VALUES
*
*/

/**
 * @classdesc A number of the program.
 */
class CustomNumber {
    /**
     * @constructs CustomNumebr
     * @param {number} value The value of a NumberNode.
     */
    constructor(value) {
        this.value = value;
        this.set_pos();
        this.set_context();
    }

    /**
     * We need to know where is that number in the program.
     * @param {Position|null} pos_start The starting position of the number.
     * @param {Position|null} pos_end The end position of the number.
     * @return {CustomNumber} this.
     */
    set_pos(pos_start=null, pos_end=null) {
        this.pos_start = pos_start;
        this.pos_end = pos_end;
        return this;
    }

    /**
     * Saves the context.
     * @param {Context|null} context The current context.
     */
    set_context(context=null) {
        this.context = context;
        return this;
    }

    // The functions needed to perform calculations on that number (this.value).

    /**
     * Adds a number.
     * @param {CustomNumber} other_number The number to be added to our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    added_to(other_number) {
        return { result: new CustomNumber(this.value + other_number.value).set_context(this.context), error: null };
    }

    /**
     * Substracts by a number.
     * @param {CustomNumber} other_number The number to be substracted by our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    subbed_by(other_number) {
        return { result: new CustomNumber(this.value - other_number.value).set_context(this.context), error: null };
    }

    /**
     * Multiplies by a number.
     * @param {CustomNumber} other_number The number to be multiplied by our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    multed_by(other_number) {
        return { result: new CustomNumber(this.value * other_number.value).set_context(this.context), error: null };
    }

    /**
     * Divides a number.
     * @param {CustomNumber} other_number The number to be divided by our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    dived_by(other_number) {
        if (other_number.value === 0) {
            return { result: null, error: new RTError(
                other_number.pos_start, other_number.pos_end,
                "Division by Zero",
                this.context
            )};
        }
        return { result: new CustomNumber(this.value / other_number.value).set_context(this.context), error: null };
    }

    /**
     * Powered by a number.
     * @param {CustomNumber} other_number The number to be powered by our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    powered_by(other_number) {
        return { result: new CustomNumber(this.value ** other_number.value).set_context(this.context), error: null };
    }

    /**
     * Checks if our value is equals to the other value.
     * @param {CustomNumber} other_number The number to be compared with our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    get_comparison_eq(other_number) {
        return { result: new CustomNumber(new Number(this.value == other_number.value).valueOf()).set_context(this.context), error: null };
    }

    /**
     * Checks if our value is not equals to the other value.
     * @param {CustomNumber} other_number The number to be compared with our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    get_comparison_ne(other_number) {
        return { result: new CustomNumber(new Number(this.value != other_number.value).valueOf()).set_context(this.context), error: null };
    }

    /**
     * Checks if our value is less than the other value.
     * @param {CustomNumber} other_number The number to be compared with our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    get_comparison_lt(other_number) {
        return { result: new CustomNumber(new Number(this.value < other_number.value).valueOf()).set_context(this.context), error: null };
    }

    /**
     * Checks if our value is greater than the other value.
     * @param {CustomNumber} other_number The number to be compared with our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    get_comparison_gt(other_number) {
        return { result: new CustomNumber(new Number(this.value > other_number.value).valueOf()).set_context(this.context), error: null };
    }

    /**
     * Checks if our value is less than or equals the other value.
     * @param {CustomNumber} other_number The number to be compared with our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    get_comparison_lte(other_number) {
        return { result: new CustomNumber(new Number(this.value <= other_number.value).valueOf()).set_context(this.context), error: null };
    }

    /**
     * Checks if our value is greater than or equals the other value.
     * @param {CustomNumber} other_number The number to be compared with our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    get_comparison_gte(other_number) {
        return { result: new CustomNumber(new Number(this.value >= other_number.value).valueOf()).set_context(this.context), error: null };
    }

    /**
     * Checks if both values are true (1).
     * @param {CustomNumber} other_number The number to be compared with our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    anded_by(other_number) {
        return { result: new CustomNumber(new Number(this.value && other_number.value).valueOf()).set_context(this.context), error: null };
    }

    /**
     * Checks if one or both values are true (1).
     * @param {CustomNumber} other_number The number to be compared with our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    ored_by(other_number) {
        return { result: new CustomNumber(new Number(this.value || other_number.value).valueOf()).set_context(this.context), error: null };
    }

    /**
     * Gets the contrary of a comparison operator.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    notted() {
        return { result: new CustomNumber(this.value == 0 ? 1 : 0).set_context(this.context), error: null };
    }

    // ----------------

    is_true() {
        return this.value != 0;
    }

    copy() {
        let copy = new CustomNumber(this.value);
        copy.set_pos(this.pos_start, this.pos_end);
        copy.set_context(this.context);
        return copy;
    }

    toString() {
        return `${this.value}`;
    }
}

/*
*
* CONTEXT
*
*/

/**
 * @classdesc Creates a context to keep track of the user's actions.
 */
class Context {
    /**
     * @constructs Context
     * @param {string} display_name The name of the context (the name of the function where an error has occured for example).
     * @param {Context} parent The parent context of the current context.
     * @param {Position} parent_entry_pos The position in the code where the paren context has been created.
     */
    constructor(display_name, parent=null, parent_entry_pos=null) {
        this.display_name = display_name;
        this.parent = parent;
        this.parent_entry_pos = parent_entry_pos;
        /** @type {SymbolTable|null} */
        this.symbol_table = null;
    }
}

/*
*
* SYMBOL TABLE (for variables)
*
*/

/**
 * @classdesc Keeps track of all the declared variables in our program.
 */
class SymbolTable {
    constructor() {
        this.symbols = new Map();
        // a parent symbol table
        // (for an function for instance)
        // we'll be able to remove all the variables after the execution of a function
        /** @type {Map|null} */
        this.parent = null;
    }

    /**
     * Gets a variable.
     * @param {string} name The name of a variable.
     */
    get(name) {
        let value = this.symbols.has(name) ? this.symbols.get(name) : null;
        // we check for the parent symbol table
        if (value === null && this.parent) return this.parent.has(name) ? this.parent.get(name) : null;
        return value;
    }

    /**
     * Modifies the value of a variable.
     * @param {string} name The name of the variable to modify.
     * @param {any} value The new value of that variable.
     */
    set(name, value) {
        this.symbols.set(name, value);
    }

    /**
     * Removes a variable.
     * @param {string} name The name of the variable to remove.
     */
    remove(name) {
        this.symbols.delete(name);
    }
}

/*
*
* Interpreter
*
*/

/**
 * @classdesc This class will read the parsed tokens and evaluates the code accordingly.
 */
class Interpreter {
    /**
     * @param {NumberNode|UnaryOpNode|BinOpNode|VarAccessNode|VarAssignNode|IfNode} node The node to be visited.
     * @param {Context} context The root context.
     * @return {RTResult}
     */
    visit(node, context) {
        if (node instanceof NumberNode) {
            return this.visit_NumberNode(node, context);
        } else if (node instanceof UnaryOpNode) {
            return this.visit_UnaryOpNode(node, context);
        } else if (node instanceof BinOpNode) {
            return this.visit_BinOpNode(node, context);
        } else if (node instanceof VarAssignNode) {
            return this.visit_VarAssignNode(node, context);
        } else if (node instanceof VarAccessNode) {
            return this.visit_VarAccessNode(node, context);
        } else if (node instanceof IfNode) {
            return this.visit_IfNode(node, context);
        } else {
            // @ts-ignore
            throw new Error("No visit method defined for the node '" + node.constructor.name + "'");
        }
    }

    // ----------------

    /**
     * Visits a number node in order to create a CustomNumber (a valide number).
     * @param {NumberNode} node The node to be visited.
     * @param {Context} context The current context.
     * @return {RTResult}
     */
    visit_NumberNode(node, context) {
        return new RTResult().success(
            new CustomNumber(node.tok.value).set_context(context).set_pos(node.pos_start, node.pos_end)
        );
    }

    /**
     * Gets a variable.
     * @param {VarAccessNode} node The node to be visited.
     * @param {Context} context The current context.
     * @return {RTResult}
     */
    visit_VarAccessNode(node, context) {
        let res = new RTResult();
        let var_name = node.var_name_tok.value;
        let value = context.symbol_table.get(var_name);

        if (value === null || value === undefined) {
            return res.failure(new RTError(
                node.pos_start, node.pos_end,
                `'${var_name}' is not defined`,
                context
            ));
        }

        value = value.copy().set_pos(node.pos_start, node.pos_end);
        return res.success(value);
    }

    /**
     * Creates a variable.
     * @param {VarAssignNode} node The node to be visited.
     * @param {Context} context The current context.
     * @return {RTResult}
     */
    visit_VarAssignNode(node, context) {
        let res = new RTResult();
        let var_name = node.var_name_tok.value;
        let value = res.register(this.visit(node.value_node, context));
        if (res.error) return res;

        context.symbol_table.set(var_name, value);
        return res.success(value);
    }
    
    /**
     * Visits a binary operation node in order to perform the calculations on the NumberNodes contained inside.
     * @param {BinOpNode} node The node to be visited.
     * @param {Context} context The current context.
     * @return {RTResult}
     */
    visit_BinOpNode(node, context) {
        let res = new RTResult();

        // we also need to visit its own nodes (left number & right number)

        /** @type {CustomNumber} */
        let left = res.register(this.visit(node.left_node, context)); // this line will create an instance of CustomNumber
        if (res.error) return res;

        /** @type {CustomNumber} */
        let right = res.register(this.visit(node.right_node, context)); // this line will create an instance of CustomNumber
        if (res.error) return res;

        
        let operation = null;

        if (node.op_tok.type == TOKENS.PLUS) {
            operation = left.added_to(right);
        } else if (node.op_tok.type == TOKENS.MINUS) {
            operation = left.subbed_by(right);
        } else if (node.op_tok.type == TOKENS.MUL) {
            operation = left.multed_by(right);
        } else if (node.op_tok.type == TOKENS.DIV) {
            operation = left.dived_by(right);
        } else if (node.op_tok.type == TOKENS.POWER) {
            operation = left.powered_by(right);
        } else if (node.op_tok.type == TOKENS.EE) {
            operation = left.get_comparison_eq(right);
        } else if (node.op_tok.type == TOKENS.NE) {
            operation = left.get_comparison_ne(right);
        } else if (node.op_tok.type == TOKENS.LT) {
            operation = left.get_comparison_lt(right);
        } else if (node.op_tok.type == TOKENS.GT) {
            operation = left.get_comparison_gt(right);
        } else if (node.op_tok.type == TOKENS.LTE) {
            operation = left.get_comparison_lte(right);
        } else if (node.op_tok.type == TOKENS.GTE) {
            operation = left.get_comparison_gte(right);
        } else if (node.op_tok.matches(TOKENS.KEYWORD, 'AND')) {
            operation = left.anded_by(right);
        } else if (node.op_tok.matches(TOKENS.KEYWORD, 'OR')) {
            operation = left.ored_by(right);
        }

        let result = operation.result;
        let error = operation.error;

        if (error) {
            return res.failure(error);
        } else {
            return res.success(result.set_context(context).set_pos(node.pos_start, node.pos_end));
        }
    }

    /**
     * Visits the unary operator node in order to perform the calculations on the NumberNode contained inside.
     * @param {UnaryOpNode} node The node to be visited.
     * @param {Context} context The current context.
     * @return {RTResult}
     */
    visit_UnaryOpNode(node, context) {
        let res = new RTResult();

        // same as BinOpNode, we need to visit the nodes of the UnaryOpNode (its unique number)

        /** @type {CustomNumber} */
        let number = res.register(this.visit(node.node, context));
        if (res.error) return res;

        let error = null;
        let operation = null;

        if (node.op_tok.type === TOKENS.MINUS) {
            operation = number.multed_by(new CustomNumber(-1));
            number = operation.result;
            error = operation.error;
        } else if (node.op_tok.matches(TOKENS.KEYWORD, 'NOT')) {
            operation = number.notted();
            number = operation.result;
            error = operation.error;
        }
            
        if (error) {
            return res.failure(error);
        } else {
            return res.success(number.set_context(context).set_pos(node.pos_start, node.pos_start));
        }
    }

    /**
     * Visits the conditional node in order get the right expression.
     * @param {IfNode} node The node to be visited.
     * @param {Context} context The current context.
     * @return {RTResult}
     */
    visit_IfNode(node, context) {
        let res = new RTResult();
        
        for (let [condition, expr] of node.cases) {
            /** @type {CustomNumber} */
            let condition_value = res.register(this.visit(condition, context));
            if (res.error) return res;

            if (condition_value.is_true()) {
                let expr_value = res.register(this.visit(expr, context));
                if (res.error) return res;
                return res.success(expr_value);
            }
        }

        if (node.else_case) {
            let else_value = res.register(this.visit(node.else_case, context));
            if (res.error) return res;
            return res.success(else_value);
        }

        return res.success(null);
    }

    // ----------------
}

/*
*
* GLOBAL VARIABLES
*
*/

const global_symbol_table = new SymbolTable();
global_symbol_table.set("NULL", new CustomNumber(0));
global_symbol_table.set("YES", new CustomNumber(1));
global_symbol_table.set("NO", new CustomNumber(1));

/**
 * Executes the program.
 * @param {string} filename The filename.
 * @param {string} text The source code.
 * @return {{result: any, error: CustomError}}
 */
export default function run(filename, text) {
    // Generate tokens
    const lexer = new Lexer(filename, text);
    const { tokens, error } = lexer.make_tokens();
    if (error) return { result: null, error };

    // Generate abstract syntax tree
    const parser = new Parser(tokens);
    const ast = parser.parse(); // the ast will contain a node, that node is the entire list of parsed tokens as an expression.
    if (ast.error) return { result: null, error: ast.error };

    // Run the program
    const interpreter = new Interpreter();
    const context = new Context('<program>'); // the context will get modified by visiting the different user's actions.
    context.symbol_table = global_symbol_table;
    const result = interpreter.visit(ast.node, context);

    return { result: result.value, error: result.error };
}