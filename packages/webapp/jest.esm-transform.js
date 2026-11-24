// Jest-only: compile ESM-only dependencies (jose 6) to CommonJS without
// downleveling classes or async functions.
const ts = require('typescript');

module.exports = {
  process(sourceText, sourcePath) {
    const { outputText } = ts.transpileModule(sourceText, {
      fileName: sourcePath,
      compilerOptions: {
        allowJs: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        useDefineForClassFields: true,
      },
    });
    return { code: outputText };
  },
};
