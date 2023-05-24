"use strict";

import { CustomNode, AddNode, DivideNode, MinusNode, ModuloNode, MultiplyNode, NumberNode, PlusNode, PowerNode, SubtractNode, VarAssignNode, VarAccessNode, VarModifyNode, OrNode, NotNode, AndNode, EqualsNode, LessThanNode, LessThanOrEqualNode, GreaterThanNode, GreaterThanOrEqualNode, NotEqualsNode, NullishOperatorNode, ListNode, ListAccessNode, ListAssignmentNode, ListPushBracketsNode, ListBinarySelector, StringNode, IfNode, ForNode, WhileNode, FuncDefNode, CallNode, ReturnNode, ContinueNode, BreakNode, DefineNode, DeleteNode, PrefixOperationNode, PostfixOperationNode, DictionaryElementNode, DictionaryNode, ForeachNode, ClassPropertyDefNode, ClassMethodDefNode, ClassDefNode, ClassCallNode, CallPropertyNode, AssignPropertyNode, CallMethodNode, CallStaticPropertyNode, SuperNode, ArgumentNode, EnumNode, SwitchNode, NoneNode, BooleanNode, BinaryShiftLeftNode, BinaryShiftRightNode, UnsignedBinaryShiftRightNode, NullishAssignmentNode, LogicalAndNode, LogicalOrNode, LogicalXORNode, BinaryNotNode, AndAssignmentNode, OrAssignmentNode, ListArgumentNode, TypeofNode, InstanceofNode, TagStateDefNode, TagPropDefNode, TagDefNode, HtmlNode } from "./nodes.js";
import { TokenType, Token, Types } from "./tokens.js";
import { InvalidSyntaxError } from "./Exceptions.js";
import { Visibility } from "./lib/Visibility.js";
import { is_in } from "./miscellaneous.js";
import Position from "./position.js";

/**
 * @classdesc Reads the sequence of tokens in order to create the nodes.
 */
export class Parser {
    private readonly tokens: Token[];
    private idx: number;
    private advancement_count: number;
    private current_token: Token | null;

    /**
     * @param tokens The list of tokens.
     */
    constructor(tokens: Generator<Token>) {
        this.tokens = Array.from(tokens);
        this.idx = -1;
        this.advancement_count = 0;
        this.current_token = null;
        this.advance();
    }

    private hasNextToken(): boolean {
        return this.current_token !== null;
    }

    private isEOF(): boolean {
        return this.current_token!.type === TokenType.EOF;
    }

    private getTok(): Token {
        return this.current_token!;
    }

    private backwards(steps: number = 1) {
        this.idx -= steps;
        this.advancement_count -= steps;
        if (this.idx < 0) this.idx = 0;
        if (this.advancement_count < 0) this.advancement_count = 0;
        this.set_token();
    }

    private advance() {
        this.idx += 1;
        this.advancement_count += 1;
        this.set_token();
    }

    private set_token() {
        this.current_token = this.idx < this.tokens.length ? this.tokens[this.idx] : null;
    }

    // \n, \r\n or ;
    private is_newline(): boolean {
        return this.getTok().ofType(TokenType.NEWLINE) || this.getTok().ofType(TokenType.SEMICOLON);
    }

    // \t
    private is_indentation(): boolean {
        return this.getTok().ofType(TokenType.INDENTATION);
    }

    private count_indentation(): number {
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
    private ignore_newlines(ignore_indentation: boolean = true) {
        while (true) {
            if (this.getTok().ofType(TokenType.NEWLINE)) {
                this.advance();
            } else if (ignore_indentation && this.getTok().ofType(TokenType.INDENTATION)) {
                this.advance();
            } else {
                break;
            }
        }
    }

    private ignore_indentation() {
        while (true) {
            if (this.hasNextToken() && this.getTok().ofType(TokenType.INDENTATION)) {
                this.advance();
            } else {
                break;
            }
        }
    }

    public parse(): ListNode | null {
        if (!this.hasNextToken()) {
            return null;
        }

        const result = this.statements();

        // we've reached the end of the parsing
        // but not the end of the file
        if (this.hasNextToken() && this.getTok().notOfType(TokenType.EOF)) {
            const invalid_token = this.getTok().copy();
            const pos_start = this.getTok().pos_start.copy();
            this.advance();
            const pos_end = this.hasNextToken() ? this.getTok().pos_end : pos_start.copy();
            throw new InvalidSyntaxError(
                pos_start, pos_end,
                `Unexpected end of parsing: unable to parse '${invalid_token.value}'.`
            );
        }

        return result;
    }

    private statements(): ListNode {
        const statements: CustomNode[] = [];
        const pos_start = this.getTok().pos_start.copy();

        this.ignore_newlines();

        // the file is empty
        if (this.isEOF()) {
            return new ListNode(statements, pos_start, pos_start);
        }

        let statement = this.statement();
        statements.push(statement);

        let more_statements = this.hasNextToken() && !this.isEOF();

        if (more_statements) {
            while (true) {
                let newline_count = 0;
                while (this.is_newline()) {
                    this.advance();
                    this.ignore_indentation();
                    newline_count++;
                }

                if (this.isEOF()) break;

                // there are no more lines
                if (newline_count === 0) more_statements = false;
                if (!more_statements) break;
                
                if (this.getTok().matches(TokenType.KEYWORD, "elif")) {
                    more_statements = false;
                } else if (this.getTok().matches(TokenType.KEYWORD, "else")) {
                    more_statements = false;
                } else if (this.getTok().matches(TokenType.KEYWORD, "end")) {
                    more_statements = false;
                } else if (this.getTok().matches(TokenType.KEYWORD, "case")) { // we don't use `break` for the end of a case in a switch
                    more_statements = false;
                } else if (this.getTok().matches(TokenType.KEYWORD, "default")) { // we don't use `break` for the end of a case in a switch
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
                this.getTok().pos_end.copy()
            );
        } else {
            return new ListNode(
                statements,
                pos_start,
                statements[statements.length - 1].pos_end.copy()
            );
        }
    }

    private statement(): CustomNode {
        const pos_start = this.getTok().pos_start.copy();

        if (this.getTok().matches(TokenType.KEYWORD, "return")) {
            this.advance();

            let expr = null;
            if (!this.is_newline() && !this.isEOF()) expr = this.expr();
            
            return new ReturnNode(expr, pos_start, this.getTok().pos_end.copy());
        }

        if (this.getTok().matches(TokenType.KEYWORD, "continue")) {
            this.advance();
            return new ContinueNode(pos_start, this.getTok().pos_end.copy());
        }

        if (this.getTok().matches(TokenType.KEYWORD, "break")) {
            this.advance();
            return new BreakNode(pos_start, this.getTok().pos_end.copy());
        }

        if (this.getTok().matches(TokenType.KEYWORD, "class")) {
            return this.class_expr();
        }

        if (this.getTok().matches(TokenType.KEYWORD, "tag")) {
            return this.tag_expr();
        }

        if (this.getTok().matches(TokenType.KEYWORD, "super")) {
            const pos_start = this.getTok().pos_start.copy();
            this.advance();
            if (this.getTok().notOfType(TokenType.LPAREN)) {
                throw new InvalidSyntaxError(
                    this.getTok().pos_start, this.getTok().pos_end,
                    "Expected parenthesis"
                );
            }
            const function_name_pos_end = this.getTok().pos_end;
            const call_node = this.helper_call_func(new CustomNode(pos_start, this.getTok().pos_end.copy()));
            if (!(call_node instanceof CallNode)) {
                throw new InvalidSyntaxError(
                    this.getTok().pos_start, this.getTok().pos_end,
                    "Expected '(' after 'super' keyword"
                );
            }
            return new SuperNode(call_node.arg_nodes, pos_start, function_name_pos_end);
        }

        if (this.getTok().matches(TokenType.KEYWORD, "enum")) {
            return this.enum_expr();
        }

        return this.expr();
    }

    private tag_expr(): TagDefNode {
        const pos_start = this.getTok().pos_start.copy();
        this.advance();

        if (this.getTok().notOfType(TokenType.IDENTIFIER)) {
            throw new InvalidSyntaxError(
                this.getTok().pos_start, this.getTok().pos_end,
                "Expected an identifier"
            );
        }
        
        const tag_tok = this.getTok().copy();
        const props: TagPropDefNode[] = [];
        const states: TagStateDefNode[] = [];
        const methods: FuncDefNode[] = [];
        
        this.advance();

        if (this.getTok().notOfType(TokenType.COLON)) {
            throw new InvalidSyntaxError(
                this.getTok().pos_start, this.getTok().pos_end,
                "Expected ':'"
            );
        }

        this.advance();
        const is_multiline = this.is_newline();
        if (is_multiline) this.ignore_newlines();

        // `prop Test: end` I want to write "pass" in this case
        if (this.getTok().matches(TokenType.KEYWORD, "end")) {
            throw new InvalidSyntaxError(
                this.getTok().pos_start, this.getTok().pos_end,
                "Use 'pass' to write an empty class"
            );
        }

        if (this.getTok().matches(TokenType.KEYWORD, "pass")) {
            let pos_end = this.getTok().pos_end.copy();
            this.advance();
            if (is_multiline) {
                this.ignore_newlines();
                if (!this.getTok().matches(TokenType.KEYWORD, "end")) {
                    throw new InvalidSyntaxError(
                        this.getTok().pos_start, this.getTok().pos_end,
                        "Expected 'end'"
                    );
                }
                pos_end = this.getTok().pos_end.copy();
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

        const is_state  = () => this.getTok().matches(TokenType.KEYWORD, "state");
        const is_prop   = () => this.getTok().matches(TokenType.KEYWORD, "prop");
        const is_method = () => this.getTok().matches(TokenType.KEYWORD, "method");

        while (
            is_state() ||
            is_prop() ||
            is_method()
        ) {
            const beginning_pos_start = this.getTok().pos_start.copy();
            const prop = is_prop();
            const state = is_state();

            if (state || prop) {
                this.advance();
                let optional = 0;
                if (this.getTok().ofType(TokenType.QMARK)) {
                    if (state) {
                        throw new InvalidSyntaxError(
                            this.getTok().pos_start, this.getTok().pos_end,
                            "Cannot declare an optional variable."
                        );
                    }
                    optional = 1;
                    this.advance();
                }
                if (this.getTok().notOfType(TokenType.IDENTIFIER)) {
                    throw new InvalidSyntaxError(
                        this.getTok().pos_start, this.getTok().pos_end,
                        "Expected an identifier"
                    );
                }
                const property_name_tok = this.getTok().copy();
                let property_type: string = Types.ANY;
                this.advance();
                if (this.getTok().ofType(TokenType.COLON)) {
                    this.advance();
                    property_type = this.getTok().value;
                    this.advance();
                }
                let value_node;
                if (this.getTok().ofType(TokenType.EQUALS)) {
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
                let pos_start = this.getTok().pos_start.copy();
                let pos_end = this.getTok().pos_end.copy();
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

        if (!this.getTok().matches(TokenType.KEYWORD, "end")) {
            throw new InvalidSyntaxError(
                this.getTok().pos_start, this.getTok().pos_end,
                "Expected 'end'"
            );
        }

        const tag_pos_end = this.getTok().pos_end;

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

    private enum_expr(): EnumNode {
        const pos_start = this.getTok().pos_start.copy();
        this.advance();
        
        if (this.getTok().notOfType(TokenType.IDENTIFIER)) {
            throw new InvalidSyntaxError(
                this.getTok().pos_start, this.getTok().pos_end,
                "Expected an identifier"
            );
        }

        const enum_name_tok = this.getTok().copy();
        const properties: Token[] = [];
        let is_multiline = false;

        this.advance();

        if (this.getTok().notOfType(TokenType.COLON)) {
            throw new InvalidSyntaxError(
                this.getTok().pos_start, this.getTok().pos_end,
                "Expected ':'"
            );
        }

        this.advance();
        is_multiline = this.is_newline();
        if (is_multiline) this.ignore_newlines();

        if (this.getTok().matches(TokenType.KEYWORD, "pass")) {
            let pos_end = this.getTok().pos_end.copy();
            this.advance();
            if (is_multiline) {
                this.ignore_newlines();
                if (!this.getTok().matches(TokenType.KEYWORD, "end")) {
                    throw new InvalidSyntaxError(
                        this.getTok().pos_start, this.getTok().pos_end,
                        "Expected 'end'"
                    );
                }
                pos_end = this.getTok().pos_end.copy();
                this.advance();
            }
            return new EnumNode(
                enum_name_tok,
                properties,
                pos_start,
                pos_end
            );
        }

        if (this.getTok().notOfType(TokenType.IDENTIFIER)) {
            throw new InvalidSyntaxError(
                this.getTok().pos_start, this.getTok().pos_end,
                "Expected an identifier or 'pass'"
            );
        }

        properties.push(this.getTok().copy());
        this.advance();
        if (is_multiline) this.ignore_newlines();

        while (this.getTok().ofType(TokenType.COMMA)) {
            this.advance();
            if (is_multiline) this.ignore_newlines();
            if (this.getTok().ofType(TokenType.IDENTIFIER)) {
                properties.push(this.getTok());
                this.advance();
                if (is_multiline) this.ignore_newlines();
            } else {
                break;
            }
        }

        if (is_multiline) {
            if (!this.getTok().matches(TokenType.KEYWORD, "end")) {
                throw new InvalidSyntaxError(
                    this.getTok().pos_start, this.getTok().pos_end,
                    "Expected 'end'"
                );
            }
        } else {
            // on a single line statement, we expect the end of the enum statement to be a new line or the end of the file
            if (this.getTok().notOfType(TokenType.EOF) && !this.is_newline()) {
                throw new InvalidSyntaxError(
                    this.getTok().pos_start, this.getTok().pos_end,
                    "Expected new line or ';'"
                );
            }
        }

        const pos_end = this.getTok().pos_end.copy();
        if (this.getTok().notOfType(TokenType.EOF) && !this.is_newline()) this.advance();

        return new EnumNode(
            enum_name_tok,
            properties,
            pos_start,
            pos_end
        );
    }
    
    private class_expr(): ClassDefNode {
        const class_pos_start = this.getTok().pos_start.copy();
        this.advance();

        if (this.getTok().notOfType(TokenType.IDENTIFIER)) {
            throw new InvalidSyntaxError(
                this.getTok().pos_start, this.getTok().pos_end,
                "Expected an identifier"
            );
        }

        const class_name_tok = this.getTok();
        const properties: ClassPropertyDefNode[] = [];
        const methods: ClassMethodDefNode[] = [];
        const getters: ClassMethodDefNode[] = [];
        const setters: ClassMethodDefNode[] = [];
        let parent_class_tok: Token | null = null;

        this.advance();

        if (this.getTok().matches(TokenType.KEYWORD, "extends")) {
            this.advance();
            if (this.getTok().notOfType(TokenType.IDENTIFIER)) {
                throw new InvalidSyntaxError(
                    this.getTok().pos_start, this.getTok().pos_end,
                    "Expected an identifier"
                );
            }
            parent_class_tok = this.getTok();
            this.advance();
        }

        if (this.getTok().notOfType(TokenType.COLON)) {
            throw new InvalidSyntaxError(
                class_name_tok.pos_start, class_name_tok.pos_end,
                `Expected ':'`
            );
        }

        this.advance();
        let is_multiline = this.is_newline();
        if (is_multiline) this.ignore_newlines();

        const is_public = () => this.getTok().matches(TokenType.KEYWORD, "public");
        const is_private = () => this.getTok().matches(TokenType.KEYWORD, "private");
        const is_protected = () => this.getTok().matches(TokenType.KEYWORD, "protected");
        const is_override = () => this.getTok().matches(TokenType.KEYWORD, "override");
        const is_property = () => this.getTok().matches(TokenType.KEYWORD, "property");
        const is_method = () => this.getTok().matches(TokenType.KEYWORD, "method");
        const is_setter = () => this.getTok().matches(TokenType.KEYWORD, "set");
        const is_getter = () => this.getTok().matches(TokenType.KEYWORD, "get");
        const is_static = () => this.getTok().matches(TokenType.KEYWORD, "static");

        // `class Test: end` I want to write "pass" in this case
        if (this.getTok().matches(TokenType.KEYWORD, "end")) {
            throw new InvalidSyntaxError(
                this.getTok().pos_start, this.getTok().pos_end,
                "Use 'pass' to write an empty class"
            );
        }

        if (this.getTok().matches(TokenType.KEYWORD, "pass")) {
            let pos_end = this.getTok().pos_end.copy();
            this.advance();
            if (is_multiline) {
                this.ignore_newlines();
                if (!this.getTok().matches(TokenType.KEYWORD, "end")) {
                    throw new InvalidSyntaxError(
                        this.getTok().pos_start, this.getTok().pos_end,
                        "Expected 'end'"
                    );
                }
                pos_end = this.getTok().pos_end.copy();
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
                    this.getTok().pos_start, this.getTok().pos_end,
                    "Cannot write a class on a single line."
                );
            }

            const beginning_pos_start = this.getTok().pos_start.copy();

            let status = Visibility.Public;
            if (is_private()) status = Visibility.Private;
            if (is_protected()) status = Visibility.Protected;

            if (
                is_private() ||
                is_public() ||
                is_protected()
            ) {
                this.advance();
            }

            const override = is_override() ? 1 : 0;
            if (is_override()) this.advance()
            
            const static_prop = is_static() ? 1 : 0;
            if (is_static()) this.advance();

            if (is_getter() || is_setter() || is_method()) {
                const is_get = is_getter();
                const is_set = is_setter();
                const is_met = is_method();

                const pos_start = this.getTok().pos_start.copy();
                const pos_end = this.getTok().pos_end.copy();
                const func_expr = this.func_expr();
                if (func_expr.var_name_tok === null) {
                    throw new InvalidSyntaxError(
                        pos_start, pos_end,
                        "Expected an identifier"
                    );
                }
                const node = new ClassMethodDefNode(
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
                if (this.getTok().notOfType(TokenType.IDENTIFIER)) {
                    throw new InvalidSyntaxError(
                        this.getTok().pos_start, this.getTok().pos_end,
                        "Expected an identifier"
                    );
                }
                const property_name_tok = this.getTok();
                const property_pos_end = this.getTok().pos_end.copy();
                let property_type: string | null = null;
                this.advance();
                if (this.getTok().ofType(TokenType.COLON)) {
                    this.advance();
                    property_type = this.getTok().value as string;
                    this.advance();
                }
                let value_node: CustomNode;
                if (this.getTok().ofType(TokenType.EQUALS)) {
                    this.advance();
                    value_node = this.expr();
                } else {
                    value_node = new NoneNode(beginning_pos_start, property_pos_end);
                }
                const property_def_node = new ClassPropertyDefNode(
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
                    this.getTok().pos_start, this.getTok().pos_end,
                    "The right order is: private/protected/public? override? static? method/property/get/set"
                );
            }
        }

        if (!this.getTok().matches(TokenType.KEYWORD, "end")) {
            throw new InvalidSyntaxError(
                this.getTok().pos_start, this.getTok().pos_end,
                "Expected 'end'"
            );
        }

        const class_pos_end = this.getTok().pos_end;

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

    private expr(): CustomNode {
        if (this.getTok().matches(TokenType.KEYWORD, "var") || this.getTok().matches(TokenType.KEYWORD, "define")) {
            const is_variable = this.getTok().matches(TokenType.KEYWORD, "var");
            const pos_start = this.getTok().pos_start;
            this.advance();
            
            if (this.getTok().notOfType(TokenType.IDENTIFIER)) {
                throw new InvalidSyntaxError(
                    this.getTok().pos_start, this.getTok().pos_end,
                    "Expected identifier"
                );
            }
            
            const var_name_tok = this.getTok();
            this.advance();

            let type: string | null = null;

            if (this.getTok().ofType(TokenType.COLON)) {
                this.advance();
                type = this.getTok().value as string;
                this.advance();
            } else {
                type = Types.ANY;
            }

            if (is_variable) { // is var?
                let value_node: CustomNode;
                if (this.getTok().ofType(TokenType.EQUALS)) {
                    this.advance();
                    value_node = this.expr();
                } else {
                    value_node = new NoneNode(this.getTok().pos_start.copy(), this.getTok().pos_end.copy());
                }
                return new VarAssignNode(var_name_tok, value_node, type);
            } else { // is define?
                if (this.getTok().notOfType(TokenType.EQUALS)) {
                    throw new InvalidSyntaxError(
                        pos_start, this.getTok().pos_end,
                        "You must assign a value to a constant."
                    );
                }

                this.advance();
                const value_node = this.expr();
                return new DefineNode(var_name_tok, value_node, type);
            }
        } else if (this.getTok().matches(TokenType.KEYWORD, "delete")) {
            const pos_start = this.getTok().pos_start;
            this.advance();

            const node_to_delete = this.call(); // I don't want to delete properties, so not `this.prop()`

            return new DeleteNode(node_to_delete, pos_start, node_to_delete.pos_end);
        }

        return this.html_expr();
    }
    
    private html_expr(): CustomNode {
        if (this.getTok().ofType(TokenType.LCHEVRON)) {
            const pos_start = this.getTok().pos_start.copy();
            this.advance();

            const parse_html = (): HtmlNode => {
                const beginning_pos_start = this.getTok().pos_start.copy();
                const attributes: [Token, CustomNode][] = [];
                const events: [Token, CustomNode][] = [];
                let tagname_tok: Token | null = null;
                let classes: string[] = [];
                let id: string | null = null;
                let pos_end = null;

                // we are after "<"
                if (this.getTok().ofType(TokenType.IDENTIFIER)) {
                    tagname_tok = this.getTok();
                    this.advance();

                    // Here we handle the classes and id.
                    // For example, the tagname can be "div.class1.class2#id.class3"
                    const potential_tokens = [
                        TokenType.DOT,
                        TokenType.HASH
                    ];

                    while (is_in(this.getTok().type, potential_tokens)) {
                        if (this.getTok().ofType(TokenType.DOT)) {
                            this.advance();
                            const classname = this.getTok().value;
                            if (is_in(classname, classes)) {
                                throw new InvalidSyntaxError(
                                    this.getTok().pos_start, this.getTok().pos_end,
                                    "This class has already been declared."
                                );
                            }
                            classes.push(classname);
                            this.advance();
                        } else {
                            if (id) {
                                // we have already declared an ID
                                throw new InvalidSyntaxError(
                                    this.getTok().pos_start, this.getTok().pos_end,
                                    "An ID has already been declared."
                                );
                            }
                            this.advance();
                            id = this.getTok().value;
                            this.advance();
                        }
                    }
                    
                    while (
                        this.getTok().ofType(TokenType.IDENTIFIER) ||
                        this.getTok().ofType(TokenType.ARROBASE)
                    ) {
                        if (this.getTok().ofType(TokenType.IDENTIFIER)) {
                            const attr_tok = this.getTok().copy();
                            let value_node: CustomNode;
                            this.advance();
                            if (this.getTok().ofType(TokenType.EQUALS)) {
                                this.advance();
                                if (this.getTok().ofType(TokenType.LBRACK)) { // '={'
                                    this.advance();
                                    value_node = this.cond_expr();
                                    if (this.getTok().notOfType(TokenType.RBRACK)) {
                                        throw new InvalidSyntaxError(
                                            this.getTok().pos_start, this.getTok().pos_end,
                                            "Expected '}'"
                                        );
                                    }
                                    this.advance();
                                } else {
                                    if (this.getTok().notOfType(TokenType.STRING)) {
                                        throw new InvalidSyntaxError(
                                            this.getTok().pos_start, this.getTok().pos_end,
                                            "For more readability and consistency, you must use brackets {} around your value, or a simple string"
                                        );
                                    }
                                    value_node = this.atom();
                                }
                            } else {
                                value_node = new StringNode(attr_tok); // <button disabled> === <button disabled="disabled">
                            }
                            attributes.push([attr_tok, value_node]);
                        } else if (this.getTok().ofType(TokenType.ARROBASE)) {
                            this.advance();
                            const eventname = this.getTok().copy();
                            this.advance();
                            if (this.getTok().notOfType(TokenType.EQUALS)) {
                                throw new InvalidSyntaxError(
                                    this.getTok().pos_start, this.getTok().pos_end,
                                    "Expected '='"
                                );
                            }
                            this.advance();
                            if (this.getTok().notOfType(TokenType.LBRACK)) {
                                throw new InvalidSyntaxError(
                                    this.getTok().pos_start, this.getTok().pos_end,
                                    "Expected '{'"
                                );
                            }
                            this.advance();
                            const value_node = this.prop();
                            if (this.getTok().notOfType(TokenType.RBRACK)) {
                                throw new InvalidSyntaxError(
                                    this.getTok().pos_start, this.getTok().pos_end,
                                    "Expected '}'"
                                );
                            }
                            events.push([eventname, value_node]);
                            this.advance();
                        }
                    }

                    if (this.getTok().notOfType(TokenType.RCHEVRON)) {
                        throw new InvalidSyntaxError(
                            this.getTok().pos_start, this.getTok().pos_end,
                            "Expected '>'"
                        );
                    }

                    pos_end = this.getTok().pos_end.copy();

                    this.advance();
                } else {
                    if (this.getTok().notOfType(TokenType.RCHEVRON)) {
                        throw new InvalidSyntaxError(
                            this.getTok().pos_start, this.getTok().pos_end,
                            "Expected identifier or '>'"
                        );
                    }
                    pos_end = this.getTok().pos_end.copy();
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

            if (this.getTok().ofType(TokenType.IDENTIFIER)) { // oneline
                const element = parse_html();
                if (!this.is_newline() && !this.isEOF()) {
                    const child = this.cond_expr();
                    element.children.push(child);
                }
                return element;
            } else { // multiline
                if (this.getTok().notOfType(TokenType.RCHEVRON)) {
                    throw new InvalidSyntaxError(
                        this.getTok().pos_start, this.getTok().pos_end,
                        "Expected identifier or '>'"
                    );
                }
                this.advance();
                
                if (!this.is_newline()) {
                    throw new InvalidSyntaxError(
                        this.getTok().pos_start, this.getTok().pos_end,
                        "Expected a new line after an opening fragment"
                    );
                }

                this.ignore_newlines(false);

                // count_indentation also ignores indentation
                const starting_indentation = this.count_indentation();
                const children: CustomNode[] = [];
                let pos_end: Position | null = null;

                const all_elements: { element: CustomNode, level: number }[] = [];
                let previous_indentation = starting_indentation;
                let idx = 0;
                
                const mainElements: { element: CustomNode, idx: number }[] = [];

                const is_if      = () => this.getTok().matches(TokenType.KEYWORD, "if");
                const is_for     = () => this.getTok().matches(TokenType.KEYWORD, "for");
                const is_foreach = () => this.getTok().matches(TokenType.KEYWORD, "foreach");
                const is_lbrack  = () => this.getTok().ofType(TokenType.LBRACK);
                const is_lchev   = () => this.getTok().ofType(TokenType.LCHEVRON);

                while (
                    is_lchev() ||
                    is_if() ||
                    is_for() ||
                    is_foreach() ||
                    is_lbrack()
                ) {
                    const is_element = is_lchev();
                    if (is_element) {
                        this.advance();
                        if (this.getTok().ofType(TokenType.SLASH)) {
                            this.advance();
                            if (this.getTok().notOfType(TokenType.RCHEVRON)) {
                                throw new InvalidSyntaxError(
                                    this.getTok().pos_start, this.getTok().pos_end,
                                    "Expected '>'"
                                );
                            }
                            pos_end = this.getTok().pos_end;
                            this.advance();
                            break;
                        }
                        const tag = parse_html();
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
                        let statement: IfNode | ForNode | ForeachNode;
                        if (is_if()) statement = this.if_expr(true);
                        else if (is_for()) statement = this.for_expr(true);
                        else statement = this.foreach_expr(true);
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
                        const value_node: CustomNode = this.cond_expr();
                        if (this.getTok().notOfType(TokenType.RBRACK)) {
                            throw new InvalidSyntaxError(
                                this.getTok().pos_start, this.getTok().pos_end,
                                "Expected '}'"
                            );
                        }
                        this.advance();
                        if (!this.is_newline()) {
                            throw new InvalidSyntaxError(
                                this.getTok().pos_start, this.getTok().pos_end,
                                "Expected a new line"
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
                        let value_node: CustomNode;
                        if (this.getTok().ofType(TokenType.LBRACK)) { // <div> {variable}
                            this.advance();
                            value_node = this.cond_expr();
                            if (this.getTok().notOfType(TokenType.RBRACK)) {
                                throw new InvalidSyntaxError(
                                    this.getTok().pos_start, this.getTok().pos_end,
                                    "Expected '}'"
                                );
                            }
                            this.advance();
                        } else {
                            if (this.getTok().notOfType(TokenType.STRING)) {
                                throw new InvalidSyntaxError(
                                    this.getTok().pos_start, this.getTok().pos_end,
                                    "For more readability and consistency, you must use brackets {} around your value, or a simple string"
                                );
                            }
                            value_node = this.atom();
                        }
                        if (!this.is_newline()) {
                            throw new InvalidSyntaxError(
                                this.getTok().pos_start, this.getTok().pos_end,
                                "Expected a new line"
                            );
                        }
                        all_elements.push({
                            element: value_node,
                            level: previous_indentation + 1 // + 1 because it's a child of the current indentation
                        });
                        ++idx; // we add a new child, a child that counts as a new element in the tree
                    }
                    // prepare the following element
                    this.ignore_newlines(false);
                    previous_indentation = this.count_indentation();
                    ++idx;
                }

                const getDeepestIndex = (arr: { element: CustomNode, level: number }[]): number => {
                    let max = arr[0].level;
                    let index = 0;
                    for (let i = 0; i < arr.length; ++i) {
                        if (arr[i].level >= max) { // >= because we want the last one
                            max = arr[i].level;
                            index = i;
                        }
                    }
                    return index;
                };

                // Get the first element, starting at index `from`, where the level is equal to the given `lvl` - 1.
                // Go backwards (= upwards).
                const getNearestIndex = (from: number, lvl: number, arr: { element: CustomNode, level: number }[]) => {
                    const upper_level = lvl - 1;
                    for (let i = from; i >= 0; --i) {
                        if (arr[i].level === upper_level) {
                            return i;
                        }
                    }
                    return null;
                };

                // Reorder the elements correctly so that the deepest element becomes the child of its parent.
                // So populate the "children" property of each HtmlNode, starting at the deepest one and going up.
                for (let i = 0; i < mainElements.length; ++i) {
                    const mainElement = mainElements[i];
                    const childrenElements = all_elements.slice(mainElement.idx + 1, mainElements[i + 1]?.idx);

                    while (childrenElements.length > 0) {
                        const index_deepest = getDeepestIndex(childrenElements);
                        const deepest = childrenElements[index_deepest];
                        const nearest_index = getNearestIndex(index_deepest, deepest.level, childrenElements);
                        const nearest = nearest_index !== null ? childrenElements[nearest_index] : all_elements[mainElement.idx];
                        
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

                const node = new HtmlNode(
                    null, // because this is a fragment
                    [],
                    null,
                    [],
                    [],
                    children,
                    pos_start,
                    pos_end!
                );

                return node;
            }
        }

        // if this is not a HtmlNode, go deeper
        return this.cond_expr();
    }

    private cond_expr(): CustomNode {
        let result: CustomNode = this.comp_expr(); // anything else deeper, but there could be an "and" keyword or an "or" keyword after that
        
        const is_and = () => this.getTok().matches(TokenType.KEYWORD, "and") || this.getTok().ofType(TokenType.AND); // TODO: that's weird
        const is_or  = () => this.getTok().matches(TokenType.KEYWORD, "or")  || this.getTok().ofType(TokenType.OR); // here too

        while (this.hasNextToken() && (is_and() || is_or())) {
            if (this.getTok().matches(TokenType.KEYWORD, "and")) {
                this.advance();
                result = new AndNode(result, this.comp_expr());
            } else if (this.getTok().matches(TokenType.KEYWORD, "or")) {
                this.advance();
                result = new OrNode(result, this.comp_expr());
            } else if (this.getTok().ofType(TokenType.OR)) { // ||
                this.advance();
                if (this.getTok().ofType(TokenType.EQUALS)) { // ||=
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
            } else if (this.getTok().ofType(TokenType.AND)) { // &&
                this.advance();
                if (this.getTok().ofType(TokenType.EQUALS)) { // &&=
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

    private comp_expr(): CustomNode {
        if (this.getTok().matches(TokenType.KEYWORD, "not")) {
            this.advance();
            const node = this.comp_expr();
            return new NotNode(node);
        }

        let result = this.bin_op();
        const possible_tokens = [
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
        while (this.hasNextToken() && is_in(this.getTok().type, possible_tokens)) {
            if (this.getTok().ofType(TokenType.DOUBLE_EQUALS)) {
                this.advance();
                result = new EqualsNode(result, this.bin_op());
            } else if (this.getTok().ofType(TokenType.LT)) {
                this.advance();
                result = new LessThanNode(result, this.bin_op());
            } else if (this.getTok().ofType(TokenType.GT)) {
                this.advance();
                result = new GreaterThanNode(result, this.bin_op());
            } else if (this.getTok().ofType(TokenType.LTE)) {
                this.advance();
                result = new LessThanOrEqualNode(result, this.bin_op());
            } else if (this.getTok().ofType(TokenType.GTE)) {
                this.advance();
                result = new GreaterThanOrEqualNode(result, this.bin_op());
            } else if (this.getTok().ofType(TokenType.NOT_EQUAL)) {
                this.advance();
                result = new NotEqualsNode(result, this.bin_op());
            } else if (this.getTok().ofType(TokenType.NULLISH_OPERATOR)) {
                this.advance();
                if (this.getTok().ofType(TokenType.EQUALS)) { // a ??= 5, a <- 5 only if a == none
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

    // arith_expr instanceof expr
    // arith_expr &= expr
    // <<=
    // >>=
    // >>>=
    // &=
    // |=
    // ^=
    private bin_op(): CustomNode {
        let result = this.arith_expr();
        const possible_tokens = [
            TokenType.BINARY_LEFT,
            TokenType.BINARY_RIGHT,
            TokenType.BINARY_UNSIGNED_RIGHT,
            TokenType.LOGICAL_AND,
            TokenType.LOGICAL_OR,
            TokenType.LOGICAL_XOR,
        ];

        if (this.getTok().matches(TokenType.KEYWORD, "instanceof")) {
            this.advance();
            let class_name_tok = this.getTok().copy();
            this.advance();
            return new InstanceofNode(result, class_name_tok);
        }

        // TODO: is the while loop really necessary?
        while (this.hasNextToken() && is_in(this.getTok().type, possible_tokens)) {
            if (this.getTok().ofType(TokenType.BINARY_LEFT)) {
                this.advance();
                if (this.getTok().ofType(TokenType.EQUALS)) { // <<=
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
            } else if (this.getTok().ofType(TokenType.BINARY_RIGHT)) {
                this.advance();
                if (this.getTok().ofType(TokenType.EQUALS)) { // >>=
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
            } else if (this.getTok().ofType(TokenType.BINARY_UNSIGNED_RIGHT)) {
                this.advance();
                if (this.getTok().ofType(TokenType.EQUALS)) { // >>>=
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
            } else if (this.getTok().ofType(TokenType.LOGICAL_AND)) {
                this.advance();
                if (this.getTok().ofType(TokenType.EQUALS)) { // &=
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
            } else if (this.getTok().ofType(TokenType.LOGICAL_OR)) {
                this.advance();
                if (this.getTok().ofType(TokenType.EQUALS)) { // |=
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
            } else if (this.getTok().ofType(TokenType.LOGICAL_XOR)) {
                this.advance();
                if (this.getTok().ofType(TokenType.EQUALS)) { // ^=
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

    // TODO: not sure if += and -= should be here instead of bin_op()
    // term += something else 
    // -=
    // ++
    // --
    private arith_expr(): CustomNode {
        let result = this.term();
        const possible_tokens = [
            TokenType.PLUS,
            TokenType.MINUS,
            TokenType.INC,
            TokenType.DEC,
        ];

        while (this.hasNextToken() && is_in(this.getTok().type, possible_tokens)) {
            if (this.getTok().ofType(TokenType.PLUS)) {
                this.advance();
                if (this.getTok().ofType(TokenType.EQUALS)) { // +=
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
            } else if (this.getTok().ofType(TokenType.MINUS)) { // -=
                this.advance();
                if (this.getTok().ofType(TokenType.EQUALS)) {
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
            } else if (this.getTok().ofType(TokenType.INC)) { // a++
                this.advance();
                let difference = 1;
                while (this.getTok().ofType(TokenType.INC)) {
                    ++difference;
                    this.advance();
                }
                if (result instanceof ListAccessNode) {
                    return new ListAssignmentNode(result, new AddNode(result, new NumberNode(new Token<number>(TokenType.NUMBER, difference, result.pos_start, this.getTok().pos_end))));
                } else if (result instanceof CallPropertyNode) {
                    return new AssignPropertyNode(result, new NumberNode(new Token<number>(TokenType.NUMBER, difference, result.pos_start, this.getTok().pos_end)));
                } else if (result instanceof CallStaticPropertyNode) {
                    return new AssignPropertyNode(result, new NumberNode(new Token<number>(TokenType.NUMBER, difference, result.pos_start, this.getTok().pos_end)));
                }
                return new PostfixOperationNode(result, difference);
            } else if (this.getTok().ofType(TokenType.DEC)) { // b--
                this.advance();
                let difference = -1;
                while (this.getTok().ofType(TokenType.DEC)) {
                    --difference;
                    this.advance();
                }
                if (result instanceof ListAccessNode) {
                    return new ListAssignmentNode(result, new AddNode(result, new NumberNode(new Token<number>(TokenType.NUMBER, difference, result.pos_start, this.getTok().pos_end))));
                } else if (result instanceof CallPropertyNode) {
                    return new AssignPropertyNode(result, new NumberNode(new Token<number>(TokenType.NUMBER, difference, result.pos_start, this.getTok().pos_end)));
                } else if (result instanceof CallStaticPropertyNode) {
                    return new AssignPropertyNode(result, new NumberNode(new Token<number>(TokenType.NUMBER, difference, result.pos_start, this.getTok().pos_end)));
                }
                return new PostfixOperationNode(result, difference);
            }
        }

        return result;
    }

    // factor * expr
    // /
    // **
    // %
    // *=
    // /=
    // **=
    // %=
    private term(): CustomNode {
        let result: CustomNode | null = null;
        const node_a = this.factor();
        const possible_tokens = [
            TokenType.MULTIPLY,
            TokenType.SLASH,
            TokenType.POWER,
            TokenType.MODULO
        ];

        while (this.hasNextToken() && is_in(this.getTok().type, possible_tokens)) {
            if (this.getTok().ofType(TokenType.MULTIPLY)) {
                this.advance();
                if (this.getTok().ofType(TokenType.EQUALS)) { // *=
                    this.advance();
                    if (node_a instanceof VarAccessNode) {
                        return new VarModifyNode(node_a.var_name_tok, new MultiplyNode(node_a, this.expr()));
                    } else if (node_a instanceof ListAccessNode) {
                        return new ListAssignmentNode(node_a, new MultiplyNode(node_a, this.expr()));
                    } else if (node_a instanceof CallPropertyNode || node_a instanceof CallStaticPropertyNode) {
                        return new AssignPropertyNode(node_a, new MultiplyNode(node_a, this.expr()));
                    } else {
                        throw new InvalidSyntaxError(
                            node_a.pos_start, result?.pos_end ?? this.getTok().pos_end,
                            "Expected a variable"
                        );
                    }
                }
                result = new MultiplyNode(result ? result : node_a, this.factor());
            } else if (this.getTok().ofType(TokenType.SLASH)) {
                this.advance();
                if (this.getTok().ofType(TokenType.EQUALS)) { // /=
                    this.advance();
                    if (node_a instanceof VarAccessNode) {
                        return new VarModifyNode(node_a.var_name_tok, new DivideNode(node_a, this.expr()));
                    } else if (node_a instanceof ListAccessNode) {
                        return new ListAssignmentNode(node_a, new DivideNode(node_a, this.expr()));
                    } else if (node_a instanceof CallPropertyNode || node_a instanceof CallStaticPropertyNode) {
                        return new AssignPropertyNode(node_a, new DivideNode(node_a, this.expr()));
                    } else {
                        throw new InvalidSyntaxError(
                            node_a.pos_start, result?.pos_end ?? this.getTok().pos_end,
                            "Expected a variable"
                        );
                    }
                }
                result = new DivideNode(result ? result : node_a, this.factor());
            } else if (this.getTok().ofType(TokenType.POWER)) {
                this.advance();
                if (this.getTok().ofType(TokenType.EQUALS)) { // **=
                    this.advance();
                    if (node_a instanceof VarAccessNode) {
                        return new VarModifyNode(node_a.var_name_tok, new PowerNode(node_a, this.expr()));
                    } else if (node_a instanceof ListAccessNode) {
                        return new ListAssignmentNode(node_a, new PowerNode(node_a, this.expr()));
                    } else if (node_a instanceof CallPropertyNode || node_a instanceof CallStaticPropertyNode) {
                        return new AssignPropertyNode(node_a, new PowerNode(node_a, this.expr()));
                    } else {
                        throw new InvalidSyntaxError(
                            node_a.pos_start, result?.pos_end ?? this.getTok().pos_end,
                            "Expected a variable"
                        );
                    }
                }
                result = new PowerNode(result ? result : node_a, this.factor());
            } else if (this.getTok().ofType(TokenType.MODULO)) {
                this.advance();
                if (this.getTok().ofType(TokenType.EQUALS)) { // %=
                    this.advance();
                    if (node_a instanceof VarAccessNode) {
                        return new VarModifyNode(node_a.var_name_tok, new ModuloNode(node_a, this.expr()));
                    } else if (node_a instanceof ListAccessNode) {
                        return new ListAssignmentNode(node_a, new ModuloNode(node_a, this.expr()));
                    } else if (node_a instanceof CallPropertyNode || node_a instanceof CallStaticPropertyNode) {
                        return new AssignPropertyNode(node_a, new ModuloNode(node_a, this.expr()));
                    } else {
                        throw new InvalidSyntaxError(
                            node_a.pos_start, result?.pos_end ?? this.getTok().pos_end,
                            "Expected a variable"
                        );
                    }
                }
                result = new ModuloNode(result ? result : node_a, this.factor());
            }
        }

        return result ? result : node_a;
    }

    // +a
    // -a
    // typeof 5
    // -a
    // ++expr
    // --expr
    private factor(): CustomNode {
        if (this.getTok().ofType(TokenType.PLUS)) { // +a
            this.advance();
            return new PlusNode(this.factor());
        } else if (this.getTok().ofType(TokenType.MINUS)) { // -a
            this.advance();
            return new MinusNode(this.factor());
        } else if (this.getTok().matches(TokenType.KEYWORD, "typeof")) { // typeof 5
            this.advance();
            return new TypeofNode(this.factor());
        } else if (this.getTok().ofType(TokenType.BIN_NOT)) { // ~a
            this.advance();
            return new BinaryNotNode(this.factor());
        } else if (this.getTok().ofType(TokenType.INC)) { // ++expr
            this.advance();
            let difference = 1;
            while (this.getTok().ofType(TokenType.INC)) {
                difference++;
                this.advance();
            }
            let expr = this.term();
            return new PrefixOperationNode(expr, difference);
        } else if (this.getTok().ofType(TokenType.DEC)) { // --expr
            this.advance();
            let difference = -1;
            while (this.getTok().ofType(TokenType.DEC)) {
                difference--;
                this.advance();
            }
            let expr = this.term();
            return new PrefixOperationNode(expr, difference);
        } else {
            return this.prop();
        }
    }

    // property
    // which could be called ([], ())
    private prop(): CustomNode {
        const node_to_call: CustomNode = this.call();

        // if we have a '.' after our atom (or '::' or '?.')
        // that means we are calling the atom (and that this atom is a ClassValue)

        const is_dot     = () => this.getTok().ofType(TokenType.DOT);
        const is_static  = () => this.getTok().ofType(TokenType.DOUBLE_COLON) || this.getTok().ofType(TokenType.OPTIONAL_STATIC_CALL);
        const is_ocp     = () => this.getTok().ofType(TokenType.OPTIONAL_CHAINING_OPERATOR) || this.getTok().ofType(TokenType.OPTIONAL_STATIC_CALL);

        if (is_dot() || is_static() || is_ocp()) {
            const is_lparen = () => this.getTok().ofType(TokenType.LPAREN);
            const is_lsquare = () => this.getTok().ofType(TokenType.LSQUARE);

            let result: CustomNode | null = null;
            let is_static_prop = false;
            let is_optional = false;
            let is_calling = false;

            while (this.hasNextToken() && !this.isEOF()) {
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
                    result = new CallMethodNode(this.helper_call_func(result ?? node_to_call) as CallNode, node_to_call, is_optional);
                    continue;
                } else if (is_lsquare()) {
                    result = this.helper_call_list(result ?? node_to_call, is_optional);
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
                        result = new CallMethodNode(this.helper_call_func(result, true) as CallNode, node_to_call, true);
                    }
                } else if (is_lsquare() && is_optional) { // or "example.list?.[0]"
                    if (!result) { // the risk is that we might have "simplelist?.[]" too
                        result = this.helper_call_list(node_to_call, true);
                    } else {
                        result = this.helper_call_list(result, true);
                    }
                } else {
                    if (this.getTok().notOfType(TokenType.IDENTIFIER)) {
                        throw new InvalidSyntaxError(
                            this.getTok().pos_start, this.getTok().pos_end,
                            "Expected identifier"
                        );
                    }

                    const property_tok = this.getTok();

                    this.advance();

                    const call_node: CallStaticPropertyNode | CallPropertyNode = is_static_prop ? new CallStaticPropertyNode(result ? result : node_to_call, property_tok, is_optional) : new CallPropertyNode(result ? result : node_to_call, property_tok, is_optional);

                    if (is_lparen()) {
                        result = new CallMethodNode(this.helper_call_func(call_node) as CallNode, node_to_call); // node_to_call will have to be an instance of ClassValue
                    } else if (is_lsquare()) {
                        result = this.helper_call_list(call_node);
                    } else {
                        result = call_node;
                    }
                }
            }

            if (this.getTok().ofType(TokenType.EQUALS)) {
                if (result === null || (!(result instanceof CallPropertyNode) && !(result instanceof CallStaticPropertyNode))) {
                    throw new InvalidSyntaxError(
                        result?.pos_start ?? node_to_call.pos_start, this.getTok().pos_end,
                        "Unable to assign a new value for that call.",
                    );
                }
                this.advance();
                let value_node = this.expr();
                return new AssignPropertyNode(result, value_node);
            }

            return result === null ? node_to_call : result;
        }

        return node_to_call;
    }

    // new Something()
    // or just an atom
    private call(): CustomNode {
        if (this.getTok().matches(TokenType.KEYWORD, "new")) {
            this.advance();
            if (this.getTok().notOfType(TokenType.IDENTIFIER)) {
                throw new InvalidSyntaxError(
                    this.getTok().pos_start, this.getTok().pos_end,
                    "Expected an identifier"
                );
            }
            
            const class_name_tok = this.getTok().copy();
            this.advance();
            if (this.getTok().notOfType(TokenType.LPAREN)) {
                throw new InvalidSyntaxError(
                    this.getTok().pos_start, this.getTok().pos_end,
                    "Expected '('"
                );
            }

            this.advance();
            this.ignore_newlines();

            const arg_nodes: CustomNode[] = [];
            if (this.getTok().ofType(TokenType.RPAREN)) {
                this.advance();
            } else {
                arg_nodes.push(this.expr());
                this.ignore_newlines();

                while (this.getTok().ofType(TokenType.COMMA)) {
                    this.advance();
                    this.ignore_newlines();
                    arg_nodes.push(this.expr());
                }

                this.ignore_newlines();

                if (this.getTok().notOfType(TokenType.RPAREN)) {
                    throw new InvalidSyntaxError(
                        this.getTok().pos_start, this.getTok().pos_end,
                        "Expected ',' or ')'"
                    );
                }

                this.advance();
            }

            return new ClassCallNode(class_name_tok, arg_nodes);
        }

        const atom = this.atom();
        let result: CustomNode | null = null;

        const is_lparen  = () => this.getTok().ofType(TokenType.LPAREN);
        const is_lsquare = () => this.getTok().ofType(TokenType.LSQUARE);
        const is_ocp     = () => this.getTok().ofType(TokenType.OPTIONAL_CHAINING_OPERATOR);

        while (is_lparen() || is_lsquare() || is_ocp()) {
            let optional = false;
            if (is_ocp()) {
                optional = true;
                this.advance();
            }

            if (is_lparen()) {
                result = this.helper_call_func(result ? result : atom, optional);
            } else if (is_lsquare()) {
                result = this.helper_call_list(result ? result : atom, optional);
            } else {
                // we might have the following situation:
                // `variable?.()` where variable could be a function or a list, therefore no properties here
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
     */
    private helper_call_list(atom: CustomNode, is_already_optional: boolean = false): CustomNode {
        // if we have a left square bracket after our atom
        // that means we are trying to get an element in a list

        // is_already_optional allows me to call helper_call_list elsewhere
        // and keep in mind that the first call has been set as optional

        // we might have "[42]?.[42]"
        if (this.getTok().ofType(TokenType.LSQUARE) || this.getTok().ofType(TokenType.OPTIONAL_CHAINING_OPERATOR)) {
            const index_nodes: ListArgumentNode[] = [];
            let depth: number = -1; // list[(1+1)][index] has a depth of 2
            let is_depth = false;
            let is_pushing = false; // is "list[]" ?
            let newest_qmark_tok: Token | null = null;
            let i = 0;

            const is_optional = () => {
                if (this.getTok().ofType(TokenType.OPTIONAL_CHAINING_OPERATOR)) {
                    newest_qmark_tok = this.getTok();
                    this.advance();
                    return true;
                }
                return false;
            };

            while (this.hasNextToken() && !this.isEOF()) {
                is_depth = false;
                const optional = i === 0 && is_already_optional ? true : is_optional();

                if (this.getTok().ofType(TokenType.LSQUARE)) is_depth = true;
                if (!is_depth) break;
                if (is_pushing) {
                    throw new InvalidSyntaxError(
                        this.getTok().pos_start, this.getTok().pos_end,
                        `Expected '='`
                    );
                }

                this.advance();
                this.ignore_newlines();

                // if "list[]"
                if (this.getTok().ofType(TokenType.RSQUARE)) {
                    if (optional && newest_qmark_tok !== null) {
                        throw new InvalidSyntaxError(
                            (newest_qmark_tok as Token).pos_start, (newest_qmark_tok as Token).pos_end,
                            "A push to a list cannot be optional"
                        );
                    }
                    index_nodes.push(
                        new ListArgumentNode(
                            new ListPushBracketsNode(this.getTok().pos_start, this.getTok().pos_end),
                            optional
                        )
                    );
                    is_pushing = true;
                } else {
                    const index_pos_start = this.getTok().pos_start.copy();
                    let expr: CustomNode | null; // the expression before the colon, or the whole index if there is no colon

                    // TODO: test this because it looks suspicious
                    
                    // is it "[:3]" ? (is it already a colon?)
                    if (this.getTok().ofType(TokenType.COLON)) {
                        expr = null;
                    } else {
                        expr = this.expr();
                        this.ignore_newlines();
                    }

                    if (this.getTok().ofType(TokenType.COLON)) {
                        this.advance();
                        
                        let right_expr;
                        if (this.getTok().ofType(TokenType.RSQUARE)) {
                            right_expr = null;
                        } else {
                            right_expr = this.expr();
                            this.ignore_newlines();
                        }

                        index_nodes.push(
                            new ListArgumentNode(
                                new ListBinarySelector(expr, right_expr, index_pos_start, this.getTok().pos_end),
                                optional
                            )
                        );
                    } else {
                        index_nodes.push(
                            new ListArgumentNode(
                                expr!,
                                optional
                            )
                        );
                    }
                }

                if (this.getTok().ofType(TokenType.RSQUARE)) ++depth;
                if (this.isEOF()) {
                    throw new InvalidSyntaxError(
                        this.getTok().pos_start, this.getTok().pos_end,
                        "Expected ',', ':' or ']'"
                    );
                }

                this.advance();
                ++i;
            }

            const accessor = new ListAccessNode(atom, depth, index_nodes);

            if (this.getTok().ofType(TokenType.EQUALS)) {
                this.advance();
                const value_node = this.expr();
                return new ListAssignmentNode(accessor, value_node);
            } else if (is_pushing) {
                throw new InvalidSyntaxError(
                    this.getTok().pos_start, this.getTok().pos_end,
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
     */
    private helper_call_func(atom: CustomNode, is_already_optional: boolean = false): CustomNode {
        // if we have a left parenthesis after our atom
        // that means we are calling the atom

        if (this.getTok().ofType(TokenType.LPAREN) || this.getTok().ofType(TokenType.OPTIONAL_CHAINING_OPERATOR)) {
            let result: CallNode | null = null;
            let pos_end: Position;
            let is_calling = false;

            const is_optional = () => {
                if (this.getTok().ofType(TokenType.OPTIONAL_CHAINING_OPERATOR)) {
                    this.advance();
                    return true;
                }
                return false;
            };

            while (this.hasNextToken() && !this.isEOF()) {
                const arg_nodes: CustomNode[] = [];
                is_calling = false;

                // because the behavior of the lists and the behavior of the functions
                // are different, we imitate the behavior of lists here by defining each call as optional
                // as soon as a call has been defined as optional
                // Thanks to that, we can do: `function?.()()()()`, just like JavaScript
                const optional = is_already_optional ? true : is_optional();

                if (this.getTok().ofType(TokenType.LPAREN)) is_calling = true;
                if (!is_calling) break;

                this.advance();
                this.ignore_newlines();

                if (this.getTok().ofType(TokenType.RPAREN)) {
                    pos_end = this.getTok().pos_end.copy();
                    this.advance();
                } else {
                    arg_nodes.push(this.expr());
                    this.ignore_newlines();

                    while (this.getTok().ofType(TokenType.COMMA)) {
                        this.advance();
                        this.ignore_newlines();
                        arg_nodes.push(this.expr());
                    }

                    this.ignore_newlines();

                    if (this.getTok().notOfType(TokenType.RPAREN)) {
                        throw new InvalidSyntaxError(
                            this.getTok().pos_start, this.getTok().pos_end,
                            "Expected ',' or ')'"
                        );
                    }

                    pos_end = this.getTok().pos_end.copy();

                    this.advance();
                }

                result = new CallNode(result ? result : atom, arg_nodes, optional).set_pos(result ? result.pos_start : atom.pos_start, pos_end);
            }

            if (result === null) {
                throw new InvalidSyntaxError(
                    this.getTok().pos_start, this.getTok().pos_end,
                    "Expected function call"
                );
            }

            return result;
        }

        return atom;
    }
    
    private atom(): CustomNode {
        const first_token: Token<any> = this.getTok().copy();

        if (first_token.ofType(TokenType.LPAREN)) {
            this.advance();
            this.ignore_newlines();
            const result = this.expr();
            this.ignore_newlines();
            if (this.getTok().notOfType(TokenType.RPAREN)) {
                throw new InvalidSyntaxError(
                    this.getTok().pos_start, this.getTok().pos_end,
                    "Expected ')'"
                );
            }

            this.advance();
            return result;
        } else if (first_token.ofType(TokenType.NUMBER)) {
            this.advance();
            return new NumberNode(first_token);
        } else if (first_token.ofType(TokenType.STRING)) {
            this.advance();
            return new StringNode(first_token);
        } else if (first_token.ofType(TokenType.IDENTIFIER)) {
            const var_name_tok = first_token;
            this.advance();

            if (this.getTok().ofType(TokenType.EQUALS)) {
                this.advance();
                const value_node = this.expr();
                return new VarModifyNode(var_name_tok, value_node);
            }

            return new VarAccessNode(first_token);
        } else if (this.getTok().ofType(TokenType.LSQUARE)) {
            return this.list_expr();
        } else if (this.getTok().ofType(TokenType.LBRACK)) {
            return this.dict_expr();
        } else if (this.getTok().matches(TokenType.KEYWORD, "if")) {
            return this.if_expr();
        } else if (this.getTok().matches(TokenType.KEYWORD, "for")) {
            return this.for_expr();
        } else if (this.getTok().matches(TokenType.KEYWORD, "foreach")) {
            return this.foreach_expr();
        } else if (this.getTok().matches(TokenType.KEYWORD, "while")) {
            return this.while_expr();
        } else if (this.getTok().matches(TokenType.KEYWORD, "func")) {
            return this.func_expr();
        } else if (this.getTok().matches(TokenType.KEYWORD, "switch")) {
            return this.switch_expr();
        } else if (this.getTok().matches(TokenType.KEYWORD, "none")) {
            this.advance();
            return new NoneNode(first_token.pos_start, first_token.pos_end);
        } else if (
            this.getTok().matches(TokenType.KEYWORD, "yes") ||
            this.getTok().matches(TokenType.KEYWORD, "true") ||
            this.getTok().matches(TokenType.KEYWORD, "no") ||
            this.getTok().matches(TokenType.KEYWORD, "false")
        ) {
            const state = this.getTok().matches(TokenType.KEYWORD, "yes") || this.getTok().matches(TokenType.KEYWORD, "true") ? 1 : 0;
            const display_name = this.getTok().value;
            this.advance();
            return new BooleanNode(state, display_name, first_token.pos_start, first_token.pos_end);
        } else {
            console.log("the error is thrown here");
            throw new InvalidSyntaxError(
                first_token.pos_start, first_token.pos_end,
                `Unexpected token '${first_token.value}'`
            );
        }
    }

    // ----
    // most functions here will now return a specific Node
    // instead of just a "CustomNode".
    // They are "atomic".

    // One simple list declaration "[1, 2, 3, ...]"
    // Call this when the token is "["
    private list_expr(): ListNode {
        const element_nodes: CustomNode[] = [];
        const pos_start = this.getTok().pos_start.copy();
        this.advance();
        this.ignore_newlines();

        // if the list is empty ("[]")
        if (this.getTok().ofType(TokenType.RSQUARE)) {
            this.advance();
        } else {
            // we have values in the list
            // it's actually the same as getting arguments from the call method
            element_nodes.push(this.expr());
            this.ignore_newlines();

            while (this.getTok().ofType(TokenType.COMMA)) {
                this.advance();
                this.ignore_newlines();
                if (this.getTok().ofType(TokenType.RSQUARE)) break;
                element_nodes.push(this.expr());
                this.ignore_newlines();
            }

            if (this.getTok().notOfType(TokenType.RSQUARE)) {
                throw new InvalidSyntaxError(
                    this.getTok().pos_start, this.getTok().pos_end,
                    "Expected ',', or ']'"
                );
            }

            this.advance();
        }

        return new ListNode(
            element_nodes,
            pos_start,
            this.getTok().pos_end.copy()
        );
    }

    // Reads one single dictionary: "{a: 5, ...}"
    // Call this when the token is "{"
    private dict_expr(): DictionaryNode {
        const dict_element_nodes: DictionaryElementNode[] = [];
        const pos_start = this.getTok().pos_start.copy();
        let pos_end: Position;
        this.advance();
        this.ignore_newlines();

        // if the dictionary is empty ("{}")
        if (this.getTok().ofType(TokenType.RBRACK)) {
            pos_end = this.getTok().pos_end.copy();
            this.advance();
        } else {
            const read_element = () => {
                // we have values in the dictionary
                const key = this.expr(); // can only be StringNode or VarAccessNode
                this.ignore_newlines();

                if (key instanceof StringNode) {
                    if (this.getTok().notOfType(TokenType.COLON)) {
                        throw new InvalidSyntaxError(
                            this.getTok().pos_start, this.getTok().pos_end,
                            "Expected ':'"
                        );
                    }

                    this.advance();
                    this.ignore_newlines();

                    const value = this.expr();
                    this.ignore_newlines();
                    const element = new DictionaryElementNode(key, value);
                    dict_element_nodes.push(element);
                } else if (key instanceof VarAccessNode) {
                    // if this is a variable, we want its name to become the key and its value to become the value of this key
                    // var age = 17; var dico = { age, name: "thomas" }

                    // the user had to use a string
                    // because he's trying to do: `{ age: 17 }`
                    if (this.getTok().ofType(TokenType.COLON)) {
                        throw new InvalidSyntaxError(
                            this.getTok().pos_start, this.getTok().pos_end,
                            "Expected a comma, or change the key to a string"
                        );
                    }

                    // we don't need to advance

                    // we'll do a little trick
                    // => the key becomes the name of the variable
                    // the value becomes the key (an instance of VarAccessNode)
                    // therefore, during interpretation, we'll have: { "age": age }
                    const key_string = new StringNode(key.var_name_tok);
                    const value = key;
                    const element = new DictionaryElementNode(key_string, value);
                    dict_element_nodes.push(element);
                } else {
                    throw new InvalidSyntaxError(
                        key.pos_start, key.pos_end,
                        "Expected a string or an identifier as key"
                    );
                }
            };

            read_element();

            while (this.getTok().ofType(TokenType.COMMA)) {
                this.advance();
                this.ignore_newlines();
                if (this.getTok().ofType(TokenType.RBRACK)) break;
                read_element();
            }

            this.ignore_newlines();

            if (this.getTok().notOfType(TokenType.RBRACK)) {
                throw new InvalidSyntaxError(
                    this.getTok().pos_start, this.getTok().pos_end,
                    "Expected ',' or '}'"
                );
            }

            pos_end = this.getTok().pos_end.copy();

            this.advance();
        }

        return new DictionaryNode(
            dict_element_nodes,
            pos_start,
            pos_end
        );
    }

    // prevent_null_return = Prevents the condition from returning "none" in an HTML structure.
    private if_expr(prevent_null_return: boolean = false): IfNode {
        const pos_start = this.getTok().pos_start.copy();
        const all_cases = this.if_expr_cases("if");
        const cases = all_cases.cases;
        const else_case = all_cases.else_case;
        const should_return_null = all_cases.should_return_null;
        let pos_end: Position;
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
     * @param case_keyword The keyword for a case ("if" or "elif").
     */
    private if_expr_cases(case_keyword: string): { cases: [CustomNode, CustomNode][], else_case: CustomNode | null, should_return_null: boolean } {
        let cases: [CustomNode, CustomNode][] = []; // [conditions, statements][]
        let else_case: CustomNode | null = null;
        let should_return_null: boolean = false;

        // we must have a "if" (or "elif")

        if (!this.getTok().matches(TokenType.KEYWORD, case_keyword)) {
            throw new InvalidSyntaxError(
                this.getTok().pos_start, this.getTok().pos_end,
                `Expected '${case_keyword}'`
            );
        }

        // we continue

        this.advance();
        const condition = this.expr();

        // we must have a colon

        if (this.getTok().notOfType(TokenType.COLON)) {
            throw new InvalidSyntaxError(
                this.getTok().pos_start, this.getTok().pos_end,
                "Expected ':'"
            );
        }

        this.advance();

        if (this.is_newline()) {
            this.advance();

            const statements = this.statements();

            // true = should return null?
            // before, we returned the evaluated expr
            // now if we are on several lines, we don't want to return anything
            cases.push([condition, statements]);
            should_return_null = true;

            if (this.getTok().matches(TokenType.KEYWORD, "end")) {
                this.advance();
            } else {
                // there might be elifs
                const all_cases = this.if_expr_elif_or_else();
                const new_cases = all_cases.cases;
                else_case = all_cases.else_case;

                if (new_cases.length > 0) {
                    cases = [...cases, ...new_cases];
                }
            }
        } else {
            // inline condition
            const statement = this.statement();
            cases.push([condition, statement]);
            should_return_null = false; // we want the return value of an inline-if statement (that's why "false")

            const all_cases = this.if_expr_elif_or_else();
            const new_cases = all_cases.cases;
            else_case = all_cases.else_case;

            if (new_cases.length > 0) {
                cases = [...cases, ...new_cases];
            }
        }

        return { cases, else_case, should_return_null };
    }

    /**
     * Checks if there is `elif` cases or an `else` case
     */
    private if_expr_elif_or_else(): { cases: [CustomNode, CustomNode][], else_case: CustomNode | null, should_return_null: boolean } {
        let cases: [CustomNode, CustomNode][] = [];
        let else_case: CustomNode | null = null;
        let should_return_null = false;

        if (this.getTok().matches(TokenType.KEYWORD, "elif")) {
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
     */
    private if_expr_elif(): { cases: [CustomNode, CustomNode][], else_case: CustomNode | null, should_return_null: boolean } {
        return this.if_expr_cases("elif"); // same as "if"
    }

    /**
     * Checks if there is an `else` case.
     */
    private if_expr_else(): CustomNode | null {
        let else_case: CustomNode | null = null;
        
        if (this.getTok().matches(TokenType.KEYWORD, "else")) {
            this.advance();

            if (this.getTok().ofType(TokenType.COLON)) {
                this.advance();
            } else {
                throw new InvalidSyntaxError(
                    this.getTok().pos_start, this.getTok().pos_end,
                    "Expected ':'"
                );
            }

            if (this.is_newline()) {
                this.advance();
                
                else_case = this.statements();

                if (this.getTok().matches(TokenType.KEYWORD, "end")) {
                    this.advance();
                } else {
                    throw new InvalidSyntaxError(
                        this.getTok().pos_start, this.getTok().pos_end,
                        "Expected 'end'"
                    );
                }
            } else {
                else_case = this.statement();
            }
        }

        return else_case;
    }

    // we don't want a return value for a multiline statement for example, so prevent_null_return = true
    private for_expr(prevent_null_return: boolean = false) {
        this.advance();

        // after the "for" keyword,
        // we start with an identifier (i)

        if (this.getTok().notOfType(TokenType.IDENTIFIER)) {
            throw new InvalidSyntaxError(
                this.getTok().pos_start, this.getTok().pos_end,
                "Expected identifier"
            );
        }

        const var_name_token = this.getTok().copy();
        this.advance();

        // the variable i needs to have a value,
        // so there must be an equal token

        let start_value: CustomNode | null = null;

        if (this.getTok().ofType(TokenType.EQUALS)) {
            // after the equal token, we expect an expr
            this.advance();
            start_value = this.expr();
        }

        // after the expr, we expect a `to` keyword

        if (!this.getTok().matches(TokenType.KEYWORD, "to")) {
            throw new InvalidSyntaxError(
                this.getTok().pos_start, this.getTok().pos_end,
                "Expected 'to'"
            );
        }

        this.advance();

        // The `to` keyword indicated the end value

        const end_value = this.expr();

        // we may have a `step` keyword afterwards

        let step_value: CustomNode | null = null;
        if (this.getTok().matches(TokenType.KEYWORD, "step")) {
            this.advance();
            step_value = this.expr();
        }

        if (this.getTok().notOfType(TokenType.COLON)) {
            throw new InvalidSyntaxError(
                this.getTok().pos_start, this.getTok().pos_end,
                "Expected ':'"
            );
        }

        this.advance();

        if (this.is_newline()) {
            this.advance();

            const extended_body = this.statements();

            if (!this.getTok().matches(TokenType.KEYWORD, "end")) {
                throw new InvalidSyntaxError(
                    this.getTok().pos_start, this.getTok().pos_end,
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

        const body = this.statement();

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

    private foreach_expr(prevent_null_return: boolean = false): ForeachNode {
        const pos_start = this.getTok().pos_start.copy();
        this.advance();

        const list_node = this.prop();

        if (!this.getTok().matches(TokenType.KEYWORD, "as")) {
            throw new InvalidSyntaxError(
                this.getTok().pos_start, this.getTok().pos_end,
                "Expected 'as'"
            );
        }

        this.advance();

        if (this.getTok().notOfType(TokenType.IDENTIFIER)) {
            throw new InvalidSyntaxError(
                this.getTok().pos_start, this.getTok().pos_end,
                "Expected an identifier"
            );
        }

        const var_name_tok = this.getTok().copy();

        this.advance();

        let value_name_tok: Token | null = null;
        if (this.getTok().ofType(TokenType.DOUBLE_ARROW)) {
            this.advance();
            value_name_tok = this.getTok();
            this.advance();
        }

        if (this.getTok().notOfType(TokenType.COLON)) {
            throw new InvalidSyntaxError(
                this.getTok().pos_start, this.getTok().pos_end,
                "Expected ':'"
            );
        }

        this.advance();

        if (this.is_newline()) {
            this.advance();

            const extended_body = this.statements();

            if (!this.getTok().matches(TokenType.KEYWORD, "end")) {
                throw new InvalidSyntaxError(
                    this.getTok().pos_start, this.getTok().pos_end,
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

        const body = this.statement();

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

    // Call this function when the "while" keyword is spotted.
    private while_expr(): WhileNode {
        this.advance();

        // after the `while` keyword, there must be an expression

        const condition = this.expr();

        // after the condition, we expect a ":"

        if (this.getTok().notOfType(TokenType.COLON)) {
            throw new InvalidSyntaxError(
                this.getTok().pos_start, this.getTok().pos_end,
                "Expected ':'"
            );
        }

        this.advance();

        if (this.is_newline()) {
            this.advance();

            const extended_body = this.statements();

            if (!this.getTok().matches(TokenType.KEYWORD, "end")) {
                throw new InvalidSyntaxError(
                    this.getTok().pos_start, this.getTok().pos_end,
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

        const body = this.statement();

        return new WhileNode(
            condition,
            body,
            false
        );
    }

    // Call this function when the "func" keyword is spotted.
    private func_expr(): FuncDefNode {
        this.advance();

        // there might be no identifier (anonymous function)

        let var_name_token: Token | null = null;
        if (this.getTok().ofType(TokenType.IDENTIFIER)) {
            var_name_token = this.getTok();
            this.advance();

            // there must be a left parenthesis after the identifier
            if (this.getTok().notOfType(TokenType.LPAREN)) {
                throw new InvalidSyntaxError(
                    this.getTok().pos_start, this.getTok().pos_end,
                    "Expected '('"
                );
            }
        } else {
            // anonymous function, no identifier
            // there must be a left parenthesis after anyway
            if (this.getTok().notOfType(TokenType.LPAREN)) {
                throw new InvalidSyntaxError(
                    this.getTok().pos_start, this.getTok().pos_end,
                    "Expected identifier or '('"
                );
            }
        }

        this.advance();

        let is_optional = false; // once there is an optional argument, this goes to true
        // indeed, we cannot have a mandatory argument after an optional one.

        const all_args: ArgumentNode[] = []; // all the args

        const error_rest_parameter = () => {
            // customisation of the error message
            if (this.getTok().ofType(TokenType.COMMA)) {
                throw new InvalidSyntaxError(
                    this.getTok().pos_start, this.getTok().pos_end,
                    "Invalid parameter after rest parameter."
                );
            }
            throw new InvalidSyntaxError(
                this.getTok().pos_start, this.getTok().pos_end,
                "Expected a parenthesis ')'"
            );
        };

        let is_rest = false;

        if (this.getTok().ofType(TokenType.TRIPLE_DOTS)) {
            this.advance();
            is_rest = true;
        }

        if (this.getTok().ofType(TokenType.IDENTIFIER)) {
            // there is an identifier
            // advance
            // check if there is a question mark
            // if there is a question mark, check if there is an equal sign
            // if there is an equal sign, advance and get the default value (an expr)

            // just in case we begin with a rest parameter
            if (is_rest) {
                const identifier_token = this.getTok();
                let type: string = Types.LIST;
                this.advance();
                // is optional
                if (this.getTok().ofType(TokenType.QMARK)) {
                    this.advance();
                    is_optional = true;
                }
                // is the type specified?
                if (this.getTok().ofType(TokenType.COLON)) {
                    this.advance();
                    type = this.getTok().value;
                    this.advance();
                }
                // just in case a default value has been assigned
                if (this.getTok().ofType(TokenType.EQUALS)) {
                    throw new InvalidSyntaxError(
                        this.getTok().pos_start, this.getTok().pos_end,
                        "A rest parameter can be optional but a default value can't be assigned. It's an empty list by default."
                    );
                }
                all_args.push(new ArgumentNode(identifier_token, type, is_rest, is_optional));
                // there cannot be any more arguments after a rest parameter
                if (this.getTok().notOfType(TokenType.RPAREN)) {
                    error_rest_parameter();
                }
            } else {
                const check_for_args = () => {
                    const identifier_token = this.getTok().copy();
                    this.advance();

                    if (is_rest) {
                        // there cannot be any more arguments after a rest parameter
                        if (this.getTok().ofType(TokenType.QMARK)) {
                            is_optional = true;
                            const question_mark_token = this.getTok().copy();
                            const default_value = new ListNode([], question_mark_token.pos_start, question_mark_token.pos_end);
                            let type: string = Types.LIST;
                            this.advance();

                            // TODO: the type must be a list
                            if (this.getTok().ofType(TokenType.COLON)) {
                                this.advance();
                                type = this.getTok().value;
                                this.advance();
                            }

                            if (this.getTok().ofType(TokenType.EQUALS)) {
                                throw new InvalidSyntaxError(
                                    this.getTok().pos_start, this.getTok().pos_end,
                                    "A rest parameter can be optional but a default value can't be assigned. It's an empty list by default."
                                );
                            }

                            all_args.push(new ArgumentNode(identifier_token, type, is_rest, true, default_value));
                        } else {
                            let type: string = Types.LIST; // TODO: must be a list too
                            if (this.getTok().ofType(TokenType.COLON)) {
                                this.advance();
                                type = this.getTok().value;
                                this.advance();
                            }
                            all_args.push(new ArgumentNode(identifier_token, type, is_rest, false));
                        }
                        if (this.getTok().notOfType(TokenType.RPAREN)) error_rest_parameter();
                        return;
                    }

                    // there might be a question mark
                    // (optional arg)

                    if (this.getTok().ofType(TokenType.QMARK)) {
                        is_optional = true;
                        const question_mark_token = this.getTok();
                        let default_value = new NoneNode(question_mark_token.pos_start, question_mark_token.pos_end);
                        let type: string = Types.ANY;
                        this.advance();

                        if (this.getTok().ofType(TokenType.COLON)) {
                            this.advance();
                            type = this.getTok().value;
                            this.advance();
                        }

                        // there might be an equal sign
                        // to customise the default value
                        // which is null by default
                        if (this.getTok().ofType(TokenType.EQUALS)) {
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
                            let type: string = Types.ANY;
                            const is_specified_type = this.getTok().ofType(TokenType.COLON);
                            if (is_specified_type) {
                                this.advance();
                                type = this.getTok().value;
                                this.advance();
                            }
                            if (this.getTok().ofType(TokenType.EQUALS)) {
                                throw new InvalidSyntaxError(
                                    this.getTok().pos_start, this.getTok().pos_end,
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

                while (this.getTok().ofType(TokenType.COMMA)) {
                    this.advance();

                    // there might be '...' before an identifier (a rest parameter)
                    if (this.getTok().ofType(TokenType.TRIPLE_DOTS)) {
                        this.advance();
                        is_rest = true;
                    }

                    // there must be an identifier after a comma or triple dots
                    if (this.getTok().notOfType(TokenType.IDENTIFIER)) {
                        throw new InvalidSyntaxError(
                            this.getTok().pos_start, this.getTok().pos_end,
                            "Expected identifier"
                        );
                    }

                    check_for_args();

                    if (is_rest) break;
                }

                // we have all the args,
                // now there must be a right parenthesis

                if (this.getTok().notOfType(TokenType.RPAREN)) {
                    throw new InvalidSyntaxError(
                        this.getTok().pos_start, this.getTok().pos_end,
                        "Expected ',' or ')'"
                    );
                }
            }
        } else {
            // there is no identifier (no args)
            // so we must find a right parenthesis
            if (this.getTok().notOfType(TokenType.RPAREN)) {
                throw new InvalidSyntaxError(
                    this.getTok().pos_start, this.getTok().pos_end,
                    "Expected identifier or ')'"
                );
            }
        }

        // we get out of the parenthesis

        this.advance();

        // we should have an arrow now
        // if we have an inline function of course
        if (this.getTok().ofType(TokenType.ARROW)) {
            // great, enter the body now
            this.advance();

            if (this.getTok().matches(TokenType.KEYWORD, "pass")) {
                const pos_start = this.getTok().pos_start.copy();
                const pos_end = this.getTok().pos_end.copy();
                this.advance();
                return new FuncDefNode(
                    var_name_token, // the name
                    all_args, // all the arguments
                    new NoneNode(pos_start, pos_end), // the body,
                    true // should auto return? True because the arrow behaves like the `return` keyword.
                );
            }

            // what's our body?
            const node_to_return = this.expr();

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
        if (this.getTok().notOfType(TokenType.COLON)) {
            throw new InvalidSyntaxError(
                this.getTok().pos_start, this.getTok().pos_end,
                "Expected ':' or '->'"
            );
        }

        this.advance();
        this.ignore_newlines();

        let body: CustomNode;

        // we might need to temporarily write an empty function
        if (this.getTok().matches(TokenType.KEYWORD, "pass")) {
            const pos_start = this.getTok().pos_start.copy();
            const pos_end = this.getTok().pos_end.copy();
            body = new NoneNode(pos_start, pos_end);
            this.advance();
            this.ignore_newlines();
            if (!this.getTok().matches(TokenType.KEYWORD, "end")) {
                throw new InvalidSyntaxError(
                    this.getTok().pos_start, this.getTok().pos_end,
                    "Expected 'end'"
                );
            }
            this.advance();
        } else {
            body = this.statements();
            if (!this.getTok().matches(TokenType.KEYWORD, "end")) {
                throw new InvalidSyntaxError(
                    this.getTok().pos_start, this.getTok().pos_end,
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

    // Call this as soon as the "switch" keyword was spotted
    private switch_expr() {
        const pos_start = this.getTok().pos_start.copy();
        this.advance();

        const primary_value = this.expr();

        if (this.getTok().notOfType(TokenType.COLON)) {
            throw new InvalidSyntaxError(
                this.getTok().pos_start, this.getTok().pos_end,
                "Expected ':'"
            );
        }

        this.advance();

        if (!this.is_newline()) {
            throw new InvalidSyntaxError(
                this.getTok().pos_start, this.getTok().pos_end,
                "Expected a new line"
            );
        }

        this.ignore_newlines();

        // A switch can have multiple conditions
        const cases: { conditions: CustomNode[], body: CustomNode }[] = [];
        let default_case: ListNode | null = null; // will contain the statements of the default case

        if (!this.getTok().matches(TokenType.KEYWORD, "case") && !this.getTok().matches(TokenType.KEYWORD, "default")) {
            throw new InvalidSyntaxError(
                this.getTok().pos_start, this.getTok().pos_end,
                "Expected cases or default case."
            );
        }

        const search_for_case = () => {
            if (this.getTok().matches(TokenType.KEYWORD, "case")) {
                this.advance();
                this.ignore_newlines();
                const expr = this.expr();
                const conditions = [new EqualsNode(primary_value, expr)];
                this.ignore_newlines();
                if (this.getTok().ofType(TokenType.COMMA)) {
                    while (this.getTok().ofType(TokenType.COMMA)) {
                        this.advance();
                        this.ignore_newlines();
                        conditions.push(new EqualsNode(primary_value, this.expr())); // case 1, 2, 4, 4 + 1 etc...
                        this.ignore_newlines();
                    }
                }
                if (this.getTok().notOfType(TokenType.COLON)) {
                    throw new InvalidSyntaxError(
                        this.getTok().pos_start, this.getTok().pos_end,
                        "Expected ':'"
                    );
                }
                this.advance();
                this.ignore_newlines();
                const body = this.statements();
                cases.push({conditions, body});
            } else if (this.getTok().matches(TokenType.KEYWORD, "default")) {
                this.advance();
                if (this.getTok().notOfType(TokenType.COLON)) {
                    throw new InvalidSyntaxError(
                        this.getTok().pos_start, this.getTok().pos_end,
                        "Expected ':'"
                    );
                }
                this.advance();
                this.ignore_newlines();
                default_case = this.statements();
            }
        };

        search_for_case();

        while (this.getTok().matches(TokenType.KEYWORD, "case") || this.getTok().matches(TokenType.KEYWORD, "default")) {
            // there has been a default case
            // but we're still in the loop
            // that mens that a `case` or another default case has been detected
            if (default_case) {
                throw new InvalidSyntaxError(
                    this.getTok().pos_start, this.getTok().pos_end,
                    "The default case must be the last case of a switch statement."
                );
            }
            search_for_case();
        }

        if (!this.getTok().matches(TokenType.KEYWORD, "end")) {
            throw new InvalidSyntaxError(
                this.getTok().pos_start, this.getTok().pos_end,
                "Expected 'end'"
            );
        }

        this.advance();

        return new SwitchNode(
            primary_value,
            cases,
            default_case,
            pos_start,
            this.getTok().pos_end
        );
    }
}