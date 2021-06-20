import { TokenType, Token } from "./tokens.js";
import { CustomNode, AddNode, DivideNode, MinusNode, ModuloNode, MultiplyNode, NumberNode, PlusNode, PowerNode, SubtractNode, VarAssignNode, VarAccessNode, VarModifyNode, OrNode, NotNode, AndNode, EqualsNode, LessThanNode, LessThanOrEqualNode, GreaterThanNode, GreaterThanOrEqualNode, NotEqualsNode } from "./nodes.js";
import { is_in } from './miscellaneous.js';
import { InvalidSyntaxError } from "./Exceptions.js";
import { CONSTANTS } from "./symbol_table.js";

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
        if (this.current_token.matches(TokenType.KEYWORD, "var")) {
            let pos_start = this.current_token.pos_start;
            this.advance();
            
            if (this.current_token.type !== TokenType.IDENTIFIER) {
                throw new InvalidSyntaxError(
                    pos_start, this.current_token.pos_end,
                    "Expected identifier"
                );
            }
            
            const var_name_tok = this.current_token;
            this.advance();

            if (this.current_token.type !== TokenType.EQUALS) {
                throw new InvalidSyntaxError(
                    pos_start, this.current_token.pos_end,
                    "Expected equals"
                );
            }

            this.advance();
            const value_node = this.expr();

            return new VarAssignNode(var_name_tok, value_node);
        }

        let result = this.comp_expr();

        if (this.current_token !== null) {
            if (this.current_token.matches(TokenType.KEYWORD, "and")) {
                this.advance();
                let node = this.comp_expr();
                return new AndNode(result, node);
            } else if (this.current_token.matches(TokenType.KEYWORD, "or")) {
                this.advance();
                let node = this.comp_expr();
                return new OrNode(result, node);
            }
        }

        return result;
    }

    comp_expr() {
        if (this.current_token.matches(TokenType.KEYWORD, "not")) {
            this.advance();
            let node = this.comp_expr();
            return new NotNode(node);
        }

        let node_a = this.arith_expr();

        if (this.current_token.type === TokenType.DOUBLE_EQUALS) {
            this.advance();
            return new EqualsNode(node_a, this.arith_expr());
        } else if (this.current_token.type === TokenType.LT) {
            this.advance();
            return new LessThanNode(node_a, this.arith_expr());
        } else if (this.current_token.type === TokenType.GT) {
            this.advance();
            return new GreaterThanNode(node_a, this.arith_expr());
        } else if (this.current_token.type === TokenType.LTE) {
            this.advance();
            return new LessThanOrEqualNode(node_a, this.arith_expr());
        } else if (this.current_token.type === TokenType.GTE) {
            this.advance();
            return new GreaterThanOrEqualNode(node_a, this.arith_expr());
        } else if (this.current_token.type === TokenType.NOT_EQUAL) {
            this.advance();
            return new NotEqualsNode(node_a, this.arith_expr());
        }

        return node_a;
    }

    arith_expr() {
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
        } else if (token.type === TokenType.IDENTIFIER) {
            const var_name_tok = token;
            this.advance();
            if (this.current_token.type === TokenType.EQUALS) {
                if (is_in(var_name_tok.value, Object.keys(CONSTANTS))) {
                    throw new InvalidSyntaxError(
                        pos_start, this.current_token.pos_end,
                        "Invalid variable name for assigment."
                    );
                }

                this.advance();
                const value_node = this.expr();
                return new VarModifyNode(var_name_tok, value_node);
            } else {
                return new VarAccessNode(token);
            }
        } else {
            this.advance();
            throw new InvalidSyntaxError(pos_start, token.pos_end, "Unexpected node");
        }
    }
}