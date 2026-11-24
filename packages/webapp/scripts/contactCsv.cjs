'use strict';
/**
 * One CSV cell for the contact export. Cells that a spreadsheet would read as a
 * formula (leading = + - @, tab or carriage return) get a leading ' so they stay
 * literal text; then the cell is quoted with embedded quotes doubled.
 */
function csvCell(value) {
  const text = String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

module.exports = { csvCell };
