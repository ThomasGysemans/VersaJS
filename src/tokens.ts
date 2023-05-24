"use strict";

import Position from "./position.js";

export enum TokenType {
    NUMBER                     = 'NUMBER',
    PLUS                       = 'PLUS',
    MINUS                      = 'MINUS',
    MULTIPLY                   = 'MULTIPLY',
    SLASH                      = 'SLASH',
    POWER                      = 'POWER',
    MODULO                     = 'MODULO',
    LPAREN                     = 'LPAREN',
    RPAREN                     = 'RPAREN',
    IDENTIFIER                 = 'IDENTIFIER',
    KEYWORD                    = 'KEYWORD',
    EQUALS                     = 'EQUALS',
    DOUBLE_EQUALS              = 'DOUBLE_EQUALS',
    NOT_EQUAL                  = 'NOT_EQUAL',
    LT                         = 'LESS_THAN',
    GT                         = 'GREATER_THAN',
    LTE                        = 'LESS_THAN_OR_EQUAL',
    GTE                        = 'GREATER_THAN_OR_EQUAL',
    NULLISH_OPERATOR           = 'NULLISH_OPERATOR', // "??"
    COLON                      = 'COLON',
    DOUBLE_COLON               = 'DOUBLE_COLON',
    NEWLINE                    = 'NEWLINE',
    // a semicolon represents a newline, except in certain cases
    // where we need to make the differencee between a newline and a semicolon
    // for instance, we want to avoid newlines inside lists, but not semicolons
    SEMICOLON                  = 'SEMICOLON' ,
    LSQUARE                    = 'LSQUARE',
    RSQUARE                    = 'RSQUARE',
    LBRACK                     = 'LBRACK',
    RBRACK                     = 'RBRACK',
    COMMA                      = 'COMMA',
    STRING                     = 'STRING',
    ARROW                      = 'ARROW',
    DOUBLE_ARROW               = 'DOUBLE_ARROW',
    INC                        = 'INC',
    DEC                        = 'DEC',
    QMARK                      = 'QUESTION_MARK',
    DOT                        = 'DOT',
    TRIPLE_DOTS                = 'TRIPLE_DOTS',
    BINARY_LEFT                = 'BINARY_LEFT',
    BINARY_RIGHT               = 'BINARY_RIGHT',
    BINARY_UNSIGNED_RIGHT      = 'BINARY_UNSIGNED_RIGHT',
    LOGICAL_AND                = 'LOGICAL_AND', // &
    LOGICAL_XOR                = 'LOGICAL_XOR', // ^
    LOGICAL_OR                 = 'LOGICAL_OR', // |
    BIN_NOT                    = 'BINARY_NOT', // ~
    AND                        = 'AND', // &&
    OR                         = 'OR', // ||
    OPTIONAL_CHAINING_OPERATOR = 'OPTIONAL_CHAINING_OPERATOR', // '?.'
    OPTIONAL_STATIC_CALL       = 'OPTIONAL_STATIC_CALL', // '?::'
    LCHEVRON                   = 'LCHEVRON', // <
    RCHEVRON                   = 'RCHEVRON', // >
    HASH                       = 'HASH', // #
    INDENTATION                = 'INDENTATION', // \t
    ARROBASE                   = 'ARROBASE', // @
    EOF                        = 'EOF',
}

export enum Types {
    ANY      = "any", // everything, var a = none, `a` is of type `ANY`, same if var number = 5, then `number` is of type `ANY`
    DYNAMIC  = "dynamic", // everything except none
    NUMBER   = "number",
    STRING   = "string",
    LIST     = "list",
    DICT     = "dict",
    OBJECT   = "object",
    BOOLEAN  = "boolean",
    FUNCTION = "function",
    HTML     = "html",
    TAG      = "TAG"
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
export class Token<T = string> {
    public type: TokenType;
    public value: T;
    public pos_start: Position;
    public pos_end: Position;
    public data: TokenData | null;

    /**
     * @param type The type of token.
     * @param value The value of the token.
     * @param pos_start The starting position of the token in the code.
     * @param pos_end The end position of the token in our code.
     * @param data Additional data that the interpreter or the parser might need.
     */
    constructor(type: TokenType, value: T, pos_start: Position, pos_end: Position | null = null, data: TokenData | null = null) {
        this.type = type;
        this.value = value;
        this.data = data;
        this.pos_start = pos_start.copy();
        this.pos_end = pos_end ? pos_end.copy() : pos_start.copy();
    }

    /**
     * Checks if a the type and the value of a token correspond.
     * @param type The type of token (`TokenType.KEYWORD` for example).
     * @param value The value that has to correspond.
     * @returns `true` if the type & value of a token correspond with `type` and `value`.
     */
    public matches(type: string, value: string): boolean {
        return this.type === type && this.value === value;
    }

    /**
     * If the value is indentation or tabulation, then it just returns the type.
     * Otherwise, it returns : "type:value".
     * @returns A readable format of the token for debugging.
     */
    public toString(): String {
        if (this.value === "\t" || this.value === "\n") {
            return this.type;
        } else {
            return this.type + (`:${this.value ?? ''}`);
        }
    }

    /**
     * Checks if the type of this token matches the given type.
     * @param type The TokenType to test.
     * @returns `true` if this token is of type `type`.
     */
    public ofType(type: TokenType): boolean {
        return this.type === type;
    }

    /**
     * Checks if the type of this token doesn't match the given type.
     * @param type The TokenType to test.
     * @returns `true` if this token is not of type `type`.
     */
    public notOfType(type: TokenType): boolean {
        return !this.ofType(type);
    }

    /**
     * Creates a deep copy of this instance, a clone.
     * @returns A new instance of Token with the same data.
     */
    public copy(): Token<T> {
        return new Token<T>(this.type, this.value, this.pos_start.copy(), this.pos_end.copy(), this.data === null ? null : {...this.data});
    }
}