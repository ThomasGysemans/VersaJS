"use strict";

import { Position } from "./position.js";

export class TokenType {
    static NUMBER                     = 'NUMBER'
    static PLUS                       = 'PLUS'
    static MINUS                      = 'MINUS'
    static MULTIPLY                   = 'MULTIPLY'
    static SLASH                      = 'SLASH'
    static POWER                      = 'POWER'
    static MODULO                     = 'MODULO'
    static LPAREN                     = 'LPAREN'
    static RPAREN                     = 'RPAREN'
    static IDENTIFIER                 = 'IDENTIFIER'
    static KEYWORD                    = 'KEYWORD'
    static EQUALS                     = 'EQUALS'
    static DOUBLE_EQUALS              = 'DOUBLE_EQUALS'
    static NOT_EQUAL                  = 'NOT_EQUAL'
    static LT                         = 'LESS_THAN'
    static GT                         = 'GREATER_THAN'
    static LTE                        = 'LESS_THAN_OR_EQUAL'
    static GTE                        = 'GREATER_THAN_OR_EQUAL'
    static NULLISH_OPERATOR           = 'NULLISH_OPERATOR' // "??"
    static COLON                      = 'COLON'
    static DOUBLE_COLON               = 'DOUBLE_COLON'
    static NEWLINE                    = 'NEWLINE'
    // a semicolon represents a newline, except in certain cases
    // where we need to make the differencee between a newline and a semicolon
    // for instance, we want to avoid newlines inside lists, but not semicolons
    static SEMICOLON                  = 'SEMICOLON' 
    static LSQUARE                    = 'LSQUARE'
    static RSQUARE                    = 'RSQUARE'
    static LBRACK                     = 'LBRACK'
    static RBRACK                     = 'RBRACK'
    static COMMA                      = 'COMMA'
    static STRING                     = 'STRING'
    static ARROW                      = 'ARROW'
    static DOUBLE_ARROW               = 'DOUBLE_ARROW'
    static INC                        = 'INC'
    static DEC                        = 'DEC'
    static QMARK                      = 'QUESTION_MARK'
    static DOT                        = 'DOT'
    static TRIPLE_DOTS                = 'TRIPLE_DOTS'
    static BINARY_LEFT                = 'BINARY_LEFT'
    static BINARY_RIGHT               = 'BINARY_RIGHT'
    static BINARY_UNSIGNED_RIGHT      = 'BINARY_UNSIGNED_RIGHT'
    static LOGICAL_AND                = 'LOGICAL_AND' // &
    static LOGICAL_XOR                = 'LOGICAL_XOR' // ^
    static LOGICAL_OR                 = 'LOGICAL_OR' // |
    static BIN_NOT                    = 'BINARY_NOT' // ~
    static AND                        = 'AND' // &&
    static OR                         = 'OR' // ||
    static OPTIONAL_CHAINING_OPERATOR = 'OPTIONAL_CHAINING_OPERATOR' // '?.'
    static OPTIONAL_STATIC_CALL       = 'OPTIONAL_STATIC_CALL' // '?::'
    static LCHEVRON                   = 'LCHEVRON' // <
    static RCHEVRON                   = 'RCHEVRON' // >
    static HASH                       = 'HASH' // #
    static INDENTATION                = 'INDENTATION' // \t
    static ARROBASE                   = 'ARROBASE' // @
    static EOF                        = 'EOF'
}

export class Types {
    static ANY      = "any" // everything, var a = none, a is of type any
    static DYNAMIC  = "dynamic" // everything except none
    static NUMBER   = "number"
    static STRING   = "string"
    static LIST     = "list"
    static DICT     = "dict"
    static OBJECT   = "object"
    static BOOLEAN  = "boolean"
    static FUNCTION = "function"
    static HTML     = "html"
    static TAG      = "TAG"
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
    "switch",
    "case",
    "default",
    "none",
    "yes",
    "no",
    "true",
    "false",
    "pass",
    "typeof",
    "instanceof",
    "tag",
    "prop",
    "state",
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
     * @param {any} data Additional data that the interpreter or the parser might need.
     */
    constructor(type, value=null, pos_start=null, pos_end=null, data=null) {
        this.type = type;
        this.value = value;
        this.data = data;

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
        if (this.value === "\t" || this.value === "\n") {
            return this.type;
        } else {
            return this.type + (`:${this.value ?? ''}`);
        }
    }
}