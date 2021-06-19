import { TokenType, Token } from "./tokens.js";
import { CustomNode, AddNode, DivideNode, MinusNode, ModuloNode, MultiplyNode, NumberNode, PlusNode, PowerNode, SubtractNode } from "./nodes.js";
import { is_in } from './miscellaneous.js';
import { InvalidSyntaxError } from "./Exceptions.js";

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

    parse() {
        if (this.current_token === null) {
            return null;
        }

        let result = this.expr();

        // not normal
        if (this.current_token !== null && this.current_token.type !== TokenType.EOF) {
            let pos_start = this.current_token.pos_start.copy();
            this.advance();
            let pos_end = this.current_token ? this.current_token.pos_end : pos_start.copy();
            if (this.current_token) {
                pos_end = this.current_token.pos_end;
            } else {
                pos_end = pos_start.copy();
                pos_end.advance(null);
            }
            throw new InvalidSyntaxError(pos_start, pos_end, "Unexpected end of interpretation.");
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

    /**
     * @returns {CustomNode}
     */
    term() {
        let node_a = this.factor();
        let result;

        while (this.current_token !== null && is_in(this.current_token.type, [TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.POWER, TokenType.MODULO])) {
            if (this.current_token.type === TokenType.MULTIPLY) {
                this.advance();
                result = new MultiplyNode(node_a, this.factor());
            } else if (this.current_token.type === TokenType.DIVIDE) {
                this.advance();
                result = new DivideNode(node_a, this.factor());
            } else if (this.current_token.type === TokenType.POWER) {
                this.advance();
                result = new PowerNode(node_a, this.factor());
            } else if (this.current_token.type === TokenType.MODULO) {
                this.advance();
                result = new ModuloNode(node_a, this.factor());
            }
        }

        return result ? result : node_a;
    }

    /**
     * @returns {CustomNode}
     */
    factor() {
        let pos_start = this.current_token.pos_start.copy();
        let token = this.current_token;

        if (token.type === TokenType.LPAREN) {
            this.advance();
            let result = this.expr();
            if (this.current_token.type !== TokenType.RPAREN) {
                throw new InvalidSyntaxError(pos_start, this.current_token.pos_end, "Expected ')'");
            }

            this.advance();
            return result;
        } else if (token.type === TokenType.NUMBER) {
            this.advance();
            return new NumberNode(token);
        } else if (token.type === TokenType.PLUS) {
            this.advance();
            return new PlusNode(this.factor());
        } else if (token.type === TokenType.MINUS) {
            this.advance();
            return new MinusNode(this.factor());
        } else {
            this.advance();
            throw new InvalidSyntaxError(pos_start, this.current_token.pos_end, "Unexpected node");
        }
    }
}