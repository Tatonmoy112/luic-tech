const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const roots = ['packages/platform/src', 'apps/commerce-api/src', 'apps/commerce-worker/src'];
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : file.endsWith('.ts') ? [file] : [];
  });
}
const files = roots.flatMap(dir => walk(path.join(root, dir)));
const graph = new Map(files.map(file => [file, []]));
const errors = [];
for (const file of files) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  function inspect(node) {
    let specifier;
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      specifier = node.moduleSpecifier.text;
    } else if (ts.isCallExpression(node) && node.arguments.length &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
       (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
      specifier = ts.isStringLiteral(node.arguments[0]) ? node.arguments[0].text : undefined;
      if (!specifier) errors.push('Nonliteral module load in ' + file);
    }
    if (specifier) {
      let resolved;
      if (specifier === '@luic/platform') resolved = path.join(root, 'packages/platform/src/index.ts');
      else if (specifier === '@luic/platform/configuration') resolved = path.join(root, 'packages/platform/src/configuration.ts');
      else if (specifier === '@luic/platform/lifecycle') resolved = path.join(root, 'packages/platform/src/lifecycle.ts');
      else if (specifier.startsWith('.')) {
        const candidate = path.resolve(path.dirname(file), specifier);
        resolved = [candidate + '.ts', path.join(candidate, 'index.ts')].find(f => fs.existsSync(f));
        if (!resolved) errors.push('Unresolved local import in ' + file);
      } else if (specifier.startsWith('@luic/')) errors.push('Undeclared workspace boundary in ' + file);
      if (resolved) {
        const owner = roots.find(dir => file.startsWith(path.join(root, dir) + path.sep));
        const target = roots.find(dir => resolved.startsWith(path.join(root, dir) + path.sep));
        if (!target || (target !== owner && target !== 'packages/platform/src')) {
          errors.push('Cross-application or outward platform import in ' + file);
        }
        graph.get(file).push(resolved);
      }
    }
    ts.forEachChild(node, inspect);
  }
  inspect(source);
}
const active = new Set();
const visited = new Set();
function visit(file) {
  if (active.has(file)) { errors.push('Module cycle at ' + file); return; }
  if (visited.has(file)) return;
  active.add(file);
  for (const target of graph.get(file) || []) visit(target);
  active.delete(file);
  visited.add(file);
}
files.forEach(visit);
if (errors.length) {
  process.stderr.write(errors.join('\n') + '\n');
  process.exitCode = 1;
} else {
  process.stdout.write('Module boundaries and acyclic imports verified: ' + files.length + ' source files.\n');
}
