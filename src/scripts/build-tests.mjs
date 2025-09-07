import fs from 'node:fs'
import path from 'node:path'
import * as core from '../../target/esm/core.mjs'
import * as index from '../../target/esm/index.mjs'

// prettier-ignore
const modules = [
  ['core', core],
  ['index', index],
]
const root = path.resolve(new URL(import.meta.url).pathname, '../../..')
const filePath = path.resolve(root, `src/test/js/export.test.js`)

let head = `import assert from 'node:assert'
import { test, describe } from 'vitest'`
let body = '\n'

for (const [name, ref, apis = Object.keys(ref).sort()] of modules) {
  head += `\nimport * as ${name} from '../../../target/esm/${name}.mjs'`
  body += `\n//prettier-ignore\ndescribe('${name}', () => {\n`
  body += `  test('exports', () => {\n`
  for (const r of apis) {
    const api = ref[r]
    body += `    assert.equal(typeof ${name}.${r}, '${typeof api}', '${name}.${r}')\n`
    if (typeof api !== 'function' && typeof api !== 'object') continue
    for (const k of Object.keys(api).sort()) {
      const v = api[k]
      body += `    assert.equal(typeof ${name}.${r}.${k}, '${typeof v}', '${name}.${r}.${k}')\n`
    }
  }
  body += '  })\n'
  body += '})\n'
}

const contents = head + body

fs.writeFileSync(filePath, contents)
