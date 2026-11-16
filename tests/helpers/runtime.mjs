import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { posix } from 'node:path';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import ts from 'typescript';
const nodeRequire = createRequire(import.meta.url);
export function loadModule(path, mocks = {}, globals = {}, cache = new Map()) {
  if (cache.has(path)) return cache.get(path);
  const source = readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8').replaceAll('import.meta.env', '({})');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } });
  const exports = {};
  cache.set(path, exports);
  const context = vm.createContext({
    exports, console, URL, URLSearchParams, TextDecoder, TextEncoder, Request, Response, Headers,
    crypto: webcrypto, structuredClone, setTimeout, clearTimeout, setInterval, clearInterval,
    require(name) {
      if (name in mocks) return mocks[name];
      if (name.startsWith('.')) {
        const base = posix.join(posix.dirname(path), name);
        return loadModule(existsSync(new URL(`../../${base}.ts`, import.meta.url)) ? `${base}.ts` : `${base}/index.ts`, mocks, globals, cache);
      }
      return nodeRequire(name);
    },
    ...globals,
  });
  vm.runInContext(outputText, context, { filename: path });
  return exports;
}

export function memoryStorage(initial = new Map()) {
  let data = structuredClone(initial);
  let queue = Promise.resolve();
  const store = (getData) => ({
    async get(key) { return structuredClone(getData().get(key)); },
    async put(key, value) {
      if (api.failWrites) throw new Error('Storage unavailable');
      if (typeof key === 'string') getData().set(key, structuredClone(value));
      else for (const [id, item] of Object.entries(key)) getData().set(id, structuredClone(item));
    },
    async delete(key) { return getData().delete(key); },
    async list({ prefix = '', reverse = false, limit = 1000, startAfter } = {}) {
      let entries = [...getData()].filter(([key]) => key.startsWith(prefix)).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
      if (reverse) entries.reverse();
      if (startAfter) entries = entries.filter(([key]) => reverse ? key < startAfter : key > startAfter);
      return structuredClone(new Map(entries.slice(0, limit)));
    },
  });
  const api = {
    ...store(() => data), failWrites: false, snapshot: () => structuredClone(data),
    async transaction(callback) {
      const previous = queue;
      let release;
      queue = new Promise((resolve) => { release = resolve; });
      await previous;
      const draft = structuredClone(data);
      try { const result = await callback(store(() => draft)); data = draft; return result; }
      finally { release(); }
    },
  };
  return api;
}
