const fs = require('fs')
for (const f of ['app/vymc/page.tsx', 'components/vymc/import-week-dialog.tsx', 'components/vymc/weeks-table.tsx']) {
  let s = fs.readFileSync(f, 'utf-8').replace(/\r\n/g, '\n')
  s = s.split('`/dashboard/weeks/').join('`/vymc/weeks/')
  fs.writeFileSync(f, s)
}
console.log('backticks corregidos')
