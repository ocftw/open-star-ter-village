const { csvCell } = require('./contactCsv.cjs') as { csvCell: (value: string) => string };

test('neutralises spreadsheet formula prefixes before quoting contact cells', () => {
  expect(csvCell('=1+1@evil.example')).toBe(`"'=1+1@evil.example"`);
  expect(csvCell('+886@example.com')).toBe(`"'+886@example.com"`);
  expect(csvCell('-x@example.com')).toBe(`"'-x@example.com"`);
  expect(csvCell('@x.example')).toBe(`"'@x.example"`);
  expect(csvCell('\tx@example.com')).toBe(`"'\tx@example.com"`);
  expect(csvCell('\rx@example.com')).toBe(`"'\rx@example.com"`);
  expect(csvCell('a"b@example.com')).toBe('"a""b@example.com"');
  expect(csvCell('member@example.com')).toBe('"member@example.com"');
});
