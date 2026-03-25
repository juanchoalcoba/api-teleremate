/**
 * getAccentInsensitiveRegex
 * 
 * Transforms a search string into a regex pattern that matches accented and unaccented 
 * versions of vowels. Example: "camara" matches "cámara".
 * 
 * @param {string} text - The raw search text
 * @returns {string} - The regex-ready pattern string
 */
const getAccentInsensitiveRegex = (text) => {
  if (!text || typeof text !== "string") return "";

  // 1. Escape basic regex special characters
  let pattern = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 2. Normalize NFD to separate characters from their accents, 
  // then remove the accent marks (diacritics).
  const normalized = pattern.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 3. Map each vowel to a character class containing all its accented variants
  return normalized
    .replace(/a/gi, '[aáàâä]')
    .replace(/e/gi, '[eéèêë]')
    .replace(/i/gi, '[iíìîï]')
    .replace(/o/gi, '[oóòôö]')
    .replace(/u/gi, '[uúùûü]');
};

module.exports = { getAccentInsensitiveRegex };
