"use strict";

import { ClassValue, DictionaryValue, ListValue, NativeClassValue, NativeFunction, NativePropertyValue, NoneValue, NumberValue, StringValue, Value } from "./values.js";
import { ArgumentNode, type CustomNode } from "./nodes.js";
import { PropertyNature } from "./lib/PropertyNature.js";
import { Token, TokenType, Types } from "./tokens.js";
import { Visibility } from "./lib/Visibility.js";
import { RuntimeError } from "./Exceptions.js";
import RuntimeResult from "./runtime.js";
import Context from "./context.js";
import Position, { getDefaultPos } from "./position.js";
import process from 'process';

/**
 * A shortcut to create arguments for native functions faster.
 * @param name The name of the argument.
 * @param type The type of the variable.
 * @param is_rest Is a rest parameter?
 * @param is_optional Is optional?
 * @param default_value The default value.
 */
export function argNode(name: string, type: VariableStrictType = Types.ANY, is_rest: boolean = false, is_optional: boolean = false, default_value: CustomNode | Value | null = null) {
    return new ArgumentNode(new Token(TokenType.STRING, name, getDefaultPos()), type, is_rest, is_optional, default_value);
}

/**
 * Gets a property that belongs to the executed native class.
 * @param exec_ctx The execution context
 * @param pos_start The starting position
 * @param pos_end The end position
 * @param property_name The property we want to get
 * @returns It can return any sort of Value
 */
export function getInsideProperty<T = any>(exec_ctx: Context, pos_start: Position, pos_end: Position, property_name: string) {
    return (exec_ctx.symbol_table!.get('self')?.value as NativeClassValue).self.get(property_name)!.value.behavior(exec_ctx, pos_start, pos_end).value as T;
}

/**
 * @param value Checks if the type of that value corresponds to an object.
 */
export function is_object(value: Value): boolean {
    // Enum is an object and its type remains Types.OBJECT so we're good
    return value.type === Types.OBJECT || value instanceof NativeClassValue || value instanceof ClassValue;
}

export const NATIVE_CLASSES: NativeClasses = { }
export const NATIVE_FUNCTIONS: { [key: string]: NativeFunctionType; } = { }

const GLOBAL_ATTRIBUTES = [
    "contenteditable",
    "dir",
    "draggable",
    "dropzone",
    "hidden",
    "lang",
    "spellcheck",
    "style",
    "tabindex",
    "title",
    "translate",
];

// https://fr.w3docs.com/apprendre-html/tableau-des-tags-html.html
// only the tags that are supported in HTML5
export const NATIVE_TAGS: {
    [key: string]: NativeTag;
} = {
    h1: {
        name: "h1",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ]
    },
    h2: {
        name: "h2",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ]
    },
    h3: {
        name: "h3",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ]
    },
    h4: {
        name: "h4",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ]
    },
    h5: {
        name: "h5",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ]
    },
    h6: {
        name: "h6",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ]
    },
    p: {
        name: "p",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ]
    },
    br: {
        name: "br",
        props: [
            "hidden",
        ]
    },
    hr: {
        name: "hr",
        props: [
            "hidden",
        ]
    },
    abbr: {
        name: "abbr",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    address: {
        name: "address",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    b: {
        name: "b",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    bdi: {
        name: "bdi",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    bdo: {
        name: "bdo",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    blockquote: {
        name: "blockquote",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "cite",
        ],
    },
    cite: {
        name: "cite",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    code: {
        name: "code",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    del: {
        name: "del",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "cite",
            "datetime",
        ],
    },
    dfn: {
        name: "dfn",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    em: {
        name: "em",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    i: {
        name: "i",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    ins: {
        name: "ins",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "cite",
            "datetime",
        ],
    },
    kbd: {
        name: "kbd",
        props: [
            ...GLOBAL_ATTRIBUTES
        ],
    },
    mark: {
        name: "mark",
        props: [
            ...GLOBAL_ATTRIBUTES
        ],
    },
    meter: {
        name: "meter",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "form",
            "high",
            "low",
            "max",
            "min",
            "optimum",
            "value",
        ],
    },
    pre: {
        name: "pre",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    progress: {
        name: "progress",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "max",
            "value",
        ],
    },
    q: {
        name: "q",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "cite",
        ],
    },
    rp: {
        name: "rp",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    rt: {
        name: "rt",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    ruby: {
        name: "ruby",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    s: {
        name: "s",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    samp: {
        name: "samp",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    small: {
        name: "small",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    strong: {
        name: "strong",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    sub: {
        name: "sub",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    sup: {
        name: "sup",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    template: {
        name: "template",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    time: {
        name: "time",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "datetime",
        ],
    },
    u: {
        name: "u",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    var: {
        name: "var",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    wbr: {
        name: "wbr",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    form: {
        name: "form",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "accept_charset",
            "action",
            "autocomplete",
            "enctype",
            "method",
            "name",
            "novalidate",
            "target",
        ],
    },
    input: {
        name: "input",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "accept",
            "alt",
            "autocomplete",
            "autofocus",
            "checked",
            "disabled",
            "form",
            "formaction",
            "formenctype",
            "formmethod",
            "formnovalidate",
            "formtarget",
            "height",
            "inputmode",
            "list",
            "max",
            "maxlength",
            "min",
            "multiple",
            "name",
            "pattern",
            "placeholder",
            "readonly",
            "required",
            "selectionDirection",
            "size",
            "src",
            "step",
            "type",
            "value",
            "width"
        ],
    },
    textarea: {
        name: "textarea",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "autocomplete",
            "autofocus",
            "cols",
            "dirname",
            "disabled",
            "form",
            "maxlength",
            "minlength",
            "name",
            "placeholder",
            "readonly",
            "required",
            "rows",
            "wrap"
        ],
    },
    button: {
        name: "button",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "autofocus",
            "disabled",
            "form",
            "formaction",
            "formenctype",
            "formmethod",
            "formnovalidate",
            "formtarget",
            "name",
            "type",
            "value"
        ],
    },
    select: {
        name: "select",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "autofocus",
            "disabled",
            "form",
            "multiple",
            "name",
            "required",
            "size"
        ],
    },
    optgroup: {
        name: "optgroup",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "disabled",
            "label"
        ],
    },
    option: {
        name: "option",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "disabled",
            "label",
            "selected",
            "value"
        ],
    },
    label: {
        name: "label",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "accesskey",
            "for",
            "form"
        ],
    },
    fieldset: {
        name: "fieldset",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "disabled",
            "form",
            "name"
        ],
    },
    legend: {
        name: "legend",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    datalist: {
        name: "datalist",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    keygen: {
        name: "keygen",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "autofocus",
            "challenge",
            "disabled",
            "form",
            "keytype",
            "name"
        ],
    },
    output: {
        name: "output",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "for",
            "form",
            "name"
        ],
    },
    iframe: {
        name: "iframe",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "allowfullscreen",
            "height",
            "name",
            "sandbox",
            "char",
            "seamless",
            "src",
            "srcdoc",
            "width"
        ],
    },
    img: {
        name: "img",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "alt",
            "crossorigin",
            "height",
            "ismap",
            "src",
            "usemap",
            "width"
        ],
    },
    map: {
        name: "map",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "name"
        ],
    },
    area: {
        name: "area",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "alt",
            "coords",
            "download",
            "href",
            "hreflang",
            "media",
            "rel",
            "shape",
            "type"
        ],
    },
    canvas: {
        name: "canvas",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "height",
            "width"
        ],
    },
    figcaption: {
        name: "figcaption",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    figure: {
        name: "figure",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    picture: {
        name: "picture",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "media",
            "sizes",
            "src",
            "srcset",
            "type"
        ],
    },
    svg: {
        name: "svg",
        props: [
            "baseProfile",
            "contentScriptType",
            "contentStyleType",
            "height",
            "preserveAspectRatio",
            "version",
            "viewbox",
            "width",
            "x",
            "y"
        ],
    },
    audio: {
        name: "audio",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "autoplay",
            "controls",
            "loop",
            "muted",
            "preload",
            "src"
        ],
    },
    source: {
        name: "source",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "media",
            "sizes",
            "src",
            "srcset",
            "type"
        ],
    },
    track: {
        name: "track",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "default",
            "kind",
            "label",
            "src",
            "srclang"
        ],
    },
    video: {
        name: "video",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "autoplay",
            "controls",
            "height",
            "loop",
            "muted",
            "poster",
            "preload",
            "src",
            "width"
        ],
    },
    a: {
        name: "a",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "href",
            "target",
            "rel",
            "download",
            "hreflang",
            "media",
            "ping",
            "referrerpolicy",
            "type"
        ],
    },
    nav: {
        name: "nav",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    ul: {
        name: "ul",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ]
    },
    ol: {
        name: "ol",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "reversed",
            "start",
            "type"
        ],
    },
    li: {
        name: "li",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "type",
            "value"
        ]
    },
    dl: {
        name: "dl",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    dt: {
        name: "dt",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    dd: {
        name: "dd",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    menu: {
        name: "menu",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "label",
            "type"
        ],
    },
    menuitem: {
        name: "menuitem",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "checked",
            "default",
            "disabled",
            "icon",
            "label",
            "radiogroup",
            "type"
        ],
    },
    table: {
        name: "table",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "height"
        ],
    },
    caption: {
        name: "caption",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    th: {
        name: "th",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "colspan",
            "headers",
            "rowspan",
        ],
    },
    tr: {
        name: "tr",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    td: {
        name: "td",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "abbr",
            "colspan",
            "headers",
            "rowspan",
        ],
    },
    thead: {
        name: "thead",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    tbody: {
        name: "tbody",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    tfoot: {
        name: "tfoot",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    col: {
        name: "col",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    colgroup: {
        name: "colgroup",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ],
    },
    div: {
        name: "div",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ]
    },
    span: {
        name: "span",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ]
    },
    header: {
        name: "header",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ]
    },
    footer: {
        name: "footer",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ]
    },
    main: {
        name: "main",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ]
    },
    section: {
        name: "section",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ]
    },
    article: {
        name: "article",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ]
    },
    aside: {
        name: "aside",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ]
    },
    details: {
        name: "details",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "open"
        ]
    },
    dialog: {
        name: "dialog",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "open"
        ]
    },
    data: {
        name: "data",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "value"
        ]
    },
    summary: {
        name: "summary",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ]
    },
    noscript: {
        name: "noscript",
        props: [
            ...GLOBAL_ATTRIBUTES,
        ]
    },
    embed: {
        name: "embed",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "height",
            "pluginspage",
            "src",
            "type",
            "vspace",
            "width"
        ]
    },
    object: {
        name: "object",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "data",
            "form",
            "height",
            "name",
            "type",
            "usemap",
            "width",
            "typemustmatch"
        ]
    },
    param: {
        name: "param",
        props: [
            ...GLOBAL_ATTRIBUTES,
            "name",
            "value"
        ]
    },
};

/**
 * Initialises all native classes and functions.
 * This is a function to run before the compilation.
 */
export function init_native_values(context: Context) {
    /*
    *
    * Native classes
    *
    */
    NATIVE_CLASSES.console = {
        name: "console", // TODO: to test
        properties: [
            {
                name: "log",
                nature: PropertyNature.Method,
                type: Types.FUNCTION,
                status: Visibility.Public,
                static_prop: 0,
                value: {
                    args: [
                        argNode("value", Types.LIST, true)
                    ],
                    /**
                     * Equivalent of `console.log`.
                     */
                    behavior: (exec_ctx) => {
                        const value = exec_ctx.symbol_table!.get('value') as ListValue;
                        let str = "";
                        for (const el of value.elements) {
                            str += el.repr() + " ";
                        }
                        console.log(str); // normal
                        return new RuntimeResult().success(new NoneValue()); // useless to define the position or the context of NoneValue here
                    }
                }
            },
            {
                name: "assert",
                nature: PropertyNature.Method,
                type: Types.FUNCTION,
                status: Visibility.Public,
                static_prop: 0,
                value: {
                    args: [
                        argNode("expression", Types.ANY),
                        argNode("message", Types.ANY, false, true, new StringValue("")),
                        argNode("optionalParams", Types.LIST, true, true, new ListValue([])),
                    ],
                    /**
                     * Equivalent of `console.assert`.
                     */
                    behavior: (exec_ctx, pos_start, pos_end) => {
                        const expression = exec_ctx.symbol_table!.get('expression')!;
                        const message = exec_ctx.symbol_table!.get('message') as StringValue;
                        const optionalParams = exec_ctx.symbol_table!.get('optionalParams') as ListValue;

                        if (is_object(message)) {
                            throw new RuntimeError(
                                pos_start, pos_end,
                                "Invalid Type for argument 'message'",
                                exec_ctx
                            );
                        }

                        console.assert(expression.is_true(), message.equivalent(), ...optionalParams.elements.map(v => v.equivalent()));
                        return new RuntimeResult().success(new NoneValue());
                    }
                }
            }
        ]
    };
    NATIVE_CLASSES.versa = {
        name: "Versa",
        properties: [
            {
                name: "mount",
                nature: PropertyNature.Method,
                type: Types.FUNCTION,
                status: Visibility.Public,
                static_prop: 0,
                value: {
                    args: [
                        argNode("element", Types.HTML),
                    ],
                    /**
                     * Just an empty function that will build the DOM. In the shell, this function won't do a thing.
                     */
                    behavior: () => {
                        console.warn("WARNING: Versa.mount() has no effect outside a browser.");
                        return new RuntimeResult().success(new NoneValue());
                    }
                }
            }
        ]
    };

    /*
    *
    * Native functions
    *
    */

    NATIVE_FUNCTIONS.log = {
        args: [ // all the args
            argNode("value", Types.LIST, true),
        ],
        /**
         * Equivalent of `console.log`.
         * @param exec_ctx The execution context.
         */
        behavior: (exec_ctx) => {
            const value = exec_ctx.symbol_table!.get('value') as ListValue;
            let str = "";
            for (let el of value.elements) {
                str += el.repr() + " ";
            }
            console.log(str); // normal
            return new RuntimeResult().success(new NoneValue());
        }
    };
    NATIVE_FUNCTIONS.len = {
        args: [
            argNode("s", Types.DYNAMIC)
        ],
        /**
         * Equivalent of `len()` in python.
         */
        behavior: (exec_ctx, pos_start, pos_end) => {
            let s = exec_ctx.symbol_table!.get('s');
            let length = 0;
            if (s instanceof StringValue) {
                length = s.value.length;
            } else if (s instanceof ListValue) {
                length = s.elements.length;
            } else if (s instanceof DictionaryValue) {
                length = s.elements.size;
            } else {
                throw new RuntimeError(
                    pos_start, pos_end,
                    "Invalid type of argument for function len()",
                    exec_ctx
                );
            }
            return new RuntimeResult().success(new NumberValue(length));
        }
    };
    NATIVE_FUNCTIONS.exit = {
        /**
         * Exists the entire program
         */
        behavior: () => {
            process.exit();
        }
    };

    /*
    *
    * Put everything in the given context
    *
    */

    for (let i = 0; i < Object.keys(NATIVE_FUNCTIONS).length; ++i) {
        const name = Object.keys(NATIVE_FUNCTIONS)[i];
        context.symbol_table!.set(name, new NativeFunction(name));
    }

    for (let i = 0; i < Object.keys(NATIVE_CLASSES).length; ++i) {
        const native = Object.values(NATIVE_CLASSES)[i];
        const name = native.name;
        const self = new Map(native.properties.map(v => [v.name, {
            status: v.status,
            static_prop: v.static_prop,
            value: new NativePropertyValue( // TODO: before, it was : value: { type: v.type, value: NativePropertyValue } but I had to change it
                v.name,
                v.nature,
                name,
                v.status,
                v.static_prop,
                v.value.behavior,
                v.value.args,
            )
        }]));
        context.symbol_table!.set(name, new NativeClassValue(name, self, null));
    }
}