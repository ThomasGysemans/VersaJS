"use strict";

import { TokenType, Token, Types } from "./tokens.js";
import { CustomNode, AddNode, DivideNode, MinusNode, ModuloNode, MultiplyNode, NumberNode, PlusNode, PowerNode, SubtractNode, VarAssignNode, VarAccessNode, VarModifyNode, OrNode, NotNode, AndNode, EqualsNode, LessThanNode, LessThanOrEqualNode, GreaterThanNode, GreaterThanOrEqualNode, NotEqualsNode, NullishOperatorNode, ListNode, ListAccessNode, ListAssignmentNode, ListPushBracketsNode, ListBinarySelector, StringNode, IfNode, ForNode, WhileNode, FuncDefNode, CallNode, ReturnNode, ContinueNode, BreakNode, DefineNode, DeleteNode, PrefixOperationNode, PostfixOperationNode, DictionnaryElementNode, DictionnaryNode, ForeachNode, ClassPropertyDefNode, ClassMethodDefNode, ClassDefNode, ClassCallNode, CallPropertyNode, AssignPropertyNode, CallMethodNode, CallStaticPropertyNode, SuperNode, ArgumentNode, EnumNode, SwitchNode, NoneNode, BooleanNode, BinaryShiftLeftNode, BinaryShiftRightNode, UnsignedBinaryShiftRightNode, NullishAssignmentNode, LogicalAndNode, LogicalOrNode, LogicalXORNode, BinaryNotNode, AndAssignmentNode, OrAssignmentNode, ListArgumentNode, TypeofNode, InstanceofNode, TagStateDefNode, TagPropDefNode, TagDefNode, HtmlNode } from "./nodes.js";
import { InvalidSyntaxError } from "./Exceptions.js";
import { is_in } from "./miscellaneous.js";
import { Position } from "./position.js";

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

    // \n, \r\n or ;
    is_newline() {
        return this.current_token.type === TokenType.NEWLINE || this.current_token.type === TokenType.SEMICOLON;
    }

    is_indentation() {
        return this.current_token.type === TokenType.INDENTATION;
    }

    count_indentation() {
        let count = 0;
        while (this.is_indentation()) {
            count++;
            this.advance();
        }
        return count;
    }

    // we just want to avoid the newlines (\n)
    // but not the semicolons.
    // That allows us to make the difference between the wanted syntax of the user
    // and a syntax error (a semicolon inside a list declaration for example).
    // Let's take:
    // `return;` // i.e. end of statement
    // However, we might have:
    // ```
    // return
    //     (5 + 5)
    // ```
    ignore_newlines(ignore_indentation=true) {
        while (true) {
            if (this.current_token.type === TokenType.NEWLINE) {
                this.advance();
            } else if (ignore_indentation && this.current_token.type === TokenType.INDENTATION) {
                this.advance();
            } else {
                break;
            }
        }
    }

    ignore_indentation() {
        while (true) {
            if (this.current_token.type === TokenType.INDENTATION) {
                this.advance();
            } else {
                break;
            }
        }
    }

    /**
     * Assigns a type.
     * @param {string} token_value The value of the token following ':'
     */
    assign_type(token_value) {
        return token_value;
    }

    parse() {
        if (this.current_token === null) {
            return null;
        }

        let result = this.statements();

        // we've reached the end of the parsing
        // but not the end of the file
        if (this.current_token !== null && this.current_token.type !== TokenType.EOF) {
            let invalid_token = this.current_token;
            let pos_start = this.current_token.pos_start.copy();
            this.advance();
            let pos_end = this.current_token ? this.current_token.pos_end : pos_start.copy();
            throw new InvalidSyntaxError(
                pos_start, pos_end,
                `Unexpected end of parsing: unable to parse '${invalid_token.value}'.`
            );
        }

        return result;
    }
    
    statements() {
        let statements = [];
        let pos_start = this.current_token.pos_start.copy();

        this.ignore_newlines();

        // the file is empty
        if (this.current_token.type === TokenType.EOF) {
            return new ListNode(statements, null, null);
        }

        let statement = this.statement();
        statements.push(statement);

        let more_statements = this.current_token !== null && this.current_token.type !== TokenType.EOF;

        if (more_statements) {
            while (true) {
                let newline_count = 0;
                while (this.is_newline()) {
                    this.advance();
                    this.ignore_indentation();
                    newline_count++;
                }

                if (this.current_token.type === TokenType.EOF) break;

                // there are no more lines
                if (newline_count === 0) more_statements = false;
                if (!more_statements) break;
                
                if (this.current_token.matches(TokenType.KEYWORD, "elif")) {
                    more_statements = false;
                } else if (this.current_token.matches(TokenType.KEYWORD, "else")) {
                    more_statements = false;
                } else if (this.current_token.matches(TokenType.KEYWORD, "end")) {
                    more_statements = false;
                } else if (this.current_token.matches(TokenType.KEYWORD, "case")) { // we don't use `break` for the end of a case in a switch
                    more_statements = false;
                } else if (this.current_token.matches(TokenType.KEYWORD, "default")) { // we don't use `break` for the end of a case in a switch
                    more_statements = false;
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
        } else {
            return new ListNode(
                statements,
                pos_start,
                statements[statements.length - 1].pos_end.copy()
            );
        }
    }

    statement() {
        let pos_start = this.current_token.pos_start.copy();

        if (this.current_token.matches(TokenType.KEYWORD, "return")) {
            this.advance();

            let expr = null;
            if (!this.is_newline() && this.current_token.type !== TokenType.EOF) expr = this.expr();
            
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

        if (this.current_token.matches(TokenType.KEYWORD, "class")) {
            return this.class_expr();
        }

        if (this.current_token.matches(TokenType.KEYWORD, "tag")) {
            return this.tag_expr();
        }

        if (this.current_token.matches(TokenType.KEYWORD, "super")) {
            let pos_start = this.current_token.pos_start.copy();
            this.advance();
            if (this.current_token.type !== TokenType.LPAREN) {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "Expected parenthesis"
                );
            }
            let call_node = this.helper_call_func(new CustomNode().set_pos(pos_start, this.current_token.pos_end.copy()));
            return new SuperNode(call_node.arg_nodes, pos_start, this.current_token.pos_end);
        }

        if (this.current_token.matches(TokenType.KEYWORD, "enum")) {
            return this.enum_expr();
        }

        return this.expr();
    }

    tag_expr() {
        let pos_start = this.current_token.pos_start.copy();
        this.advance();

        if (this.current_token.type !== TokenType.IDENTIFIER) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected an identifier"
            );
        }
        
        let tag_tok = this.current_token;
        let props = [];
        let states = [];
        let methods = [];
        
        this.advance();

        if (this.current_token.type !== TokenType.COLON) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected ':'"
            );
        }

        this.advance();
        let is_multiline = this.is_newline();
        if (is_multiline) this.ignore_newlines();

        // `prop Test: end` I want to write "pass" in this case
        if (this.current_token.matches(TokenType.KEYWORD, "end")) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Use 'pass' to write an empty class"
            );
        }

        if (this.current_token.matches(TokenType.KEYWORD, "pass")) {
            let pos_end = this.current_token.pos_end.copy();
            this.advance();
            if (is_multiline) {
                this.ignore_newlines();
                if (!this.current_token.matches(TokenType.KEYWORD, "end")) {
                    throw new InvalidSyntaxError(
                        this.current_token.pos_start, this.current_token.pos_end,
                        "Expected 'end'"
                    );
                }
                pos_end = this.current_token.pos_end.copy();
                this.advance();
            }
            return new TagDefNode(
                tag_tok,
                props,
                states,
                methods,
                pos_start,
                pos_end
            );
        }

        const is_state  = () => this.current_token.matches(TokenType.KEYWORD, "state");
        const is_prop   = () => this.current_token.matches(TokenType.KEYWORD, "prop");
        const is_method = () => this.current_token.matches(TokenType.KEYWORD, "method");

        while (
            is_state() ||
            is_prop() ||
            is_method()
        ) {
            let beginning_pos_start = this.current_token.pos_start.copy();
            let prop = is_prop();
            let state = is_state();

            if (state || prop) {
                this.advance();
                let optional = 0;
                if (this.current_token.type === TokenType.QMARK) {
                    if (state) {
                        throw new InvalidSyntaxError(
                            this.current_token.pos_start, this.current_token.pos_end,
                            "Cannot declare an optional variable."
                        );
                    }
                    optional = 1;
                    this.advance();
                }
                if (this.current_token.type !== TokenType.IDENTIFIER) {
                    throw new InvalidSyntaxError(
                        this.current_token.pos_start, this.current_token.pos_end,
                        "Expected an identifier"
                    );
                }
                let property_name_tok = this.current_token;
                let property_type = null;
                this.advance();
                if (this.current_token.type === TokenType.COLON) {
                    this.advance();
                    property_type = this.assign_type(this.current_token.value);
                    this.advance();
                }
                let value_node;
                if (this.current_token.type === TokenType.EQUALS) {
                    this.advance();
                    value_node = this.expr();
                } else {
                    value_node = new NoneNode(beginning_pos_start, property_name_tok.pos_end);
                }
                if (state) {
                    states.push(
                        new TagStateDefNode(
                            property_name_tok,
                            value_node,
                            property_type
                        ).set_pos(beginning_pos_start, value_node.pos_end)
                    );
                } else if (prop) {
                    props.push(
                        new TagPropDefNode(
                            property_name_tok,
                            value_node,
                            property_type,
                            optional
                        ).set_pos(beginning_pos_start, value_node.pos_end)
                    );
                }
                this.advance();
                this.ignore_newlines();
            } else if (is_method()) {
                let pos_start = this.current_token.pos_start.copy();
                let pos_end = this.current_token.pos_end.copy();
                let func_expr = this.func_expr();
                if (func_expr.var_name_tok === null) {
                    throw new InvalidSyntaxError(
                        pos_start, pos_end,
                        "A method cannot be anonymous"
                    );
                }
                func_expr.set_pos(beginning_pos_start, func_expr.pos_end);
                methods.push(func_expr);
                this.advance()
                this.ignore_newlines();
            }
        }

        if (!this.current_token.matches(TokenType.KEYWORD, "end")) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected 'end'"
            );
        }

        let tag_pos_end = this.current_token.pos_end;

        this.advance();

        return new TagDefNode(
            tag_tok,
            props,
            states,
            methods,
            pos_start,
            tag_pos_end
        );
    }

    enum_expr() {
        let pos_start = this.current_token.pos_start.copy();
        this.advance();
        
        if (this.current_token.type !== TokenType.IDENTIFIER) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected an identifier"
            );
        }

        let enum_name_tok = this.current_token;
        let properties = [];
        let is_multiline = false;

        this.advance();

        if (this.current_token.type !== TokenType.COLON) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected ':'"
            );
        }

        this.advance();
        is_multiline = this.is_newline();
        if (is_multiline) this.ignore_newlines();

        if (this.current_token.matches(TokenType.KEYWORD, "pass")) {
            let pos_end = this.current_token.pos_end.copy();
            this.advance();
            if (is_multiline) {
                this.ignore_newlines();
                if (!this.current_token.matches(TokenType.KEYWORD, "end")) {
                    throw new InvalidSyntaxError(
                        this.current_token.pos_start, this.current_token.pos_end,
                        "Expected 'end'"
                    );
                }
                pos_end = this.current_token.pos_end.copy();
                this.advance();
            }
            return new EnumNode(
                enum_name_tok,
                properties,
                pos_start,
                pos_end
            );
        }

        if (this.current_token.type !== TokenType.IDENTIFIER) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected an identifier or 'pass'"
            );
        }

        properties.push(this.current_token);
        this.advance();
        if (is_multiline) this.ignore_newlines();

        while (this.current_token.type === TokenType.COMMA) {
            this.advance();
            if (is_multiline) this.ignore_newlines();
            if (this.current_token.type === TokenType.IDENTIFIER) {
                properties.push(this.current_token);
                this.advance();
                if (is_multiline) this.ignore_newlines();
            } else {
                break;
            }
        }

        if (is_multiline) {
            if (!this.current_token.matches(TokenType.KEYWORD, "end")) {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "Expected 'end'"
                );
            }
        } else {
            // on a single line statement, we expect the end of the enum statement to be a newline or the end of the file
            if (this.current_token.type !== TokenType.EOF && !this.is_newline()) {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "Expected newline or ';'"
                );
            }
        }

        let pos_end = this.current_token.pos_end.copy();
        if (this.current_token.type !== TokenType.EOF && !this.is_newline()) this.advance();

        return new EnumNode(
            enum_name_tok,
            properties,
            pos_start,
            pos_end
        );
    }
    
    class_expr() {
        let class_pos_start = this.current_token.pos_start.copy();
        this.advance();

        if (this.current_token.type !== TokenType.IDENTIFIER) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected an identifier"
            );
        }

        let class_name_tok = this.current_token;
        let properties = [];
        let methods = [];
        let getters = [];
        let setters = [];
        let parent_class_tok;

        this.advance();

        if (this.current_token.matches(TokenType.KEYWORD, "extends")) {
            this.advance();
            if (this.current_token.type !== TokenType.IDENTIFIER) {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "Expected an identifier"
                );
            }
            parent_class_tok = this.current_token;
            this.advance();
        }

        if (this.current_token.type !== TokenType.COLON) {
            throw new InvalidSyntaxError(
                class_name_tok.pos_start, class_name_tok.pos_end,
                `Expected ':'`
            );
        }

        this.advance();
        let is_multiline = this.is_newline();
        if (is_multiline) this.ignore_newlines();

        const is_public = () => this.current_token.matches(TokenType.KEYWORD, "public");
        const is_private = () => this.current_token.matches(TokenType.KEYWORD, "private");
        const is_protected = () => this.current_token.matches(TokenType.KEYWORD, "protected");
        const is_override = () => this.current_token.matches(TokenType.KEYWORD, "override");
        const is_property = () => this.current_token.matches(TokenType.KEYWORD, "property");
        const is_method = () => this.current_token.matches(TokenType.KEYWORD, "method");
        const is_setter = () => this.current_token.matches(TokenType.KEYWORD, "set");
        const is_getter = () => this.current_token.matches(TokenType.KEYWORD, "get");
        const is_static = () => this.current_token.matches(TokenType.KEYWORD, "static");

        // `class Test: end` I want to write "pass" in this case
        if (this.current_token.matches(TokenType.KEYWORD, "end")) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Use 'pass' to write an empty class"
            );
        }

        if (this.current_token.matches(TokenType.KEYWORD, "pass")) {
            let pos_end = this.current_token.pos_end.copy();
            this.advance();
            if (is_multiline) {
                this.ignore_newlines();
                if (!this.current_token.matches(TokenType.KEYWORD, "end")) {
                    throw new InvalidSyntaxError(
                        this.current_token.pos_start, this.current_token.pos_end,
                        "Expected 'end'"
                    );
                }
                pos_end = this.current_token.pos_end.copy();
                this.advance();
            }
            return new ClassDefNode(
                class_name_tok,
                parent_class_tok,
                properties,
                methods,
                getters,
                setters,
                class_pos_start,
                pos_end,
            );
        }

        while (
            is_private() ||
            is_public() ||
            is_protected() ||
            is_override() ||
            is_property() ||
            is_method() ||
            is_setter() ||
            is_getter() ||
            is_static()
        ) {
            if (!is_multiline) {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "Cannot write a class on a single line."
                );
            }

            let beginning_pos_start = this.current_token.pos_start.copy();

            let status = 1;
            if (is_private()) status = 0;
            if (is_protected()) status = 2;

            if (
                is_private() ||
                is_public() ||
                is_protected()
            ) {
                this.advance();
            }

            let override = is_override() ? 1 : 0;
            if (is_override()) this.advance()
            
            let static_prop = is_static() ? 1 : 0;
            if (is_static()) this.advance();

            if (is_getter() || is_setter() || is_method()) {
                let is_get = is_getter();
                let is_set = is_setter();
                let is_met = is_method();

                let pos_start = this.current_token.pos_start.copy();
                let pos_end = this.current_token.pos_end.copy();
                let func_expr = this.func_expr();
                if (func_expr.var_name_tok === null) {
                    throw new InvalidSyntaxError(
                        pos_start, pos_end,
                        "Expected an identifier"
                    );
                }
                let node = new ClassMethodDefNode(
                    func_expr,
                    status,
                    override,
                    static_prop
                ).set_pos(beginning_pos_start, func_expr.pos_end);
                if (is_get) getters.push(node);
                if (is_set) setters.push(node);
                if (is_met) methods.push(node);
                this.advance()
                this.ignore_newlines();
            } else if (is_property()) { // property
                this.advance();
                if (this.current_token.type !== TokenType.IDENTIFIER) {
                    throw new InvalidSyntaxError(
                        this.current_token.pos_start, this.current_token.pos_end,
                        "Expected an identifier"
                    );
                }
                let property_name_tok = this.current_token;
                let property_pos_end = this.current_token.pos_end.copy();
                let property_type = null;
                this.advance();
                if (this.current_token.type === TokenType.COLON) {
                    this.advance();
                    property_type = this.assign_type(this.current_token.value);
                    this.advance();
                }
                let value_node;
                if (this.current_token.type === TokenType.EQUALS) {
                    this.advance();
                    value_node = this.expr();
                } else {
                    value_node = new NoneNode(beginning_pos_start, property_pos_end);
                }
                let property_def_node = new ClassPropertyDefNode(
                    property_name_tok,
                    value_node,
                    property_type,
                    status,
                    override,
                    static_prop
                ).set_pos(beginning_pos_start, value_node.pos_end);
                properties.push(property_def_node);
                this.advance();
                this.ignore_newlines();
            } else {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "The right order is: private/protected/public? override? static? method/property/get/set"
                );
            }
        }

        if (!this.current_token.matches(TokenType.KEYWORD, "end")) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected 'end'"
            );
        }

        let class_pos_end = this.current_token.pos_end;

        this.advance();

        return new ClassDefNode(
            class_name_tok,
            parent_class_tok,
            properties,
            methods,
            getters,
            setters,
            class_pos_start,
            class_pos_end,
        );
    }

    expr() {
        if (this.current_token.matches(TokenType.KEYWORD, "var") || this.current_token.matches(TokenType.KEYWORD, "define")) {
            let is_variable = this.current_token.matches(TokenType.KEYWORD, "var");
            let pos_start = this.current_token.pos_start;
            this.advance();
            
            if (this.current_token.type !== TokenType.IDENTIFIER) {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "Expected identifier"
                );
            }
            
            const var_name_tok = this.current_token;
            this.advance();

            let type = null;

            if (this.current_token.type === TokenType.COLON) {
                this.advance();
                type = this.assign_type(this.current_token.value);
                this.advance();
            }

            if (is_variable) { // is var?
                let value_node;
                if (this.current_token.type === TokenType.EQUALS) {
                    this.advance();
                    value_node = this.expr();
                } else {
                    value_node = new NoneNode(this.current_token.pos_start.copy(), this.current_token.pos_end.copy());
                }
                return new VarAssignNode(var_name_tok, value_node, type);
            } else { // is define?
                if (this.current_token.type !== TokenType.EQUALS) {
                    throw new InvalidSyntaxError(
                        pos_start, this.current_token.pos_end,
                        "You must assign a value to a constant."
                    );
                }

                this.advance();
                const value_node = this.expr();
                return new DefineNode(var_name_tok, value_node, type);
            }
        } else if (this.current_token.matches(TokenType.KEYWORD, "delete")) {
            let pos_start = this.current_token.pos_start;
            this.advance();

            let node_to_delete = this.call(); // I don't want to delete properties, so not `this.prop()`

            return new DeleteNode(node_to_delete, pos_start, node_to_delete.pos_end);
        }

        return this.html_expr();
    }
    
    html_expr() {
        if (this.current_token.type === TokenType.LCHEVRON) {
            let pos_start = this.current_token.pos_start.copy();
            this.advance();

            const parse_html = () => {
                let tagname_tok = null;
                let classes = [];
                let id = null;
                let attributes = [];
                let events = [];
                let beginning_pos_start = this.current_token.pos_start.copy();
                let pos_end = null;

                // we are after "<"
                if (this.current_token.type === TokenType.IDENTIFIER) {
                    tagname_tok = this.current_token;
                    this.advance();

                    let potential_tokens = [
                        TokenType.DOT,
                        TokenType.HASH
                    ];

                    while (is_in(this.current_token.type, potential_tokens)) {
                        if (this.current_token.type === TokenType.DOT) {
                            this.advance();
                            let classname = this.current_token.value;
                            if (is_in(classname, classes)) {
                                throw new InvalidSyntaxError(
                                    this.current_token.pos_start, this.current_token.pos_end,
                                    "This class has already been declared."
                                );
                            }
                            classes.push(classname);
                            this.advance();
                        } else {
                            if (id) {
                                // we have already declared an ID
                                throw new InvalidSyntaxError(
                                    this.current_token.pos_start, this.current_token.pos_end,
                                    "An ID has already been declared."
                                );
                            }
                            this.advance();
                            id = this.current_token.value;
                            this.advance();
                        }
                    }
                    
                    while (
                        this.current_token.type === TokenType.IDENTIFIER ||
                        this.current_token.type === TokenType.ARROBASE
                    ) {
                        if (this.current_token.type === TokenType.IDENTIFIER) {
                            let attr_tok = this.current_token;
                            let value_node;
                            this.advance();
                            if (this.current_token.type === TokenType.EQUALS) {
                                this.advance();
                                if (this.current_token.type === TokenType.LBRACK) {
                                    this.advance();
                                    value_node = this.cond_expr();
                                    if (this.current_token.type !== TokenType.RBRACK) {
                                        throw new InvalidSyntaxError(
                                            this.current_token.pos_start, this.current_token.pos_end,
                                            "Expected '}'"
                                        );
                                    }
                                    this.advance();
                                } else {
                                    if (this.current_token.type !== TokenType.STRING) {
                                        throw new InvalidSyntaxError(
                                            this.current_token.pos_start, this.current_token.pos_end,
                                            "For more readability and consistency, you must use brackets {} around your value, or a simple string"
                                        );
                                    }
                                    value_node = this.atom();
                                }
                            } else {
                                value_node = new StringNode(attr_tok); // <button disabled> === <button disabled="disabled">
                            }
                            attributes.push([attr_tok, value_node]);
                        } else if (this.current_token.type === TokenType.ARROBASE) {
                            this.advance();
                            let eventname = this.current_token;
                            this.advance();
                            if (this.current_token.type !== TokenType.EQUALS) {
                                throw new InvalidSyntaxError(
                                    this.current_token.pos_start, this.current_token.pos_end,
                                    "Expected '='"
                                );
                            }
                            this.advance();
                            if (this.current_token.type !== TokenType.LBRACK) {
                                throw new InvalidSyntaxError(
                                    this.current_token.pos_start, this.current_token.pos_end,
                                    "Expected '{'"
                                );
                            }
                            this.advance();
                            let value_node = this.prop();
                            if (this.current_token.type !== TokenType.RBRACK) {
                                throw new InvalidSyntaxError(
                                    this.current_token.pos_start, this.current_token.pos_end,
                                    "Expected '}'"
                                );
                            }
                            events.push([eventname, value_node]);
                            this.advance();
                        }
                    }

                    if (this.current_token.type !== TokenType.RCHEVRON) {
                        throw new InvalidSyntaxError(
                            this.current_token.pos_start, this.current_token.pos_end,
                            "Expected '>'"
                        );
                    }

                    pos_end = this.current_token.pos_end.copy();

                    this.advance();
                } else {
                    if (this.current_token.type !== TokenType.RCHEVRON) {
                        throw new InvalidSyntaxError(
                            this.current_token.pos_start, this.current_token.pos_end,
                            "Expected identifier or '>'"
                        );
                    }
                    pos_end = this.current_token.pos_end.copy();
                    this.advance();
                }

                return new HtmlNode(
                    tagname_tok,
                    classes,
                    id,
                    attributes,
                    events,
                    [],
                    beginning_pos_start,
                    pos_end
                );
            };

            if (this.current_token.type === TokenType.IDENTIFIER) { // oneline
                let element = parse_html();
                if (!this.is_newline() && this.current_token.type !== TokenType.EOF) {
                    let child = this.cond_expr();
                    element.children.push(child);
                }
                return element;
            } else { // multiline
                if (this.current_token.type !== TokenType.RCHEVRON) {
                    throw new InvalidSyntaxError(
                        this.current_token.pos_start, this.current_token.pos_end,
                        "Expected identifier or '>'"
                    );
                }
                this.advance();
                
                if (!this.is_newline()) {
                    throw new InvalidSyntaxError(
                        this.current_token.pos_start, this.current_token.pos_end,
                        "Expected a newline after an opening fragment"
                    );
                }

                this.ignore_newlines(false);

                // count_indentation also ignores indentation
                let starting_indentation = this.count_indentation();
                let children = [];
                let pos_end = null;

                /** @type {{element: any, level: number}[]} */
                let all_elements = [];
                let previous_indentation = starting_indentation;
                let idx = 0;
                
                /** @type {{element: any, idx: number}[]} */
                const mainElements = [];

                const is_if      = () => this.current_token.matches(TokenType.KEYWORD, "if");
                const is_for     = () => this.current_token.matches(TokenType.KEYWORD, "for");
                const is_foreach = () => this.current_token.matches(TokenType.KEYWORD, "foreach");
                const is_lbrack  = () => this.current_token.type === TokenType.LBRACK;

                while (
                    this.current_token.type === TokenType.LCHEVRON ||
                    is_if() ||
                    is_for() ||
                    is_foreach() ||
                    is_lbrack()
                ) {
                    let is_element = this.current_token.type === TokenType.LCHEVRON;
                    if (is_element) {
                        this.advance();
                        if (this.current_token.type === TokenType.SLASH) {
                            this.advance();
                            if (this.current_token.type !== TokenType.RCHEVRON) {
                                throw new InvalidSyntaxError(
                                    this.current_token.pos_start, this.current_token.pos_end,
                                    "Expected '>'"
                                );
                            }
                            pos_end = this.current_token.pos_end;
                            this.advance();
                            break;
                        }
                        let tag = parse_html();
                        all_elements.push({
                            element: tag,
                            level: previous_indentation
                        });
                        if (previous_indentation === starting_indentation) {
                            mainElements.push({
                                element: tag,
                                idx
                            });
                        }
                    } else if (
                        is_if() ||
                        is_for() ||
                        is_foreach()
                    ) {
                        let statement;
                        if (is_if()) statement = this.if_expr(true);
                        if (is_for()) statement = this.for_expr(true);
                        if (is_foreach()) statement = this.foreach_expr(true);
                        all_elements.push({
                            element: statement,
                            level: previous_indentation
                        });
                        if (previous_indentation === starting_indentation) {
                            mainElements.push({
                                element: statement,
                                idx
                            });
                        }
                    } else if (is_lbrack()) {
                        this.advance();
                        let value_node = this.cond_expr();
                        if (this.current_token.type !== TokenType.RBRACK) {
                            throw new InvalidSyntaxError(
                                this.current_token.pos_start, this.current_token.pos_end,
                                "Expected '}'"
                            );
                        }
                        this.advance();
                        if (!this.is_newline()) {
                            throw new InvalidSyntaxError(
                                this.current_token.pos_start, this.current_token.pos_end,
                                "Expected a newline"
                            );
                        }
                        all_elements.push({
                            element: value_node,
                            level: previous_indentation
                        });
                        if (previous_indentation === starting_indentation) {
                            mainElements.push({
                                element: value_node,
                                idx
                            });
                        }
                    }
                    if (is_element && !this.is_newline()) { // <div> "Content"
                        let value_node;
                        if (this.current_token.type === TokenType.LBRACK) { // <div> {variable}
                            this.advance();
                            value_node = this.cond_expr();
                            if (this.current_token.type !== TokenType.RBRACK) {
                                throw new InvalidSyntaxError(
                                    this.current_token.pos_start, this.current_token.pos_end,
                                    "Expected '}'"
                                );
                            }
                            this.advance();
                        } else {
                            if (this.current_token.type !== TokenType.STRING) {
                                throw new InvalidSyntaxError(
                                    this.current_token.pos_start, this.current_token.pos_end,
                                    "For more readability and consistency, you must use brackets {} around your value, or a simple string"
                                );
                            }
                            value_node = this.atom();
                        }
                        if (!this.is_newline()) {
                            throw new InvalidSyntaxError(
                                this.current_token.pos_start, this.current_token.pos_end,
                                "Expected a newline"
                            );
                        }
                        all_elements.push({
                            element: value_node,
                            level: previous_indentation + 1 // + 1 because it's a child of the current indentation
                        });
                        idx++; // we add a new child, a child that counts as a new element in the tree
                    }
                    // prepare the following element
                    this.ignore_newlines(false);
                    previous_indentation = this.count_indentation();
                    idx++;
                }

                const getDeepestIndex = (arr) => {
                    let max = arr[0].level;
                    let index = 0;
                    for (let i = 0; i < arr.length; i++) {
                        if (arr[i].level >= max) { // >= because we want the last one
                            max = arr[i].level;
                            index = i;
                        }
                    }
                    return index;
                };

                const getNearestIndex = (from, lvl, arr) => {
                    for (let i = from; i >= 0; i--) {
                        if (arr[i].level === (lvl - 1)) {
                            return i;
                        }
                    }
                    return null;
                };

                for (let i = 0; i < mainElements.length; i++) {
                    let mainElement = mainElements[i];
                    let childrenElements = all_elements.slice(mainElement.idx + 1, mainElements[i + 1]?.idx);

                    while (childrenElements.length > 0) {
                        let index_deepest = getDeepestIndex(childrenElements);
                        let deepest = childrenElements[index_deepest];
                        let nearest_index = getNearestIndex(index_deepest, deepest.level, childrenElements);
                        let nearest = nearest_index !== null ? childrenElements[nearest_index] : all_elements[mainElement.idx];
                        
                        if (!(nearest.element instanceof HtmlNode)) {
                            throw new InvalidSyntaxError(
                                nearest.element.pos_start, nearest.element.pos_end,
                                "This element cannot be interpreted as an html node during the parsing. Change the structure of your html."
                            );
                        }

                        nearest.element.children.unshift(deepest.element); // nearest will become the mainElement
                        childrenElements.splice(index_deepest, 1);
                    }

                    children.push(mainElement.element);
                }

                let node = new HtmlNode(
                    null, // because this is a fragment
                    [],
                    null,
                    [],
                    [],
                    children,
                    pos_start,
                    pos_end
                );

                return node;
            }
        }

        return this.cond_expr();
    }

    cond_expr() {
        let result = this.comp_expr();
        
        const is_and = () => this.current_token.matches(TokenType.KEYWORD, "and") || this.current_token.type === TokenType.AND;
        const is_or  = () => this.current_token.matches(TokenType.KEYWORD, "or")  || this.current_token.type === TokenType.OR;

        while (this.current_token !== null && (is_and() || is_or())) {
            if (this.current_token.matches(TokenType.KEYWORD, "and")) {
                this.advance();
                result = new AndNode(result, this.comp_expr());
            } else if (this.current_token.matches(TokenType.KEYWORD, "or")) {
                this.advance();
                result = new OrNode(result, this.comp_expr());
            } else if (this.current_token.type === TokenType.OR) { // ||
                this.advance();
                if (this.current_token.type === TokenType.EQUALS) { // ||=
                    this.advance();
                    if (!(result instanceof VarAccessNode) && !(result instanceof ListAccessNode) && !(result instanceof CallPropertyNode) && !(result instanceof CallStaticPropertyNode)) {
                        throw new InvalidSyntaxError(
                            result.pos_start, result.pos_end,
                            "Expected a variable"
                        );
                    }
                    return new OrAssignmentNode(result, this.expr());
                }
                result = new OrNode(result, this.comp_expr());
            } else if (this.current_token.type === TokenType.AND) { // &&
                this.advance();
                if (this.current_token.type === TokenType.EQUALS) { // &&=
                    this.advance();
                    if (!(result instanceof VarAccessNode) && !(result instanceof ListAccessNode) && !(result instanceof CallPropertyNode) && !(result instanceof CallStaticPropertyNode)) {
                        throw new InvalidSyntaxError(
                            result.pos_start, result.pos_end,
                            "Expected a variable"
                        );
                    }
                    return new AndAssignmentNode(result, this.expr());
                }
                result = new AndNode(result, this.comp_expr());
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

        let result = this.bin_op();
        let possible_tokens = [
            TokenType.DOUBLE_EQUALS,
            TokenType.LT,
            TokenType.GT,
            TokenType.LTE,
            TokenType.GTE,
            TokenType.NOT_EQUAL,
            TokenType.NULLISH_OPERATOR,
        ];

        // 'while' because we want to be able to do:
        // `5 == 5 == yes`
        while (this.current_token !== null && is_in(this.current_token.type, possible_tokens)) {
            if (this.current_token.type === TokenType.DOUBLE_EQUALS) {
                this.advance();
                result = new EqualsNode(result, this.bin_op());
            } else if (this.current_token.type === TokenType.LT) {
                this.advance();
                result = new LessThanNode(result, this.bin_op());
            } else if (this.current_token.type === TokenType.GT) {
                this.advance();
                result = new GreaterThanNode(result, this.bin_op());
            } else if (this.current_token.type === TokenType.LTE) {
                this.advance();
                result = new LessThanOrEqualNode(result, this.bin_op());
            } else if (this.current_token.type === TokenType.GTE) {
                this.advance();
                result = new GreaterThanOrEqualNode(result, this.bin_op());
            } else if (this.current_token.type === TokenType.NOT_EQUAL) {
                this.advance();
                result = new NotEqualsNode(result, this.bin_op());
            } else if (this.current_token.type === TokenType.NULLISH_OPERATOR) {
                this.advance();
                if (this.current_token.type === TokenType.EQUALS) { // a ??= 5, a <- 5 only if a == none
                    this.advance();
                    if (!(result instanceof VarAccessNode) && !(result instanceof ListAccessNode) && !(result instanceof CallPropertyNode) && !(result instanceof CallStaticPropertyNode)) {
                        throw new InvalidSyntaxError(
                            result.pos_start, result.pos_end,
                            "Expected a variable"
                        );
                    }
                    return new NullishAssignmentNode(result, this.expr());
                }
                result = new NullishOperatorNode(result, this.bin_op());
            }
        }

        return result;
    }

    bin_op() {
        let result = this.arith_expr();
        let possible_tokens = [
            TokenType.BINARY_LEFT,
            TokenType.BINARY_RIGHT,
            TokenType.BINARY_UNSIGNED_RIGHT,
            TokenType.LOGICAL_AND,
            TokenType.LOGICAL_OR,
            TokenType.LOGICAL_XOR,
        ];

        if (this.current_token.matches(TokenType.KEYWORD, "instanceof")) {
            this.advance();
            let class_name_tok = this.current_token;
            this.advance();
            return new InstanceofNode(result, class_name_tok);
        }

        while (this.current_token !== null && is_in(this.current_token.type, possible_tokens)) {
            if (this.current_token.type === TokenType.BINARY_LEFT) {
                this.advance();
                if (this.current_token.type === TokenType.EQUALS) { // <<=
                    this.advance();
                    if (result instanceof VarAccessNode) {
                        return new VarModifyNode(result.var_name_tok, new BinaryShiftLeftNode(result, this.expr()));
                    } else if (result instanceof ListAccessNode) {
                        return new ListAssignmentNode(result, new BinaryShiftLeftNode(result, this.expr()));
                    } else if (result instanceof CallPropertyNode || result instanceof CallStaticPropertyNode) {
                        return new AssignPropertyNode(result, new BinaryShiftLeftNode(result, this.expr()));
                    } else {
                        throw new InvalidSyntaxError(
                            result.pos_start, result.pos_end,
                            "Expected a variable"
                        );
                    }
                }
                result = new BinaryShiftLeftNode(result, this.bin_op());
            } else if (this.current_token.type === TokenType.BINARY_RIGHT) {
                this.advance();
                if (this.current_token.type === TokenType.EQUALS) { // >>=
                    this.advance();
                    if (result instanceof VarAccessNode) {
                        return new VarModifyNode(result.var_name_tok, new BinaryShiftRightNode(result, this.expr()));
                    } else if (result instanceof ListAccessNode) {
                        return new ListAssignmentNode(result, new BinaryShiftRightNode(result, this.expr()));
                    } else if (result instanceof CallPropertyNode || result instanceof CallStaticPropertyNode) {
                        return new AssignPropertyNode(result, new BinaryShiftRightNode(result, this.expr()));
                    } else {
                        throw new InvalidSyntaxError(
                            result.pos_start, result.pos_end,
                            "Expected a variable"
                        );
                    }
                }
                result = new BinaryShiftRightNode(result, this.bin_op());
            } else if (this.current_token.type === TokenType.BINARY_UNSIGNED_RIGHT) {
                this.advance();
                if (this.current_token.type === TokenType.EQUALS) { // >>>=
                    this.advance();
                    if (result instanceof VarAccessNode) {
                        return new VarModifyNode(result.var_name_tok, new UnsignedBinaryShiftRightNode(result, this.expr()));
                    } else if (result instanceof ListAccessNode) {
                        return new ListAssignmentNode(result, new UnsignedBinaryShiftRightNode(result, this.expr()));
                    } else if (result instanceof CallPropertyNode || result instanceof CallStaticPropertyNode) {
                        return new AssignPropertyNode(result, new UnsignedBinaryShiftRightNode(result, this.expr()));
                    } else {
                        throw new InvalidSyntaxError(
                            result.pos_start, result.pos_end,
                            "Expected a variable"
                        );
                    }
                }
                result = new UnsignedBinaryShiftRightNode(result, this.bin_op());
            } else if (this.current_token.type === TokenType.LOGICAL_AND) {
                this.advance();
                if (this.current_token.type === TokenType.EQUALS) { // &=
                    this.advance();
                    if (result instanceof VarAccessNode) {
                        return new VarModifyNode(result.var_name_tok, new LogicalAndNode(result, this.expr()));
                    } else if (result instanceof ListAccessNode) {
                        return new ListAssignmentNode(result, new LogicalAndNode(result, this.expr()));
                    } else if (result instanceof CallPropertyNode || result instanceof CallStaticPropertyNode) {
                        return new AssignPropertyNode(result, new LogicalAndNode(result, this.expr()));
                    } else {
                        throw new InvalidSyntaxError(
                            result.pos_start, result.pos_end,
                            "Expected a variable"
                        );
                    }
                }
                result = new LogicalAndNode(result, this.bin_op());
            } else if (this.current_token.type === TokenType.LOGICAL_OR) {
                this.advance();
                if (this.current_token.type === TokenType.EQUALS) { // |=
                    this.advance();
                    if (result instanceof VarAccessNode) {
                        return new VarModifyNode(result.var_name_tok, new LogicalOrNode(result, this.expr()));
                    } else if (result instanceof ListAccessNode) {
                        return new ListAssignmentNode(result, new LogicalOrNode(result, this.expr()));
                    } else if (result instanceof CallPropertyNode || result instanceof CallStaticPropertyNode) {
                        return new AssignPropertyNode(result, new LogicalOrNode(result, this.expr()));
                    } else {
                        throw new InvalidSyntaxError(
                            result.pos_start, result.pos_end,
                            "Expected a variable"
                        );
                    }
                }
                result = new LogicalOrNode(result, this.bin_op());
            } else if (this.current_token.type === TokenType.LOGICAL_XOR) {
                this.advance();
                if (this.current_token.type === TokenType.EQUALS) { // ^=
                    this.advance();
                    if (result instanceof VarAccessNode) {
                        return new VarModifyNode(result.var_name_tok, new LogicalXORNode(result, this.expr()));
                    } else if (result instanceof ListAccessNode) {
                        return new ListAssignmentNode(result, new LogicalXORNode(result, this.expr()));
                    } else if (result instanceof CallPropertyNode || result instanceof CallStaticPropertyNode) {
                        return new AssignPropertyNode(result, new LogicalXORNode(result, this.expr()));
                    } else {
                        throw new InvalidSyntaxError(
                            result.pos_start, result.pos_end,
                            "Expected a variable"
                        );
                    }
                }
                result = new LogicalXORNode(result, this.bin_op());
            }
        }

        return result;
    }

    arith_expr() {
        let result = this.term();
        let possible_tokens = [
            TokenType.PLUS,
            TokenType.MINUS,
            TokenType.INC,
            TokenType.DEC,
        ];

        while (this.current_token !== null && is_in(this.current_token.type, possible_tokens)) {
            if (this.current_token.type === TokenType.PLUS) {
                this.advance();
                if (this.current_token.type === TokenType.EQUALS) { // +=
                    this.advance();
                    if (result instanceof VarAccessNode) {
                        return new VarModifyNode(result.var_name_tok, new AddNode(result, this.expr()));
                    } else if (result instanceof ListAccessNode) {
                        return new ListAssignmentNode(result, new AddNode(result, this.expr()));
                    } else if (result instanceof CallPropertyNode || result instanceof CallStaticPropertyNode) {
                        return new AssignPropertyNode(result, new AddNode(result, this.expr()));
                    } else {
                        throw new InvalidSyntaxError(
                            result.pos_start, result.pos_end,
                            "Expected a variable"
                        );
                    }
                }
                result = new AddNode(result, this.term());
            } else if (this.current_token.type === TokenType.MINUS) { // -=
                this.advance();
                if (this.current_token.type === TokenType.EQUALS) {
                    this.advance();
                    if (result instanceof VarAccessNode) {
                        return new VarModifyNode(result.var_name_tok, new SubtractNode(result, this.expr()));
                    } else if (result instanceof ListAccessNode) {
                        return new ListAssignmentNode(result, new SubtractNode(result, this.expr()));
                    } else if (result instanceof CallPropertyNode || result instanceof CallStaticPropertyNode) {
                        return new AssignPropertyNode(result, new SubtractNode(result, this.expr()));
                    } else {
                        throw new InvalidSyntaxError(
                            result.pos_start, result.pos_end,
                            "Expected a variable"
                        );
                    }
                }
                result = new SubtractNode(result, this.term());
            } else if (this.current_token.type === TokenType.INC) { // a++
                this.advance();
                let difference = 1;
                while (this.current_token.type === TokenType.INC) {
                    difference++;
                    this.advance();
                }
                if (result instanceof ListAccessNode) {
                    return new ListAssignmentNode(result, new AddNode(result, new NumberNode(new Token(TokenType.NUMBER, difference))));
                } else if (result instanceof CallPropertyNode) {
                    return new AssignPropertyNode(result, new NumberNode(new Token(TokenType.NUMBER, difference)));
                } else if (result instanceof CallStaticPropertyNode) {
                    return new AssignPropertyNode(result, new NumberNode(new Token(TokenType.NUMBER, difference)));
                }
                return new PostfixOperationNode(result, difference);
            } else if (this.current_token.type === TokenType.DEC) { // b--
                this.advance();
                let difference = -1;
                while (this.current_token.type === TokenType.DEC) {
                    difference--;
                    this.advance();
                }
                if (result instanceof ListAccessNode) {
                    return new ListAssignmentNode(result, new AddNode(result, new NumberNode(new Token(TokenType.NUMBER, difference))));
                } else if (result instanceof CallPropertyNode) {
                    return new AssignPropertyNode(result, new NumberNode(new Token(TokenType.NUMBER, difference)));
                } else if (result instanceof CallStaticPropertyNode) {
                    return new AssignPropertyNode(result, new NumberNode(new Token(TokenType.NUMBER, difference)));
                }
                return new PostfixOperationNode(result, difference);
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
        let possible_tokens = [
            TokenType.MULTIPLY,
            TokenType.SLASH,
            TokenType.POWER,
            TokenType.MODULO
        ];

        while (this.current_token !== null && is_in(this.current_token.type, possible_tokens)) {
            if (this.current_token.type === TokenType.MULTIPLY) {
                this.advance();
                if (this.current_token.type === TokenType.EQUALS) { // *=
                    this.advance();
                    if (node_a instanceof VarAccessNode) {
                        return new VarModifyNode(node_a.var_name_tok, new MultiplyNode(node_a, this.expr()));
                    } else if (node_a instanceof ListAccessNode) {
                        return new ListAssignmentNode(node_a, new MultiplyNode(node_a, this.expr()));
                    } else if (node_a instanceof CallPropertyNode || node_a instanceof CallStaticPropertyNode) {
                        return new AssignPropertyNode(node_a, new MultiplyNode(node_a, this.expr()));
                    } else {
                        throw new InvalidSyntaxError(
                            node_a.pos_start, result.pos_end,
                            "Expected a variable"
                        );
                    }
                }
                result = new MultiplyNode(result ? result : node_a, this.factor());
            } else if (this.current_token.type === TokenType.SLASH) {
                this.advance();
                if (this.current_token.type === TokenType.EQUALS) { // /=
                    this.advance();
                    if (node_a instanceof VarAccessNode) {
                        return new VarModifyNode(node_a.var_name_tok, new DivideNode(node_a, this.expr()));
                    } else if (node_a instanceof ListAccessNode) {
                        return new ListAssignmentNode(node_a, new DivideNode(node_a, this.expr()));
                    } else if (node_a instanceof CallPropertyNode || node_a instanceof CallStaticPropertyNode) {
                        return new AssignPropertyNode(node_a, new DivideNode(node_a, this.expr()));
                    } else {
                        throw new InvalidSyntaxError(
                            node_a.pos_start, result.pos_end,
                            "Expected a variable"
                        );
                    }
                }
                result = new DivideNode(result ? result : node_a, this.factor());
            } else if (this.current_token.type === TokenType.POWER) {
                this.advance();
                if (this.current_token.type === TokenType.EQUALS) { // **=
                    this.advance();
                    if (node_a instanceof VarAccessNode) {
                        return new VarModifyNode(node_a.var_name_tok, new PowerNode(node_a, this.expr()));
                    } else if (node_a instanceof ListAccessNode) {
                        return new ListAssignmentNode(node_a, new PowerNode(node_a, this.expr()));
                    } else if (node_a instanceof CallPropertyNode || node_a instanceof CallStaticPropertyNode) {
                        return new AssignPropertyNode(node_a, new PowerNode(node_a, this.expr()));
                    } else {
                        throw new InvalidSyntaxError(
                            node_a.pos_start, result.pos_end,
                            "Expected a variable"
                        );
                    }
                }
                result = new PowerNode(result ? result : node_a, this.factor());
            } else if (this.current_token.type === TokenType.MODULO) {
                this.advance();
                if (this.current_token.type === TokenType.EQUALS) { // %=
                    this.advance();
                    if (node_a instanceof VarAccessNode) {
                        return new VarModifyNode(node_a.var_name_tok, new ModuloNode(node_a, this.expr()));
                    } else if (node_a instanceof ListAccessNode) {
                        return new ListAssignmentNode(node_a, new ModuloNode(node_a, this.expr()));
                    } else if (node_a instanceof CallPropertyNode || node_a instanceof CallStaticPropertyNode) {
                        return new AssignPropertyNode(node_a, new ModuloNode(node_a, this.expr()));
                    } else {
                        throw new InvalidSyntaxError(
                            node_a.pos_start, result.pos_end,
                            "Expected a variable"
                        );
                    }
                }
                result = new ModuloNode(result ? result : node_a, this.factor());
            }
        }

        return result ? result : node_a;
    }

    factor() {
        let token = this.current_token;

        if (token.type === TokenType.PLUS) { // +a
            this.advance();
            return new PlusNode(this.factor());
        } else if (token.type === TokenType.MINUS) { // -a
            this.advance();
            return new MinusNode(this.factor());
        } else if (token.matches(TokenType.KEYWORD, "typeof")) { // typeof 5
            this.advance();
            return new TypeofNode(this.factor());
        } else if (token.type === TokenType.BIN_NOT) { // ~a
            this.advance();
            return new BinaryNotNode(this.factor());
        } else if (this.current_token.type === TokenType.INC) { // ++expr
            this.advance();
            let difference = 1;
            while (this.current_token.type === TokenType.INC) {
                difference++;
                this.advance();
            }
            let expr = this.term();
            return new PrefixOperationNode(expr, difference);
        } else if (this.current_token.type === TokenType.DEC) { // --expr
            this.advance();
            let difference = -1;
            while (this.current_token.type === TokenType.DEC) {
                difference--;
                this.advance();
            }
            let expr = this.term();
            return new PrefixOperationNode(expr, difference);
        } else {
            return this.prop();
        }
    }

    prop() {
        let node_to_call = this.call();

        // if we have a '.' after our atom (or '::' or '?.')
        // that means we are calling the atom (and that this atom is a ClassValue)

        const is_dot     = () => this.current_token.type === TokenType.DOT;
        const is_static  = () => this.current_token.type === TokenType.DOUBLE_COLON || this.current_token.type === TokenType.OPTIONAL_STATIC_CALL;
        const is_ocp     = () => this.current_token.type === TokenType.OPTIONAL_CHAINING_OPERATOR || this.current_token.type === TokenType.OPTIONAL_STATIC_CALL;
        const is_lparen  = () => this.current_token.type === TokenType.LPAREN;
        const is_lsquare = () => this.current_token.type === TokenType.LSQUARE;

        if (is_dot() || is_static() || is_ocp()) {
            let is_optional = false;
            let is_static_prop = false;
            let is_calling = false;
            let result;

            while (this.current_token !== null && this.current_token.type !== TokenType.EOF) {
                is_calling = false;

                if (is_ocp()) {
                    is_calling = true;
                    is_optional = true;
                }

                if (is_dot()) is_calling = true;

                if (is_static()) {
                    is_calling = true;
                    is_static_prop = true;
                }

                // if we have prop.method()()()
                // or prop.method()[0]()
                if (is_lparen()) {
                    result = new CallMethodNode(this.helper_call_func(result), node_to_call, is_optional);
                    continue;
                } else if (is_lsquare()) {
                    result = this.helper_call_list(result, this.current_token.pos_start.copy(), is_optional);
                    continue;
                }

                if (!is_calling) break;
                
                this.advance();
                if (!is_static_prop && !is_optional) this.ignore_newlines();
                
                // if we have "example.meth?.()"
                if (is_lparen() && is_optional) {
                    if (!result) { // the risk is that we might have "function?.()" too
                        result = this.helper_call_func(node_to_call, true);
                    } else {
                        result = new CallMethodNode(this.helper_call_func(result), node_to_call, true);
                    }
                } else if (is_lsquare() && is_optional) { // or "example.list?.[0]"
                    if (!result) { // the risk is that we might have "simplelist?.[]" too
                        result = this.helper_call_list(node_to_call, this.current_token.pos_start.copy(), true);
                    } else {
                        result = this.helper_call_list(result, this.current_token.pos_start.copy(), true);
                    }
                } else {
                    if (this.current_token.type !== TokenType.IDENTIFIER) {
                        throw new InvalidSyntaxError(
                            this.current_token.pos_start, this.current_token.pos_end,
                            "Expected identifier"
                        );
                    }

                    let property_tok = this.current_token;

                    this.advance();

                    let call_node = is_static_prop ? new CallStaticPropertyNode(result ? result : node_to_call, property_tok, is_optional) : new CallPropertyNode(result ? result : node_to_call, property_tok, is_optional);

                    if (is_lparen()) {
                        result = new CallMethodNode(this.helper_call_func(call_node), node_to_call); // node_to_call will have to be an instance of ClassValue
                    } else if (is_lsquare()) {
                        result = this.helper_call_list(call_node, this.current_token.pos_start.copy())
                    } else {
                        result = call_node;
                    }
                }
            }

            if (this.current_token.type === TokenType.EQUALS) {
                if (!(result instanceof CallPropertyNode) && !(result instanceof CallStaticPropertyNode)) {
                    throw new InvalidSyntaxError(
                        result.pos_start, result.pos_end,
                        "Unable to assign a new value for that call.",
                    );
                }
                this.advance();
                let value_node = this.expr();
                return new AssignPropertyNode(result, value_node);
            }

            return result;
        }

        return node_to_call;
    }

    call() {
        if (this.current_token.matches(TokenType.KEYWORD, "new")) {
            this.advance();
            if (this.current_token.type !== TokenType.IDENTIFIER) {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "Expected an identifier"
                );
            }
            
            let class_name_tok = this.current_token;
            this.advance();
            if (this.current_token.type !== TokenType.LPAREN) {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "Expected '('"
                );
            }

            this.advance();
            this.ignore_newlines();

            let arg_nodes = [];
            if (this.current_token.type === TokenType.RPAREN) {
                this.advance();
            } else {
                arg_nodes.push(this.expr());
                this.ignore_newlines();

                while (this.current_token.type === TokenType.COMMA) {
                    this.advance();
                    this.ignore_newlines();
                    arg_nodes.push(this.expr());
                }

                this.ignore_newlines();

                if (this.current_token.type !== TokenType.RPAREN) {
                    throw new InvalidSyntaxError(
                        this.current_token.pos_start, this.current_token.pos_end,
                        "Expected ',' or ')'"
                    );
                }

                this.advance();
            }

            return new ClassCallNode(class_name_tok, arg_nodes);
        }

        let atom = this.atom();
        let pos_start = this.current_token.pos_start.copy();
        let result;

        const is_lparen  = () => this.current_token.type === TokenType.LPAREN;
        const is_lsquare = () => this.current_token.type === TokenType.LSQUARE;
        const is_ocp     = () => this.current_token.type === TokenType.OPTIONAL_CHAINING_OPERATOR;

        while (is_lparen() || is_lsquare() || is_ocp()) {
            let optional = false;
            if (is_ocp()) {
                optional = true;
                this.advance();
            }

            if (is_lparen()) {
                result = this.helper_call_func(result ? result : atom, optional);
            } else if (is_lsquare()) {
                result = this.helper_call_list(result ? result : atom, pos_start, optional);
            } else {
                // we might have the following situation:
                // `variable?.() # variable could be a function or a list, therefore no properties here`
                // however, in order not to interfere with the proper behavior of `prop()`
                // we cancel the advancement after the '?.' if this is not a call to a function or a list
                // note: by cancelling the advancement, I mean to come back to the '?.' 'cause the following is surely an identifier
                this.backwards();
                break;
            }
        }

        return result ? result : atom;
    }

    /**
     * grammar: `call_list`
     * @param {CustomNode} atom 
     * @param {Position} pos_start
     * @param {boolean} is_already_optional
     */
    helper_call_list(atom, pos_start, is_already_optional=false) {
        // if we have a left square bracket after our atom
        // that means we are trying to get an element in a list

        // is_already_optional allows us to call helper_call_list elsewhere
        // and keep in mind that the first call has been set as optional

        // we might have "[42]?.[42]"
        if (this.current_token.type === TokenType.LSQUARE || this.current_token.type === TokenType.OPTIONAL_CHAINING_OPERATOR) {
            // list[(1+1)][index]
            let depth = -1;
            /** @type {Array<ListArgumentNode>} */
            let index_nodes = [];
            let is_depth = false;
            let is_pushing = false; // is "list[]" ?
            let i = 0;
            let newest_qmark_tok;

            const is_optional = () => {
                if (this.current_token.type === TokenType.OPTIONAL_CHAINING_OPERATOR) {
                    newest_qmark_tok = this.current_token;
                    this.advance();
                    return true;
                }
                return false;
            };

            while (this.current_token !== null && this.current_token.type !== TokenType.EOF) {
                is_depth = false;
                let optional = i === 0 && is_already_optional ? true : is_optional();

                if (this.current_token.type === TokenType.LSQUARE) is_depth = true;
                if (!is_depth) break;
                if (is_pushing) {
                    throw new InvalidSyntaxError(
                        this.current_token.pos_start, this.current_token.pos_end,
                        `Expected '='`
                    );
                }

                this.advance();
                this.ignore_newlines();

                // if "list[]"
                if (this.current_token.type === TokenType.RSQUARE) {
                    if (optional && newest_qmark_tok) {
                        throw new InvalidSyntaxError(
                            // @ts-ignore
                            newest_qmark_tok.pos_start, newest_qmark_tok.pos_end,
                            "A push to a list cannot be optional"
                        );
                    }
                    index_nodes.push(
                        new ListArgumentNode(
                            new ListPushBracketsNode(this.current_token.pos_start, this.current_token.pos_end),
                            optional
                        )
                    );
                    is_pushing = true;
                } else {
                    let index_pos_start = this.current_token.pos_start.copy();
                    let expr;
                    
                    // is it "[:3]" ? (is it already a colon)
                    if (this.current_token.type === TokenType.COLON) {
                        expr = null;
                    } else {
                        expr = this.expr();
                        this.ignore_newlines();
                    }

                    if (this.current_token.type === TokenType.COLON) {
                        this.advance();
                        
                        let right_expr;
                        if (this.current_token.type === TokenType.RSQUARE) {
                            right_expr = null;
                        } else {
                            right_expr = this.expr();
                            this.ignore_newlines();
                        }

                        index_nodes.push(
                            new ListArgumentNode(
                                new ListBinarySelector(expr, right_expr, index_pos_start, this.current_token.pos_end),
                                optional
                            )
                        );
                    } else {
                        index_nodes.push(
                            new ListArgumentNode(
                                expr,
                                optional
                            )
                        );
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
                i++;
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
        }

        return atom;
    }

    /**
     * grammar: `call_func`
     * @param {CustomNode} atom
     * @param {boolean} is_already_optional
     */
    helper_call_func(atom, is_already_optional=false) {
        // if we have a left parenthesis after our atom
        // that means we are calling the atom

        if (this.current_token.type === TokenType.LPAREN || this.current_token.type === TokenType.OPTIONAL_CHAINING_OPERATOR) {
            let is_calling = false;
            let result;
            let pos_end;

            const is_optional = () => {
                if (this.current_token.type === TokenType.OPTIONAL_CHAINING_OPERATOR) {
                    this.advance();
                    return true;
                }
                return false;
            };

            while (this.current_token !== null && this.current_token.type !== TokenType.EOF) {
                let arg_nodes = [];
                is_calling = false;

                // because the behavior of the lists and the behavior of the functions
                // are different, we imitate the behavior of lists here by defining each call as optional
                // as soon as a call has been defined as optional
                // Thanks to that, we can do: `function?.()()()()`, just like JavaScript
                let optional = is_already_optional ? true : is_optional();

                if (this.current_token.type === TokenType.LPAREN) is_calling = true;
                if (!is_calling) break;

                this.advance();
                this.ignore_newlines();

                if (this.current_token.type === TokenType.RPAREN) {
                    pos_end = this.current_token.pos_end.copy();
                    this.advance();
                } else {
                    arg_nodes.push(this.expr());
                    this.ignore_newlines();

                    while (this.current_token.type === TokenType.COMMA) {
                        this.advance();
                        this.ignore_newlines();
                        arg_nodes.push(this.expr());
                    }

                    this.ignore_newlines();

                    if (this.current_token.type !== TokenType.RPAREN) {
                        throw new InvalidSyntaxError(
                            this.current_token.pos_start, this.current_token.pos_end,
                            "Expected ',' or ')'"
                        );
                    }

                    pos_end = this.current_token.pos_end.copy();

                    this.advance();
                }

                result = new CallNode(result ? result : atom, arg_nodes, optional).set_pos(result ? result.pos_start : atom.pos_start, pos_end);
            }

            return result;
        }

        return atom;
    }
    
    /**
     * @returns {CustomNode}
     */
    atom() {
        let token = this.current_token;

        if (token.type === TokenType.LPAREN) {
            this.advance();
            this.ignore_newlines();
            let result = this.expr();
            this.ignore_newlines();
            if (this.current_token.type !== TokenType.RPAREN) {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "Expected ')'"
                );
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

            if (var_name_tok.value === "f" && this.current_token.type === TokenType.STRING) {
                const string = this.current_token;
                this.advance();
                return new StringNode(string, true);
            }

            if (this.current_token.type === TokenType.EQUALS) {
                this.advance();
                const value_node = this.expr();
                return new VarModifyNode(var_name_tok, value_node);
            }

            return new VarAccessNode(token);
        } else if (this.current_token.type === TokenType.LSQUARE) {
            return this.list_expr();
        } else if (this.current_token.type === TokenType.LBRACK) {
            return this.dict_expr();
        } else if (this.current_token.matches(TokenType.KEYWORD, "if")) {
            return this.if_expr();
        } else if (this.current_token.matches(TokenType.KEYWORD, "for")) {
            return this.for_expr();
        } else if (this.current_token.matches(TokenType.KEYWORD, "foreach")) {
            return this.foreach_expr();
        } else if (this.current_token.matches(TokenType.KEYWORD, "while")) {
            return this.while_expr();
        } else if (this.current_token.matches(TokenType.KEYWORD, "func")) {
            return this.func_expr();
        } else if (this.current_token.matches(TokenType.KEYWORD, "switch")) {
            return this.switch_expr();
        } else if (this.current_token.matches(TokenType.KEYWORD, "none")) {
            this.advance();
            return new NoneNode(token.pos_start, token.pos_end);
        } else if (
            this.current_token.matches(TokenType.KEYWORD, "yes") ||
            this.current_token.matches(TokenType.KEYWORD, "true") ||
            this.current_token.matches(TokenType.KEYWORD, "no") ||
            this.current_token.matches(TokenType.KEYWORD, "false")
        ) {
            let state = this.current_token.matches(TokenType.KEYWORD, "yes") || this.current_token.matches(TokenType.KEYWORD, "true") ? 1 : 0;
            let display_name = this.current_token.value;
            this.advance();
            return new BooleanNode(state, display_name, token.pos_start, token.pos_end);
        } else {
            throw new InvalidSyntaxError(token.pos_start, token.pos_end, `Unexpected token '${token.value}'`);
        }
    }

    // ----

    list_expr() {
        let element_nodes = [];
        let pos_start = this.current_token.pos_start.copy();
        this.advance();
        this.ignore_newlines();

        // if the list is empty ("[]")
        if (this.current_token.type === TokenType.RSQUARE) {
            this.advance();
        } else {
            // we have values in the list
            // it's actually the same as getting arguments from the call method
            element_nodes.push(this.expr());
            this.ignore_newlines();

            while (this.current_token.type === TokenType.COMMA) {
                this.advance();
                this.ignore_newlines();
                if (this.current_token.type === TokenType.RSQUARE) break;
                element_nodes.push(this.expr());
                this.ignore_newlines();
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

    dict_expr() {
        let dict_element_nodes = [];
        let pos_start = this.current_token.pos_start.copy();
        let pos_end;
        this.advance();
        this.ignore_newlines();

        // if the dictionnary is empty ("{}")
        if (this.current_token.type === TokenType.RBRACK) {
            pos_end = this.current_token.pos_end.copy();
            this.advance();
        } else {
            const read_element = () => {
                // we have values in the dictionnary
                let key = this.expr();
                this.ignore_newlines();

                if (key instanceof StringNode) {
                    if (this.current_token.type !== TokenType.COLON) {
                        throw new InvalidSyntaxError(
                            this.current_token.pos_start, this.current_token.pos_end,
                            "Expected ':'"
                        );
                    }

                    this.advance();
                    this.ignore_newlines();

                    let value = this.expr();
                    this.ignore_newlines();
                    let element = new DictionnaryElementNode(key, value);
                    dict_element_nodes.push(element);
                } else if (key instanceof VarAccessNode) {
                    // if this is a variable, we want its name to become the key and its value to become the value of this key
                    // var age = 17; var dico = { age, name: "thomas" }

                    // the user had to use a string
                    // because he's trying to do: `{ age: 17 }`
                    if (this.current_token.type === TokenType.COLON) {
                        throw new InvalidSyntaxError(
                            this.current_token.pos_start, this.current_token.pos_end,
                            "Expected a comma, or change the key to a string"
                        );
                    }

                    // we don't need to advance

                    // we'll do a little trick
                    // => the key becomes the name of the variable
                    // the value becomes the key (an instance of VarAccessNode)
                    // therefore, during interpretation, we'll have: { "age": age }
                    let key_string = new StringNode(key.var_name_tok);
                    let value = key;
                    let element = new DictionnaryElementNode(key_string, value);
                    dict_element_nodes.push(element);
                } else {
                    throw new InvalidSyntaxError(
                        key.pos_start, key.pos_end,
                        "Expected a string or an identifier as key"
                    );
                }
            };

            read_element();

            while (this.current_token.type === TokenType.COMMA) {
                this.advance();
                this.ignore_newlines();
                if (this.current_token.type === TokenType.RBRACK) break;
                read_element();
            }

            this.ignore_newlines();

            if (this.current_token.type !== TokenType.RBRACK) {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "Expected ',' or '}'"
                );
            }

            pos_end = this.current_token.pos_end.copy();

            this.advance();
        }

        return new DictionnaryNode(
            dict_element_nodes,
            pos_start,
            pos_end
        );
    }

    if_expr(prevent_null_return=false) {
        const pos_start = this.current_token.pos_start.copy();
        const all_cases = this.if_expr_cases("if");
        const cases = all_cases.cases;
        const else_case = all_cases.else_case;
        const should_return_null = all_cases.should_return_null;
        let pos_end;
        if (else_case) {
            pos_end = else_case.pos_end;
        } else {
            pos_end = cases[cases.length - 1][1].pos_end;
        }
        return new IfNode(
            cases,
            else_case,
            should_return_null,
            prevent_null_return,
            pos_start,
            pos_end
        );
    }

    /**
     * Gets the cases of a condition, including: "if", "elif" and "else"
     * @param {string} case_keyword The keyword for a case ("if" or "elif").
     * @returns {{cases: [CustomNode, CustomNode][], else_case: CustomNode, should_return_null: boolean}}
     */
    if_expr_cases(case_keyword) {
        let cases = [];
        let else_case = null;
        let should_return_null = false;

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

        // we must have a colon

        if (this.current_token.type !== TokenType.COLON) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected ':'"
            );
        }

        this.advance();

        if (this.is_newline()) {
            this.advance();

            let statements = this.statements();

            // true = should return null?
            // before, we returned the evaluated expr
            // now if we are on several lines, we don't want to return anything
            cases.push([condition, statements]);
            should_return_null = true;

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
            cases.push([condition, statement]); // we want the return value of a if statement (that's why false)
            should_return_null = false;

            const all_cases = this.if_expr_elif_or_else();
            let new_cases = all_cases.cases;
            else_case = all_cases.else_case;

            if (new_cases.length > 0) {
                cases = [...cases, ...new_cases];
            }
        }

        return { cases, else_case, should_return_null };
    }

    /**
     * Checks if there is `elif` cases or an `else` case
     * @returns {{cases: [CustomNode, CustomNode][], else_case: CustomNode, should_return_null: boolean}}
     */
    if_expr_elif_or_else() {
        let cases = [];
        let else_case = null;
        let should_return_null = false;

        if (this.current_token.matches(TokenType.KEYWORD, "elif")) {
            const all_cases = this.if_expr_elif();
            cases = all_cases.cases;
            else_case = all_cases.else_case;
            should_return_null = all_cases.should_return_null;
        } else {
            else_case = this.if_expr_else();
        }

        return { cases, else_case, should_return_null };
    }

    /**
     * Checks if there is an `elif` case.
     * @returns {{cases: [CustomNode, CustomNode][], else_case: CustomNode, should_return_null: boolean}}
     */
    if_expr_elif() {
        return this.if_expr_cases("elif"); // same as "if"
    }

    /**
     * Checks if there is an `else` case.
     * @returns {CustomNode}
     */
    if_expr_else() {
        let else_case = null;
        
        if (this.current_token.matches(TokenType.KEYWORD, "else")) {
            this.advance();

            if (this.current_token.type === TokenType.COLON) {
                this.advance();
            } else {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "Expected ':'"
                );
            }

            if (this.is_newline()) {
                this.advance();
                
                else_case = this.statements();

                if (this.current_token.matches(TokenType.KEYWORD, "end")) {
                    this.advance();
                } else {
                    throw new InvalidSyntaxError(
                        this.current_token.pos_start, this.current_token.pos_end,
                        "Expected 'end'"
                    );
                }
            } else {
                else_case = this.statement();
            }
        }

        return else_case;
    }

    for_expr(prevent_null_return=false) {
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

        if (this.current_token.type !== TokenType.COLON) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected ':'"
            );
        }

        this.advance();

        if (this.is_newline()) {
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
                !prevent_null_return, // true == should return null
                prevent_null_return
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
            false,
            false
        );
    }

    foreach_expr(prevent_null_return=false) {
        let pos_start = this.current_token.pos_start.copy();
        this.advance();

        let list_node = this.prop();

        if (!this.current_token.matches(TokenType.KEYWORD, "as")) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected 'as'"
            );
        }

        this.advance();

        if (this.current_token.type !== TokenType.IDENTIFIER) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected an identifier"
            );
        }

        let var_name_tok = this.current_token;

        this.advance();

        let value_name_tok;
        if (this.current_token.type === TokenType.DOUBLE_ARROW) {
            this.advance();
            value_name_tok = this.current_token;
            this.advance();
        }

        if (this.current_token.type !== TokenType.COLON) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected ':'"
            );
        }

        this.advance();

        if (this.is_newline()) {
            this.advance();

            let extended_body = this.statements();

            if (!this.current_token.matches(TokenType.KEYWORD, "end")) {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "Expected 'end'"
                );
            }

            this.advance();

            return new ForeachNode(
                list_node,
                value_name_tok ? var_name_tok : null,
                value_name_tok ? value_name_tok : var_name_tok,
                extended_body,
                !prevent_null_return,
                prevent_null_return,
                pos_start,
                extended_body.pos_end
            );
        }

        let body = this.statement();

        return new ForeachNode(
            list_node,
            value_name_tok ? var_name_tok : null,
            value_name_tok ? value_name_tok : var_name_tok,
            body,
            false,
            false,
            pos_start,
            body.pos_end
        );
    }

    while_expr() {
        this.advance();

        // after the `while` keyword, there must be an expression

        let condition = this.expr();

        // after the condition, we expect a ":"

        if (this.current_token.type !== TokenType.COLON) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected ':'"
            );
        }

        this.advance();

        if (this.is_newline()) {
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

        let all_args = []; // all the args

        const error_rest_parameter = () => {
            // customisation of the error message
            if (this.current_token.type === TokenType.COMMA) {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "Invalid parameter after rest parameter."
                );
            }
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected a parenthesis ')'"
            );
        };

        let is_rest = false;

        if (this.current_token.type === TokenType.TRIPLE_DOTS) {
            this.advance();
            is_rest = true;
        }

        if (this.current_token.type === TokenType.IDENTIFIER) {
            // there is an identifier
            // advance
            // check if there is a question mark
            // if there is a question mark, check if there is an equal sign
            // if there is an equal sign, advance and get the default value (an expr)

            // just in case we begin with a rest parameter
            if (is_rest) {
                let identifier_token = this.current_token;
                let type = Types.LIST;
                this.advance();
                // is optional
                if (this.current_token.type === TokenType.QMARK) {
                    this.advance();
                    is_optional = true;
                }
                // is the type specified?
                if (this.current_token.type === TokenType.COLON) {
                    this.advance();
                    type = this.assign_type(this.current_token.value);
                    this.advance();
                }
                // just in case a default value has been assigned
                if (this.current_token.type === TokenType.EQUALS) {
                    throw new InvalidSyntaxError(
                        this.current_token.pos_start, this.current_token.pos_end,
                        "A rest parameter can be optional but a default value can't be assigned. It's an empty list by default."
                    );
                }
                all_args.push(new ArgumentNode(identifier_token, type, is_rest, is_optional));
                // there cannot be any more arguments after a rest parameter
                if (this.current_token.type !== TokenType.RPAREN) {
                    error_rest_parameter();
                }
            } else {
                const check_for_args = () => {
                    let identifier_token = this.current_token;
                    this.advance();

                    if (is_rest) {
                        // there cannot be any more arguments after a rest parameter
                        if (this.current_token.type === TokenType.QMARK) {
                            is_optional = true;
                            let type = Types.LIST;
                            let question_mark_token = this.current_token;
                            let default_value = new ListNode([], question_mark_token.pos_start, question_mark_token.pos_end);
                            this.advance();

                            if (this.current_token.type === TokenType.COLON) {
                                this.advance();
                                type = this.assign_type(this.current_token.value);
                                this.advance();
                            }

                            if (this.current_token.type === TokenType.EQUALS) {
                                throw new InvalidSyntaxError(
                                    this.current_token.pos_start, this.current_token.pos_end,
                                    "A rest parameter can be optional but a default value can't be assigned. It's an empty list by default."
                                );
                            }

                            all_args.push(new ArgumentNode(identifier_token, type, is_rest, true, default_value));
                        } else {
                            let type = Types.LIST;
                            if (this.current_token.type === TokenType.COLON) {
                                this.advance();
                                type = this.assign_type(this.current_token.value);
                                this.advance();
                            }
                            all_args.push(new ArgumentNode(identifier_token, type, is_rest, false));
                        }
                        if (this.current_token.type !== TokenType.RPAREN) error_rest_parameter();
                        return;
                    }

                    // there might be a question mark
                    // (optional arg)

                    if (this.current_token.type === TokenType.QMARK) {
                        is_optional = true;
                        let type = Types.ANY;
                        let question_mark_token = this.current_token;
                        let default_value = new NoneNode(question_mark_token.pos_start, question_mark_token.pos_end);
                        this.advance();

                        if (this.current_token.type === TokenType.COLON) {
                            this.advance();
                            type = this.assign_type(this.current_token.value);
                            this.advance();
                        }

                        // there might be an equal sign
                        // to customise the default value
                        // which is null by default
                        if (this.current_token.type === TokenType.EQUALS) {
                            this.advance();
                            default_value = this.expr();
                        }

                        all_args.push(new ArgumentNode(identifier_token, type, is_rest, is_optional, default_value));
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
                            let type = Types.ANY;
                            let is_specified_type = this.current_token.type === TokenType.COLON;
                            if (is_specified_type) {
                                this.advance();
                                type = this.assign_type(this.current_token.value);
                                this.advance();
                            }
                            if (this.current_token.type === TokenType.EQUALS) {
                                throw new InvalidSyntaxError(
                                    this.current_token.pos_start, this.current_token.pos_end,
                                    `In order to assign a default value, you must write: '${is_specified_type ? 'a?: type = 0' : '?='}'`
                                );
                            }
                            all_args.push(new ArgumentNode(identifier_token, type, is_rest, is_optional));
                        }
                    }
                };

                check_for_args();

                // there are arguments, how many?
                // we want them all

                while (this.current_token.type === TokenType.COMMA) {
                    this.advance();

                    // there might be '...' before an identifier (a rest parameter)
                    if (this.current_token.type === TokenType.TRIPLE_DOTS) {
                        this.advance();
                        is_rest = true;
                    }

                    // there must be an identifier after a comma or triple dots
                    if (this.current_token.type !== TokenType.IDENTIFIER) {
                        throw new InvalidSyntaxError(
                            this.current_token.pos_start, this.current_token.pos_end,
                            "Expected identifier"
                        );
                    }

                    check_for_args();

                    if (is_rest) break;
                }

                // we have all the args,
                // now there must be a right parenthesis

                if (this.current_token.type !== TokenType.RPAREN) {
                    throw new InvalidSyntaxError(
                        this.current_token.pos_start, this.current_token.pos_end,
                        "Expected ',' or ')'"
                    );
                }
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

            if (this.current_token.matches(TokenType.KEYWORD, "pass")) {
                let pos_start = this.current_token.pos_start.copy();
                let pos_end = this.current_token.pos_end.copy();
                this.advance();
                return new FuncDefNode(
                    var_name_token, // the name
                    all_args, // all the arguments
                    new NoneNode(pos_start, pos_end), // the body,
                    true // should auto return? True because the arrow behaves like the `return` keyword.
                );
            }

            // what's our body?
            let node_to_return = this.expr();

            return new FuncDefNode(
                var_name_token, // the name
                all_args, // all the arguments
                node_to_return, // the body,
                true // should auto return? True because the arrow behaves like the `return` keyword.
            );
        }
        
        //
        //
        // Multiline function
        //
        //

        // I want to write a colon when there are several lines
        if (this.current_token.type !== TokenType.COLON) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected ':' or '->'"
            );
        }

        this.advance();
        this.ignore_newlines();

        let body;

        // we might need to temporarily write an empty function
        if (this.current_token.matches(TokenType.KEYWORD, "pass")) {
            let pos_start = this.current_token.pos_start.copy();
            let pos_end = this.current_token.pos_end.copy();
            body = new NoneNode(pos_start, pos_end);
            this.advance();
            this.ignore_newlines();
            if (!this.current_token.matches(TokenType.KEYWORD, "end")) {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "Expected 'end'"
                );
            }
            this.advance();
        } else {
            body = this.statements();
            if (!this.current_token.matches(TokenType.KEYWORD, "end")) {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "Expected 'end'"
                );
            }

            this.advance();
        }

        return new FuncDefNode(
            var_name_token,
            all_args,
            body,
            false // should auto return? False because we need a `return` keyword for a several-lines function 
        );
    }

    switch_expr() {
        let pos_start = this.current_token.pos_start.copy();
        this.advance();

        let primary_value = this.expr();

        if (this.current_token.type !== TokenType.COLON) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected ':'"
            );
        }

        this.advance();
        this.ignore_newlines();

        /** @type {Array<{conditions:Array<CustomNode>,body:CustomNode}>} */
        let cases = [];
        /** @type {CustomNode|null} */
        let default_case = null;

        if (!this.current_token.matches(TokenType.KEYWORD, "case") && !this.current_token.matches(TokenType.KEYWORD, "default")) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected cases or default case."
            );
        }

        const search_for_case = () => {
            if (this.current_token.matches(TokenType.KEYWORD, "case")) {
                this.advance();
                this.ignore_newlines();
                let expr = this.expr();
                let conditions = [new EqualsNode(primary_value, expr)];
                this.ignore_newlines();
                if (this.current_token.type === TokenType.COMMA) {
                    while (this.current_token.type === TokenType.COMMA) {
                        this.advance();
                        this.ignore_newlines();
                        conditions.push(new EqualsNode(primary_value, this.expr()));
                        this.ignore_newlines();
                    }
                }
                if (this.current_token.type !== TokenType.COLON) {
                    throw new InvalidSyntaxError(
                        this.current_token.pos_start, this.current_token.pos_end,
                        "Expected ':'"
                    );
                }
                this.advance();
                this.ignore_newlines();
                let body = this.statements();
                cases.push({conditions, body});
            } else if (this.current_token.matches(TokenType.KEYWORD, "default")) {
                this.advance();
                if (this.current_token.type !== TokenType.COLON) {
                    throw new InvalidSyntaxError(
                        this.current_token.pos_start, this.current_token.pos_end,
                        "Expected ':'"
                    );
                }
                this.advance();
                this.ignore_newlines();
                default_case = this.statements();
            }
        };

        search_for_case();

        while (this.current_token.matches(TokenType.KEYWORD, "case") || this.current_token.matches(TokenType.KEYWORD, "default")) {
            // there has been a default case
            // but we're still in the loop
            // that mens that a `case` or another default case has been detected
            if (default_case) {
                throw new InvalidSyntaxError(
                    this.current_token.pos_start, this.current_token.pos_end,
                    "The default case must be the last case of a switch statement."
                );
            }
            search_for_case();
        }

        if (!this.current_token.matches(TokenType.KEYWORD, "end")) {
            throw new InvalidSyntaxError(
                this.current_token.pos_start, this.current_token.pos_end,
                "Expected 'end'"
            );
        }

        this.advance();

        return new SwitchNode(
            primary_value,
            cases,
            default_case,
            pos_start,
            this.current_token.pos_end
        );
    }
}