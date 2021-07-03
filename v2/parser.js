import { TokenType, Token } from "./tokens.js";
import { CustomNode, AddNode, DivideNode, MinusNode, ModuloNode, MultiplyNode, NumberNode, PlusNode, PowerNode, SubtractNode, VarAssignNode, VarAccessNode, VarModifyNode, OrNode, NotNode, AndNode, EqualsNode, LessThanNode, LessThanOrEqualNode, GreaterThanNode, GreaterThanOrEqualNode, NotEqualsNode, ElseAssignmentNode, ListNode, ListAccessNode, ListAssignmentNode, ListPushBracketsNode, ListBinarySelector, StringNode, IfNode, ForNode, WhileNode, FuncDefNode, CallNode, ReturnNode, ContinueNode, BreakNode, DefineNode, DeleteNode } from "./nodes.js";
import { is_in } from './miscellaneous.js';
import { InvalidSyntaxError } from "./Exceptions.js";
import { NumberValue } from "./values.js";

/**
 * @classdesc Reads the sequence of tokens in order to create the nodes.
 */
export class Parser {
    /**
     * @constructs Parser
     * @param {Generator} tokens The list of tokens.
     */
    constructor(tokens) {
        this.tokens = Array.from(tokens);
        this.idx = -1;
        this.advancement_count = 0;
        this.backup_index = 0;
        this.advance();
    }

    backup() {
        this.backup_index = this.idx;
    }

    rescue() {
        this.idx = this.backup_index;
        this.backup_index = 0;
    }

    reset_advancement_count() {
        this.advancement_count = 0;
    }

    backwards(steps=1) {
        this.idx -= steps;
        this.advancement_count -= steps;
        if (this.idx < 0) this.idx = 0;
        if (this.advancement_count < 0) this.advancement_count = 0;
        this.set_token();
    }

    try(val) {
        this.advancement_count = 0;
        return val;
    }

    advance() {
        this.idx += 1;
        this.advancement_count += 1;
        this.set_token();
    }

    set_token() {
        /** @type {Token|null} */
        this.current_token = this.idx < this.tokens.length ? this.tokens[this.idx] : null;
    }

    parse() {
        if (this.current_token === null) {
            return null;
        }

        let result = this.statements();

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
            throw new InvalidSyntaxError(pos_start, pos_end, "Unexpected end of parsing.");
        }

        return result;
    }
    
    statements() {
        let statements = [];
        let pos_start = this.current_token.pos_start.copy();

        while (this.current_token.type === TokenType.NEWLINE) {
            this.advance();
        }

        if (this.current_token.type === TokenType.EOF) {
            throw new InvalidSyntaxError(
                pos_start, this.current_token.pos_end,
                "Unexpected end of file"
            );
        }

        let statement = this.statement();
        statements.push(statement);

        let more_statements = true;

        while (true) {
            let newline_count = 0;
            while (this.current_token.type === TokenType.NEWLINE) {
                this.advance();
                newline_count++;
            }

            if (this.current_token.type === TokenType.EOF) break;

            // there are no more lines
            if (newline_count === 0) more_statements = false;
            if (!more_statements) break;
            
            if (this.current_token.matches(TokenType.KEYWORD, "elif")) {
                more_statements = false;
                continue;
            } else if (this.current_token.matches(TokenType.KEYWORD, "else")) {
                more_statements = false;
                continue;
            } else if (this.current_token.matches(TokenType.KEYWORD, "end")) {
                more_statements = false;
                continue;
            } else {
                statement = this.statement();

                if (!statement) {
                    more_statements = false;
                    continue;
                }

                statements.push(statement);
            }
        }

        return new ListNode(
            statements,
            pos_start,
            this.current_token.pos_end.copy()
        );
    }

    statement() {
        let pos_start = this.current_token.pos_start.copy();

        if (this.current_token.matches(TokenType.KEYWORD, "return")) {
            this.advance();

            let expr = null;
            if (this.current_token.type !== TokenType.NEWLINE && this.current_token.type !== TokenType.EOF) expr = this.expr();
            
            return new ReturnNode(expr, pos_start, this.current_token.pos_end.copy());
        }

        if (this.current_token.matches(TokenType.KEYWORD, "continue")) {
            this.advance();
            return new ContinueNode(pos_start, this.current_token.pos_end.copy());
        }

        if (this.current_token.matches(TokenType.KEYWORD, "break")) {
            this.advance();
            return new BreakNode(pos_start, this.current_token.pos_end.copy());
        }

        return this.expr();
    }

    expr() {
        if (this.current_token.matches(TokenType.KEYWORD, "var") || this.current_token.matches(TokenType.KEYWORD, "define")) {
            let is_variable = this.current_token.matches(TokenType.KEYWORD, "var");
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

            if (is_variable) {
                return new VarAssignNode(var_name_tok, value_node);
            } else {
                return new DefineNode(var_name_tok, value_node);
            }
        } else if (this.current_token.matches(TokenType.KEYWORD, "delete")) {
            let pos_start = this.current_token.pos_start;
            this.advance();

            let node_to_delete = this.call_list();

            return new DeleteNode(node_to_delete, pos_start, node_to_delete.pos_end);
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
        } else if (this.current_token.type === TokenType.ELSE_ASSIGN) {
            this.advance();
            return new ElseAssignmentNode(node_a, this.arith_expr());
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

    factor() {
        let token = this.current_token;

        if (token.type === TokenType.PLUS) {
            this.advance();
            return new PlusNode(this.call_list());
        } else if (token.type === TokenType.MINUS) {
            this.advance();
            return new MinusNode(this.call_list());
        } else {
            return this.call_list();
        }
    }

    call_list() {
        let atom = this.call();
        let pos_start = this.current_token.pos_start.copy();

        if (this.current_token.type === TokenType.LSQUARE) {
            // list[(1+1)][index]
            let depth = -1;
            let index_nodes = [];
            let is_depth = false;
            let is_pushing = false; // is "list[]" ?

            while (this.current_token !== null && this.current_token.type !== TokenType.EOF) {
                is_depth = false;

                if (this.current_token.type === TokenType.LSQUARE) is_depth = true;
                if (!is_depth) break;

                this.advance();

                // if "list[]"
                if (this.current_token.type === TokenType.RSQUARE) {
                    // if it's already pushing
                    if (is_pushing) {
                        throw new InvalidSyntaxError(
                            this.current_token.pos_start, this.current_token.pos_end,
                            `Cannot push several times on the same list.`
                        );
                    }

                    index_nodes.push(new ListPushBracketsNode(pos_start, this.current_token.pos_end));
                    is_pushing = true;
                } else {
                    let index_pos_start = this.current_token.pos_start.copy();
                    let expr;
                    
                    // is it "[:3]" ? (is it already a semicolon)
                    if (this.current_token.type === TokenType.SEMICOLON) {
                        expr = null;
                    } else {
                        try {
                            expr = this.expr();
                        } catch(e) {
                            throw new InvalidSyntaxError(
                                pos_start, index_pos_start,
                                "Expected expression"
                            );
                        }
                    }

                    if (this.current_token.type === TokenType.SEMICOLON) {
                        this.advance();
                        
                        let right_expr;
                        if (this.current_token.type === TokenType.RSQUARE) {
                            right_expr = null;
                        } else {
                            try {
                                right_expr = this.expr();
                            } catch(e) {
                                throw new InvalidSyntaxError(
                                    pos_start, index_pos_start,
                                    "Expected expression or ']'"
                                );
                            }
                        }

                        index_nodes.push(new ListBinarySelector(expr, right_expr, index_pos_start, this.current_token.pos_end));
                    } else {
                        index_nodes.push(expr);
                    }
                }

                if (this.current_token.type === TokenType.RSQUARE) depth++;
                if (this.current_token.type === TokenType.EOF) {
                    throw new InvalidSyntaxError(
                        this.current_token.pos_start, this.current_token.pos_end,
                        "Expected ',', ':' or ']'"
                    );
                }

                this.advance();
            }

            const accessor = new ListAccessNode(atom, depth, index_nodes);

            if (this.current_token.type === TokenType.EQUALS) {
                this.advance();
                const value_node = this.expr();
                return new ListAssignmentNode(accessor, value_node);
            } else if (is_pushing) {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "Expected '='"
                );
            } else {
                return accessor;
            }
        } else {
            return atom;
        }
    }

    call() {
        let atom = this.atom();

        // if we have a left parenthesis after our atom
        // that means we are calling the atom

        if (this.current_token.type === TokenType.LPAREN) {
            this.advance();
            
            let arg_nodes = [];
            if (this.current_token.type === TokenType.RPAREN) {
                this.advance();
            } else {
                try {
                    arg_nodes.push(this.expr());
                } catch(e) {
                    throw new InvalidSyntaxError(
                        this.current_token.pos_start, this.current_token.pos_end,
                        "Expected an expression or ')'"
                    );
                }

                while (this.current_token.type === TokenType.COMMA) {
                    this.advance();
                    arg_nodes.push(this.expr());
                }

                if (this.current_token.type !== TokenType.RPAREN) {
                    throw new InvalidSyntaxError(
                        this.current_token.pos_start, this.current_token.pos_end,
                        "Expected ',' or ')'"
                    );
                }

                this.advance();
            }

            return new CallNode(atom, arg_nodes);
        }

        return atom;
    }

    /**
     * @returns {CustomNode}
     */
    atom() {
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
        } else if (token.type === TokenType.STRING) {
            this.advance();
            return new StringNode(token);
        } else if (token.type === TokenType.IDENTIFIER) {
            const var_name_tok = token;
            this.advance();
            if (this.current_token.type === TokenType.EQUALS) {
                this.advance();
                const value_node = this.expr();
                return new VarModifyNode(var_name_tok, value_node);
            } else {
                return new VarAccessNode(token);
            }
        } else if (this.current_token.type === TokenType.LSQUARE) {
            let list_expr = this.list_expr();
            return list_expr;
        } else if (this.current_token.matches(TokenType.KEYWORD, "if")) {
            let if_expr = this.if_expr();
            return if_expr;
        } else if (this.current_token.matches(TokenType.KEYWORD, "for")) {
            let for_expr = this.for_expr();
            return for_expr;
        } else if (this.current_token.matches(TokenType.KEYWORD, "while")) {
            let while_expr = this.while_expr();
            return while_expr;
        } else if (this.current_token.matches(TokenType.KEYWORD, "func")) {
            let func_expr = this.func_expr();
            return func_expr;
        } else {
            this.advance();
            let pos_end = pos_start.copy();
            if (this.current_token) {
                pos_end = this.current_token.pos_end
            }
            throw new InvalidSyntaxError(pos_start, pos_end, "Unexpected node");
        }
    }

    // ----

    list_expr() {
        let element_nodes = [];
        let pos_start = this.current_token.pos_start.copy();
        this.advance();

        // if the list is empty ("[]")
        if (this.current_token.type === TokenType.RSQUARE) {
            this.advance();
        } else {
            // we have values in the list
            // it's actually the same as getting arguments from the call method
            element_nodes.push(this.expr());

            while (this.current_token.type === TokenType.COMMA) {
                this.advance();
                element_nodes.push(this.expr());
            }

            if (this.current_token.type !== TokenType.RSQUARE) {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "Expected ',', or ']'"
                );
            }

            this.advance();
        }

        return new ListNode(
            element_nodes,
            pos_start,
            this.current_token.pos_end.copy()
        );
    }

    if_expr() {
        const all_cases = this.if_expr_cases("if");
        const cases = all_cases.cases;
        const else_case = all_cases.else_case;
        return new IfNode(cases, else_case);
    }

    /**
     * Gets the cases of a condition, including: "if", "elif" and "else"
     * @param {string} case_keyword The keyword for a case ("if" or "elif").
     * @returns {{cases, else_case: {code, should_return_null: boolean}}}
     */
    if_expr_cases(case_keyword) {
        let cases = [];
        let else_case = { code: null, should_return_null: false };

        // we must have a "if" (or "elif")

        if (!this.current_token.matches(TokenType.KEYWORD, case_keyword)) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                `Expected '${case_keyword}'`
            );
        }

        // we continue

        this.advance();
        let condition = this.expr();

        // we must have a semicolon

        if (this.current_token.type !== TokenType.SEMICOLON) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected ':'"
            );
        }

        this.advance();

        if (this.current_token.type === TokenType.NEWLINE) {
            this.advance();

            let statements = this.statements();

            // true = should return null?
            // before, we returned the evaluated expr
            // now if we are on several lines, we don't want to return anything
            cases.push([condition, statements, true]);

            if (this.current_token.matches(TokenType.KEYWORD, "end")) {
                this.advance();
            } else {
                // there might be elifs
                const all_cases = this.if_expr_elif_or_else();
                let new_cases = all_cases.cases;
                else_case = all_cases.else_case;

                if (new_cases.length > 0) {
                    cases = [...cases, ...new_cases];
                }
            }
        } else {
            // inline condition
            let statement = this.statement();
            cases.push([condition, statement, false]); // we want the return value of a if statement (that's why false)

            const all_cases = this.if_expr_elif_or_else();
            let new_cases = all_cases.cases;
            else_case = all_cases.else_case;

            if (new_cases.length > 0) {
                cases = [...cases, ...new_cases];
            }
        }

        return { cases, else_case };
    }

    /**
     * Checks if there is `elif` cases or an `else` case
     * @returns {{cases, else_case: {code, should_return_null: boolean}}}
     */
    if_expr_elif_or_else() {
        let cases = [];
        let else_case = { code: null, should_return_null: false };

        if (this.current_token.matches(TokenType.KEYWORD, "elif")) {
            const all_cases = this.if_expr_elif();
            cases = all_cases.cases;
            else_case = all_cases.else_case;
        } else {
            else_case = this.if_expr_else();
        }

        return { cases, else_case };
    }

    /**
     * Checks if there is an `elif` case.
     * @returns {{cases, else_case: {code, should_return_null: boolean}}}
     */
    if_expr_elif() {
        return this.if_expr_cases("elif"); // same as "if"
    }

    /**
     * Checks if there is an `else` case.
     * @returns {{code, should_return_null: boolean}}
     */
    if_expr_else() {
        let else_case = { code: null, should_return_null: false };
        
        if (this.current_token.matches(TokenType.KEYWORD, "else")) {
            this.advance();

            if (this.current_token.type === TokenType.SEMICOLON) {
                this.advance();
            } else {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "Expected ':'"
                );
            }

            if (this.current_token.type === TokenType.NEWLINE) {
                this.advance();
                
                let statements = this.statements();
                else_case = { code: statements, should_return_null: true };

                if (this.current_token.matches(TokenType.KEYWORD, "end")) {
                    this.advance();
                } else {
                    throw new InvalidSyntaxError(
                        this.current_token.pos_start, this.current_token.pos_end,
                        "Expected 'end'"
                    );
                }
            } else {
                let statement = this.statement();
                else_case = { code: statement, should_return_null: false };
            }
        }

        return else_case;
    }

    for_expr() {
        this.advance();

        // after the "for" keyword,
        // we start with an identifier (i)

        if (this.current_token.type !== TokenType.IDENTIFIER) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected identifier"
            );
        }

        let var_name_token = this.current_token;
        this.advance();

        // the variable i needs to have a value,
        // so there must be an equal token

        let start_value = null;

        if (this.current_token.type === TokenType.EQUALS) {
            // after the equal token, we expect an expr
            this.advance();
            start_value = this.expr();
        }

        // after the expr, we expect a `to` keyword

        if (!this.current_token.matches(TokenType.KEYWORD, "to")) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected 'to'"
            );
        }

        this.advance();

        // The `to` keyword indicated the end value

        let end_value = this.expr();

        // we could have a `step` keyword afterwards

        let step_value = null;
        if (this.current_token.matches(TokenType.KEYWORD, "step")) {
            this.advance();
            step_value = this.expr();
        }

        if (this.current_token.type !== TokenType.SEMICOLON) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected ':'"
            );
        }

        this.advance();

        if (this.current_token.type === TokenType.NEWLINE) {
            this.advance();

            let extended_body = this.statements();

            if (!this.current_token.matches(TokenType.KEYWORD, "end")) {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "Expected 'end'"
                );
            }

            this.advance();

            return new ForNode(
                var_name_token,
                start_value,
                end_value,
                step_value,
                extended_body,
                true // should return null
            );
        }

        // now there is the body of the statement
        // for an inline loop

        let body = this.statement();

        return new ForNode(
            var_name_token,
            start_value,
            end_value,
            step_value,
            body,
            false
        );
    }

    while_expr() {
        this.advance();

        // after the `while` keyword, there must be an expression

        let condition = this.expr();

        // after the condition, we expect a ":"

        if (this.current_token.type !== TokenType.SEMICOLON) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected ':'"
            );
        }

        this.advance();

        if (this.current_token.type === TokenType.NEWLINE) {
            this.advance();

            let extended_body = this.statements();

            if (!this.current_token.matches(TokenType.KEYWORD, "end")) {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "Expected 'end'"
                );
            }

            this.advance();

            return new WhileNode(
                condition,
                extended_body,
                true // should return null? True
            );
        }

        let body = this.statement();

        return new WhileNode(
            condition,
            body,
            false
        );
    }

    func_expr() {
        this.advance();

        // there might be no identifier (anonymous function)

        let var_name_token = null;
        if (this.current_token.type === TokenType.IDENTIFIER) {
            var_name_token = this.current_token;
            this.advance();

            // there must be a left parenthesis after the identifier
            if (this.current_token.type !== TokenType.LPAREN) {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "Expected '('"
                );
            }
        } else {
            // anonymous function, no identifier
            // there must be a left parenthesis after anyway
            if (this.current_token.type !== TokenType.LPAREN) {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "Expected identifier or '('"
                );
            }
        }

        this.advance();

        let is_optional = false; // once there is an optional argument, this goes to true
        // indeed, we cannot have a mandatory argument after an optional one.

        let arg_name_toks = []; // all the args
        let mandatory_arg_name_toks = []; // the mandatory args
        let optional_name_toks = []; // the optional args
        let default_values_nodes = []; // the tokens for the default value

        if (this.current_token.type === TokenType.IDENTIFIER) {
            // there is an identifier
            // advance
            // check if there is a question mark
            // if there is a question mark, check if there is an equal sign
            // if there is an equal sign, advance and get the default value (an expr)

            const check_for_optional_args = () => {
                let identifier_token = this.current_token;
                arg_name_toks.push(identifier_token);
                this.advance();

                // there might be a question mark
                // optional

                if (this.current_token.type === TokenType.QMARK) {
                    is_optional = true;
                    let question_mark_token = this.current_token;
                    optional_name_toks.push(identifier_token);
                    this.advance();

                    // there might be an equal sign
                    // to customise the default value
                    // which is null by default
                    if (this.current_token.type === TokenType.EQUALS) {
                        this.advance();

                        try {
                            let node_default_value = this.expr();
                            default_values_nodes.push(node_default_value);
                        } catch(e) {
                            throw new InvalidSyntaxError(
                                this.current_token.pos_start, this.current_token.pos_end,
                                "Expected default value for the argument."
                            );
                        }
                    } else {
                        let df = new NumberNode(new Token(TokenType.NUMBER, NumberValue.none.value, question_mark_token.pos_start, question_mark_token.pos_end));
                        default_values_nodes.push(df);
                    }
                } else { // mandatory with no default value
                    // there was an optional argument already
                    // so there is a mandatory argument after an optional one
                    // that's not good
                    if (is_optional) {
                        throw new InvalidSyntaxError(
                            identifier_token.pos_start, identifier_token.pos_end,
                            "Expected an optional argument"
                        );
                    } else {
                        mandatory_arg_name_toks.push(identifier_token);
                    }
                }
            };

            check_for_optional_args();

            // there are arguments, how many?
            // we want them all

            while (this.current_token.type === TokenType.COMMA) {
                this.advance();

                // there must be an identifier after the comma (= the arg)
                if (this.current_token.type !== TokenType.IDENTIFIER) {
                    throw new InvalidSyntaxError(
                        this.current_token.pos_start, this.current_token.pos_end,
                        "Expected identifier"
                    );
                }

                check_for_optional_args();
            }

            // we have all the args,
            // now there must be a right parenthesis

            if (this.current_token.type !== TokenType.RPAREN) {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "Expected ',' or ')'"
                );
            }
        } else {
            // there is no identifier (no args)
            // so we must find a right parenthesis
            if (this.current_token.type !== TokenType.RPAREN) {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "Expected identifier or ')'"
                );
            }
        }

        // we get out of the parenthesis

        this.advance();

        // we should have an arrow now
        // if we have an inline function of course
        if (this.current_token.type === TokenType.ARROW) {
            // great, enter the body now
            this.advance();

            // what's our body?
            let node_to_return = this.expr();

            return new FuncDefNode(
                var_name_token, // the name
                arg_name_toks, // all the arguments
                mandatory_arg_name_toks, // the mandatory arguments
                optional_name_toks, // the optional arguments
                default_values_nodes, // their default values
                node_to_return, // the body,
                true // should auto return? True because the arrow behaves like the `return` keyword.
            );
        }

        // I want to write a semicolon when there are several lines
        if (this.current_token.type !== TokenType.SEMICOLON) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected ':' or '->'"
            );
        }

        this.advance();

        // now there might be a new line

        if (this.current_token.type !== TokenType.NEWLINE) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected '->' or a new line"
            );
        }

        this.advance();

        let body = this.statements();

        if (!this.current_token.matches(TokenType.KEYWORD, "end")) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected 'end'"
            );
        }

        this.advance();

        return new FuncDefNode(
            var_name_token,
            arg_name_toks,
            mandatory_arg_name_toks,
            optional_name_toks,
            default_values_nodes,
            body,
            false // should auto return? False because we need a `return` keyword for a several-lines function 
        );
    }
}