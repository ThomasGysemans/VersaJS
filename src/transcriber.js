import {
    VarAssignNode,
    NumberNode,
    ListNode,
    AddNode,
    SubtractNode,
    MultiplyNode,
    DivideNode,
    PlusNode, MinusNode
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
     * @param {string} dir The directory in which to put the compiled javascript file. By default "./compiled/".
     */
    constructor(text, filename, dir="./compiled/") {
        this.text = text;
        this.filename = filename;
        this.dir = dir;
        this.javascript = "";
        this.execute();
        // because the entire file is a list
        // but we need to make the difference between a real list ([1, 2]) and the entire file
        let lines = [];
        for (let node of this.tree.element_nodes) {
            lines.push(this.transcribe(node));
        }
        this.javascript += lines.join('\n');
    }

    execute() {
        const lexer = new Lexer(this.text, this.filename);
        const tokens = lexer.generate_tokens();
        const parser = new Parser(tokens);
        const tree = parser.parse();
        this.tree = tree;

        if (!tree) {
            return "";
        }

        const context = new Context('<program>');
        context.symbol_table = global_symbol_table;
        const interpreter = new Interpreter();
        return interpreter.visit(tree, context); // shouldn' raise an error
    }

    create() {
        if (!fs.existsSync(this.dir)) {
            fs.mkdirSync(this.dir, { recursive: true });
            console.log(`The directory '${this.dir}' has been created successfully`);
        }

        let directory = this.dir.endsWith('/') ? this.dir : this.dir + '/';
        let filename = this.filename.substring(this.filename.lastIndexOf('/')).replace(/\.\w+$/, ".js");
        fs.writeFileSync(directory + filename, this.javascript, { flag: 'w+' });
    }

    /**
     * Visits the different nodes of the program to transcribe them into JavaScript.
     * @param {CustomNode} node
     */
    transcribe(node) {
        if (node instanceof NumberNode) {
            this.transcribe_NumberNode(node);
        } else if (node instanceof VarAssignNode) {
            this.transcribe_VarAssignNode(node);
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
        } else if (node instanceof PlusNode) {
            this.transcribe_PlusNode(node);
        } else if (node instanceof MinusNode) {
            this.transcribe_MinusNode(node);
        } else {
            throw new CompilerError(
                node.pos_start, node.pos_end,
                `There is no way to compile this kind of node.`
            );
        }

        // todo: faut faire en sorte de contrôler simultanément la position du noeud et la position du token, et ainsi pouvoir vérifier si on entre dans une parenthèse

        return "";
    }

    /**
     * Transcribes a vjs number into a js number.
     * @param {NumberNode} node
     */
    transcribe_NumberNode(node) {
        this.javascript += node.value.toString();
    }

    /**
     * Transcribes the declaration of a variable.
     * @param {VarAssignNode} node
     */
    transcribe_VarAssignNode(node) {
        this.javascript += `\nlet ${node.var_name_tok.value} = `;
        this.transcribe(node.value_node);
    }

    /**
     * Transcribes the declaration of a list.
     * @param {ListNode} node
     */
    transcribe_ListNode(node) {
        this.javascript += "[";
        node.element_nodes.forEach((element, i) => {
            this.transcribe(element);
            if (i !== (node.element_nodes.length - 1)) { // not last one
                this.javascript += ", ";
            }
        });
        this.javascript += "]";
    }

    /**
     * Transcribes an addition
     * @param {AddNode} node
     */
    transcribe_AddNode(node) {
        this.javascript += "(";
        this.transcribe(node.node_a);
        this.javascript += " + ";
        this.transcribe(node.node_b);
        this.javascript += ")";
    }

    /**
     * Transcribes a subtraction
     * @param {SubtractNode} node
     */
    transcribe_SubtractNode(node) {
        this.javascript += "(";
        this.transcribe(node.node_a);
        this.javascript += " - ";
        this.transcribe(node.node_b);
        this.javascript += ")";
    }

    /**
     * Transcribes a multiplication
     * @param {MultiplyNode} node
     */
    transcribe_MultiplyNode(node) {
        this.javascript += "(";
        this.transcribe(node.node_a);
        this.javascript += " * ";
        this.transcribe(node.node_b);
        this.javascript += ")";
    }

    /**
     * Transcribes a division
     * @param {DivideNode} node
     */
    transcribe_DivideNode(node) {
        this.javascript += "(";
        this.transcribe(node.node_a);
        this.javascript += " / ";
        this.transcribe(node.node_b);
        this.javascript += ")";
    }

    /**
     * Transcribes a positive node
     * @param {PlusNode} node
     */
    transcribe_PlusNode(node) {
        this.javascript += "+";
        this.transcribe(node.node);
    }

    /**
     * Transcribes a negative node
     * @param {MinusNode} node
     */
    transcribe_MinusNode(node) {
        this.javascript += "-";
        this.transcribe(node.node);
    }
}