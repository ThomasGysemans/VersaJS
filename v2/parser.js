import { TokenType, Token } from "./tokens.js";
import { AddNode, DivideNode, MinusNode, MultiplyNode, NumberNode, PlusNode, PowerNode, SubtractNode } from "./nodes.js";
import { is_in } from './miscellaneous.js';

/**
 * @classdesc Reads the sequence of tokens in order to create the nodes.
 */
export class Parser {
    /**
     * @constructs Parser
     * @param {Generator} tokens The list of tokens.
     */
    constructor(tokens) {
        this.tokens = tokens[Symbol.iterator]();
        this.advance();
    }

    advance() {
        let next = this.tokens.next();
        /** @type {Token|null} */
        this.current_token = next.done ? null : next.value;
    }

    raise_error() {
        throw new Error("Invalid Syntax");
    }

    parse() {
        if (this.current_token === null) {
            return null;
        }

        let result = this.expr();

        // not normal
        if (this.current_token !== null) {
            this.raise_error();
        }

        return result;
    }

    expr() {
        let result = this.term();

        while (this.current_token !== null && is_in(this.current_token.type, [TokenType.PLUS, TokenType.MINUS])) {
            if (this.current_token.type === TokenType.PLUS) {
                this.advance();
                result = new AddNode(result, this.term());
            } else if (this.current_token.type === TokenType.MINUS) {
                this.advance();
                result = new SubtractNode(result, this.term());
            }
        }

        return result;
    }

    term() {
        let node_a = this.factor();
        let result;

        while (this.current_token !== null && is_in(this.current_token.type, [TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.POWER])) {
            if (this.current_token.type === TokenType.MULTIPLY) {
                this.advance();
                result = new MultiplyNode(node_a, this.factor());
            } else if (this.current_token.type === TokenType.DIVIDE) {
                this.advance();
                result = new DivideNode(node_a, this.factor());
            } else if (this.current_token.type === TokenType.POWER) {
                this.advance();
                result = new PowerNode(node_a, this.factor());
            }
        }

        return result ? result : node_a;
    }

    factor() {
        let token = this.current_token;

        if (token.type === TokenType.LPAREN) {
            this.advance();
            let result = this.expr();
            if (this.current_token.type !== TokenType.RPAREN) {
                this.raise_error();
            }

            this.advance();
            return result;
        } else if (token.type === TokenType.NUMBER) {
            this.advance();
            return new NumberNode(token.value);
        } else if (token.type === TokenType.PLUS) {
            this.advance();
            return new PlusNode(this.factor());
        } else if (token.type === TokenType.MINUS) {
            this.advance();
            return new MinusNode(this.factor());
        }

        this.raise_error();
    }
}