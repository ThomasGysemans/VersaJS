"use strict";

import {
    VarAssignNode,
    NumberNode,
    ListNode,
    AddNode,
    SubtractNode,
    MultiplyNode,
    DivideNode,
    PlusNode,
    MinusNode,
    DictionaryNode,
    StringNode,
    VarAccessNode,
    ListAccessNode,
    ListBinarySelector,
    ListPushBracketsNode,
    ListAssignmentNode,
    FuncDefNode,
    NoneNode,
    CallNode,
    CallPropertyNode,
    CallMethodNode,
    PowerNode,
    ModuloNode,
    BinaryShiftLeftNode,
    BinaryShiftRightNode,
    UnsignedBinaryShiftRightNode,
    LessThanNode,
    LessThanOrEqualNode,
    GreaterThanNode,
    GreaterThanOrEqualNode,
    LogicalAndNode,
    LogicalOrNode,
    LogicalXORNode,
    NullishOperatorNode,
    NullishAssignmentNode,
    AndAssignmentNode,
    OrAssignmentNode,
    VarModifyNode,
    AndNode,
    OrNode,
    NotNode,
    NotEqualsNode,
    EqualsNode,
    IfNode,
    ForNode,
    ForeachNode,
    WhileNode,
    PrefixOperationNode,
    PostfixOperationNode,
    ReturnNode,
    ContinueNode,
    BreakNode,
    DefineNode,
    DeleteNode,
    CallStaticPropertyNode,
    BooleanNode,
    BinaryNotNode,
    EnumNode,
    SwitchNode,
    TypeofNode,
    InstanceofNode,
    ClassDefNode,
    AssignPropertyNode,
    SuperNode, ClassCallNode, TagDefNode, HtmlNode, CustomNode, ArgumentNode
} from "./nodes.js";
import { CompilerError } from "./Exceptions.js";
import { Interpreter } from "./interpreter.js";
import { Parser } from "./parser.js";
import { Lexer } from "./lexer.js";
import RuntimeResult from "./runtime.js";
import Context, { init_global_context } from "./context.js";
import fs from 'fs';

export class Transcriber {
    private readonly text: string;
    private readonly filename: string;
    private readonly dir: string;
    private context: Context | null;
    private indentation_level: number; // the current level of indentation, useful to produce a readable JavaScript code
    private cursor: number; // position of the cursor in source code, -1 if the translations just need to be appended
    private temp_text: string; // temporary text to be inserted later in a certain position
    private insidetag_counter: number; // 
    private tree: ListNode | null;
    private javascript: string; // the translated code to put in the transcribed file

    /**
     * @param text The source code of the main file.
     * @param filename The filename of the source code.
     * @param dir The directory in which to put the compiled javascript file. By default, "./build/".
     * @param context The execution context for tests.
     */
    constructor(text: string, filename: string, dir: string = "./build/", context: Context | null = null) {
        this.text = text;
        this.filename = filename;
        this.dir = dir;
        this.javascript = "";
        this.context = context;
        this.indentation_level = 1;
        this.cursor = -1; // -1 === append to `this.javascript`
        this.temp_text = ""; // temporary text to be inserted later in a certain position
        this.insidetag_counter = 0; // just a variable used to tell the difference between inside and oustide the definition of a tag
        this.tree = null;
        this.execute();
        this.interpret_file();
    }

    public getJavaScript(): string { return this.javascript; }
    public clearJavaScript() { this.javascript = ""; }

    public interpret_file() {
        // because the entire file is a list
        // but we need to make the difference between a real list ([1, 2]) and the entire file
        this.tree!.element_nodes.forEach((node, i) => {
            this.indent();
            this.transcribe(node);
            if (i !== (this.tree!.element_nodes.length - 1)) {
                this.newline();
            }
        });
    }

    /**
     * Executes the code to compile.
     * @returns 
     */
    private execute(): RuntimeResult | undefined {
        const lexer = new Lexer(this.text, this.filename);
        const tokens = lexer.generate_tokens();
        const parser = new Parser(tokens);
        const tree = parser.parse();

        // TODO: for the natives properties of JS, when a property is unknown, instead of throwing an error, look inside of `window`.
        // same strategy for interpretation???

        if (!tree) {
            return;
        }
        
        this.tree = tree;
        
        let context = this.context;
        if (!context) {
            context = init_global_context();
        }

        return new Interpreter().visit(tree, context)!; // shouldn't raise an error
    }

    private add_template() {
        // TODO: add the exact version of VersaJS
        const comments = [
            "// This is a generated file, the most accurate javascript translation that the current version of VersaJS can give you.",
            "// You can modify it as you wish, but all your changes will be deleted after a new compilation.",
            "// " + (new Date()).toString()
        ];

        this.javascript = comments.join('\n') + `\n\n;(function($){\n${this.javascript}\n})(window.Versa);`;
    }

    /**
     * Creates the template that runs the compiled code.
     * It copies the JSCore (needed to run VersaJS) to the `build` folder.
     * It also copies the `index.html` template and replaces the constants by their value.
     * - `___JSFILENAME___` becomes the name of the compiled source code.
     * All files within the `build` folder will be overwritten.
     */
    public create() {
        if (!fs.existsSync(this.dir)) {
            fs.mkdirSync(this.dir, { recursive: true });
            console.log(`The directory '${this.dir}' has been created successfully`);
        }

        const directory = this.dir.endsWith('/') ? this.dir : this.dir + '/';
        const filename = this.filename.substring(this.filename.lastIndexOf('/') + 1).replace(/\.\w+$/, ".js");
        this.add_template();
        fs.writeFileSync(directory + filename, this.javascript, {flag: 'w+'});

        fs.copyFileSync('js/jscore.js', 'build/jscore.js');
        // and 'index.html' by replacing the constants by their values simultaneously
        const html_template = fs
            .readFileSync('template/index.html', { encoding: 'utf8' })
            .replace(new RegExp('___JSFILENAME___', 'g'), "./" + filename); // TODO: only one VersaJS file can be compiled
        fs.writeFileSync(directory + "index.html", html_template, {flag:"w+"});
    }

    /**
     * Increases the level of indentation by one.
     */
    private block() {
        ++this.indentation_level;
    }

    /**
     * Decreases the level of indentation by one.
     */
    private out() {
        --this.indentation_level;
    }

    /**
     * Adds new lines
     * @param n The number of new lines.
     */
    private newline(n: number = 1) {
        if (this.cursor === -1) {
            this.javascript += "\n".repeat(n);
        } else {
            this.temp_text += "\n".repeat(n);
        }
    }

    /**
     * Adds indentation
     * @param n The level of indentation.
     */
    private indent(n: number = this.indentation_level) {
        if (this.cursor === -1) {
            this.javascript += "\t".repeat(n);
        } else {
            this.temp_text += "\t".repeat(n);
        }
    }

    /**
     * Writes code into `this.javascript`
     * @param text The text to insert.
     * @param indent Should we indent the line? False by default.
     */
    private write(text: string, indent: boolean = false) {
        if (indent) this.indent();
        if (this.cursor === -1) {
            this.javascript += text;
        } else {
            this.temp_text += text;
        }
    }

    private move_cursor(n: number) {
        if (this.cursor !== -1) {
            throw new Error(
                "A fatal error has occured: the cursor cannot be moved twice, it needs to be reset."
            );
        }
        this.cursor = n;
    }

    private reset_cursor() {
        this.javascript = this.javascript.substring(0, this.cursor + 1) + this.temp_text + this.javascript.substring(this.cursor);
        this.cursor = -1;
        this.temp_text = "";
    }

    /**
     * Is the cursor iside of a tag? If `insidetag_counter` is not equal to 0, then it means that we're still writing a tag.
     * @returns `true` if insidetag_counter is greater than 0.
     */
    private is_inside_tag(): boolean {
        return this.insidetag_counter > 0;
    }

    /**
     * Visits the different nodes of the program to transcribe them into JavaScript.
     * @param node The node to be translated.
     * @returns An empty string.
     */
    private transcribe(node: CustomNode): string {
        if (node instanceof NumberNode) {
            this.transcribe_NumberNode(node);
        } else if (node instanceof NoneNode) {
            this.transcribe_NoneNode();
        } else if (node instanceof BooleanNode) {
            this.transcribe_BooleanNode(node);
        } else if (node instanceof VarAssignNode) {
            this.transcribe_VarAssignNode(node);
        } else if (node instanceof DefineNode) {
            this.transcribe_DefineNode(node);
        } else if (node instanceof EnumNode) {
            this.transcribe_EnumNode(node);
        } else if (node instanceof VarAccessNode) {
            this.transcribe_VarAccessNode(node);
        } else if (node instanceof VarModifyNode) {
            this.transcribe_VarModifyNode(node);
        } else if (node instanceof ListNode) {
            this.transcribe_ListNode(node);
        } else if (node instanceof AddNode) {
            this.transcribe_AddNode(node);
        } else if (node instanceof SubtractNode) {
            this.transcribe_SubtractNode(node);
        } else if (node instanceof MultiplyNode) {
            this.transcribe_MultiplyNode(node);
        } else if (node instanceof DivideNode) {
            this.transcribe_DivideNode(node);
        } else if (node instanceof PowerNode) {
            this.transcribe_PowerNode(node);
        } else if (node instanceof ModuloNode) {
            this.transcribe_ModuloNode(node);
        } else if (node instanceof BinaryShiftLeftNode) {
            this.transcribe_BinaryShiftLeftNode(node);
        } else if (node instanceof BinaryShiftRightNode) {
            this.transcribe_BinaryShiftRightNode(node);
        } else if (node instanceof UnsignedBinaryShiftRightNode) {
            this.transcribe_UnsignedBinaryShiftRightNode(node);
        } else if (node instanceof LogicalAndNode) {
            this.transcribe_LogicalAndNode(node);
        } else if (node instanceof LogicalOrNode) {
            this.transcribe_LogicalOrNode(node);
        } else if (node instanceof LogicalXORNode) {
            this.transcribe_LogicalXORNode(node);
        } else if (node instanceof PlusNode) {
            this.transcribe_PlusNode(node);
        } else if (node instanceof MinusNode) {
            this.transcribe_MinusNode(node);
        } else if (node instanceof BinaryNotNode) {
            this.transcribe_BinaryNotNode(node);
        } else if (node instanceof PrefixOperationNode) {
            this.transcribe_PrefixOperationNode(node);
        } else if (node instanceof PostfixOperationNode) {
            this.transcribe_PostfixOperationNode(node);
        } else if (node instanceof LessThanNode) {
            this.transcribe_LessThanNode(node);
        } else if (node instanceof LessThanOrEqualNode) {
            this.transcribe_LessThanOrEqualNode(node);
        } else if (node instanceof GreaterThanNode) {
            this.transcribe_GreaterThanNode(node);
        } else if (node instanceof GreaterThanOrEqualNode) {
            this.transcribe_GreaterThanOrEqualNode(node);
        } else if (node instanceof StringNode) {
            this.transcribe_StringNode(node);
        } else if (node instanceof DictionaryNode) {
            this.transcribe_DictionaryNode(node);
        } else if (node instanceof ListAccessNode) {
            this.transcribe_ListAccessNode(node);
        } else if (node instanceof ListAssignmentNode) {
            this.transcribe_ListAssignmentNode(node);
        } else if (node instanceof FuncDefNode) {
            this.transcribe_FuncDefNode(node);
        } else if (node instanceof ReturnNode) {
            this.transcribe_ReturnNode(node);
        } else if (node instanceof CallNode) {
            this.transcribe_CallNode(node);
        } else if (node instanceof CallPropertyNode) {
            this.transcribe_CallPropertyNode(node);
        } else if (node instanceof CallStaticPropertyNode) {
            this.transcribe_CallStaticPropertyNode(node);
        } else if (node instanceof CallMethodNode) {
            this.transcribe_CallMethodNode(node);
        } else if (node instanceof NullishOperatorNode) {
            this.transcribe_NullishOperatorNode(node);
        } else if (node instanceof NullishAssignmentNode) {
            this.transcribe_NullishAssignmentNode(node);
        } else if (node instanceof AndAssignmentNode) {
            this.transcribe_AndAssignmentNode(node);
        } else if (node instanceof OrAssignmentNode) {
            this.transcribe_OrAssignmentNode(node);
        } else if (node instanceof AndNode) {
            this.transcribe_AndNode(node);
        } else if (node instanceof OrNode) {
            this.transcribe_OrNode(node);
        } else if (node instanceof NotNode) {
            this.transcribe_NotNode(node);
        } else if (node instanceof NotEqualsNode) {
            this.transcribe_NotEqualsNode(node);
        } else if (node instanceof EqualsNode) {
            this.transcribe_EqualsNode(node);
        } else if (node instanceof IfNode) {
            this.transcribe_IfNode(node);
        } else if (node instanceof ForNode) {
            this.transcribe_ForNode(node);
        } else if (node instanceof ForeachNode) {
            this.transcribe_ForeachNode(node);
        } else if (node instanceof WhileNode) {
            this.transcribe_WhileNode(node);
        } else if (node instanceof ContinueNode) {
            this.transcribe_ContinueNode();
        } else if (node instanceof BreakNode) {
            this.transcribe_BreakNode();
        } else if (node instanceof DeleteNode) {
            this.transcribe_DeleteNode(node);
        } else if (node instanceof SwitchNode) {
            this.transcribe_SwitchNode(node);
        } else if (node instanceof TypeofNode) {
            this.transcribe_TypeofNode(node);
        } else if (node instanceof InstanceofNode) {
            this.transcribe_InstanceofNode(node);
        } else if (node instanceof ClassDefNode) {
            this.transcribe_ClassDefNode(node);
        } else if (node instanceof AssignPropertyNode) {
            this.transcribe_AssignPropertyNode(node);
        } else if (node instanceof SuperNode) {
            this.transcribe_SuperNode(node);
        } else if (node instanceof ClassCallNode) {
            this.transcribe_ClassCallNode(node);
        } else if (node instanceof TagDefNode) {
            this.transcribe_TagDefNode(node);
        } else if (node instanceof HtmlNode) {
            this.transcribe_HtmlNode(node);
        } else {
            throw new CompilerError(
                node.pos_start, node.pos_end,
                `There is no way to compile this kind of node.`
            );
        }

        return "";
    }

    /**
     * Because the body is a list of lines, not a normal list (same problem as `interpret_file()`)
     * @param body Multiple statements, which are always in a ListNode.
     */
    private compile_multiline(body: ListNode) {
        for (let e = 0; e < body.element_nodes.length; ++e) {
            this.indent();
            this.transcribe(body.element_nodes[e]);
            this.newline();
        }
    }

    /**
     * Transcribes a list of arguments in the declaration of a function or a method.
     * @param args The arguments passed to a function declaration.
     */
    private argument_list(args: ArgumentNode[]) {
        args.forEach((arg, i) => {
            if (arg.is_rest) this.write("...");
            this.write(arg.arg_name_tok.value);
            if (!arg.is_rest) {
                if (arg.is_optional) {
                    this.write(" = ");
                    this.transcribe(arg.default_value_node as CustomNode); // TODO: not sure if there is a default value actually...
                }
                if (i !== (args.length - 1)) {
                    this.write(", ");
                }
            }
        });
    }

    /**
     * Transcribes a vjs number into a js number.
     */
    private transcribe_NumberNode(node: NumberNode) {
        this.write(node.value.toString());
    }

    /**
     * Transcribes "none"
     */
    private transcribe_NoneNode() {
        this.write("null");
    }
    /**
     * Transcribes a boolean
     */
    private transcribe_BooleanNode(node: BooleanNode) {
        this.write(node.state === 1 ? "true" : "false");
    }

    /**
     * Transcribes the declaration of a variable.
     */
    private transcribe_VarAssignNode(node: VarAssignNode) {
        this.write(`let ${node.var_name_tok.value} = `);
        this.transcribe(node.value_node);
    }

    /**
     * Transcribes the declaration of a constant.
     */
    private transcribe_DefineNode(node: DefineNode) {
        // every constant must be on top of the current code.
        const copy = this.javascript.trim();
        let text = `const ${node.var_name_tok.value} = `;
        this.javascript = "";
        this.transcribe(node.value_node);
        text += this.javascript + "\n";
        this.javascript = text + copy;
    }

    /**
     * Transcribes the declaration of an enum.
     */
    private transcribe_EnumNode(node: EnumNode) {
        // every constant must be on top of the current code.
        let text = `const ${node.enum_name_tok.value} = {\n`;
        if (node.properties.length > 0) {
            node.properties.forEach((property, i) => {
                text += "\t" + property.value;
                text += ": " + i;
                if (i !== (node.properties.length - 1)) text += ",";
                text += "\n";
            });
        } else {
            console.warn("Warning: it's discouraged to compile empty enums.");
        }
        text += "}\n";
        this.javascript = text + this.javascript.trim();
    }

    /**
     * Transcribes the access to a variable.
     */
    private transcribe_VarAccessNode(node: VarAccessNode) {
        if (node.var_name_tok.value === "Versa") {
            this.write("$"); // specific case when we call "Versa.mount()"
        } else {
            this.write(node.var_name_tok.value);
        }
    }

    /**
     * Transcribes the modification of a variable.
     */
    private transcribe_VarModifyNode(node: VarModifyNode) {
        this.write(node.var_name_tok.value);
        this.write(" = ");
        this.transcribe(node.value_node);
    }

    /**
     * Transcribes the declaration of a list.
     */
    private transcribe_ListNode(node: ListNode) {
        this.write("[");
        node.element_nodes.forEach((element, i) => {
            this.transcribe(element);
            if (i !== (node.element_nodes.length - 1)) { // not last one
                this.write(", ");
            }
        });
        this.write("]");
    }

    /**
     * Transcribes an addition
     */
    private transcribe_AddNode(node: AddNode) {
        this.write("$.add(");
        this.transcribe(node.node_a);
        this.write(", ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes a subtraction
     */
    private transcribe_SubtractNode(node: SubtractNode) {
        this.write("(");
        this.transcribe(node.node_a);
        this.write(" - ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes a multiplication
     */
    private transcribe_MultiplyNode(node: MultiplyNode) {
        this.write("$.mul(");
        this.transcribe(node.node_a);
        this.write(", ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes a division
     */
    private transcribe_DivideNode(node: DivideNode) {
        this.write("(");
        this.transcribe(node.node_a);
        this.write(" / ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes a power operation
     */
    private transcribe_PowerNode(node: PowerNode) {
        this.write("(");
        this.transcribe(node.node_a);
        this.write(" ** ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes a modulo
     */
    private transcribe_ModuloNode(node: ModuloNode) {
        this.write("(");
        this.transcribe(node.node_a);
        this.write(" % ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes a binary shift to the left
     */
    private transcribe_BinaryShiftLeftNode(node: BinaryShiftLeftNode) {
        this.write("(");
        this.transcribe(node.node_a);
        this.write(" << ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes a binary shift to the right
     */
    private transcribe_BinaryShiftRightNode(node: BinaryShiftRightNode) {
        this.write("(");
        this.transcribe(node.node_a);
        this.write(" >> ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes an unsigned binary shift to the right
     */
    private transcribe_UnsignedBinaryShiftRightNode(node: UnsignedBinaryShiftRightNode) {
        this.write("(");
        this.transcribe(node.node_a);
        this.write(" >>> ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes a logical AND (&)
     */
    private transcribe_LogicalAndNode(node: LogicalAndNode) {
        this.write("(");
        this.transcribe(node.node_a);
        this.write(" & ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes a logical OR (|)
     */
    private transcribe_LogicalOrNode(node: LogicalOrNode) {
        this.write("(");
        this.transcribe(node.node_a);
        this.write(" | ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes a logical XOR (^)
     */
    private transcribe_LogicalXORNode(node: LogicalXORNode) {
        this.write("(");
        this.transcribe(node.node_a);
        this.write(" ^ ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes a positive number
     */
    private transcribe_PlusNode(node: PlusNode) {
        this.write("+");
        this.transcribe(node.node);
    }

    /**
     * Transcribes a negative number
     */
    private transcribe_MinusNode(node: MinusNode) {
        this.write("-");
        this.transcribe(node.node);
    }

    /**
     * Transcribes a binary NOT (~)
     */
    private transcribe_BinaryNotNode(node: BinaryNotNode) {
        this.write("~");
        this.transcribe(node.node);
    }

    /**
     * Transcribes a prefix operation (++2, --2)
     */
    private transcribe_PrefixOperationNode(node: PrefixOperationNode) {
        this.write("(");
        this.transcribe(node.node);
        this.write(node.difference > 0 ? ' + ' : ' - ');
        this.write((Math.abs(node.difference)).toString());
        this.write(")");
    }

    /**
     * Transcribes a postfix operation (a++, a--)
     */
    private transcribe_PostfixOperationNode(node: PostfixOperationNode) {
        this.write("(");
        this.transcribe(node.node);
        this.write(node.difference > 0 ? '+=' : '-=');
        this.write((Math.abs(node.difference)).toString());
        this.write(")");
    }

    /**
     * Transcribes a less than (<)
     */
    private transcribe_LessThanNode(node: LessThanNode) {
        this.write("$.lt(");
        this.transcribe(node.node_a);
        this.write(", ");
        this.transcribe(node.node_b);
        this.write(")")
    }

    /**
     * Transcribes a greater than (>)
     */
    private transcribe_GreaterThanNode(node: GreaterThanNode) {
        this.write("$.gt(");
        this.transcribe(node.node_a);
        this.write(", ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes a less than or equal (<=)
     */
    private transcribe_LessThanOrEqualNode(node: LessThanOrEqualNode) {
        this.write("$.lte(");
        this.transcribe(node.node_a);
        this.write(", ");
        this.transcribe(node.node_b);
        this.write(")");
    }
    /**
     * Transcribes a greater than or equal (>=)
     */
    private transcribe_GreaterThanOrEqualNode(node: GreaterThanNode) {
        this.write("$.gte(");
        this.transcribe(node.node_a);
        this.write(", ");
        this.transcribe(node.node_b);
        this.write(")");
    }


    /**
     * Transcribes a string
     */
    private transcribe_StringNode(node: StringNode) {
        const allow_concatenation = node.allow_concatenation;
        this.write(allow_concatenation ? '`' : "'");

        if (allow_concatenation) {
            for (let i = 0; i < node.token.value.length; ++i) {
                let char = node.token.value[i];
                let brackets_counter = 1;
                let code = "";
                if (char === "{") {
                    while (true) {
                        ++i;
                        // useless to check if i >= node.token.value.length
                        // because it would have raised an error before the call to this access
                        char = node.token.value[i];
                        if (char === "{") ++brackets_counter;
                        if (char === "}") --brackets_counter;
                        if (brackets_counter === 0) break;
                        code += char;
                    }
                    if (code.trim().length > 0) {
                        this.write("${$.concatenate("); // TODO: we should optimise the thing. When there is only one node, then don't use `$.concatenate` at all
                        // we need to see `code` as a node
                        const lexer = new Lexer(code, this.filename);
                        const tokens = lexer.generate_tokens();
                        const parser = new Parser(tokens);
                        const tree = parser.parse();
                        if (!tree) {
                            throw new CompilerError(
                                node.pos_start, node.pos_end,
                                "Failed reading concatenation."
                            );
                        }
                        this.transcribe(tree);
                        this.write(")}");
                        code = "";
                    } else {
                        this.write("{" + code + "}");
                    }
                } else {
                    this.write(char);
                }
            }
        } else {
            this.write(node.token.value);
        }

        this.write(allow_concatenation ? '`' : "'"); // TODO: what about conflicts in the quotes inside of the value?
    }

    /**
     * Transcribes a dictionary
     */
    private transcribe_DictionaryNode(node: DictionaryNode) {
        this.write("{ ");
        node.element_nodes.forEach((v, i) => {
            this.write("[");
            this.transcribe(v.key);
            this.write("]");
            this.write(": ");
            this.transcribe(v.value);
            if (i !== (node.element_nodes.length - 1)) {
                this.write(", ");
            }
        });
        this.write(" }");
    }

    /**
     * Transcribes a list access node
     * @param node An access to a list.
     * @param splice Should we delete the selected zone? `true` when the "delete" keyword is there right before it.
     */
    private transcribe_ListAccessNode(node: ListAccessNode, splice: boolean = false) {
        this.transcribe(node.node_to_access);
        for (let i = 0; i < node.list_nodes.length; ++i) {
            const argument = node.list_nodes[i];
            const index_node = argument.node;
            if (index_node instanceof ListBinarySelector) {
                this.write((argument.is_optional ? '?' : '') + (splice ? ".splice(" : ".slice("));
                if (index_node.node_a) {
                    this.transcribe(index_node.node_a);
                } else {
                    this.write("0");
                }
                if (index_node.node_b) {
                    this.write(", ");
                    this.transcribe(index_node.node_b);
                }
                this.write(")");
            } else if (index_node instanceof ListPushBracketsNode) {
                this.write((argument.is_optional ? '?' : '') + ".push(");
            } else {
                this.write(argument.is_optional ? "?.[" : "[");
                this.transcribe(index_node);
                this.write("]");
            }
        }
    }

    /**
     * Transcribes a list assignment node
     */
    private transcribe_ListAssignmentNode(node: ListAssignmentNode) {
        this.transcribe(node.accessor);
        let is_push = node.accessor.list_nodes[node.accessor.list_nodes.length - 1].node instanceof ListPushBracketsNode;
        if (!is_push) this.write(" = ");
        this.transcribe(node.new_value_node);
        if (is_push) this.write(")");
    }

    /**
     * Transcribes the declaration of a function
     */
    private transcribe_FuncDefNode(node: FuncDefNode) {
        if (!node.var_name_tok) {
            this.write("((");
            this.argument_list(node.args);
            this.write(") => {\n");
            this.block();
            if (node.body_node instanceof ListNode) {
                this.compile_multiline(node.body_node);
                this.out();
                this.write("}", true);
            } else {
                if (node.should_auto_return) this.write("return ", true);
                this.transcribe(node.body_node);
                this.newline();
                this.out();
                this.write("}", true);
            }
            this.write(")");
        } else {
            this.write("function ");
            this.write(node.var_name_tok?.value ?? '');
            this.write("(");
            this.argument_list(node.args);
            this.write(")");
            this.write(" {\n");
            this.block();
            if (node.should_auto_return) this.write("return ", true);
            if (node.body_node instanceof ListNode) {
                this.compile_multiline(node.body_node);
            } else {
                this.transcribe(node.body_node);
                this.newline();
            }
            this.out();
            this.write("}", true);
        }
    }

    /**
     * Transcribes the `return` keyword
     */
    private transcribe_ReturnNode(node: ReturnNode) {
        if (node.node_to_return === null) {
            this.write("return;");
        } else {
            this.write("return ");
            this.transcribe(node.node_to_return);
        }
    }

    /**
     * Transcribes a call to a function
     */
    private transcribe_CallNode(node: CallNode) {
        this.transcribe(node.node_to_call);
        this.write((node.is_optional ? '?.' : '') + "(");
        node.arg_nodes.forEach((arg, i) => {
            this.transcribe(arg);
            if (i !== (node.arg_nodes.length - 1)) this.write(", ");
        });
        this.write(")");
    }

    /**
     * Transcribes the call to a property
     */
    private transcribe_CallPropertyNode(node: CallPropertyNode) {
        let is_this = false;
        let istag = false;
        // TODO: in a class, maybe create a "self" variable to fix the context issue (in JS "this" changes in a function, but not in VersaJS)
        if (node.node_to_call instanceof VarAccessNode && node.node_to_call.var_name_tok.value === "self") {
            this.write("this");
            is_this = true;
            istag = this.is_inside_tag();
        } else {
            this.transcribe(node.node_to_call);
        }
        this.write((node.is_optional ? '?' : '') + ".");
        if (is_this && istag) {
            this.write(`getProperty("${node.property_tok.value}")`);
        } else {
            this.write(node.property_tok.value);
        }
    }

    /**
     * Transcribes the call to a static property
     */
    private transcribe_CallStaticPropertyNode(node: CallStaticPropertyNode) {
        this.transcribe(node.node_to_call);
        this.write((node.is_optional ? '?' : '') + ".");
        this.write(node.property_tok.value);
    }

    /**
     * Transcribes the call to a method
     */
    private transcribe_CallMethodNode(node: CallMethodNode) {
        // this.transcribe(node); <-- // TODO: could it be node.(property)?
        this.transcribe_CallNode(node.node_to_call as CallNode);
    }

    /**
     * Transcribes the nullish operator node
     */
    private transcribe_NullishOperatorNode(node: NullishOperatorNode) {
        this.transcribe(node.node_a);
        this.write(" ?? ");
        this.transcribe(node.node_b);
    }

    /**
     * Transcribes the nullish assignment node
     */
    private transcribe_NullishAssignmentNode(node: NullishAssignmentNode) {
        this.transcribe(node.node_a);
        this.write(" ??= ");
        this.transcribe(node.node_b);
    }

    /**
     * Transcribes the "and" assignment node
     */
    private transcribe_AndAssignmentNode(node: AndAssignmentNode) {
        this.transcribe(node.node_a);
        this.write(" &&= ");
        this.transcribe(node.node_b);
    }

    /**
     * Transcribes the "or" assignment node
     */
    private transcribe_OrAssignmentNode(node: OrAssignmentNode) {
        this.transcribe(node.node_a);
        this.write(" ||= ");
        this.transcribe(node.node_b);
    }

    /**
     * Transcribes "&&"
     */
    private transcribe_AndNode(node: AndNode) {
        this.transcribe(node.node_a);
        this.write(" && ");
        this.transcribe(node.node_b);
    }

    /**
     * Transcribes "||"
     */
    private transcribe_OrNode(node: OrNode) {
        this.transcribe(node.node_a);
        this.write(" || ");
        this.transcribe(node.node_b);
    }

    /**
     * Transcribes "not"
     */
   private transcribe_NotNode(node: NotNode) {
        this.write("$.not(");
        this.transcribe(node.node);
        this.write(")");
    }

    /**
     * Transcribes "!="
     */
    private transcribe_NotEqualsNode(node: NotEqualsNode) {
        this.write("$.inequality(");
        this.transcribe(node.node_a);
        this.write(", ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes "=="
     */
    private transcribe_EqualsNode(node: EqualsNode) {
        this.write("$.equality(");
        this.transcribe(node.node_a);
        this.write(", ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Gets the cases that must be redirected because JavaScript doesn't allow them to be written on a single line.
     * @param node The node that might contain cases with "return", "continue" or "break".
     * @return A copy of the node without the redirected cases and a confirmation that redirected cases have been detected.
     */
    private parse_redirected_cases(node: IfNode): [IfNode, boolean] {
        /*
        Process:

        We need to spot whether we have a ReturnNode, ContinueNode or BreakNode in the different cases of the condition,
        only if it is a condition on a single line.

        Once we have found out if there is one of these nodes,
        we write a multiline condition containing only the cases with one of the special nodes
        while deleting them from the list

        In other words, we decompose the ternary condition in such a way that the "return" etc. are not
        included in the operation.

        If only 'else' remains, then no ternary operation will be made
         */

        // TODO: here we actually tried a copy of the node, was it necessary? If yes then implement a copy method in the IfNode

        let redirected_cases: [CustomNode, (ReturnNode | ContinueNode | BreakNode)][] = [];
        let redirected_else_case: CustomNode | null = null;

        if (!node.should_return_null) {
            let nested = false;

            for (let i = 0; i < node.cases.length; ++i) {
                const cas = node.cases[i];
                if (cas[1] instanceof ReturnNode || cas[1] instanceof ContinueNode || cas[1] instanceof BreakNode) {
                    redirected_cases.push(cas);
                    node.cases[i] = undefined as any; // because we'll filter it out later
                } else if (cas[1] instanceof IfNode) {
                    // nested conditions
                    // they are too complicated to be parsed
                    // therefore, we copy the condition as a multiline statement above the original statement
                    // and we replace every special node by "none"
                    // a ternary operation will do the rest

                    // TODO: test nested conditions (ternary and not ternary)

                    /**
                     * Transforms nested conditions into ternary operations.
                     * @param cases
                     * @param else_case
                     */
                    const transform = (cases: [CustomNode, CustomNode][], else_case: CustomNode | null): [[CustomNode, CustomNode][], CustomNode | null] => {
                        for (let y = 0; y < cases.length; ++y) {
                            const body = cases[y][1];
                            if (body instanceof ReturnNode || body instanceof ContinueNode || body instanceof BreakNode) {
                                cases[y][1] = new NoneNode(body.pos_start, body.pos_end);
                            } else if (body instanceof IfNode) {
                                [body.cases, body.else_case] = transform(body.cases, body.else_case);
                            }
                        }
                        if (else_case instanceof ReturnNode || else_case instanceof ContinueNode || else_case instanceof BreakNode) {
                            else_case = new NoneNode(else_case.pos_start, else_case.pos_end);
                        }
                        return [cases, else_case];
                    };

                    redirected_cases = node.cases;
                    redirected_else_case = node.else_case;
                    nested = true;
                    this.parse_if(redirected_cases, redirected_else_case);
                    [node.cases, node.else_case] = transform(node.cases, node.else_case);

                    break;
                }
            }

            node.cases = node.cases.filter(c => c !== undefined);

            if (!nested) { // useless code if we've detected a nested condition
                if (node.else_case instanceof ReturnNode || node.else_case instanceof ContinueNode || node.else_case instanceof BreakNode) {
                    redirected_else_case = node.else_case;
                    node.else_case = null;
                }

                this.parse_if(redirected_cases, redirected_else_case);
            }
        }

        return [node, (redirected_cases.length > 0 || redirected_else_case !== null)];
    }

    /**
     * Transcribes an if-statement on several lines.
     * @param cases The cases of the condition (if, else if)
     * @param else_case The else statement
     * @param redirect Should we redirect the condition? True by default.
     */
    private parse_if(cases: [CustomNode, CustomNode][], else_case: CustomNode | null, redirect: boolean = true) {
        if (cases.length === 0) {
            if (else_case) {
                this.transcribe(else_case);
            }
            return;
        }

        if (redirect) {
            this.move_cursor(this.javascript.lastIndexOf('\n'));
            this.indent(); // start with the current level of indentation
        }

        for (let i = 0; i < cases.length; ++i) {
            this.write("if (");
            this.write("$.is_true(");
            this.transcribe(cases[i][0]);
            this.write(")");
            this.write(") {\n");
            this.block();
            let body = cases[i][1];
            if (body instanceof ListNode) {
                this.compile_multiline(body);
            } else {
                if (body instanceof IfNode && this.cursor !== -1) {
                    this.indent();
                    this.parse_if(body.cases, body.else_case, false);
                    this.newline();
                } else {
                    this.indent();
                    this.transcribe(body);
                    this.newline();
                }
            }
            this.out();
            this.write("}", true);
            if (i + 1 === cases.length) {
                if (else_case) {
                    this.write(" else {\n");
                    this.block();
                    if (else_case instanceof ListNode) { // will always be true
                        this.compile_multiline(else_case);
                    } else {
                        this.indent();
                        this.transcribe(else_case);
                        this.newline();
                    }
                    this.out();
                    this.write("}", true);
                }
            } else {
                this.write(" else "); // loop again to write "if"
            }
        }

        if (redirect) this.reset_cursor();
    }

    /**
     * Transcribes a condition (if-statement)
     */
    private transcribe_IfNode(node: IfNode) {
        const ternary = (cases: [CustomNode, CustomNode][], else_case: CustomNode | null) => {
            if (cases.length === 0) {
                if (else_case) {
                    this.transcribe(else_case); // possible when all the cases were redirected but the `else` case.
                }
                return;
            }

            for (let i = 0; i < cases.length; ++i) {
                this.write("($.is_true(");
                this.transcribe(cases[i][0]);
                this.write(")");
                this.write(" ? ");
                this.transcribe(cases[i][1]);
                this.write(" : ");
                if (i + 1 === cases.length) { // end
                    if (else_case) {
                        this.transcribe(else_case);
                    } else {
                        this.write("null");
                    }
                }
            }
            this.write(")".repeat(cases.length));
        };

        if (node.should_return_null) {
            // multiline
            this.parse_if(node.cases, node.else_case, false);
        } else {
            // inline
            const [new_node, does_redirect] = this.parse_redirected_cases(node);
            // It redirects the cases containing `return`, `break` or `continue`,
            // and makes a ternary operation of what remains
            if (does_redirect) {
                ternary(new_node.cases, new_node.else_case);
            } else {
                ternary(node.cases, node.else_case);
            }
        }
    }

    /**
     * Transcribes a loop (for)
     */
    private transcribe_ForNode(node: ForNode) {
        const parse_loop = (oneline: boolean = false) => {
            // index
            this.write("for (let ", oneline);
            this.write(node.var_name_tok.value);
            this.write(" = ");
            if (node.start_value_node) {
                this.transcribe(node.start_value_node);
            } else {
                this.write("0");
            }
            this.write("; ");

            // condition
            this.write(`$.forcond(${node.var_name_tok.value}, `);
            if (node.step_value_node) {
                this.transcribe(node.step_value_node);
            } else {
                this.write("1");
            }
            this.write(", ");
            this.transcribe(node.end_value_node);
            this.write("); ");

            // step
            this.write(`${node.var_name_tok.value} += $.forinc(`);
            if (node.step_value_node) {
                this.transcribe(node.step_value_node);
            } else {
                this.write("1");
            }
            this.write(", ");
            if (node.start_value_node) {
                this.transcribe(node.start_value_node);
            } else {
                this.write("0");
            }
            this.write(", ");
            this.transcribe(node.end_value_node);
            this.write(")");

            // body
            this.write(") {\n");
            this.block();
            if (node.body_node instanceof ListNode) { // will always be true in a multiline loop
                this.compile_multiline(node.body_node);
            } else if (oneline) {
                this.write("$list.push(", true);
                this.transcribe(node.body_node);
                this.write(")\n");
            }

            this.out();
            this.write("}", true);
        };

        if (node.should_return_null) {
            // multiline
            parse_loop();
        } else {
            // oneline
            this.write("(() => {\n");
            this.block();
            this.write("let $list = []\n", true);
            parse_loop(true);
            this.newline();
            this.write("return $list", true);
            this.out();
            this.newline();
            this.write("})()", true);
        }
    }

    /**
     * Transcribes a loop (foreach)
     */
    private transcribe_ForeachNode(node: ForeachNode) {
        this.write("$.foreach(");
        this.transcribe(node.list_node);
        this.write(", ($i) => {\n");
        this.block();
        if (node.key_name_tok) {
            this.write("let " + node.key_name_tok.value + " = Array.isArray(", true);
            this.transcribe(node.list_node);
            this.write(") ? $i : Object.keys(");
            this.transcribe(node.list_node);
            this.write(")[$i]\n");
            this.write("let " + node.value_name_tok.value + " = ", true);
            this.transcribe(node.list_node);
            this.write("[" + node.key_name_tok.value + "]\n");
        } else {
            this.write("let " + node.value_name_tok.value + " = Array.isArray(", true);
            this.transcribe(node.list_node);
            this.write(") ? ");
            this.transcribe(node.list_node);
            this.write("[$i] : Object.values(");
            this.transcribe(node.list_node);
            this.write(")[$i]\n");
        }
        if (node.should_return_null) {
            if (node.body_node instanceof ListNode) { // will always be true
                this.compile_multiline(node.body_node);
            }
        } else {
            this.write("return ", true);
            this.transcribe(node.body_node);
            this.newline();
        }
        this.out();
        this.write("})", true);
    }

    /**
     * Transcribes a loop (while)
     */
    private transcribe_WhileNode(node: WhileNode) {
        const parse_loop = (oneline: boolean = false) => {
            this.write("while ($.is_true(", oneline);
            this.transcribe(node.condition_node);
            this.write(")) {\n");
            this.block();
            if (node.body_node instanceof ListNode) { // will always be true if multiline
                this.compile_multiline(node.body_node);
            } else {
                this.write("$list.push(", true);
                this.transcribe(node.body_node);
                this.write(")\n");
            }
            this.out();
            this.write("}", true);
        };

        if (node.should_return_null) {
            // multiline
            parse_loop();
        } else {
            this.write("(() => {\n");
            this.block();
            this.write("let $list = []\n", true);
            parse_loop(true);
            this.newline();
            this.write("return $list", true);
            this.newline();
            this.out();
            this.write("})()", true);
        }
    }

    /**
     * Transcribes the `continue` keyword
     */
    private transcribe_ContinueNode() {
        this.write("continue");
    }

    /**
     * Transcribes the `break` keyword
     */
    private transcribe_BreakNode() {
        this.write("break");
    }

    /**
     * Transcribes the `delete` keyword
     */
    private transcribe_DeleteNode(node: DeleteNode) {
        if (node.node_to_delete instanceof VarAccessNode) {
            this.write(node.node_to_delete.var_name_tok.value + " = undefined");
        } else if (node.node_to_delete instanceof ListAccessNode) {
            this.write("$.del(() => {\n");
            this.block();

            let has_binaryselector = false;
            for (const arg of node.node_to_delete.list_nodes) {
                if (arg.node instanceof ListBinarySelector) {
                    has_binaryselector = true;
                    break;
                }
            }
            // normally, the binary selector should be the last access for a delete node.
            if (has_binaryselector) {
                this.indent();
                this.transcribe_ListAccessNode(node.node_to_delete, true);
            } else {
                this.indent();
                this.transcribe(node.node_to_delete);
                this.write(" = undefined");
                this.newline();
                this.indent();
                this.transcribe(node.node_to_delete.node_to_access);
                this.write(" = ");
                this.transcribe(node.node_to_delete.node_to_access);
                this.write(".filter(v => v !== undefined)");
            }

            this.newline();
            this.out();
            this.write("})", true);
        } else {
            // should never happen
            throw new CompilerError(
                node.pos_start, node.pos_end,
                "Cannot delete this kind of node for unknown reasons."
            );
        }
    }

    /**
     * Transcribes a switch
     */
    private transcribe_SwitchNode(node: SwitchNode) {
        this.write("switch (");
        this.transcribe(node.primary_value);
        this.write(") {\n");
        this.block();
        node.cases.forEach((cas, i) => {
            this.indent();
            cas.conditions.forEach((cond, e) => {
                this.write("case ");
                if (cond instanceof EqualsNode) { // should always be true
                    // Indeed, VersaJS creates an EqualsNode during parsing
                    // in order for the interpreter to execute the conditions properly
                    // For instance, we do: `case 1` === `case (value == 1):`
                    // From this equality `(value == 1)`, we take the right side.
                    this.transcribe(cond.node_b);
                } else {
                    this.transcribe(cond);
                }
                this.write(": ");
                if (e === (cas.conditions.length - 1)) { // if this is the last condition
                    this.newline();
                }
            });
            this.block();
            if (cas.body instanceof ListNode) { // will always be true
                this.compile_multiline(cas.body);
            }
            this.out();
            this.write("break\n", true);
            if (i !== (node.cases.length - 1) || node.default_case) {
                // we want a new line after each "break" keyword
                // only if there is something afterwards
                this.newline();
            }
        });
        if (node.default_case) {
            this.write("default:\n", true);
            this.block();
            if (node.default_case instanceof ListNode) {
                this.compile_multiline(node.default_case);
            }
            this.out();
        }
        this.out();
        this.write("}", true);
    }

    /**
     * Transcribes the 'typeof' keyword
     */
    private transcribe_TypeofNode(node: TypeofNode) {
        this.write("$.gettype(");
        this.transcribe(node.node);
        this.write(")");
    }

    /**
     * Transcribes the 'instanceof' keyword
     */
    private transcribe_InstanceofNode(node: InstanceofNode) {
        this.transcribe(node.node_a);
        this.write(" instanceof " + node.class_name_tok.value);
    }

    /**
     * Transcribes the definition of a class
     */
    private transcribe_ClassDefNode(node: ClassDefNode) {
        this.write("class " + node.class_name_tok.value);
        if (node.parent_class_tok) {
            this.write(" extends " + node.parent_class_tok.value);
        }
        this.write(" {\n");
        this.block();

        const nonstatic_properties = node.properties.filter(v => v.static_prop === 0);
        const static_properties = node.properties.filter(v => v.static_prop === 1);
        const init_method = node.methods.filter(v => v.func.var_name_tok!.value === "__init")[0];
        const methods = node.methods.filter(v => v.func.var_name_tok!.value !== "__init");
        methods.push(...node.getters, ...node.setters);

        this.write(`static __name = "${node.class_name_tok.value}"\n`, true);
        if (node.parent_class_tok) this.write(`static __parent_name = "${node.parent_class_tok.value}"\n`, true);

        if (static_properties.length > 0) {
            static_properties.forEach((property) => {
                this.write("static " + property.property_name_tok.value + " = ", true);
                this.transcribe(property.value_node);
                this.newline();
            });
        }

        this.newline();

        if (init_method) {
            this.write("constructor(", true);
            this.argument_list(init_method.func.args);
            this.write(") {\n");
            this.block();

            // The optional properties that are declared above __init are default values
            // they can be reassigned in the __init method,
            // so as to avoid repetition, we declare the properties that are not reassigned inside __init

            // An array that contains the properties that are not reassigned in __init
            const defaults = (() => {
                const list = nonstatic_properties; // because the static properties cannot be reassigned
                const body = init_method.func.body_node;
                if (body instanceof ListNode) {
                    for (const childnode of body.element_nodes) {
                        if (childnode instanceof AssignPropertyNode) { // the only statement is an assignment to a property
                            nonstatic_properties.forEach((property, i) => {
                                if (childnode.property.property_tok.value === property.property_name_tok.value) { // if we assign a new value to an already declared property
                                    list.splice(i, 1); // the remove it
                                }
                            });
                        }
                    }
                } else {
                    if (body instanceof AssignPropertyNode) { // the only statement is an assignment to a property
                        nonstatic_properties.forEach((property, i) => {
                            if (body.property.property_tok.value === property.property_name_tok.value) { // if we assign a new value to an already declared property
                                list.splice(i, 1); // then remove it
                            }
                        });
                    }
                }
                return list;
            })();

            defaults.forEach((property) => {
                this.write("this." + property.property_name_tok.value + " = ", true);
                this.transcribe(property.value_node);
                this.newline();
            });

            if (init_method.func.should_auto_return) this.write("return ", true);
            if (init_method.func.body_node instanceof ListNode) {
                this.compile_multiline(init_method.func.body_node);
                this.out();
                this.write("}", true);
            } else {
                this.transcribe(init_method.func.body_node);
                this.newline();
                this.out();
                this.write("}", true);
            }
            this.newline();
            if (node.methods) {
                this.newline();
            }
        } else {
            this.write("constructor() {\n", true);
            this.block();
            nonstatic_properties.forEach((property) => {
                this.write("this." + property.property_name_tok.value + " = ", true);
                this.transcribe(property.value_node);
                this.newline();
            });
            this.out();
            this.write("}\n", true);
            if (node.methods) {
                this.newline();
            }
        }

        if (methods.length > 0) {
            methods.forEach((method, i) => {
                if (method.override) {
                    this.write("/** @override */\n", true);
                }
                if (method.static_prop) {
                    this.write("static ", true);
                }
                const method_name = method.func.var_name_tok!.value;
                this.write(method_name === "__repr" ? "toString" : method_name, !method.static_prop);
                this.write("(");
                this.argument_list(method.func.args);
                this.write(") {\n");
                this.block();
                if (method.func.should_auto_return) this.write("return ", true);
                if (method.func.body_node instanceof ListNode) {
                    this.compile_multiline(method.func.body_node);
                    this.out();
                    this.write("}\n", true);
                } else {
                    this.transcribe(method.func.body_node);
                    this.newline();
                    this.out();
                    this.write("}\n", true);
                }
                if (i !== (methods.length - 1)) {
                    this.newline();
                }
            });
        }

        this.out();
        this.write("}\n", true);
    }

    /**
     * Transcribes the instantiation of a tag
     */
    private transcribe_TagDefNode(node: TagDefNode) {
        ++this.insidetag_counter;
        this.write("class " + node.tag_name_tok.value + " extends VersaHTMLElement {\n");
        this.block();
        this.write(`static __name = "${node.tag_name_tok.value}"\n`, true);
        this.newline();

        this.write("constructor() {\n", true);
        this.block();
        this.write(`super("${node.tag_name_tok.value}")`, true);
        this.newline();
        node.props.forEach((p) => {
            // this.write(`this.props.${p.property_name_tok.value} = new VersaProp(`, true);
            // this.transcribe(p.value_node);
            // this.write(`, ${p.optional ? 'true' : 'false'})`);
            // this.newline();
            this.write(`this.props.${p.property_name_tok.value} = `, true);
            this.transcribe(p.value_node);
            this.newline();
        });
        node.states.forEach((s) => {
            this.write(`this.state.${s.property_name_tok.value} = `, true);
            this.transcribe(s.value_node);
            this.newline();
        });
        this.out();
        this.write("}\n", true);
        if (node.methods) {
            this.newline();
        }

        if (node.methods.length > 0) {
            node.methods.forEach((func, i) => {
                const method_name = func.var_name_tok!.value;
                this.write(method_name, true);
                this.write('(');
                this.argument_list(func.args);
                this.write(") {\n");
                this.block();
                if (func.should_auto_return) this.write("return ", true);
                if (func.body_node instanceof ListNode) {
                    this.compile_multiline(func.body_node);
                    this.out();
                    this.write("}\n", true);
                } else {
                    this.transcribe(func.body_node);
                    this.newline();
                    this.out();
                    this.write("}\n", true);
                }
                if (i !== (node.methods.length - 1)) {
                    this.newline();
                }
            });
        }

        this.out();
        this.write("}\n", true);
        --this.insidetag_counter;
        this.write(`$.CUSTOM_ELEMENTS["${node.tag_name_tok.value}"] = ${node.tag_name_tok.value}\n`, true);
    }

    /**
     * Transcribes the HTML structure
     */
    private transcribe_HtmlNode(node: HtmlNode) {
        // todo: create the html structure (which is a mess for now, also note that the if conditions should be ternary)
        // je fais juste un Versa.html() comme prévu, cela dit c'est dans render() que je ferai l'optimisation
        // problématique : comment savoir où on se situe dans le vrai DOM ?
        // solution : on devrait sauvegarder la position lors du premier render (et attribuer à chaque html element un data-id)
        // tagname
        this.write("$.html(\n");
        this.block();
        this.write(`"${node.tagname_tok?.value ?? 'div'}", `, true);
        this.newline();
        // classes
        this.write("[", true);
        node.classes.forEach((clas, i) => {
            this.write(`"${clas}"`);
            if (i !== (node.classes.length - 1)) {
                this.write(", ");
            }
        });
        this.write("], ");
        this.newline();
        // id
        if (node.id) {
            this.write(`"${node.id}", `, true);
        } else {
            this.write('"", ', true);
        }
        this.newline();
        // attributes
        this.write("[", true);
        node.attributes.forEach((attr, i) => {
            let attr_name = attr[0].value;
            this.write("[");
            this.write(`"${attr_name}"`);
            this.write(", ");
            this.transcribe(attr[1]);
            this.write(']');
            if (i !== (node.attributes.length - 1)) {
                this.write(", ");
            }
        });
        this.write("], ");
        this.newline();
        // events
        this.write("[", true);
        node.events.forEach((event, i) => {
            let evt_name = event[0].value;
            this.write("[");
            this.write(`"${evt_name}"`);
            this.write(", (");
            this.transcribe(event[1]);
            // this.write(").bind(this)");
            this.write(")");
            this.write(']');
            if (i !== (node.events.length - 1)) {
                this.write(", ");
            }
        });
        this.write("], ");
        this.newline();
        // children
        this.write("[", true);
        node.children.forEach((child, i) => {
            this.transcribe(child);
            if (i !== (node.children.length - 1)) {
                this.write(", ");
            }
        });
        this.write("]");
        this.newline();
        this.out();
        this.write(")", true);

        // todo: le problème est que mount() ne fait rien, il n'appelle pas render du custom tag :/
        // solution pas ouf : créer une classe pour chaque tag et appeler render() systématiquement en passant en arguments props & states
    }

    /**
     * Transcribes the assignment of a new value to a property
     */
    private transcribe_AssignPropertyNode(node: AssignPropertyNode) {
        this.transcribe(node.property);
        this.write(" = ");
        this.transcribe(node.value_node);
    }

    /**
     * Transcribes the call to 'super' function
     */
    private transcribe_SuperNode(node: SuperNode) {
        this.write("super(");
        node.arg_nodes.forEach((arg, i) => {
            this.transcribe(arg);
            if (i !== (node.arg_nodes.length - 1)) this.write(", ");
        });
        this.write(")");
    }

    /**
     * Transcribes the instantiation of a class
     */
    private transcribe_ClassCallNode(node: ClassCallNode) {
        this.write("new " + node.class_name_tok.value + "(");
        node.arg_nodes.forEach((arg, i) => {
            this.transcribe(arg);
            if (i !== (node.arg_nodes.length - 1)) this.write(", ");
        });
        this.write(")");
    }
}