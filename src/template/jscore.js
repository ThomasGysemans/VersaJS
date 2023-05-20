"use strict";

// This file is the core of the JavaScript equivalent of VersaJS,
// which makes it possible to translate the functionalities of VersaJS into JavaScript as faithfully as possible

;(function(){
    class Versa {
        static CUSTOM_ELEMENTS = {}; // contains the custom tags because we need to make the difference between "div" and "Counter"
        static MOUNTED = false; // We cannot use `Versa.mount()` multiple times
        static TYPES = {
            any: "any",
            dynamic: "dynamic",
            number: "number",
            string: "string",
            list: "list",
            dict: "dict",
            object: "object",
            boolean: "boolean",
            func: "function",
            html: "html",
            tag: "tag"
        }

        /**
         * Internal concatenation in VersaJS. Indeed, ';' is allowed: `${firstname; lastname}`
         * @param {[*]} arr
         * @returns {string}
         */
        static concatenate(arr) {
            return arr.join();
        }

        /**
         * Performs the condition statement in a for-loop in order to imitate as faithfully as possible the behavior of VersaJS.
         * @param {number} i
         * @param {number} step_value
         * @param {number} end_value
         */
        static forcond(i, step_value, end_value) {
            return step_value >= 0 ? (i < end_value) : (i > end_value);
        }

        /**
         * Performs the incrementation/decrementation in a for-loop
         * @param {number} step_value
         * @param {number} start_value
         * @param {number} end_value
         * @returns {number}
         */
        static forinc(step_value, start_value, end_value) {
            if (step_value) {
                return step_value;
            } else {
                return start_value < end_value ? 1 : -1;
            }
        }

        /**
         * Imitates the foreach-loop of VersaJS
         * @param {[*]|{}} variable
         * @param {(i: number) => any} callback
         */
        static foreach(variable, callback) {
            let len = Array.isArray(variable) ? variable.length : Object.keys(variable).length;
            let $list = [];
            for (let i = 0; i < len; i++) {
                $list.push(callback(i));
            }
            return $list;
        }

        static del(callback) {
            callback();
        }

        static gettype(variable) {
            // todo: don't forget to add the check for a tag or an html element
            if (variable === undefined || variable === null) {
                return Versa.TYPES.any;
            }

            if (Array.isArray(variable)) {
                return Versa.TYPES.list;
            } else if (typeof variable === "object") {
                if (variable.constructor.name !== "Object") {
                    return variable.constructor.name;
                } else {
                    let values = Object.values(variable);
                    if (values.length > 0 ){
                        let expected_values_for_enum = (() => {
                            let list = [];
                            for (let i = 0; i < values.length; i++) {
                                list.push(i);
                            }
                            return list;
                        })();
                        // Indeed, the values of an enum should be a list increasing from 0 to its length
                        if (Versa.array_equals(values, expected_values_for_enum)) {
                            return Versa.TYPES.object;
                        } else {
                            return Versa.TYPES.dict;
                        }
                    } else {
                        return Versa.TYPES.dict; // mismatch when an enum is empty ;(
                    }
                }
            } else if (typeof variable === "number") {
                return Versa.TYPES.number;
            } else if (typeof variable === "string") {
                return Versa.TYPES.string;
            } else if (typeof variable === "function") {
                try {
                    let _ = new variable(); // make the distinction between a class and a function
                    return variable.name;
                } catch(e) {
                    return Versa.TYPES.func;
                }
            } else if (typeof variable === "boolean") {
                return Versa.TYPES.boolean;
            } else {
                return Versa.TYPES.dynamic;
            }
        }

        /**
         * Checks if two arrays are equal.
         * @param {Array} a
         * @param {Array} b
         * @returns {boolean}
         */
        static array_equals(a, b) {
            // if the other array is a falsy value, return
            if (!b)
                return false;

            // compare lengths - can save a lot of time
            if (a.length !== b.length)
                return false;

            for (let i = 0, l=a.length; i < l; i++) {
                // Check if we have nested arrays
                if (Array.isArray(a[i]) && Array.isArray(b[i])) {
                    // recurse into the nested arrays
                    if (!Versa.array_equals(a[i], b[i]))
                        return false;
                } else if (Versa.gettype(a[i]) === Versa.TYPES.dict && Versa.gettype(b[i]) === Versa.TYPES.dict) {
                    if (!Versa.dictionnary_equals(a[i], b[i])) {
                        return false;
                    }
                } else if (a[i] !== b[i]) {
                    // Warning - two different object instances will never be equal: {x:20} != {x:20}
                    return false;
                }
            }
            return true;
        }

        static dictionnary_equals(a, b) {
            const keys_a = Object.keys(a);
            const keys_b = Object.keys(b);
            const values_a = Object.values(a);
            const values_b = Object.values(b);

            if (keys_a.length !== keys_b.length) {
                return false;
            }

            for (let i = 0; i < keys_a.length; i++) {
                if (keys_a[i] !== keys_b[i]) {
                    return false;
                }
                if (values_a[i] !== values_b[i]) {
                    return false;
                }
            }

            return true;
        }

        /**
         * Checks if the value is in the list.
         * @param {string} value The value.
         * @param {Array|string} list The list.
         */
        static is_in(value, list) {
            if (typeof list === "string") {
                list = Array.from(list);
            }

            for (let list_value of list) {
                if (list_value === value) {
                    return true;
                }
            }

            return false;
        }

        static equality(a, b) {
            const type_a = Versa.gettype(a);
            const type_b = Versa.gettype(b);
            if (a === null && b === 0) {
                return true;
            } else if (a === 0 && b === null) {
                return true;
            } else if (type_a === Versa.TYPES.list && type_b === Versa.TYPES.list) {
                return Versa.array_equals(a, b);
            } else if (type_a === Versa.TYPES.dict && type_b === Versa.TYPES.dict) {
                return Versa.dictionnary_equals(a, b);
            } else {
                return a == b;
            }
        }

        static inequality(a, b) {
            return !Versa.equality(a, b);
        }

        static add(a, b) {
            if (a === null && typeof b === "string") {
                return b;
            } else if (typeof a === "string" && b === null) {
                return a;
            } else if (Array.isArray(a) || Array.isArray(b)) {
                let isa = Array.isArray(a);
                let isb = Array.isArray(b);
                if (isa && isb) {
                    return [...a, ...b];
                } else {
                    if (isa) {
                        return [...a, b];
                    } else {
                        return [a, ...b];
                    }
                }
            } else if (Versa.gettype(a) === Versa.TYPES.dict && Versa.gettype(b) === Versa.TYPES.dict) {
                return {...a, ...b};
            } else if (typeof a === "string" && typeof b === "boolean") {
                return a + (b === true ? '1' : '0');
            } else if (typeof a === "boolean" && typeof b === "string") {
                return (a === true ? '1' : '0') + b;
            } else {
                return a + b;
            }
        }

        static mul(a, b) {
            if (typeof a === "string" && typeof b === "number") {
                return a.repeat(b);
            } else if (typeof a === "number" && typeof b === "string") {
                return b.repeat(a);
            } else if (Array.isArray(a) && typeof b === "number") {
                let new_arr = [];
                for (let i = 0; i < b; i++) {
                    new_arr.push(...a);
                }
                return new_arr;
            } else if (typeof a === "number" && Array.isArray(b)) {
                let new_arr = [];
                for (let i = 0; i < a; i++) {
                    new_arr.push(...b);
                }
                return new_arr;
            } else {
                return a * b;
            }
        }

        /**
         * Checks whether a variable `a` is >, <, >= or <= than another variable `b`.
         * @param {*} a
         * @param {*} b
         * @param {string} type
         * @returns {boolean}
         * @private
         */
        static _szcond(a, b, type) {
            const compare = (value_a, value_b) => {
                switch (type) {
                    case "lt":
                        return value_a < value_b;

                    case "gt":
                        return value_a > value_b;

                    case "lte":
                        return value_a <= value_b;

                    case "gte":
                        return value_a >= value_b;

                    default:
                        throw new Error(`Unable to parse this kind of condition: "${type}"`)
                }
            };
            const isa_arr = Array.isArray(a);
            const isb_arr = Array.isArray(b);
            const isa_dic = Versa.gettype(a) === Versa.TYPES.dict;
            const isb_dic = Versa.gettype(b) === Versa.TYPES.dict;
            if (isa_arr && isb_arr) {
                return compare(a.length, b.length);
            } else if ((isa_arr || isb_arr) &&
                (typeof a === "number" || typeof b === "number")) { // is one of them a list and the other a number?
                if (isa_arr) {
                    return compare(a.length, b);
                } else {
                    return compare(a, b.length);
                }
            } else if (typeof a === "string" && typeof b === "string") {
                return compare(a.length, b.length);
            } else if ((typeof a === "string" || typeof b === "string") && (typeof a === "number" || typeof b === "number")) { // is one of them a string and the other a number?
                if (typeof a === "string") {
                    return compare(a.length, b);
                } else {
                    return compare(a, b.length);
                }
            } else if (isa_dic && isb_dic) {
                return compare(Object.keys(a).length, Object.keys(b).length);
            } else if ((isa_dic || isb_dic) && (typeof a === "number" || typeof b === "number")) {
                if (isa_dic) {
                    return compare(Object.keys(a).length, b);
                } else {
                    return compare(a, Object.keys(b).length);
                }
            } else {
                return compare(a, b);
            }
        }

        static lt(a, b) {
            return Versa._szcond(a, b, "lt");
        }

        static gt(a, b) {
            return Versa._szcond(a, b, "gt");
        }

        static lte(a, b) {
            return Versa._szcond(a, b, "lte");
        }

        static gte(a, b) {
            return Versa._szcond(a, b, "gte");
        }

        static is_true(a) {
            if (a === true || a === false) return a;
            const type = Versa.gettype(a);
            switch (type) {
                case Versa.TYPES.number:
                    return a !== 0

                case Versa.TYPES.list:
                    return a.length > 0

                case Versa.TYPES.dict:
                    return Object.keys(a).length > 0

                case Versa.TYPES.string:
                    return a.length > 0

                case Versa.TYPES.boolean:
                    return a === true

                case Versa.TYPES.func:
                    return true

                case Versa.TYPES.object:
                    return true

                case Versa.TYPES.any: case Versa.TYPES.dynamic:
                    return a !== null

                case Versa.TYPES.html: case Versa.TYPES.tag:
                    return true

                default:
                    return true // because in VersaJS `if aClass` is true
            }
        }

        static not(a) {
            return !Versa.is_true(a);
        }

        /**
         * Examines the differences between an element in the DOM and the new element that has been rendered.
         * @param {HTMLElement} current_element
         * @param {HTMLElement} new_element
         */
        static diff(current_element, new_element) {
            // The root element is different, therefore an entire rebuild is necessary
            if (current_element.tagName !== new_element.tagName) {
                current_element.replaceWith(new_element);
            } else {
                // now we focus on the attributes
                for (let attr of new_element.getAttributeNames()) {
                    const value_on_new = new_element.getAttribute(attr);
                    if (!current_element.hasAttribute(attr)) {
                        current_element.setAttribute(attr, value_on_new);
                    } else if (current_element.getAttribute(attr) !== value_on_new) {
                        current_element.setAttribute(attr, value_on_new);
                    }
                }

                // Versa recurses on the children
                for (let i = 0; i < current_element.children.length; i++) {
                    Versa.diff(current_element.children[i], new_element.children[i]);
                }

                // In order not to forget any node, we must add the nodes that didn't exist in the DOM,
                // and remove the children that don't exist anymore.
                if (current_element.children.length < new_element.children.length) {
                    for (let i = current_element.children.length; i < new_element.children.length; i++) {
                        current_element.parentElement.appendChild(new_element.children[i]);
                    }
                }
                if (current_element.children.length > new_element.children.length) {
                    for (let i = new_element.children.length; i < current_element.children.length; i++) {
                        current_element.parentElement.removeChild(current_element.children[i]);
                    }
                }

                // for (let i = 0; i < current_element.children.length; i++) {
                //     const current_child = current_element.children[i];
                //     const new_child = new_element.children[i];
                //     if (!new_child) break;
                //     if (!current_child.isEqualNode(new_child)) {
                //         current_child.replaceWith(new_child);
                //     }
                // }
            }
        }

        /**
         * Generates a random key for an HTML element.
         * @param {string} tagname
         * @returns {string}
         */
        static generate_random_key(tagname) {
            // [min; max[
            const getRandomInt = (min, max) => {
                min = Math.ceil(min);
                max = Math.floor(max);
                return Math.floor(Math.random() * (max - min)) + min;
            }

            let random = "";
            const alph = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            for (let i = 0; i < 9; i++) {
                let index = getRandomInt(0, alph.length);
                random += alph.charAt(index);
            }

            return tagname + "_" + random;
        }

        /**
         * Creates a native HTML element.
         * @param {string} tagname
         * @param {string[]} classes
         * @param {string} id
         * @param {[string, any][]} attributes
         * @param {[string, *][]} events
         * @param {any[]} children
         * @returns {HTMLElement}
         */
        static renderNativeElement(tagname, classes, id, attributes, events, children) {
            const element = document.createElement(tagname.toLowerCase());
            if (id.length > 0) {
                element.setAttribute("id", id);
            }
            classes.forEach((clas) => {
                if (!element.classList.contains(clas)) {
                    element.classList.add(clas);
                }
            });
            attributes.forEach((attribute) => {
                let attr_name = attribute[0];
                let attr_value = attribute[1];
                element.setAttribute(attr_name, attr_value);
            });
            events.forEach((event) => {
                let evt_name = event[0];
                let evt_function = event[1];
                element.addEventListener(evt_name, evt_function);
            });
            children.forEach((child) => {
                if (child instanceof Element) {
                    element.appendChild(child);
                } else {
                    element.textContent = child.toString();
                }
            });
            return element;
        }

        /**
         * Creates an HTML element.
         * @param {string} tagname
         * @param {string[]} classes
         * @param {string} id
         * @param {[string, any][]} attributes
         * @param {[string, *][]} events
         * @param {HTMLElement[]|string[]} children
         * @returns {HTMLElement}
         */
        static html(tagname, classes, id, attributes, events, children) {
            // todo: the user should be able to write his own key

            let el;
            const key = Versa.generate_random_key(tagname);
            if (Versa.CUSTOM_ELEMENTS[tagname]) {
                const customElement = new (Versa.CUSTOM_ELEMENTS[tagname])();
                customElement.props = attributes.reduce((previous, current) => ({...previous, [current[0]]: current[1]}), {});

                el = customElement.render();
                // we override the element's key
                el.setAttribute("data-key", key);

                // we give the reference of this custom element to the class
                // for future rebuilds (setState())
                // todo: might create problems, check if a custom element can bu reused several times across the app
                customElement.ref = key;
                console.group(tagname);
                console.log("its children are :", el.children);
                console.log("customElement =", customElement);
                console.log("its key =", key);
                console.log("the generated element from render() :", el);
                console.groupEnd();
            } else {
                el = Versa.renderNativeElement(tagname, classes, id, attributes, events, children);
            }

            return el;
        }

        /**
         * Creates the DOM
         * @param {HTMLElement} mainElement
         */
        static mount(mainElement) {
            if (Versa.MOUNTED) {
                throw new Error("Cannot mount the page multiple times.");
            } else {
                // In the JavaScript translation, mount() will always have `.html()` as argument,
                // which returns an HTML element that will contain the entire architecture
                const APP = document.querySelector("#APP");
                APP.appendChild(mainElement);
                Versa.MOUNTED = true;
                console.log("mounted");
            }
        }
    }

    class VersaHTMLElement {
        constructor(name) {
            this.name = name;
            this.state = {};
            this.props = {};
            this.ref = null; // the reference, the connection, between this Element and the real Element in the DOM
        }

        getProperty(name) {
            return (this.state[name] ?? this.props[name]) ?? this[name].bind(this);
        }

        /**
         * Rebuild the element according to new data.
         * @param {{string?:any}} new_data
         */
        setState(new_data) {
            // we need to change the data first:
            this.state = {...this.state, ...new_data};
            // now we get the key according to the reference (`this.ref`)
            // note: `this.ref` cannot be null.
            // With this key we'll be able to get the element in the real DOM
            // in order to replace it by the new render(),
            if (this.ref === null) {
                throw new Error("Attempt to rebuild a custom element that doesn't exist.");
            }
            const current_element = document.querySelector(`[data-key='${this.ref}']`);
            if (!current_element) {
                throw new Error("Attempt to rebuild a custom element that doesn't exist.");
            }
            const new_element = this.render();
            // to be able to find the element again
            new_element.setAttribute("data-key", this.ref);
            // we want to check if there are differences between the current element and the new one.
            // The differences in the DOM will be replaced by the new values.
            // We do not want to just override the entire element, but to modify what's been changed.
            Versa.diff(current_element, new_element);
            // we check if there is more or less children in the new element than in the current one
            // if there are not enough children in the current one, we add them
            // if there are too many children in the current one, we remove them
            const parent_of_current_element = current_element.parentElement;
            if (current_element.children.length < new_element.children.length) {
                for (let i = current_element.children.length; i < new_element.children.length; i++) {
                    parent_of_current_element.appendChild(new_element.children[i]);
                }
            }
            if (current_element.children.length > new_element.children.length) {
                for (let i = new_element.children.length; i < current_element.children.length; i++) {
                    parent_of_current_element.removeChild(current_element.children[i]);
                }
            }
        }

        render() {
            // todo: throw error (maybe it should return an error in the interpreter)
            throw new Error("Unimplemented render method.");
        }
    }

    try {
        window.Versa = Versa;
        window.VersaHTMLElement = VersaHTMLElement;
    } catch(e) {
        return Versa;
    }
})();