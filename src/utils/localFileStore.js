// src/utils/localFileStore.js

import { set, get, del } from 'idb-keyval';

// We create a unique "store" for our files so it doesn't clash with other data.
const fileStore = 'local-personal-note-files';

/**
 * Saves a file to IndexedDB.
 * @param {File} file The file object to save.
 * @returns {Promise<string>} A unique ID for the saved file.
 */
export const saveFileLocally = async (file) => {
  const fileId = `file_${Date.now()}_${file.name}`;
  await set(fileId, file, fileStore);
  return fileId;
};

/**
 * Retrieves a file from IndexedDB.
 * @param {string} fileId The unique ID of the file.
 * @returns {Promise<File|undefined>} The file object, or undefined if not found.
 */
export const getFileLocally = async (fileId) => {
  return await get(fileId, fileStore);
};

/**
 * Deletes a file from IndexedDB.
 * @param {string} fileId The unique ID of the file.
 */
export const deleteFileLocally = async (fileId) => {
  await del(fileId, fileStore);
};

/**
 * Creates a temporary URL that can be used to display a file in the browser.
 * @param {File} file The file object.
 * @returns {string} A temporary blob URL (e.g., "blob:http://localhost:3000/...")
 */
export const createFileUrl = (file) => {
  return URL.createObjectURL(file);
};