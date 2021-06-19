/*
*
* IMPORTS
*
*/

import prompt from 'prompt-sync';
import process from 'process';
import fs from 'fs';

/*
*
* MISCELLANEOUS
*
*/

function getArrayDepth(value) {
  return Array.isArray(value) ? 
    1 + Math.max(...value.map(getArrayDepth)) :
    0;
}

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
const ESCAPE_CHARACTERS = new Map();
ESCAPE_CHARACTERS.set('n', '\n');
ESCAPE_CHARACTERS.set('t', '\t');

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
    COMMA: 'COMMA',
    ARROW: 'ARROW',
    STRING: 'STRING',
    LSQUARE: 'LSQUARE', // [
    RSQUARE: 'RSQUARE', // ]
    QMARK: 'QUESTION_MARK',
    NEWLINE: "NEWLINE",
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
    "ELSE",
    "FOR",
    "TO",
    "STEP",
    "WHILE",
    "FUNC",
    "END",
    "RETURN",
    "CONTINUE",
    "BREAK"
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
     * @param {Context} context The context (needed if there is "{var}" in a string) 
     */
    constructor(filename, text, context) {
        this.filename = filename;
        this.text = text;
        this.pos = new Position(-1, 0, -1, filename, text);
        this.current_char = null;
        this.context = context;
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
            } else if (this.current_char === "-") {
                tokens.push(this.make_minus_or_arrow()); // minus / arrow of a function
            } else if (this.current_char === '"') {
                tokens.push(this.make_string());
            } else if (this.current_char === "'") {
                tokens.push(this.make_string());
            } else if (this.current_char === "\n" || this.current_char === "\r" || this.current_char === ";") {
                tokens.push(new Token(TOKENS.NEWLINE, null, this.pos));
                if (this.current_char === "\r") {
                    this.advance(); // a newline can be sometimes : '\r\n'
                }
                this.advance();
            } else if (this.current_char === "#") {
                this.skip_comment();
            } else {
                let found = false;
                const keywords = [{
                    symbol: "+",
                    token: TOKENS.PLUS
                }, { // the minus token is more complicated because it's also the arrow (->) of a function
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
                }, {
                    symbol: ",",
                    token: TOKENS.COMMA
                }, {
                    symbol: "[",
                    token: TOKENS.LSQUARE
                }, {
                    symbol: "]",
                    token: TOKENS.RSQUARE
                }, {
                    symbol: "?",
                    token: TOKENS.QMARK
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

    make_minus_or_arrow() {
        let tok_type = TOKENS.MINUS;
        let pos_start = this.pos.copy();
        this.advance();

        // is the character afterwards a ">"

        if (this.current_char === '>') {
            this.advance();
            tok_type = TOKENS.ARROW;
        }

        return new Token(tok_type, null, pos_start, this.pos);
    }

    make_string() {
        let string = "";
        let pos_start = this.pos.copy();
        let escape_character = false; // do we have to escape the following character?
        let opening_quote = this.current_char; // ' or "
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
                } else if (opening_quote === '"' && this.current_char === "{") {
                    let pos_start = this.pos.copy();
                    let code = "";
                    while (true) {
                        this.advance();
                        // @ts-ignore
                        if (this.current_char === "}") break;
                        code += this.current_char;
                    }
                    if (code.trim()) {
                        // Generate tokens
                        const lexer = new Lexer(this.filename, code, this.context);
                        const { tokens, error } = lexer.make_tokens();
                        if (error) {
                            return { tok: [], error: new InvalidSyntaxError(
                                pos_start, this.pos,
                                error.details
                            )};
                        }

                        // Generate abstract syntax tree
                        const parser = new Parser(tokens);
                        const ast = parser.parse(); // the ast will contain a node, that node is the entire list of parsed tokens as an expression.
                        if (ast.error) {
                            return { tok: [], error: new InvalidSyntaxError(
                                pos_start, this.pos,
                                ast.error.details
                            )}
                        }

                        // Run the program
                        const interpreter = new Interpreter();
                        const result = interpreter.visit(ast.node, this.context);
                        if (result.error) {
                            return { tok: [], error: new InvalidSyntaxError(
                                pos_start, this.pos,
                                result.error.details
                            )};
                        }

                        if (result.value.repr !== undefined) {
                            string += result.value.repr();
                        } else {
                            string += result.value;
                        }
                    } else {
                        string += "{" + code + "}"; // the code is empty
                    }
                } else {
                    string += this.current_char;
                }
            }
            this.advance();
        }

        // end of the string
        this.advance();

        return new Token(TOKENS.STRING, string, pos_start, this.pos);
    }

    skip_comment() {
        this.advance();
        while (this.current_char !== "\n")
            this.advance();
        
        this.advance();
    }
}

/*
*
* NODES
*
*/

class CustomNode {
    constructor() {
        /** @type {Position} */
        this.pos_start = null;
        /** @type {Position} */
        this.pos_end = null;
    }
}

/**
 * @classdesc This node represents a single number while reading the tokens.
 */
class NumberNode extends CustomNode {
    /**
     * @constructs NumberNode
     * @param {Token} tok The token that represents a number.
     */
    constructor(tok) {
        super();
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
class VarAccessNode extends CustomNode {
    /**
     * @constructs VarAccessNode
     * @param {Token} var_name_tok The token that represents a variable.
     */
    constructor(var_name_tok) {
        super();
        this.var_name_tok = var_name_tok;
        this.pos_start = var_name_tok.pos_start;
        this.pos_end = var_name_tok.pos_end;
    }
}

/**
 * @classdesc Creates a variable by saving its name and its value.
 */
class VarAssignNode extends CustomNode {
    /**
     * @constructs VarAssignNode
     * @param {Token} var_name_tok The name of the variable.
     * @param {CustomNode} value_node The value of the variable.
     */
    constructor(var_name_tok, value_node) {
        super();
        this.var_name_tok = var_name_tok;
        this.value_node = value_node;
        this.pos_start = this.var_name_tok.pos_start;
        this.pos_end = this.value_node.pos_end;
    }
}

/**
 * @classdesc Describes an operation between a left node and a right node.
 */
class BinOpNode extends CustomNode {
    /**
     * @constructs BinOpNode
     * @param {CustomNode} left_node The left side of an operation.
     * @param {Token} op_tok The type of operation (+, -, etc.)
     * @param {CustomNode} right_node The right side of an operation.
     */
    constructor(left_node, op_tok, right_node) {
        super();
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
class UnaryOpNode extends CustomNode {
    /**
     * @constructs UnaryOpNode
     * @param {Token} op_tok The type of operation.
     * @param {CustomNode} node The node.
     */
    constructor(op_tok, node) {
        super();
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
class IfNode extends CustomNode {
    /**
     * @constructs IfNode
     * @param {Array} cases The cases [[condition, expr, should_return_null]].
     * @param {{code: any, should_return_null: boolean}} else_case The else case.
     */
    constructor(cases, else_case) {
        super();
        this.cases = cases;
        this.else_case = else_case;

        this.pos_start = this.cases[0][0].pos_start;
        if (this.else_case.code) {
            this.pos_end = this.else_case.code.pos_end;
        } else {
            this.pos_end = this.cases[this.cases.length - 1][0].pos_end;
        }
    }
}

/**
 * @classdesc Describes a for loop.
 */
class ForNode extends CustomNode {
    /**
     * @constructs ForNode
     * @param {Token} var_name_tok The name of the variable in the for statement (i).
     * @param {CustomNode} start_value_node The starting value.
     * @param {CustomNode} end_value_node The value it will go up to.
     * @param {CustomNode} step_value_node The step between each iteration.
     * @param {CustomNode} body_node What gets evaluated on every iteration.
     * @param {boolean} should_return_null Should return null? False for inline loops.
     */
    constructor(var_name_tok, start_value_node, end_value_node, step_value_node, body_node, should_return_null) {
        super();
        this.var_name_tok = var_name_tok;
        this.start_value_node = start_value_node;
        this.end_value_node = end_value_node;
        this.step_value_node = step_value_node;
        this.body_node = body_node;
        this.should_return_null = should_return_null;

        this.pos_start = this.var_name_tok.pos_start;
        this.pos_end = this.body_node.pos_end;
    }
}

/**
 * @classdesc Describes a while loop.
 */
class WhileNode extends CustomNode {
    /**
     * @constructs WhileNode
     * @param {CustomNode} condition_node The condition needed to evaluate the body.
     * @param {CustomNode} body_node What gets evaluated on every iteration.
     * @param {boolean} should_return_null Should return null? False for inline loops.
     */
    constructor(condition_node, body_node, should_return_null) {
        super();
        this.condition_node = condition_node;
        this.body_node = body_node;
        this.should_return_null = should_return_null;
        
        this.pos_start = this.condition_node.pos_start;
        this.pos_end = this.body_node.pos_end;
    }
}

/**
 * @classdesc Describes the declaration of a function.
 */
class FuncDefNode extends CustomNode {
    /**
     * @constructs FuncDefNode
     * @param {Token|null} var_name_tok The identifier that corresponds to the name of the function.
     * @param {Array<Token>} arg_name_toks The arguments.
     * @param {Array<Token>} mandatory_arg_name_toks The mandatory arguments.
     * @param {Array<Token>} optional_arg_name_toks The optional arguments.
     * @param {Array<CustomNode>} default_values_nodes The values of the optional arguments.
     * @param {CustomNode} body_node The body of the function.
     * @param {boolean} should_auto_return Should auto return? True if the function is an arrow function.
     */
    constructor(var_name_tok, arg_name_toks, mandatory_arg_name_toks, optional_arg_name_toks, default_values_nodes, body_node, should_auto_return) {
        super();
        this.var_name_tok = var_name_tok;
        this.arg_name_toks = arg_name_toks;
        this.mandatory_arg_name_toks = mandatory_arg_name_toks;
        this.optional_arg_name_toks = optional_arg_name_toks;
        this.default_values_nodes = default_values_nodes;
        this.body_node = body_node;
        this.should_auto_return = should_auto_return;

        if (this.var_name_tok) {
            this.pos_start = this.var_name_tok.pos_start;
        } else if (this.arg_name_toks.length > 0) {
            this.pos_start = this.arg_name_toks[0].pos_start;
        } else {
            this.pos_start = this.body_node.pos_start;
        }

        this.pos_end = this.body_node.pos_end;
    }
}

/**
 * @classdesc Describes the call to a function.
 */
class CallNode extends CustomNode {
    /**
     * @constructs
     * @param {CustomNode} node_to_call The identifier that corresponds to the name of the function to be called.
     * @param {Array<CustomNode>} arg_nodes The list of arguments.
     */
    constructor(node_to_call, arg_nodes) {
        super();
        this.node_to_call = node_to_call;
        this.arg_nodes = arg_nodes;

        this.pos_start = this.node_to_call.pos_start;

        if (this.arg_nodes.length > 0) {
            this.pos_end = this.arg_nodes[this.arg_nodes.length - 1].pos_end;
        } else {
            this.pos_end = this.node_to_call.pos_end;
        }
    }
}

/**
 * @classdesc This node represents a string while reading the tokens.
 */
class StringNode extends CustomNode {
    /**
     * @constructs StringNode
     * @param {Token} tok The token that represents a string.
     */
    constructor(tok) {
        super();
        this.tok = tok;
        this.pos_start = this.tok.pos_start;
        this.pos_end = this.tok.pos_end;
    }

    toString() {
        return `${this.tok.toString()}`;
    }
}

/**
 * @classdesc This node represents a string while reading the tokens.
 */
class ListNode extends CustomNode {
    /**
     * @constructs ListNode
     * @param {Array<CustomNode>} element_nodes The token that represents a string.
     * @param {Position} pos_start The starting position of the list (we must have it from the constructor because of empty lists).
     * @param {Position} pos_end The end position of the list (we must have it from the constructor because of empty lists).
     */
    constructor(element_nodes, pos_start, pos_end) {
        super();
        this.element_nodes = element_nodes;
        this.pos_start = pos_start;
        this.pos_end = pos_end;
    }
}

/**
 * @classdesc A return keyword.
 */
class ReturnNode extends CustomNode {
    /**
     * @constructs ReturnNode
     * @param {CustomNode} node_to_return The value that we must return.
     * @param {Position} pos_start The starting position.
     * @param {Position} pos_end The end position.
     */
    constructor(node_to_return, pos_start, pos_end) {
        super();
        this.node_to_return = node_to_return;
        this.pos_start = pos_start;
        this.pos_end = pos_end;
    }
}

/**
 * @classdesc A return keyword.
 */
class ContinueNode extends CustomNode {
    /**
     * @constructs ContinueNode
     * @param {Position} pos_start The starting position.
     * @param {Position} pos_end The end position.
     */
    constructor(pos_start, pos_end) {
        super();
        this.pos_start = pos_start;
        this.pos_end = pos_end;
    }
}

/**
 * @classdesc A return keyword.
 */
class BreakNode extends CustomNode {
    /**
     * @constructs BreakNode
     * @param {Position} pos_start The starting position.
     * @param {Position} pos_end The end position.
     */
    constructor(pos_start, pos_end) {
        super();
        this.pos_start = pos_start;
        this.pos_end = pos_end;
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
        /** @var {CustomNode|null} */
        this.node = null;
        this.last_registered_advance_count = 0;
        this.advance_count = 0;
        this.to_reverse_count = 0;
    }

    register_advancement() {
        this.last_registered_advance_count = 1;
        this.advance_count += 1; // we want to known the exact amount to advancements.
    }

    /**
     * Registers a new node in order to verify if there is an error.
     * @param {any} res The result of an executed function.
     * @return {CustomNode|any|null} res.node.
     */
    register(res) {
        this.last_registered_advance_count = res.advance_count;
        this.advance_count += res.advance_count;
        if (res.error) this.error = res.error;
        return res.node;
    }

    /**
     * Tries to register for optional expressions.
     * @param {ParseResult} res 
     * @return {CustomNode|null}
     */
    try_register(res) {
        if (res.error) {
            this.to_reverse_count = res.advance_count;
            return null;
        }
        return this.register(res);
    }

    /**
     * A new node is correct.
     * @param {CustomNode|any|null} node The errorless node.
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
        this.update_current_tok();
        return this.current_tok;
    }

    reverse(amount=1) {
        this.tok_idx -= amount;
        this.update_current_tok();
        return this.current_tok;
    }

    update_current_tok() {
        if (this.tok_idx >= 0 && this.tok_idx < this.tokens.length) {
            this.current_tok = this.tokens[this.tok_idx];
        }
    }

    /**
     * Parses the tokens.
     * @returns {ParseResult}
     */
    parse() {
        let res = this.statements();
        if (!res.error && this.current_tok.type !== TOKENS.EOF) {
            return res.failure(new InvalidSyntaxError(
                this.current_tok.pos_start, this.current_tok.pos_end,
                "Expected '+', '-', '*', '/', '^', '==', '!=', '<', '>', '<=', '>=', 'AND' or 'OR'"
            ));
        }
        return res;
    }

    // -------------

    statements() {
        let res = new ParseResult();
        let statements = [];
        let pos_start = this.current_tok.pos_start.copy();

        while (this.current_tok.type === TOKENS.NEWLINE) {
            res.register_advancement();
            this.advance();
        }

        let statement = res.register(this.statement());
        if (res.error) return res;
        statements.push(statement);

        let more_statements = true;

        while (true) {
            let newline_count = 0;
            while (this.current_tok.type === TOKENS.NEWLINE) {
                res.register_advancement();
                this.advance();
                newline_count += 1;
            }

            // there are no more lines
            if (newline_count === 0) {
                more_statements = false;
            }

            if (!more_statements) break;
            statement = res.try_register(this.statement());
            if (!statement) {
                this.reverse(res.to_reverse_count);
                more_statements = false;
                continue;
            }

            statements.push(statement);
        }

        return res.success(new ListNode(
            statements,
            pos_start,
            this.current_tok.pos_end.copy()
        ));
    }

    statement() {
        let res = new ParseResult();
        let pos_start = this.current_tok.pos_start.copy();

        if (this.current_tok.matches(TOKENS.KEYWORD, "RETURN")) {
            res.register_advancement();
            this.advance();

            let expr = res.try_register(this.expr());
            if (!expr) this.reverse(res.to_reverse_count);
            
            return res.success(new ReturnNode(expr, pos_start, this.current_tok.pos_start.copy()));
        }

        if (this.current_tok.matches(TOKENS.KEYWORD, "CONTINUE")) {
            res.register_advancement();
            this.advance();
            return res.success(new ContinueNode(pos_start, this.current_tok.pos_start.copy()));
        }

        if (this.current_tok.matches(TOKENS.KEYWORD, "BREAK")) {
            res.register_advancement();
            this.advance();
            return res.success(new BreakNode(pos_start, this.current_tok.pos_start.copy()));
        }

        let expr = res.register(this.expr());
        if (res.error) {
            return res.failure(new InvalidSyntaxError(
                this.current_tok.pos_start, this.current_tok.pos_end,
                "Expected 'RETURN', 'CONTINUE', 'BREAK' 'VAR', 'IF', 'FOR', 'WHILE', 'FUNC', int, float, identifier, '+', '-', '(', '[' or 'NOT'"
            ));
        }
        return res.success(expr);
    }

    // an expression is looking for terms.
    expr() {
        let res = new ParseResult();

        // first of all, we need to check if this is a variable declaration
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

            return res.success(new VarAssignNode(var_name_tok, expr));
        }

        // evaluate a binary operation between two terms separated by PLUS or MINUS.
        let node = res.register(this.bin_op(this.comp_expr.bind(this), [[TOKENS.KEYWORD, "AND"], [TOKENS.KEYWORD, "OR"]]));
        
        if (res.error) {
            return res.failure(new InvalidSyntaxError(
                this.current_tok.pos_start, this.current_tok.pos_end,
                "Expected 'VAR', 'IF', 'FOR', 'WHILE', 'FUNC', int, float, identifier, '+', '-', '(', '[' or 'NOT'"
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

            return res.success(new UnaryOpNode(op_tok, node));
        }

        let node = res.register(this.bin_op(this.arith_expr.bind(this), [TOKENS.EE, TOKENS.NE, TOKENS.LT, TOKENS.GT, TOKENS.LTE, TOKENS.GTE]));
        
        if (res.error) {
            return res.failure(new InvalidSyntaxError(
                this.current_tok.pos_start, this.current_tok.pos_end,
                "Expected int, float, identifier, '+', '-', '(', '[' or 'NOT'"
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
            return res.success(new UnaryOpNode(tok, factor));
        }

        return this.power();
    }

    // a power operation is looking for calls
    power() {
        return this.bin_op(this.call.bind(this), [TOKENS.POWER], this.factor.bind(this));
    }

    call() {
        let res = new ParseResult();
        let atom = res.register(this.atom());
        if (res.error) return res;

        // if we have a left parenthesis after our atom
        // that means we are calling the atom

        if (this.current_tok.type === TOKENS.LPAREN) {
            res.register_advancement()
            this.advance();

            let arg_nodes = [];
            if (this.current_tok.type === TOKENS.RPAREN) {
                res.register_advancement();
                this.advance();
            } else {
                arg_nodes.push(res.register(this.expr()));
                if (res.error) {
                    return res.failure(new InvalidSyntaxError(
                        this.current_tok.pos_start, this.current_tok.pos_end,
                        "Expected ')', 'VAR', 'IF', 'FOR', 'WHILE', 'FUN', int, float, identifier, '+', '-', '(', '[' or 'NOT'"
                    ));
                }

                while (this.current_tok.type === TOKENS.COMMA) {
                    res.register_advancement();
                    this.advance();

                    arg_nodes.push(res.register(this.expr()));
                    if (res.error) return res;
                }

                if (this.current_tok.type !== TOKENS.RPAREN) {
                    return res.failure(new InvalidSyntaxError(
                        this.current_tok.pos_start, this.current_tok.pos_end,
                        "Expected ',' or ')'"
                    ));
                }

                res.register_advancement();
                this.advance();
            }

            return res.success(new CallNode(atom, arg_nodes));
        }

        return res.success(atom);
    }

    atom() {
        let res = new ParseResult();
        let tok = this.current_tok;

        if ([TOKENS.INT, TOKENS.FLOAT].includes(tok.type)) {
            res.register_advancement();
            this.advance();
            return res.success(new NumberNode(tok));
        } else if ([TOKENS.STRING].includes(tok.type)) {
            res.register_advancement();
            this.advance();
            return res.success(new StringNode(tok));
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
                return res.success(expr);
            } else {
                return res.failure(new InvalidSyntaxError(
                    this.current_tok.pos_start, this.current_tok.pos_end,
                    "Expected ')'"
                ));
            }
        } else if (tok.type === TOKENS.LSQUARE) {
            let list_expr = res.register(this.list_expr());
            if (res.error) return res;
            return res.success(list_expr);
        } else if (tok.matches(TOKENS.KEYWORD, "IF")) {
            let if_expr = res.register(this.if_expr());
            if (res.error) return res;
            return res.success(if_expr);
        } else if (tok.matches(TOKENS.KEYWORD, "FOR")) {
            let for_expr = res.register(this.for_expr());
            if (res.error) return res;
            return res.success(for_expr);
        } else if (tok.matches(TOKENS.KEYWORD, "WHILE")) {
            let while_expr = res.register(this.while_expr());
            if (res.error) return res;
            return res.success(while_expr);
        } else if (tok.matches(TOKENS.KEYWORD, "FUNC")) {
            let func_def = res.register(this.func_def());
            if (res.error) return res;
            return res.success(func_def);
        }

        return res.failure(new InvalidSyntaxError(
            tok.pos_start, tok.pos_end,
            "Expected int, float, identifier '+', '-', '(', '[', 'IF', 'FOR', 'WHILE', 'FUNC'"
        ));
    }

    /**
     * Evaluates a `IF` statement or an `ELIF` statement.
     * @param {string} case_keyword The word of the statement.
     * @return {ParseResult}
     */
    if_expr_cases(case_keyword) {
        let res = new ParseResult();
        let cases = [];
        let else_case = { code: null, should_return_null: false };

        // we must have a "IF" (or "ELIF" since multi-lines support) keyword

        if (!this.current_tok.matches(TOKENS.KEYWORD, case_keyword)) {
            return res.failure(new InvalidSyntaxError(
                this.current_tok.pos_start, this.current_tok.pos_end,
                `Expected '${case_keyword}'`
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

        if (this.current_tok.type === TOKENS.NEWLINE) {
            res.register_advancement();
            this.advance();

            let statements = res.register(this.statements());
            if (res.error) return res;

            // true = should return null ?
            // before we returned the evaluated expr
            // now if we are on several lines, we don't want to return anything
            cases.push([condition, statements, true]);

            if (this.current_tok.matches(TOKENS.KEYWORD, 'END')) {
                res.register_advancement();
                this.advance();
            } else {
                const all_cases = res.register(this.if_expr_elif_or_else());
                if (res.error) return res;
                let new_cases = all_cases.cases;
                else_case = all_cases.else_case;
                
                if (new_cases.length > 0) {
                    cases = [...cases, ...new_cases];
                }
            }
        } else {
            let expr = res.register(this.statement());
            if (res.error) return res;

            cases.push([condition, expr, false]); // we want the return value of a if statement (that's why false)

            const all_cases = res.register(this.if_expr_elif_or_else());
            if (res.error) return res;
            let new_cases = all_cases.cases;
            else_case = all_cases.else_case;
            if (new_cases.length > 0) {
                cases = [...cases, ...new_cases];
            }
        }

        return res.success({ cases: cases, else_case: else_case });
    }

    if_expr_elif() {
        return this.if_expr_cases('ELIF');
    }

    if_expr_else() {
        let res = new ParseResult();
        let else_case = { code: null, should_return_null: false };

        if (this.current_tok.matches(TOKENS.KEYWORD, "ELSE")) {
            res.register_advancement();
            this.advance();

            if (this.current_tok.type === TOKENS.NEWLINE) {
                res.register_advancement();
                this.advance();

                let statements = res.register(this.statements());
                if (res.error) return res;
                else_case = { code: statements, should_return_null: true };

                if (this.current_tok.matches(TOKENS.KEYWORD, "END")) {
                    res.register_advancement();
                    this.advance();
                } else {
                    return res.failure(new InvalidSyntaxError(
                        this.current_tok.pos_start, this.current_tok.pos_end,
                        "Expected 'END'"
                    ));
                }
            } else {
                let expr = res.register(this.statement());
                if (res.error) return res;
                else_case = { code: expr, should_return_null: false };
            }
        }

        return res.success(else_case);
    }

    if_expr_elif_or_else() {
        let res = new ParseResult();
        let cases = [];
        let else_case = { code: null, should_return_null: false };

        if (this.current_tok.matches(TOKENS.KEYWORD, "ELIF")) {
            const all_cases = res.register(this.if_expr_elif());
            if (res.error) return res;
            cases = all_cases.cases;
            else_case = all_cases.else_case;
        } else {
            else_case = res.register(this.if_expr_else());
            if (res.error) return res;
        }

        return res.success({ cases, else_case });
    }

    if_expr() {
        let res = new ParseResult();
        const all_cases = res.register(this.if_expr_cases("IF"));
        if (res.error) return res;
        /** @type {Array} */
        const cases = all_cases.cases;
        const else_case = all_cases.else_case;
        return res.success(new IfNode(cases, else_case));
    }

    for_expr() {
        let res = new ParseResult();

        // we must check if there is the "FOR" keyword
        
        if (!this.current_tok.matches(TOKENS.KEYWORD, "FOR")) {
            return res.failure(new InvalidSyntaxError(
                this.current_tok.pos_start, this.current_tok.pos_end,
                "Expected 'FOR'"
            ));
        }

        res.register_advancement();
        this.advance();

        // we need now the variable name, so just an identifier (there is no VAR keyword)

        if (this.current_tok.type !== TOKENS.IDENTIFIER) {
            return res.failure(new InvalidSyntaxError(
                this.current_tok.pos_start, this.current_tok.pos_end,
                "Expected identifier"
            ));
        }

        let var_name_tok = this.current_tok;
        res.register_advancement();
        this.advance();

        // the variable i needs to have a value, so there must be an equal token

        if (this.current_tok.type !== TOKENS.EQ) {
            return res.failure(new InvalidSyntaxError(
                this.current_tok.pos_start, this.current_tok.pos_end,
                "Expected '='"
            ));
        }

        res.register_advancement();
        this.advance();

        // after the equal token, we expect an expr

        let start_value = res.register(this.expr());
        if (res.error) return res;

        // after the expr, we expect a "TO"

        if (!this.current_tok.matches(TOKENS.KEYWORD, 'TO')) {
            return res.failure(new InvalidSyntaxError(
                this.current_tok.pos_start, this.current_tok.pos_end,
                "Expected 'TO'"
            ));
        }

        res.register_advancement();
        this.advance();
        
        // the "TO" keyword indicates the end value

        let end_value = res.register(this.expr());
        if (res.error) return res;

        // we could have a "STEP" keyword afterwards

        let step_value = null;
        if (this.current_tok.matches(TOKENS.KEYWORD, "STEP")) {
            res.register_advancement();
            this.advance();

            step_value = res.register(this.expr());
            if (res.error) return res;
        }

        if (!this.current_tok.matches(TOKENS.KEYWORD, "THEN")) {
            return res.failure(new InvalidSyntaxError(
                this.current_tok.pos_start, this.current_tok.pos_end,
                "Expected 'THEN'"
            ));
        }

        res.register_advancement();
        this.advance();

        // there might be a new line
        if (this.current_tok.type === TOKENS.NEWLINE) {
            res.register_advancement();
            this.advance();

            let extended_body = res.register(this.statements());
            if (res.error) return res;

            if (!this.current_tok.matches(TOKENS.KEYWORD, "END")) {
                return res.failure(new InvalidSyntaxError(
                    this.current_tok.pos_start, this.current_tok.pos_end,
                    "Expected 'END'"
                ));
            }

            res.register_advancement();
            this.advance();

            return res.success(new ForNode(
                var_name_tok,
                start_value,
                end_value,
                step_value,
                extended_body,
                true // should return null
            ));
        }
        
        // now there is the body of the statement

        let body = res.register(this.statement());
        if (res.error) return res;

        return res.success(new ForNode(var_name_tok, start_value, end_value, step_value, body, false));
    }

    while_expr() {
        let res = new ParseResult();

        // we must check if there is the "WHILE" keyword

        if (!this.current_tok.matches(TOKENS.KEYWORD, "WHILE")) {
            return res.failure(new InvalidSyntaxError(
                this.current_tok.pos_start, this.current_tok.pos_end,
                "Expected 'WHILE'"
            ));
        }

        res.register_advancement();
        this.advance();

        // after the while keyword, there must be an expression

        let condition = res.register(this.expr());
        if (res.error) return res;

        // after the condition, we expect a "THEN" keyword

        if (!this.current_tok.matches(TOKENS.KEYWORD, 'THEN')) {
            return res.failure(new InvalidSyntaxError(
                this.current_tok.pos_start, this.current_tok.pos_end,
                "Expected 'THEN'"
            ));
        }

        res.register_advancement();
        this.advance();

        if (this.current_tok.type === TOKENS.NEWLINE) {
            res.register_advancement();
            this.advance();

            let extended_body = res.register(this.statements());
            if (res.error) return res;

            if (!this.current_tok.matches(TOKENS.KEYWORD, "END")) {
                return res.failure(new InvalidSyntaxError(
                    this.current_tok.pos_start, this.current_tok.pos_end,
                    "Expected 'END'"
                ));
            }

            res.register_advancement();
            this.advance();

            return res.success(new WhileNode(
                condition,
                extended_body,
                true // should return null? True
            ));
        }

        let body = res.register(this.statement());
        if (res.error) return res;

        return res.success(new WhileNode(condition, body, false)); // should return null? False
    }

    func_def() {
        let res = new ParseResult();

        // we must check if there is the FUNC keyword

        if (!this.current_tok.matches(TOKENS.KEYWORD, "FUNC")) {
            return res.failure(new InvalidSyntaxError(
                this.current_tok.pos_start, this.current_tok.pos_end,
                "Expected 'FUNC'"
            ));
        }

        // we advance in order to find the identifier

        res.register_advancement();
        this.advance();

        // there might be no identifier (anonymous function)

        let var_name_tok = null;
        if (this.current_tok.type === TOKENS.IDENTIFIER) {
            var_name_tok = this.current_tok;
            res.register_advancement();
            this.advance();
            // there must be a left parenthesis after the identifier
            if (this.current_tok.type !== TOKENS.LPAREN) {
                return res.failure(new InvalidSyntaxError(
                    this.current_tok.pos_start, this.current_tok.pos_end,
                    "Expected '('"
                ));
            }
        } else {
            // anonymous function, no identifier
            // there must be a left parenthesis after anyway
            if (this.current_tok.type !== TOKENS.LPAREN) {
                return res.failure(new InvalidSyntaxError(
                    this.current_tok.pos_start, this.current_tok.pos_end,
                    "Expected identifier or '('"
                ));
            }
        }

        // we enter the parenthesis

        res.register_advancement();
        this.advance();

        let is_optional = false; // once there is an optional argument, this goes to true
        // indeed, we cannot have a mandatory argument after an optional one.

        let arg_name_toks = []; // all the args
        let mandatory_arg_name_toks = []; // the mandatory args
        let optional_name_toks = []; // the optional args
        let default_values_nodes = []; // the tokens for the default values
        if (this.current_tok.type === TOKENS.IDENTIFIER) {

            // there is an identifier
            // advance
            // check if there is a question mark
            // if there is a question mark, check if there is an equal sign
            // if there is an equal sign, advance and get the default value (an expr)
            const check_for_optional_args = () => {
                let identifier_token = this.current_tok;
                arg_name_toks.push(identifier_token);
                res.register_advancement();
                this.advance();

                // there might be a question mark
                // optional
                if (this.current_tok.type === TOKENS.QMARK) {
                    is_optional = true;
                    let question_mark_tok = this.current_tok;
                    optional_name_toks.push(identifier_token);
                    res.register_advancement();
                    this.advance();

                    // there might be an equal sign
                    // to customize the default value
                    // which is null by default
                    if (this.current_tok.type === TOKENS.EQ) {
                        res.register_advancement();
                        this.advance();

                        let node_default_value = res.register(this.expr());
                        if (res.error) {
                            return res.failure(new InvalidSyntaxError(
                                this.current_tok.pos_start, this.current_tok.pos_end,
                                "Expected default value for the argument."
                            ));
                        }

                        default_values_nodes.push(node_default_value);
                    } else {
                        let df = new NumberNode(new Token(TOKENS.INT, CustomNumber.null.value, question_mark_tok.pos_start, question_mark_tok.pos_end));
                        default_values_nodes.push(df);
                    }
                } else { // mandatory with no default value
                    // there was an optional argument already
                    // so there is a mandatory argument after an optional one
                    // that's not good
                    if (is_optional) {
                        return res.failure(new InvalidSyntaxError(
                            identifier_token.pos_start, identifier_token.pos_end,
                            "Expected an optional argument."
                        ));
                    } else {
                        mandatory_arg_name_toks.push(identifier_token);
                    }
                }
            };

            check_for_optional_args();

            // there are arguments, how many ?
            // we want them all
            while (this.current_tok.type === TOKENS.COMMA) {
                res.register_advancement();
                this.advance();

                // there must be an identifier after the comma (the arg)
                if (this.current_tok.type !== TOKENS.IDENTIFIER) {
                    return res.failure(new InvalidSyntaxError(
                        this.current_tok.pos_start, this.current_tok.pos_end,
                        "Expected identifier"
                    ));
                }

                check_for_optional_args();
            }

            // we have all the args,
            // now there must be a right parenthesis

            if (this.current_tok.type !== TOKENS.RPAREN) {
                return res.failure(new InvalidSyntaxError(
                    this.current_tok.pos_start, this.current_tok.pos_end,
                    "Expected ',' or ')'"
                ));
            }
        } else {
            // there is no identifier (no args)
            // so we must find a right parenthesis
            if (this.current_tok.type !== TOKENS.RPAREN) {
                return res.failure(new InvalidSyntaxError(
                    this.current_tok.pos_start, this.current_tok.pos_end,
                    "Expected identifier or ')'"
                ));
            }
        }

        // we get out of the parenthesis

        res.register_advancement();
        this.advance();

        // we should have an arrow now
        // if we have an inline function
        if (this.current_tok.type === TOKENS.ARROW) {
            // great, enter the body now

            res.register_advancement();
            this.advance();

            // what's our body ?
            let node_to_return = res.register(this.expr());
            if (res.error) return res;

            return res.success(new FuncDefNode(
                var_name_tok, // the name
                arg_name_toks, // all the arguments
                mandatory_arg_name_toks, // the mandatory arguments
                optional_name_toks, // the optional arguments
                default_values_nodes, // their default values
                node_to_return, // the body,
                true // should auto return? True because the arrow behaves like the `return` keyword.
            ));
        }

        // now there might be a new line

        if (this.current_tok.type !== TOKENS.NEWLINE) {
            return res.failure(new InvalidSyntaxError(
                this.current_tok.pos_start, this.current_tok.pos_end,
                "Expected '->' or a new line"
            )); 
        }

        res.register_advancement();
        this.advance();

        let body = res.register(this.statements());
        if (res.error) return res;

        if (!this.current_tok.matches(TOKENS.KEYWORD, "END")) {
            return res.failure(new InvalidSyntaxError(
                this.current_tok.pos_start, this.current_tok.pos_end,
                "Expected 'END'"
            ));
        }

        res.register_advancement();
        this.advance();

        return res.success(new FuncDefNode(
            var_name_tok,
            arg_name_toks,
            mandatory_arg_name_toks,
            optional_name_toks,
            default_values_nodes,
            body,
            false // should auto return? False because we need a `return` keyword for a several-line function
        ));
    }

    list_expr() {
        let res = new ParseResult();
        let element_nodes = [];
        let pos_start = this.current_tok.pos_start.copy();

        if (this.current_tok.type !== TOKENS.LSQUARE) {
            return res.failure(new InvalidSyntaxError(
                this.current_tok.pos_start, this.current_tok.pos_end,
                "Expected '['"
            ));
        }

        res.register_advancement();
        this.advance();

        // if the list is empty ("[]")
        if (this.current_tok.type === TOKENS.RSQUARE) {
            res.register_advancement();
            this.advance();
        } else {
            // we have values inside the list
            // it's actually the same as getting arguments from the call method,
            // so just copy past ;(
            element_nodes.push(res.register(this.expr()));
            if (res.error) {
                return res.failure(new InvalidSyntaxError(
                    this.current_tok.pos_start, this.current_tok.pos_end,
                    "Expected ']', 'VAR', 'IF', 'FOR', 'WHILE', 'FUN', int, float, identifier, '+', '-', '(', '[' or 'NOT'"
                ));
            }

            while (this.current_tok.type === TOKENS.COMMA) {
                res.register_advancement();
                this.advance();

                element_nodes.push(res.register(this.expr()));
                if (res.error) return res;
            }

            if (this.current_tok.type !== TOKENS.RSQUARE) {
                return res.failure(new InvalidSyntaxError(
                    this.current_tok.pos_start, this.current_tok.pos_end,
                    "Expected ',' or ']'"
                ));
            }

            res.register_advancement();
            this.advance();
        }

        return res.success(new ListNode(
            element_nodes,
            pos_start,
            this.current_tok.pos_end.copy()
        ));
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
            left = new BinOpNode(left, op_tok, right);
        }

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
        this.reset();
    }

    reset() {
        /** @var {any} */
        this.value = null;
        /** @var {null|CustomError} */
        this.error = null;

        // we want the following behavior
        // VAR a = RETURN 5
        // this allows us to return with the value 5 AND assign a variable

        this.func_return_value = null;
        this.loop_should_continue = false;
        this.loop_should_break = false;
    }

    /**
     * Registers an action during runtime and checks if an error has been thrown.
     * @param {any} res The value to be registered.
     * @return {any} The value.
     */
    register(res) {
        this.error = res.error;
        this.func_return_value = res.func_return_value;
        this.loop_should_continue = res.loop_should_continue;
        this.loop_should_break = res.loop_should_break;
        return res.value;
    }

    /**
     * Registers a successful action during runtime.
     * @param {any} value The correct value.
     * @return {this}
     */
    success(value) {
        this.reset();
        this.value = value;
        return this;
    }

    /**
     * Registers a successful action when returning a value (through a function).
     * @param {any} value The value we are returning.
     * @return {this}
     */
    success_return(value) {
        this.reset();
        this.func_return_value = value;
        return this;
    }

    /**
     * Registers a successful action when continueing a loop.
     * @returns {this}
     */
    success_continue() {
        this.reset();
        this.loop_should_continue = true;
        return this;
    }

    /**
     * Registers a successful action when breaking a loop.
     * @returns {this}
     */
    success_break() {
        this.reset();
        this.loop_should_break = true;
        return this;
    }

    /**
     * Registers an unsuccessful action during runtime.
     * @param {CustomError} error The error.
     * @return {this}
     */
    failure(error) {
        this.reset();
        this.error = error;
        return this;
    }

    /**
     * Stops the program if there is an error, or if we should return, continue or break.
     * @returns {boolean}
     */
    should_return() {
        return this.error
                || this.func_return_value
                || this.loop_should_continue
                || this.loop_should_break
    }
}

/*
*
* VALUES
*
*/

class Value {
    constructor() {
        this.set_pos();
        this.set_context();
    }

    /**
     * We need to know where is that number in the program.
     * @param {Position|null} pos_start The starting position of the number.
     * @param {Position|null} pos_end The end position of the number.
     * @return {this}
     */
    set_pos(pos_start=null, pos_end=null) {
        this.pos_start = pos_start;
        this.pos_end = pos_end;
        return this;
    }

    /**
     * Saves the context.
     * @param {Context|null} context The current context.
     * @return {this}
     */
    set_context(context=null) {
        this.context = context;
        return this;
    }

    // THESE FUNCTIONS ARE MEANT TO BE OVERWRITTEN
    // HOWEVER IF THEY ARE CALLED WITHOUT BEING OVERWRITTEN,
    // THAT MEANS IT'S AN ILLEGAL OPERATION (we should not be able to do theses calculations).
    
    added_to(other) { return { result: null, error: this.illegal_operation(other) } }
    subbed_by(other) { return { result: null, error: this.illegal_operation(other) } }
    multed_by(other) { return { result: null, error: this.illegal_operation(other) } }
    dived_by(other) { return { result: null, error: this.illegal_operation(other) } }
    powered_by(other) { return { result: null, error: this.illegal_operation(other) } }
    get_comparison_eq(other) { return { result: null, error: this.illegal_operation(other) } }
    get_comparison_ne(other) { return { result: null, error: this.illegal_operation(other) } }
    get_comparison_lt(other) { return { result: null, error: this.illegal_operation(other) } }
    get_comparison_gt(other) { return { result: null, error: this.illegal_operation(other) } }
    get_comparison_lte(other) { return { result: null, error: this.illegal_operation(other) } }
    get_comparison_gte(other) { return { result: null, error: this.illegal_operation(other) } }
    anded_by(other) { return { result: null, error: this.illegal_operation(other) } }
    ored_by(other) { return { result: null, error: this.illegal_operation(other) } }
    notted(other) { return { result: null, error: this.illegal_operation(other) } }
    
    // ----------------

    // meant to be overwritten
    execute(args, pos_start, pos_end) {
        return new RTResult().failure(this.illegal_operation());
    }

    copy() {
        throw new Error("No copy method defined.");
    }

    is_true() {
        return false;
    }

    /**
     * Throws a runtime error.
     * @param self The instance.
     * @param {any} other A number.
     */
    illegal_operation(self=this, other=null) {
        if (!other) other = self;
        return new RTError(
            other.pos_start, other.pos_end,
            "Illegal operation",
            self.context
        );
    }
}

/**
 * @classdesc A number of the program.
 */
class CustomNumber extends Value {
    /**
     * @constructs CustomNumber
     * @param {number} value The value of a NumberNode.
     */
    constructor(value) {
        super();
        this.value = value;
    }

    // The functions needed to perform calculations on that number (this.value).

    /**
     * Adds a number.
     * @param {CustomNumber} other_number The number to be added to our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    added_to(other_number) {
        if (other_number instanceof CustomNumber) {
            return { result: new CustomNumber(this.value + other_number.value).set_context(this.context), error: null };
        } else {
            return { result: null, error: new Value().illegal_operation(this, other_number) };
        }
    }

    /**
     * Substracts by a number.
     * @param {CustomNumber} other_number The number to be substracted by our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    subbed_by(other_number) {
        if (other_number instanceof CustomNumber) {
            return { result: new CustomNumber(this.value - other_number.value).set_context(this.context), error: null };
        } else {
            return { result: null, error: new Value().illegal_operation(this, other_number) };
        }
    }

    /**
     * Multiplies by a number.
     * @param {CustomNumber} other_number The number to be multiplied by our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    multed_by(other_number) {
        if (other_number instanceof CustomNumber) {
            return { result: new CustomNumber(this.value * other_number.value).set_context(this.context), error: null };
        } else {
            return { result: null, error: new Value().illegal_operation(this, other_number) };
        }
    }

    /**
     * Divides a number.
     * @param {CustomNumber} other_number The number to be divided by our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    dived_by(other_number) {
        if (other_number instanceof CustomNumber) {
            if (other_number.value === 0) {
                return { result: null, error: new RTError(
                    other_number.pos_start, other_number.pos_end,
                    "Division by Zero",
                    this.context
                )};
            }
            return { result: new CustomNumber(this.value / other_number.value).set_context(this.context), error: null };
        } else {
            return { result: null, error: new Value().illegal_operation(this, other_number) };
        }
    }

    /**
     * Powered by a number.
     * @param {CustomNumber} other_number The number to be powered by our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    powered_by(other_number) {
        if (other_number instanceof CustomNumber) {
            return { result: new CustomNumber(this.value ** other_number.value).set_context(this.context), error: null };
        } else {
            return { result: null, error: new Value().illegal_operation(this, other_number) };
        }
    }

    /**
     * Checks if our value is equals to the other value.
     * @param {CustomNumber} other_number The number to be compared with our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    get_comparison_eq(other_number) {
        if (other_number instanceof CustomNumber) {
            return { result: new CustomNumber(new Number(this.value == other_number.value).valueOf()).set_context(this.context), error: null };
        } else {
            return { result: null, error: new Value().illegal_operation(this, other_number) };
        }
    }

    /**
     * Checks if our value is not equals to the other value.
     * @param {CustomNumber} other_number The number to be compared with our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    get_comparison_ne(other_number) {
        if (other_number instanceof CustomNumber) {
            return { result: new CustomNumber(new Number(this.value != other_number.value).valueOf()).set_context(this.context), error: null };
        } else {
            return { result: null, error: new Value().illegal_operation(this, other_number) };
        }
    }

    /**
     * Checks if our value is less than the other value.
     * @param {CustomNumber} other_number The number to be compared with our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    get_comparison_lt(other_number) {
        if (other_number instanceof CustomNumber) {
            return { result: new CustomNumber(new Number(this.value < other_number.value).valueOf()).set_context(this.context), error: null };
        } else {
            return { result: null, error: new Value().illegal_operation(this, other_number) };
        }
    }

    /**
     * Checks if our value is greater than the other value.
     * @param {CustomNumber} other_number The number to be compared with our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    get_comparison_gt(other_number) {
        if (other_number instanceof CustomNumber) {
            return { result: new CustomNumber(new Number(this.value > other_number.value).valueOf()).set_context(this.context), error: null };
        } else {
            return { result: null, error: new Value().illegal_operation(this, other_number) };
        }
    }

    /**
     * Checks if our value is less than or equals the other value.
     * @param {CustomNumber} other_number The number to be compared with our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    get_comparison_lte(other_number) {
        if (other_number instanceof CustomNumber) {
            return { result: new CustomNumber(new Number(this.value <= other_number.value).valueOf()).set_context(this.context), error: null };
        } else {
            return { result: null, error: new Value().illegal_operation(this, other_number) };
        }
    }

    /**
     * Checks if our value is greater than or equals the other value.
     * @param {CustomNumber} other_number The number to be compared with our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    get_comparison_gte(other_number) {
        if (other_number instanceof CustomNumber) {
            return { result: new CustomNumber(new Number(this.value >= other_number.value).valueOf()).set_context(this.context), error: null };
        } else {
            return { result: null, error: new Value().illegal_operation(this, other_number) };
        }
    }

    /**
     * Checks if both values are true (1).
     * @param {CustomNumber} other_number The number to be compared with our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    anded_by(other_number) {
        if (other_number instanceof CustomNumber) {
            return { result: new CustomNumber(new Number(this.value && other_number.value).valueOf()).set_context(this.context), error: null };
        } else {
            return { result: null, error: new Value().illegal_operation(this, other_number) };
        }
    }

    /**
     * Checks if one or both values are true (1).
     * @param {CustomNumber} other_number The number to be compared with our value.
     * @return {{result: CustomNumber, error: RTError|null}} The new number (result) and a potential error.
     */
    ored_by(other_number) {
        if (other_number instanceof CustomNumber) {
            return { result: new CustomNumber(new Number(this.value || other_number.value).valueOf()).set_context(this.context), error: null };
        } else {
            return { result: null, error: new Value().illegal_operation(this, other_number) };
        }
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

// Contants
CustomNumber.null = new CustomNumber(0);
CustomNumber.false = new CustomNumber(0);
CustomNumber.true = new CustomNumber(1);
CustomNumber.math_pi = new CustomNumber(Math.PI);

/**
 * @classdesc A class shared between CustomFunction & BuiltInFunction.
 */
class BaseFunction extends Value {
    /**
     * @constructs BaseFunction
     * @param {string} name The name of the function.
     */
    constructor(name) {
        super();
        this.name = name || "<anonymous>";
    }

    /**
     * Generates a new context.
     * @returns {Context}
     */
    generate_new_context() {
        let new_context = new Context(this.name, this.context, this.pos_start);
        new_context.symbol_table = new SymbolTable(new_context.parent.symbol_table);
        return new_context;
    }

    /**
     * Checks if the number of arguments correspond.
     * @param {Array<string>} arg_names The names of the arguments.
     * @param {Array<string>} mandatory_arg_names The names of the mandatory arguments.
     * @param {Array} given_args The values of the given arguments (the function has been called by the user).
     * @return {RTResult}
     */
    check_args(arg_names, mandatory_arg_names, given_args) {
        let res = new RTResult();

        // too many arguments
        if (given_args.length > arg_names.length) {
            return res.failure(new RTError(
                this.pos_start, this.pos_end,
                `${given_args.length - arg_names.length} too many args passed into '${this.name}'`,
                this.context
            ));
        }

        // too few arguments
        if (given_args.length < mandatory_arg_names.length) {
            return res.failure(new RTError(
                this.pos_start, this.pos_end,
                `${mandatory_arg_names.length - given_args.length} too few args passed into '${this.name}'`,
                this.context
            ));
        }

        return res.success(null);
    }

    /**
     * Puts the arguments in the symbol table (gives the values to their identifier).
     * @param {Array<string>} arg_names The names of the arguments.
     * @param {Array<string>} mandatory_arg_names The names of the mandatory arguments.
     * @param {Array<string>} optional_arg_names The names of the optional arguments.
     * @param {Array} default_values The default values of the optional arguments.
     * @param {Array} given_args The values of the arguments.
     * @param {Context} exec_ctx The context.
     */
    populate_args(arg_names, mandatory_arg_names, optional_arg_names, default_values, given_args, exec_ctx) {
        // we have the names of the arguments,
        // we get the values of our arguments

        for (let i = 0; i < given_args.length; i++) {
            let arg_name = arg_names[i];
            let arg_value = given_args[i];
            arg_value.set_context(exec_ctx);
            exec_ctx.symbol_table.set(arg_name, arg_value); // create the variables (= args)
        }

        // there cannot be any optional arguments after mandatory arguments
        let total_of_possible_arguments = optional_arg_names.length + mandatory_arg_names.length;
        if (given_args.length < total_of_possible_arguments) {
            // optional_arg_names.length === default_values.length
            // Avoid replacing default values because both arrays (mandatory args & optional args) don't start at the same index
            let index_start = given_args.length - mandatory_arg_names.length;
            for (let i = index_start; i < optional_arg_names.length; i++) {
                let arg_name = optional_arg_names[i];
                let arg_value = default_values[i];
                arg_value.set_context(exec_ctx);
                exec_ctx.symbol_table.set(arg_name, arg_value);
            }
        }
    }

    /**
     * Checks the arguments & puts them in the symbol table (gives the values to their identifier).
     * @param {Array<string>} arg_names The names of the arguments.
     * @param {Array<string>} mandatory_arg_names The names of the mandatory arguments.
     * @param {Array<string>} optional_arg_names The names of the optional arguments.
     * @param {Array} default_values The values of the optional arguments.
     * @param {Array} given_args The values of the arguments.
     * @param {Context} exec_ctx The context.
     */
    check_and_populate_args(arg_names, mandatory_arg_names, optional_arg_names, default_values, given_args, exec_ctx) {
        let res = new RTResult();
        res.register(this.check_args(arg_names, mandatory_arg_names, given_args));
        if (res.should_return()) return res;

        this.populate_args(arg_names, mandatory_arg_names, optional_arg_names, default_values, given_args, exec_ctx);
        return res.success(null);
    }
}

/**
 * @classdesc A function of the program.
 */
class CustomFunction extends BaseFunction {
    /**
     * @constructs CustomFunction 
     * @param {string} name The name of the variable.
     * @param {CustomNode} body_node The body.
     * @param {Array<string>} arg_names The list of arguments.
     * @param {Array<string>} mandatory_arg_name_toks The list of mandatory arguments.
     * @param {Array<string>} optional_args The list of optional args.
     * @param {Array} default_values The values of the optional args.
     * @param {boolean} should_auto_return Should auto return? Yes for inline functions because the `return` keyword is the arrow.
     */
    constructor(name, body_node, arg_names, mandatory_arg_name_toks, optional_args, default_values, should_auto_return) {
        super(name);
        this.body_node = body_node;
        this.arg_names = arg_names;
        this.mandatory_arg_name_toks = mandatory_arg_name_toks;
        this.optional_args = optional_args;
        this.default_values = default_values;
        this.should_auto_return = should_auto_return;
    }

    /**
     * Executes a custom function (this function has been called by the user).
     * @param {Array} args The given arguments.
     * @param {Position} pos_start The starting position of the call node.
     * @param {Position} pos_end The end position of the call node.
     * @return {RTResult}
     */
    execute(args, pos_start, pos_end) {
        let res = new RTResult();
        let interpreter = new Interpreter();
        let exec_ctx = this.generate_new_context();

        res.register(this.check_and_populate_args(this.arg_names, this.mandatory_arg_name_toks, this.optional_args, this.default_values, args, exec_ctx));
        if (res.should_return()) return res;

        let value = res.register(interpreter.visit(this.body_node, exec_ctx));
        if (res.should_return() && res.func_return_value == null) return res;

        let ret_value = (this.should_auto_return ? value : null) || res.func_return_value || CustomNumber.null;
        return res.success(ret_value);
    }

    /**
     * @override
     * @return {CustomFunction} A copy of that instance.
     */
    copy() {
        let copy = new CustomFunction(this.name, this.body_node, this.arg_names, this.mandatory_arg_name_toks, this.optional_args, this.default_values, this.should_auto_return);
        copy.set_context(this.context);
        copy.set_pos(this.pos_start, this.pos_end);
        return copy;
    }

    toString() {
        return `<function ${this.name}>`;
    }
}

/**
 * @classdesc Built-in functions.
 */
class BuiltInFunction extends BaseFunction {
    /**
     * @constructs BuiltInFunction
     * @param {string} name The name of the built-in function.
     */
    constructor(name) {
        super(name);
    }

    // This static property will have all the arguments of every built-in functions.
    // This allows us to declare the functions with their arguments at the same time.
    static ARGS = {};

    /**
     * Executes a built-in function.
     * @param {Array} args The arguments
     * @param {Position} pos_start The starting position of the call node.
     * @param {Position} pos_end The end position of the call node.
     * @return {RTResult}
     * @override
     */
    execute(args, pos_start, pos_end) {
        let res = new RTResult();
        let exec_ctx = this.generate_new_context();
        let method_name = `execute_${this.name}`;
        let method = BuiltInFunction.prototype[method_name];
        
        if (!method) {
            throw new Error(`No execute_${this.name} method defined.`);
        }

        let registered_args = BuiltInFunction.ARGS[this.name];
        if (registered_args) {
            res.register(this.check_and_populate_args(registered_args.names || [], registered_args.mandatories || [], registered_args.optional || [], registered_args.default_values || [], args, exec_ctx));
        } else {
            res.register(this.check_and_populate_args([], [], [], [], args, exec_ctx));
        }
        if (res.should_return()) return res;

        let return_value = res.register(method(exec_ctx, pos_start, pos_end));
        if (res.should_return()) return res;

        return res.success(return_value);
    }

    /**
     * @override
     * @return {BuiltInFunction} A copy of that instance.
     */
    copy() {
        let copy = new BuiltInFunction(this.name);
        copy.set_context(this.context);
        copy.set_pos(this.pos_start, this.pos_end);
        return copy;
    }

    toString() {
        return `<built-in function ${this.name}>`;
    }

    /*
    *
    * THE BUILT-IN FUNCTIONS
    *
    */

    /**
     * console.log
     * @param {Context} exec_ctx The context.
     * @return {RTResult}
     */
    execute_log(exec_ctx) {
        let value = exec_ctx.symbol_table.get('value');
        if (value instanceof CustomString) {
            value = value.repr();
        }
        console.log(value.toString()); // normal
        return new RTResult().success(CustomNumber.null);
    }

    /**
     * prompt
     * @param {Context} exec_ctx The context.
     * @return {RTResult}
     */
    execute_input(exec_ctx) {
        let ask = exec_ctx.symbol_table.get('text');
        let text = prompt()(ask);
        return new RTResult().success(new CustomString(text));
    }

    /**
     * Gives the length of a list.
     * @param {Context} exec_ctx The context.
     * @param {Position} pos_start The starting position of the call node.
     * @param {Position} pos_end The end position of the call node.
     */
    execute_append(exec_ctx, pos_start, pos_end) {
        let list = exec_ctx.symbol_table.get("list");
        let value = exec_ctx.symbol_table.get("value");

        if (!(list instanceof CustomList)) {
            return new RTResult().failure(new RTError(
                pos_start, pos_end,
                "First argument must be a list",
                exec_ctx
            ));
        }

        list.elements.push(value);
        return new RTResult().success(CustomNumber.null);
    }

    /**
     * Exists the program.
     * @param {Context} _exec_ctx The context.
     */
    execute_exit(_exec_ctx) {
        process.exit();
    }

    /**
     * Gives the length of a list.
     * @param {Context} exec_ctx The context.
     * @param {Position} pos_start The starting position of the call node.
     * @param {Position} pos_end The end position of the call node.
     */
    execute_len(exec_ctx, pos_start, pos_end) {
        let list = exec_ctx.symbol_table.get("list");
        if (!(list instanceof CustomList)) {
            return new RTResult().failure(new RTError(
                pos_start, pos_end,
                "Argument must be a list",
                exec_ctx
            ));
        }

        return new RTResult().success(new CustomNumber(list.elements.length));
    }

    /**
     * Runs a file.
     * @param {Context} exec_ctx The context.
     * @param {Position} pos_start The starting position of the call node.
     * @param {Position} pos_end The end position of the call node.
     */
    execute_run(exec_ctx, pos_start, pos_end) {
        let fn = exec_ctx.symbol_table.get("fn");
        if (!(fn instanceof CustomString)) {
            return new RTResult().failure(new RTError(
                pos_start, pos_end,
                "Argument must be string",
                exec_ctx
            ));
        }

        /** @type {string} */
        fn = fn.value; // js string now
        let script = ``;

        try {
            script = fs.readFileSync(fn, 'utf8');
        } catch(e) {
            return new RTResult().failure(new RTError(
                pos_start, pos_end,
                `Failed to load script "${fn}"\n` + e.toString(),
                exec_ctx
            ));
        }

        const { result, error } = run(fn, script);

        if (error) {
            return new RTResult().failure(new RTError(
                pos_start, pos_end,
                `Failed to finish executing script "${fn}"\n` + error.toString(),
                exec_ctx
            ));
        }

        return new RTResult().success(CustomNumber.null);
    }
}

// the built-in functions are defined at the end of this file

/**
 * @classdesc A string in the program.
 */
class CustomString extends Value {
    /**
     * @constructs CustomString
     * @param {string} value The string itself.
     */
    constructor(value) {
        super();
        this.value = value;
    }

    /**
     * Concatenates the string to another value.
     * @param {CustomNode} other A node to concatenate to the string.
     * @return {{result: CustomString, error: RTError|null}} The new string (result) and a potential error.
     */
    added_to(other) {
        if (other instanceof CustomString) {
            return { result: new CustomString(this.value + other.value).set_context(this.context), error: null };
        } else {
            return { result: null, error: new Value().illegal_operation(this, other) };
        }
    }

    /**
     * Repeats a string.
     * @param {CustomNode} other How many times the string has to be repeated? `other` must be an instance of CustomNumber.
     * @return {{result: CustomString, error: RTError|null}} The new string (result) and a potential error.
     */
    multed_by(other) {
        if (other instanceof CustomNumber) {
            return { result: new CustomString(this.value.repeat(other.value)).set_context(this.context), error: null };
        } else {
            return { result: null, error: new Value().illegal_operation(this, other) };
        }
    }

    /**
     * Checks if the string is not empty.
     * @returns {boolean} `true` if the string is not empty, false otherwise.
     */
    is_true() {
        return this.value.length > 0;
    }

    copy() {
        let copy = new CustomString(this.value);
        copy.set_context(this.context);
        copy.set_pos(this.pos_start, this.pos_end);
        return copy;
    }

    toString() {
        return `"${this.value}"`;
    }

    // We don't want the quotes when we console.log a string
    // So we need another function instead of toString()
    repr() {
        return `${this.value}`;
    }
}

/**
 * @classdesc A list in our program.
 */
class CustomList extends Value {
    /**
     * @constructs CustomList
     * @param {Array<CustomNode>} elements The elements inside the list.
     */
    constructor(elements) {
        super();
        this.elements = elements;
    }

    /**
     * Adds an element to our list.
     * @param {CustomNode} other A node to add in our list.
     * @return {{result: CustomList, error: RTError|null}} The new list (result) and a potential error.
     */
    added_to(other) {
        let new_list = this.copy();
        new_list.elements.push(other);
        return { result: new_list, error: null };
    }

    /**
     * Removes an element from our list.
     * @param {CustomNode} other The index of the element to be removed.
     * @return {{result: CustomList, error: RTError|null}} The new list (result) and a potential error.
     */
    subbed_by(other) {
        if (other instanceof CustomNumber) {
            let new_list = this.copy();
            // if the index doesn't exist,
            // an error can be thrown
            try {
                new_list.elements.splice(other.value, 1);
                return { result: new_list, error: null };
            } catch(e) {
                return { result: null, error: new RTError(
                    other.pos_start, other.pos_end,
                    "Element at this index could not be removed from list because index is out of bounds",
                    this.context
                ) };
            }
        } else {
            return { result: null, error: new Value().illegal_operation(this, other) };
        }
    }

    /**
     * Concatenates the list to a another list.
     * @param {CustomNode} other A list to concatenate to our list.
     * @return {{result: CustomList, error: RTError|null}} The new list (result) and a potential error.
     */
    multed_by(other) {
        if (other instanceof CustomList) {
            let new_list = this.copy();
            new_list.elements = new_list.elements.concat(other.elements);
            return { result: new_list, error: null };
        } else {
            return { result: null, error: new Value().illegal_operation(this, other) };
        }
    }

    /**
     * Gets an element from the list.
     * @param {CustomNode} other The index of the element to get. 
     * @return {{result: CustomNode, error: RTError|null}} The element and a potential error.
     */
    dived_by(other) {
        if (other instanceof CustomNumber) {
            let value = this.elements[other.value];
            if (value) {
                return { result: value, error: null };
            } else {
                return { result: null, error: new RTError(
                    other.pos_start, other.pos_end,
                    "Element at this index could not be retrieved from list because index is out of bounds",
                    this.context
                )};
            }
        } else {
            return { result: null, error: new Value().illegal_operation(this, other) };
        }
    }

    copy() {
        let copy = new CustomList(this.elements);
        copy.set_context(this.context);
        copy.set_pos(this.pos_start, this.pos_end);
        return copy;
    }

    toString() {
        return `[${this.elements.join(', ')}]`;
    }

    /**
     * Converts an array into a one dimensional array.
     * @returns {Array}
     */
    merge_into_1d_arr(arr) {
        return arr.reduce((acc, val) => acc.concat(val instanceof CustomList ? this.merge_into_1d_arr(val.elements) : (val.repr !== undefined ? val.repr() : val)), []);
    }

    repr() {
        // we want a one dimensional array
        // let new_table = this.merge_into_1d_arr(this.elements);
        // return `${new_table.join(', ')}`;
        return `[${this.elements.join(', ')}]`;
        // TODO !
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
    /**
     * @constructs SymbolTable
     * @param {SymbolTable|null} parent The parent symbol table.
     */
    constructor(parent=null) {
        this.symbols = new Map();
        // a parent symbol table (for a function for example)
        // we'll be able to remove all the variables after the execution of a function
        this.parent = parent;
    }

    /**
     * Gets a variable.
     * @param {string} name The name of a variable.
     */
    get(name) {
        let value = this.symbols.has(name) ? this.symbols.get(name) : null;
        // we check for the parent symbol table
        if (value === null && this.parent) {
            return this.parent.get(name);
        }
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
     * @param {CustomNode} node The node to be visited.
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
        } else if (node instanceof ForNode) {
            return this.visit_ForNode(node, context);
        } else if (node instanceof WhileNode) {
            return this.visit_WhileNode(node, context);
        } else if (node instanceof FuncDefNode) {
            return this.visit_FuncDefNode(node, context);
        } else if (node instanceof CallNode) {
            return this.visit_CallNode(node, context);
        } else if (node instanceof StringNode) {
            return this.visit_StringNode(node, context);
        } else if (node instanceof ListNode) {
            return this.visit_ListNode(node, context);
        } else if (node instanceof ReturnNode) {
            return this.visit_ReturnNode(node, context);
        } else if (node instanceof ContinueNode) {
            return this.visit_ContinueNode(node, context);
        } else if (node instanceof BreakNode) {
            return this.visit_BreakNode(node, context);
        } else {
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

        value = value.copy().set_pos(node.pos_start, node.pos_end).set_context(context);
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
        if (res.should_return()) return res;

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
        if (res.should_return()) return res;

        /** @type {CustomNumber} */
        let right = res.register(this.visit(node.right_node, context)); // this line will create an instance of CustomNumber
        if (res.should_return()) return res;

        
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
            return res.success(result.set_pos(node.pos_start, node.pos_end));
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
        if (res.should_return()) return res;

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

        for (let [condition, expr, should_return_null] of node.cases) {
            /** @type {CustomNumber} */
            let condition_value = res.register(this.visit(condition, context));
            if (res.should_return()) return res;

            if (condition_value.is_true()) {
                let expr_value = res.register(this.visit(expr, context));
                if (res.should_return()) return res;
                return res.success(should_return_null ? CustomNumber.null : expr_value);
            }
        }

        if (node.else_case.code) {
            let code = node.else_case.code;
            let should_return_null = node.else_case.should_return_null;
            let else_value = res.register(this.visit(code, context));
            if (res.should_return()) return res;
            return res.success(should_return_null ? CustomNumber.null : else_value);
        }

        return res.success(CustomNumber.null);
    }

    /**
     * Visits a for statement.
     * @param {ForNode} node The node to be visited.
     * @param {Context} context The current context.
     * @return {RTResult}
     */
    visit_ForNode(node, context) {
        let res = new RTResult();
        let elements = []; // we want a loop to return by default a CustomList.

        let start_value = res.register(this.visit(node.start_value_node, context));
        if (res.should_return()) return res;

        let end_value = res.register(this.visit(node.end_value_node, context));
        if (res.should_return()) return res;

        let step_value = new CustomNumber(1);
        if (node.step_value_node) {
            step_value = res.register(this.visit(node.step_value_node, context));
            if (res.should_return()) return res;
        }

        let condition = () => false;
        let i = start_value.value;

        if (step_value.value >= 0) {
            condition = () => { return i < end_value.value; };
        } else {
            condition = () => { return i > end_value.value; };
        }

        while (condition()) {
            context.symbol_table.set(node.var_name_tok.value, new CustomNumber(i));
            i += step_value.value;

            let value = res.register(this.visit(node.body_node, context));

            if (res.should_return() && res.loop_should_continue === false && res.loop_should_break === false) {
                return res;
            }
            
            if (res.loop_should_continue) {
                continue;
            }

            if (res.loop_should_break) {
                break;
            }

            elements.push(value);
        }

        return res.success(
            node.should_return_null
                ? CustomNumber.null
                : new CustomList(elements).set_context(context).set_pos(node.pos_start, node.pos_end),
        );
    }

    /**
     * Visits a while statement.
     * @param {WhileNode} node The node to be visited.
     * @param {Context} context The current context.
     * @return {RTResult}
     */
    visit_WhileNode(node, context) {
        let res = new RTResult();
        let elements = []; // we want a loop to return a custom list by default.

        while (true) {
            let condition = res.register(this.visit(node.condition_node, context));
            if (res.should_return()) return res;

            if (!condition.is_true()) break;

            let value = res.register(this.visit(node.body_node, context));
            if (res.should_return() && res.loop_should_continue === false && res.loop_should_break === false) {
                return res;
            }

            if (res.loop_should_continue) {
                continue;
            }

            if (res.loop_should_break) {
                break;
            }

            elements.push(value);
        }

        return res.success(
            node.should_return_null
                ? CustomNumber.null
                : new CustomList(elements).set_context(context).set_pos(node.pos_start, node.pos_end),
        );
    }

    /**
     * Visits the definition of a function. We'll create an instance of CustomFunction.
     * @param {FuncDefNode} node The node that corresponds to the declaration of a variable.
     * @param {Context} context The context used for that function.
     */
    visit_FuncDefNode(node, context) {
        let res = new RTResult();
        let func_name = node.var_name_tok ? node.var_name_tok.value : null;
        let body_node = node.body_node;
        let arg_names = [];
        let optional_arg_names = [];
        let mandatory_arg_names = [];
        let default_values = [];

        for (let arg_name of node.arg_name_toks) arg_names.push(arg_name.value);
        for (let optional_arg of node.optional_arg_name_toks) optional_arg_names.push(optional_arg.value);
        for (let mandatory_arg of node.mandatory_arg_name_toks) mandatory_arg_names.push(mandatory_arg.value);
        for (let df of node.default_values_nodes) {
            let value = res.register(this.visit(df, context));
            if (res.should_return()) return res;
            default_values.push(value);
        }

        let func_value = new CustomFunction(func_name, body_node, arg_names, mandatory_arg_names, optional_arg_names, default_values, node.should_auto_return).set_context(context).set_pos(node.pos_start, node.pos_end);

        // we want to invoke the function with its name
        // so we use it as a variable in our symbol table.
        if (node.var_name_tok) {
            context.symbol_table.set(func_name, func_value);
        }

        return res.success(func_value);
    }

    /**
     * Visits a call to a function in order to get its return value.
     * @param {CallNode} node The node that corresponds to the call to a function.
     * @param {Context} context The context.
     */
    visit_CallNode(node, context) {
        let res = new RTResult();
        let args = [];

        let pos_start = node.pos_start;
        let pos_end = node.pos_end;

        let value_to_call = res.register(this.visit(node.node_to_call, context));
        if (res.should_return()) return res;
        value_to_call = value_to_call.copy().set_pos(node.pos_start, node.pos_end);

        for (let arg_node of node.arg_nodes) {
            args.push(res.register(this.visit(arg_node, context)));
            if (res.should_return()) return res;
        }

        let return_value = res.register(value_to_call.execute(args, pos_start, pos_end));
        if (res.should_return()) return res;

        return_value = return_value.copy().set_pos(node.pos_start, node.pos_end).set_context(context);

        return res.success(return_value);
    }

    /**
     * Visits a string.
     * @param {StringNode} node The node that corresponds to a string.
     * @param {Context} context The context.
     */
    visit_StringNode(node, context) {
        return new RTResult().success(
            new CustomString(node.tok.value).set_context(context).set_pos(node.pos_start, node.pos_end)
        );
    }

    /**
     * Visits a list.
     * @param {ListNode} node The node that corresponds to a string.
     * @param {Context} context The context.
     */
    visit_ListNode(node, context) {
        let res = new RTResult();
        let elements = [];

        for (let element_node of node.element_nodes) {
            elements.push(res.register(this.visit(element_node, context)));
            if (res.should_return()) return res;
        }

        return res.success(new CustomList(elements).set_context(context).set_pos(node.pos_start, node.pos_end));
    }

    /**
     * Visits a `return` keyword.
     * @param {ReturnNode} node The node that corresponds to a `return` keyword.
     * @param {Context} context The context.
     */
    visit_ReturnNode(node, context) {
        let res = new RTResult();
        let value = null;

        if (node.node_to_return) {
            value = res.register(this.visit(node.node_to_return, context));
            if (res.should_return()) return res;
        } else {
            value = CustomNumber.null;
        }

        return res.success_return(value);
    }

    /**
     * Visits a `continue` keyword.
     * @param {ContinueNode} node The node that corresponds to a `continue` keyword.
     * @param {Context} context The context.
     */
    visit_ContinueNode(node, context) {
        return new RTResult().success_continue();
    }

    /**
     * Visits a `break` keyword.
     * @param {BreakNode} node The node that corresponds to a `break` keyword.
     * @param {Context} context The context.
     */
    visit_BreakNode(node, context) {
        return new RTResult().success_break();
    }

    // ----------------
}

/*
*
* GLOBAL VARIABLES
*
*/

// Constants
BuiltInFunction.ARGS.log = {
    names: ["value"],
    mandatories: ["value"],
    optional: [],
    default_values: [],
};
BuiltInFunction.log = new BuiltInFunction("log");

BuiltInFunction.ARGS.input = {
    names: ["text"],
    mandatories: [],
    optional: ["text"],
    default_values: [new CustomString('')]
};
BuiltInFunction.input = new BuiltInFunction("input");

BuiltInFunction.ARGS.append = {
    names: ["list", "value"],
    mandatories: ["list", "value"],
    optional: [],
    default_values: []
};
BuiltInFunction.append = new BuiltInFunction("append");

BuiltInFunction.exit = new BuiltInFunction("exit");

BuiltInFunction.ARGS.run = {
    names: ["fn"],
    mandatories: ["fn"],
    optional: [],
    default_values: []
};
BuiltInFunction.run = new BuiltInFunction("run");

BuiltInFunction.ARGS.len = {
    names: ["list"],
    mandatories: ["list"],
    optional: [],
    default_values: []
};
BuiltInFunction.len = new BuiltInFunction("len");

const global_symbol_table = new SymbolTable();
global_symbol_table.set("NULL", CustomNumber.null);
global_symbol_table.set("YES", CustomNumber.true);
global_symbol_table.set("NO", CustomNumber.false);
global_symbol_table.set("MATH_PI", CustomNumber.math_pi);
// built-in functions
global_symbol_table.set("log", BuiltInFunction.log);
global_symbol_table.set("input", BuiltInFunction.input);
global_symbol_table.set("exit", BuiltInFunction.exit);
global_symbol_table.set("run", BuiltInFunction.run);
global_symbol_table.set("len", BuiltInFunction.len);
global_symbol_table.set("append", BuiltInFunction.append);

/**
 * Executes the program.
 * @param {string} filename The filename.
 * @param {string} text The source code.
 * @return {{result: any, error: CustomError}}
 */
export default function run(filename, text) {
    // We generate the context here
    // because we might need it inside strings
    // Indeed, if there is "{var}", then we need to interpret that code
    // before the creation of the variable.
    // However, we want the same context everywhere
    const context = new Context('<program>'); // the context will get modified by visiting the different user's actions.
    context.symbol_table = global_symbol_table;

    // Generate tokens
    const lexer = new Lexer(filename, text, context);
    const { tokens, error } = lexer.make_tokens();
    if (error) return { result: null, error };

    // Generate abstract syntax tree
    const parser = new Parser(tokens);
    const ast = parser.parse(); // the ast will contain a node, that node is the entire list of parsed tokens as an expression.
    if (ast.error) return { result: null, error: ast.error };

    // Run the program
    const interpreter = new Interpreter();
    const result = interpreter.visit(ast.node, context);

    return { result: result.value, error: result.error };
}