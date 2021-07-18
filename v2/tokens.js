import { Position } from "./position.js";

export class TokenType {
    static NUMBER         = 'NUMBER'
    static PLUS           = 'PLUS'
    static MINUS          = 'MINUS'
    static MULTIPLY       = 'MULTIPLY'
    static DIVIDE         = 'DIVIDE'
    static POWER          = 'POWER'
    static MODULO         = 'MODULO'
    static LPAREN         = 'LPAREN'
    static RPAREN         = 'RPAREN'
    static IDENTIFIER     = 'IDENTIFIER'
    static KEYWORD        = 'KEYWORD'
    static EQUALS         = 'EQUALS'
    static DOUBLE_EQUALS  = 'DOUBLE_EQUALS'
    static NOT_EQUAL      = 'NOT_EQUAL'
    static LT             = 'LESS_THAN'
    static GT             = 'GREATER_THAN'
    static LTE            = 'LESS_THAN_OR_EQUAL'
    static GTE            = 'GREATER_THAN_OR_EQUAL'
    static ELSE_ASSIGN    = 'ELSE_ASSIGN' // "??"
    static COLON          = 'COLON'
    static DOUBLE_COLON   = 'DOUBLE_COLON'
    static NEWLINE        = 'NEWLINE'
    // a semicolon represents a newline, except in certain cases
    // where we need to make the differencee between a newline and a semicolon
    // for instance, we want to avoid newlines inside lists, but not semicolons
    static SEMICOLON      = 'SEMICOLON' 
    static LSQUARE        = 'LSQUARE'
    static RSQUARE        = 'RSQUARE'
    static LBRACK         = 'LBRACK'
    static RBRACK         = 'RBRACK'
    static COMMA          = 'COMMA'
    static STRING         = 'STRING'
    static ARROW          = 'ARROW'
    static DOUBLE_ARROW   = 'DOUBLE_ARROW'
    static INC            = 'INC'
    static DEC            = 'DEC'
    static QMARK          = 'QUESTION_MARK'
    static DOT            = 'DOT'
    static TRIPLE_DOTS    = 'TRIPLE_DOTS'
    static EOF            = 'EOF'
}

const KEYWORDS = [
    "var",
    "and",
    "or",
    "not",
    "if",
    "elif",
    "else",
    "end",
    "for",
    "while",
    "to",
    "step",
    "func",
    "return",
    "continue",
    "break",
    "define",
    "delete",
    "foreach",
    "as",
    "class",
    "private",
    "public",
    "protected",
    "get",
    "set",
    "method",
    "property",
    "new",
    "extends",
    "override",
    "static",
    "super",
    "enum",
];

export default KEYWORDS;

/**
 * @classdesc Describes what a token is.
 */
export class Token {
    /**
     * @constructs Token
     * @param {string} type The type of token.
     * @param {any} value The value of the token.
     * @param {Position} pos_start The starting position of the token in the code.
     * @param {Position} pos_end The end position of the token in our code.
     */
    constructor(type, value=null, pos_start=null, pos_end=null) {
        this.type = type;
        this.value = value;

        if (pos_start) {
            this.pos_start = pos_start.copy();
            this.pos_end = pos_end ? pos_end.copy() : pos_start.copy();
        }
    }

    /**
     * Checks if a the type and the value of a token correspond.
     * @param {string} type The type of token (TOKENS.KEYWORD for example).
     * @param {string} value The value that has to correspond.
     * @returns {boolean} `true` if the type & value of a token correspond with `type` and `value`.
     */
    matches(type, value) {
        return this.type === type && this.value === value;
    }

    toString() {
        return this.type + (this.value !== null ? `:${this.value}` : '');
    }
}