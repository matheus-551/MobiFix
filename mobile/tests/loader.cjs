const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
// Executa os serviços TypeScript reais com dependências externas controladas.
exports.carregar = (entrada, mocks = {}, globais = {}) => {
  const cache = new Map();
  function carregar(arquivo) {
    if (cache.has(arquivo)) return cache.get(arquivo).exports;
    const modulo = { exports: {} }; cache.set(arquivo, modulo);
    const codigo = ts.transpileModule(fs.readFileSync(arquivo, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const importar = nome => {
      if (Object.hasOwn(mocks, nome)) return mocks[nome];
      return nome.startsWith('.') ? carregar(path.resolve(path.dirname(arquivo), `${nome}.ts`)) : require(nome);
    };
    vm.runInNewContext(codigo, { exports: modulo.exports, module: modulo, require: importar,
      process: { env: { EXPO_PUBLIC_API_URL: 'http://api.test/api/v1' } },
      AbortController, setTimeout, clearTimeout, console, ...globais }, { filename: arquivo });
    return modulo.exports;
  }
  return carregar(path.resolve(__dirname, '..', entrada));
};
