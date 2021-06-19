/**
 * Checks if the value is in the list.
 * @param {string} value The value.
 * @param {Array|string} list The list.
 */
export function is_in(value, list) {
    if (typeof list === "string") {
        list = Array.from(list);
    }

    for (let list_value of list) {
        if (list_value == value) {
            return true;
        }
    }

    return false;
}