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
    DictionnaryNode,
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
    SuperNode, ClassCallNode, TagDefNode, HtmlNode
} from "./nodes.js";
import {CompilerError} from "./Exceptions.js";
import {Context} from "./context.js";
import {Lexer} from "./lexer.js";
import {Parser} from "./parser.js";
import {Interpreter} from "./interpreter.js";
import global_symbol_table from "./symbol_table.js";
import fs from 'fs';

export class Transcriber {
    /**
     * @constructs Transcriber
     * @param {string} text The source code of the main file.
     * @param {string} filename The filename.
     * @param {string} dir The directory in which to put the compiled javascript file. By default, "./build/".
     * @param {Context} context The execution context for tests.
     */
    constructor(text, filename, dir="./build/", context=null) {
        this.text = text;
        this.filename = filename;
        this.dir = dir;
        this.javascript = "";
        this.context = context;
        this.indentation_level = 1;
        this.cursor = -1; // -1 === append to `this.javascript`
        this.temp_text = ""; // temporary text to be inserted later in a certain position
        this.insidetag_counter = 0; // just a variable used to tell the difference between inside and oustide the definition of a tag
        this.execute();
        this.interpret_file();
    }

    interpret_file() {
        // because the entire file is a list
        // but we need to make the difference between a real list ([1, 2]) and the entire file
        this.tree.element_nodes.forEach((node, i) => {
            this.indent();
            this.transcribe(node);
            if (i !== (this.tree.element_nodes.length - 1)) {
                this.newline();
            }
        });
    }

    execute() {
        const lexer = new Lexer(this.text, this.filename);
        const tokens = lexer.generate_tokens();
        const parser = new Parser(tokens);
        const tree = parser.parse();
        this.tree = tree;

        if (!tree) {
            return;
        }

        let context = this.context;
        if (!context) {
            context = new Context('<program>');
            context.symbol_table = global_symbol_table;
        }

        const interpreter = new Interpreter();
        return interpreter.visit(tree, context); // shouldn't raise an error
    }

    add_template() {
        const comments = [
            "// This is a generated file, the most accurate javascript translation that the current version of VersaJS can give you.",
            "// You can modify it as you wish, but all your changes will be deleted after a new compilation.",
            "// " + (new Date()).toString()
        ];

        this.javascript = comments.join('\n') + `\n\n;(function($){\n${this.javascript}\n})(window.Versa)`;
    }

    create() {
        if (!fs.existsSync(this.dir)) {
            fs.mkdirSync(this.dir, {recursive: true});
            console.log(`The directory '${this.dir}' has been created successfully`);
        }

        let directory = this.dir.endsWith('/') ? this.dir : this.dir + '/';
        let filename = this.filename.substring(this.filename.lastIndexOf('/') + 1).replace(/\.\w+$/, ".js");
        this.add_template();
        fs.writeFileSync(directory + filename, this.javascript, {flag: 'w+'});

        const replace_const = (template, name, value) => {
            template = template.replace(new RegExp(name, 'g'), value);
            return template;
        };

        // from './template/'
        // we need to copy 'jscore.js'
        fs.copyFileSync('./template/jscore.js', './build/jscore.js');
        // and 'index.html' by replacing the constants by their values simultaneously
        let html_template = fs.readFileSync('./template/index.html', {encoding: 'utf8'});
        html_template = replace_const(html_template, "___JSFILENAME___", "./" + filename);
        fs.writeFileSync(directory + "index.html", html_template, {flag:"w+"});
    }

    /**
     * Increases the level of indentation by one.
     */
    block() {
        this.indentation_level += 1;
    }

    /**
     * Decreases the level of indentation by one.
     */
    out() {
        this.indentation_level -= 1;
    }

    /**
     * Adds new lines
     * @param {number} n The number of new lines.
     */
    newline(n=1) {
        if (this.cursor === -1) {
            this.javascript += "\n".repeat(n);
        } else {
            this.temp_text += "\n".repeat(n);
        }
    }

    /**
     * Adds indentation
     * @param {number} n The level of indentation.
     */
    indent(n=this.indentation_level) {
        if (this.cursor === -1) {
            this.javascript += "\t".repeat(n);
        } else {
            this.temp_text += "\t".repeat(n);
        }
    }

    /**
     * Writes code into `this.javascript`
     * @param {string} text The text to insert.
     * @param {boolean} indent Should we indent the line? False by default.
     */
    write(text, indent=false) {
        if (indent) this.indent();
        if (this.cursor === -1) {
            this.javascript += text;
        } else {
            this.temp_text += text;
        }
    }

    move_cursor(n) {
        if (this.cursor !== -1) {
            throw new Error(
                "A fatal error has occured: the cursor cannot be moved twice, it needs to be reset."
            );
        }
        this.cursor = n;
    }

    reset_cursor() {
        this.javascript = this.javascript.substring(0, this.cursor + 1) + this.temp_text + this.javascript.substring(this.cursor);
        this.cursor = -1;
        this.temp_text = "";
    }

    is_inside_tag() {
        return this.insidetag_counter > 0;
    }

    /**
     * Visits the different nodes of the program to transcribe them into JavaScript.
     * @param {CustomNode} node
     */
    transcribe(node) {
        if (node instanceof NumberNode) {
            this.transcribe_NumberNode(node);
        } else if (node instanceof NoneNode) {
            this.transcribe_NoneNode(node);
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
        } else if (node instanceof DictionnaryNode) {
            this.transcribe_DictionnaryNode(node);
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
            this.transcribe_ContinueNode(node);
        } else if (node instanceof BreakNode) {
            this.transcribe_BreakNode(node);
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
     * @param {ListNode} body
     */
    compile_multiline(body) {
        for (let e = 0; e < body.element_nodes.length; e++) {
            this.indent();
            this.transcribe(body.element_nodes[e]);
            this.newline();
        }
    }

    /**
     * Transcribes a list of arguments in the declaration of a function or a method.
     * @param {ArgumentNode[]} args
     */
    argument_list(args) {
        args.forEach((arg, i) => {
            if (arg.is_rest) this.write("...");
            this.write(arg.arg_name_tok.value);
            if (!arg.is_rest) {
                if (arg.is_optional) {
                    this.write(" = ");
                    this.transcribe(arg.default_value_node);
                }
                if (i !== (args.length - 1)) {
                    this.write(", ");
                }
            }
        });
    }

    /**
     * Transcribes a vjs number into a js number.
     * @param {NumberNode} node
     */
    transcribe_NumberNode(node) {
        this.write(node.value.toString());
    }

    /**
     * Transcribes "none"
     * @param {NoneNode} node
     */
    transcribe_NoneNode(node) {
        this.write("null");
    }
    /**
     * Transcribes a boolean
     * @param {BooleanNode} node
     */
    transcribe_BooleanNode(node) {
        this.write(node.state === 1 ? "true" : "false");
    }

    /**
     * Transcribes the declaration of a variable.
     * @param {VarAssignNode} node
     */
    transcribe_VarAssignNode(node) {
        this.write(`let ${node.var_name_tok.value} = `);
        this.transcribe(node.value_node);
    }

    /**
     * Transcribes the declaration of a constant.
     * @param {DefineNode} node
     */
    transcribe_DefineNode(node) {
        // every constant must be on top of the current code.
        let text = `const ${node.var_name_tok.value} = `;
        let copy = this.javascript.trim();
        this.javascript = "";
        this.transcribe(node.value_node);
        text += this.javascript + "\n";
        this.javascript = text + copy;
    }

    /**
     * Transcribes the declaration of an enum.
     * @param {EnumNode} node
     */
    transcribe_EnumNode(node) {
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
            console.warn("Warning: it's discouraged to compile empty enums because they are indistinguishable from dictionaries in the eyes of JavaScript. Might cause problems.");
        }
        text += "}\n";
        this.javascript = text + this.javascript.trim();
    }

    /**
     * Transcribes the access to a variable.
     * @param {VarAccessNode} node
     */
    transcribe_VarAccessNode(node) {
        if (node.var_name_tok.value === "Versa") {
            this.write("$"); // specific case when we call "Versa.mount()"
        } else {
            this.write(node.var_name_tok.value);
        }
    }

    /**
     * Transcribes the modification of a variable.
     * @param {VarModifyNode} node
     */
    transcribe_VarModifyNode(node) {
        this.write(node.var_name_tok.value);
        this.write(" = ");
        this.transcribe(node.value_node);
    }

    /**
     * Transcribes the declaration of a list.
     * @param {ListNode} node
     */
    transcribe_ListNode(node) {
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
     * @param {AddNode} node
     */
    transcribe_AddNode(node) {
        this.write("$.add(");
        this.transcribe(node.node_a);
        this.write(", ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes a subtraction
     * @param {SubtractNode} node
     */
    transcribe_SubtractNode(node) {
        this.write("(");
        this.transcribe(node.node_a);
        this.write(" - ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes a multiplication
     * @param {MultiplyNode} node
     */
    transcribe_MultiplyNode(node) {
        this.write("$.mul(");
        this.transcribe(node.node_a);
        this.write(", ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes a division
     * @param {DivideNode} node
     */
    transcribe_DivideNode(node) {
        this.write("(");
        this.transcribe(node.node_a);
        this.write(" / ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes a power operation
     * @param {PowerNode} node
     */
    transcribe_PowerNode(node) {
        this.write("(");
        this.transcribe(node.node_a);
        this.write(" ** ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes a modulo
     * @param {ModuloNode} node
     */
    transcribe_ModuloNode(node) {
        this.write("(");
        this.transcribe(node.node_a);
        this.write(" % ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes a binary shift to the left
     * @param {BinaryShiftLeftNode} node
     */
    transcribe_BinaryShiftLeftNode(node) {
        this.write("(");
        this.transcribe(node.node_a);
        this.write(" << ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes a binary shift to the right
     * @param {BinaryShiftRightNode} node
     */
    transcribe_BinaryShiftRightNode(node) {
        this.write("(");
        this.transcribe(node.node_a);
        this.write(" >> ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes an unsigned binary shift to the right
     * @param {UnsignedBinaryShiftRightNode} node
     */
    transcribe_UnsignedBinaryShiftRightNode(node) {
        this.write("(");
        this.transcribe(node.node_a);
        this.write(" >>> ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes a logical AND (&)
     * @param {LogicalAndNode} node
     */
    transcribe_LogicalAndNode(node) {
        this.write("(");
        this.transcribe(node.node_a);
        this.write(" & ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes a logical OR (|)
     * @param {LogicalOrNode} node
     */
    transcribe_LogicalOrNode(node) {
        this.write("(");
        this.transcribe(node.node_a);
        this.write(" | ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes a logical XOR (^)
     * @param {LogicalXORNode} node
     */
    transcribe_LogicalXORNode(node) {
        this.write("(");
        this.transcribe(node.node_a);
        this.write(" ^ ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes a positive node
     * @param {PlusNode} node
     */
    transcribe_PlusNode(node) {
        this.write("+");
        this.transcribe(node.node);
    }

    /**
     * Transcribes a negative node
     * @param {MinusNode} node
     */
    transcribe_MinusNode(node) {
        this.write("-");
        this.transcribe(node.node);
    }

    /**
     * Transcribes a binary NOT (~)
     * @param {BinaryNotNode} node
     */
    transcribe_BinaryNotNode(node) {
        this.write("~");
        this.transcribe(node.node);
    }

    /**
     * Transcribes a prefix operation (++2, --2)
     * @param {PrefixOperationNode} node
     */
    transcribe_PrefixOperationNode(node) {
        this.write("(");
        this.transcribe(node.node);
        this.write(node.difference > 0 ? ' + ' : ' - ');
        this.write((Math.abs(node.difference)).toString());
        this.write(")");
    }

    /**
     * Transcribes a postfix operation (a++, a--)
     * @param {PostfixOperationNode} node
     */
    transcribe_PostfixOperationNode(node) {
        this.write("(");
        this.transcribe(node.node);
        this.write(node.difference > 0 ? '+=' : '-=');
        this.write((Math.abs(node.difference)).toString());
        this.write(")");
    }

    /**
     * Transcribes a less than (<)
     * @param {LessThanNode} node
     */
    transcribe_LessThanNode(node) {
        this.write("$.lt(");
        this.transcribe(node.node_a);
        this.write(", ");
        this.transcribe(node.node_b);
        this.write(")")
    }

    /**
     * Transcribes a greater than (>)
     * @param {GreaterThanNode} node
     */
    transcribe_GreaterThanNode(node) {
        this.write("$.gt(");
        this.transcribe(node.node_a);
        this.write(", ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes a less than or equal (<=)
     * @param {LessThanOrEqualNode} node
     */
    transcribe_LessThanOrEqualNode(node) {
        this.write("$.lte(");
        this.transcribe(node.node_a);
        this.write(", ");
        this.transcribe(node.node_b);
        this.write(")");
    }
    /**
     * Transcribes a greater than or equal (>=)
     * @param {GreaterThanOrEqualNode} node
     */
    transcribe_GreaterThanOrEqualNode(node) {
        this.write("$.gte(");
        this.transcribe(node.node_a);
        this.write(", ");
        this.transcribe(node.node_b);
        this.write(")");
    }


    /**
     * Transcribes a string
     * @param {StringNode} node
     */
    transcribe_StringNode(node) {
        let allow_concatenation = node.allow_concatenation;
        this.write(allow_concatenation ? '`' : "'");

        if (allow_concatenation) {
            for (let i = 0; i < node.token.value.length; i++) {
                let char = node.token.value[i];
                let code = "";
                let brackets_counter = 1;
                if (char === "{") {
                    while (true) {
                        i++;
                        // useless to check if i >= node.token.value.length
                        // because it would have raised an error before the call to this method
                        char = node.token.value[i];
                        if (char === "{") brackets_counter++;
                        if (char === "}") brackets_counter--;
                        if (brackets_counter === 0) break;
                        code += char;
                    }
                    if (code.trim().length > 0) {
                        this.write("${$.concatenate(");
                        // we need to see `code` as a node
                        const lexer = new Lexer(code, this.filename);
                        const tokens = lexer.generate_tokens();
                        const parser = new Parser(tokens);
                        const tree = parser.parse();
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

        this.write(allow_concatenation ? '`' : "'");
    }

    /**
     * Transcribes a dictionnary
     * @param {DictionnaryNode} node
     */
    transcribe_DictionnaryNode(node) {
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
     * @param {ListAccessNode} node
     * @param {boolean} splice Should we delete the selected zone?
     */
    transcribe_ListAccessNode(node, splice=false) {
        this.transcribe(node.node_to_access);
        for (let i = 0; i < node.list_nodes.length; i++) {
            let argument = node.list_nodes[i];
            let index_node = argument.node;
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
     * @param {ListAssignmentNode} node
     */
    transcribe_ListAssignmentNode(node) {
        this.transcribe(node.accessor);
        let is_push = node.accessor.list_nodes[node.accessor.list_nodes.length - 1].node instanceof ListPushBracketsNode;
        if (!is_push) this.write(" = ");
        this.transcribe(node.new_value_node);
        if (is_push) this.write(")");
    }

    /**
     * Transcribes the declaration of a function
     * @param {FuncDefNode} node
     */
    transcribe_FuncDefNode(node) {
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
     * @param {ReturnNode} node
     */
    transcribe_ReturnNode(node) {
        this.write("return ");
        this.transcribe(node.node_to_return);
    }

    /**
     * Transcribes a call to a function
     * @param {CallNode} node
     */
    transcribe_CallNode(node) {
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
     * @param {CallPropertyNode} node
     */
    transcribe_CallPropertyNode(node) {
        let is_this = false;
        let istag = false;
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
     * @param {CallStaticPropertyNode} node
     */
    transcribe_CallStaticPropertyNode(node) {
        this.transcribe(node.node_to_call);
        this.write((node.is_optional ? '?' : '') + ".");
        this.write(node.property_tok.value);
    }

    /**
     * Transcribes the call to a method
     * @param {CallMethodNode} node
     */
    transcribe_CallMethodNode(node) {
        this.transcribe_CallNode(node.node_to_call);
    }

    /**
     * Transcribes the nullish operator node
     * @param {NullishOperatorNode} node
     */
    transcribe_NullishOperatorNode(node) {
        this.transcribe(node.node_a);
        this.write(" ?? ");
        this.transcribe(node.node_b);
    }

    /**
     * Transcribes the nullish assignment node
     * @param {NullishAssignmentNode} node
     */
    transcribe_NullishAssignmentNode(node) {
        this.transcribe(node.node_a);
        this.write(" ??= ");
        this.transcribe(node.node_b);
    }

    /**
     * Transcribes the "and" assignment node
     * @param {AndAssignmentNode} node
     */
    transcribe_AndAssignmentNode(node) {
        this.transcribe(node.node_a);
        this.write(" &&= ");
        this.transcribe(node.node_b);
    }

    /**
     * Transcribes the "or" assignment node
     * @param {OrAssignmentNode} node
     */
    transcribe_OrAssignmentNode(node) {
        this.transcribe(node.node_a);
        this.write(" ||= ");
        this.transcribe(node.node_b);
    }

    /**
     * Transcribes "&&"
     * @param {AndNode} node
     */
    transcribe_AndNode(node) {
        this.transcribe(node.node_a);
        this.write(" && ");
        this.transcribe(node.node_b);
    }

    /**
     * Transcribes "||"
     * @param {OrNode} node
     */
    transcribe_OrNode(node) {
        this.transcribe(node.node_a);
        this.write(" || ");
        this.transcribe(node.node_b);
    }

    /**
     * Transcribes "not"
     * @param {NotNode} node
     */
    transcribe_NotNode(node) {
        this.write("$.not(");
        this.transcribe(node.node);
        this.write(")");
    }

    /**
     * Transcribes "!="
     * @param {NotEqualsNode} node
     */
    transcribe_NotEqualsNode(node) {
        this.write("$.inequality(");
        this.transcribe(node.node_a);
        this.write(", ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Transcribes "=="
     * @param {EqualsNode} node
     */
    transcribe_EqualsNode(node) {
        this.write("$.equality(");
        this.transcribe(node.node_a);
        this.write(", ");
        this.transcribe(node.node_b);
        this.write(")");
    }

    /**
     * Gets the cases that must be redirected because JavaScript doesn't allow them to be written on a single line.
     * @param {IfNode} node The node that might contain cases with "return", "continue" or "break".
     * @return {[IfNode, boolean]} A copy of the node without the redirected cases and a confirmation that redirected cases have been detected.
     */
    parse_redirected_cases(node) {
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

        let copynode = node;
        let redirected_cases = [];
        let redirected_else_case = null;

        if (!node.should_return_null) {
            let nested = false;

            for (let i = 0; i < node.cases.length; i++) {
                let cas = node.cases[i];
                if (cas[1] instanceof ReturnNode || cas[1] instanceof ContinueNode || cas[1] instanceof BreakNode) {
                    redirected_cases.push(cas);
                    copynode.cases[i] = undefined;
                } else if (cas[1] instanceof IfNode) {
                    // nested conditions
                    // they are too complicated to be parsed
                    // therefore, we copy the condition as a multiline statement above the original statement
                    // and we replace every special node by "none"
                    // a ternary operation will do the rest

                    /**
                     * Transforms nested conditions into ternary operations.
                     * @param {[CustomNode, CustomNode][]} cases
                     * @param {CustomNode} else_case
                     */
                    const transform = (cases, else_case) => {
                        for (let y = 0; y < cases.length; y++) {
                            let body = cases[y][1];
                            if (body instanceof ReturnNode || body instanceof ContinueNode || body instanceof BreakNode) {
                                cases[y][1] = new NoneNode(body.pos_start, body.pos_end);
                            } else if (body instanceof IfNode) {
                                [cases[y][1].cases, cases[y][1].else_case] = transform(body.cases, body.else_case);
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
                    [copynode.cases, copynode.else_case] = transform(node.cases, node.else_case);

                    break;
                }
            }

            if (!nested) { // useless code if we've detected a nested condition
                copynode.cases = copynode.cases.filter(v => v !== null && v !== undefined);
                if (node.else_case instanceof ReturnNode || node.else_case instanceof ContinueNode || node.else_case instanceof BreakNode) {
                    redirected_else_case = node.else_case;
                    copynode.else_case = null;
                }

                this.parse_if(redirected_cases, redirected_else_case);
            }
        }

        return [copynode, (redirected_cases.length > 0 || redirected_else_case !== null)];
    }

    /**
     * Transcribes an if-statement on several lines.
     * @param {[CustomNode, CustomNode][]} cases
     * @param {CustomNode|null} else_case
     * @param {boolean} redirect Should we redirect the condition? True by default.
     */
    parse_if(cases, else_case, redirect=true) {
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

        for (let i = 0; i < cases.length; i++) {
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
     * @param {IfNode} node
     */
    transcribe_IfNode(node) {
        const ternary = (cases, else_case) => {
            if (cases.length === 0) {
                if (else_case) {
                    this.transcribe(else_case);
                }
                return;
            }

            for (let i = 0; i < cases.length; i++) {
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
            let [new_node, does_redirect] = this.parse_redirected_cases(node);
            if (does_redirect) {
                ternary(new_node.cases, new_node.else_case);
            } else {
                ternary(node.cases, node.else_case);
            }
        }
    }

    /**
     * Transcribes a loop (for)
     * @param {ForNode} node
     */
    transcribe_ForNode(node) {
        const parse_loop = (oneline=false) => {
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
     * @param {ForeachNode} node
     */
    transcribe_ForeachNode(node) {
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
     * @param {WhileNode} node
     */
    transcribe_WhileNode(node) {
        const parse_loop = (oneline=false) => {
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
     * @param {ContinueNode} node
     */
    transcribe_ContinueNode(node) {
        this.write("continue");
    }

    /**
     * Transcribes the `break` keyword
     * @param {BreakNode} node
     */
    transcribe_BreakNode(node) {
        this.write("break");
    }

    /**
     * Transcribes the `delete` keyword
     * @param {DeleteNode} node
     */
    transcribe_DeleteNode(node) {
        if (node.node_to_delete instanceof VarAccessNode) {
            this.write(node.node_to_delete.var_name_tok.value + " = undefined");
        } else if (node.node_to_delete instanceof ListAccessNode) {
            this.write("$.del(() => {\n");
            this.block();

            let has_binaryselector = false;
            for (let arg of node.node_to_delete.list_nodes) {
                let node = arg.node;
                if (node instanceof ListBinarySelector) {
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
                "Cannot delete this kind of node. Somehow, compilation security is disabled."
            );
        }
    }

    /**
     * Transcribes a switch
     * @param {SwitchNode} node
     */
    transcribe_SwitchNode(node) {
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
     * @param {TypeofNode} node
     */
    transcribe_TypeofNode(node) {
        this.write("$.gettype(");
        this.transcribe(node.node);
        this.write(")");
    }

    /**
     * Transcribes the 'instanceof' keyword
     * @param {InstanceofNode} node
     */
    transcribe_InstanceofNode(node) {
        this.transcribe(node.node_a);
        this.write(" instanceof " + node.class_name_tok.value);
    }

    /**
     * Transcribes the definition of a class
     * @param {ClassDefNode} node
     */
    transcribe_ClassDefNode(node) {
        this.write("class " + node.class_name_tok.value);
        if (node.parent_class_tok) {
            this.write(" extends " + node.parent_class_tok.value);
        }
        this.write(" {\n");
        this.block();

        const nonstatic_properties = node.properties.filter((v) => v.static_prop === 0);
        const static_properties = node.properties.filter((v) => v.static_prop === 1);
        const init_method = node.methods.filter((v) => v.func.var_name_tok.value === "__init")[0];
        const methods = node.methods.filter((v) => v.func.var_name_tok.value !== "__init");
        methods.push(...node.getters);
        methods.push(...node.setters);

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
                let list = nonstatic_properties; // because the static properties cannot be reassigned
                let body = init_method.func.body_node;
                if (body instanceof ListNode) {
                    for (let childnode of body.element_nodes) {
                        if (childnode instanceof AssignPropertyNode) { // the only statement is an assignment to a property
                            nonstatic_properties.forEach((property, i) => {
                                if (childnode.property.property_tok.value === property.property_name_tok.value) { // if we assign a new value to an already declared property
                                    list.splice(i, 1);
                                }
                            });
                        }
                    }
                } else {
                    if (body instanceof AssignPropertyNode) { // the only statement is an assignment to a property
                        nonstatic_properties.forEach((property, i) => {
                            if (body.property.property_tok.value === property.property_name_tok.value) { // if we assign a new value to an already declared property
                                list.splice(i, 1);
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
                let method_name = method.func.var_name_tok.value;
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
     * @param {TagDefNode} node
     */
    transcribe_TagDefNode(node) {
        this.insidetag_counter++;
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
                let method_name = func.var_name_tok.value;
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
        this.insidetag_counter--;
        this.write(`$.CUSTOM_ELEMENTS["${node.tag_name_tok.value}"] = ${node.tag_name_tok.value}\n`, true);
    }

    /**
     * Transcribes the HTML structure
     * @param {HtmlNode} node
     */
    transcribe_HtmlNode(node) {
        // todo: create the html structure
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
     * @param {AssignPropertyNode} node
     */
    transcribe_AssignPropertyNode(node) {
        this.transcribe(node.property);
        this.write(" = ");
        this.transcribe(node.value_node);
    }

    /**
     * Transcribes the call to 'super' function
     * @param {SuperNode} node
     */
    transcribe_SuperNode(node) {
        this.write("super(");
        node.arg_nodes.forEach((arg, i) => {
            this.transcribe(arg);
            if (i !== (node.arg_nodes.length - 1)) this.write(", ");
        });
        this.write(")");
    }

    /**
     * Transcribes the instantiation of a class
     * @param {ClassCallNode} node
     */
    transcribe_ClassCallNode(node) {
        this.write("new " + node.class_name_tok.value + "(");
        node.arg_nodes.forEach((arg, i) => {
            this.transcribe(arg);
            if (i !== (node.arg_nodes.length - 1)) this.write(", ");
        });
        this.write(")");
    }
}