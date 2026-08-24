const fs = require('fs')
const path = require('path')
const TARGETS = []
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full)
    else if (/\.tsx?$/.test(e.name)) TARGETS.push(full)
  }
}
walk('app/vymc'); walk('components/vymc')

let n = 0
for (const f of TARGETS) {
  let s = fs.readFileSync(f, 'utf-8')
  // Backtick templates: `/api/<modulo>...` → `/api/vymc/<modulo>...`
  const re = /(`\/api\/)(?=weeks|assignments|publishers|scraper\b)/g
  s = s.replace(re, (_, p) => { n++; return p + 'vymc/' })
  fs.writeFileSync(f, s)
}
console.log(`reemplazos en backticks: ${n}`)
