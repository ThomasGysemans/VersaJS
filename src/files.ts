"use strict";

/**
 * The content of each file being read.
 * We want to store the information so that it's accessible easily.
 * It's useful to keep track of what files are being read.
 * It's also useful to display error messages.
 * This array is populated when opening a file.
 * When it's from the shell, this will only store one entry of name "shell".
 */
export const READ_FILES: FileStore = new Map();

/**
 * Returns the content of the a file being interpreted.
 * @param filename The name of the file.
 * @returns The text content of the file, undefined if it's doesn't exist.
 */
export function getFileContent(filename: string): string | undefined {
  return READ_FILES.get(filename);
}