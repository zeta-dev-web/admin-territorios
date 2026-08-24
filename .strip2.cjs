const fs = require('fs')

// week-section-card: import (una línea, cualquier comilla) + bloques JSX
let w = fs.readFileSync('components/vymc/week-section-card.tsx', 'utf-8')
w = w.replace(/^import\s+\{[^}]*ItemAiSuggest[^}]*\}\s*from\s*(['"])[^'"]*\1;?\n/m, '')
w = w.replace(/[ \t]*<ItemAiSuggest[\s\S]*?\/>\n/g, '')
fs.writeFileSync('components/vymc/week-section-card.tsx', w)

// weeks/page: BulkSendDialog
let p = fs.readFileSync('app/vymc/weeks/page.tsx', 'utf-8')
p = p.replace(/^import\s+\{[^}]*BulkSendDialog[^}]*\}\s*from\s*(['"])[^'"]*\1;?\n/m, '')
p = p.replace(/[ \t]*<BulkSendDialog[\s\S]*?\/>\n/g, '')
p = p.replace(/\n\s*bulkSend[A-Za-z]*,?/g, '\n')
p = p.replace(/const \[showBulkSend[\s\S]*?\]\s*=\s*useState[^\n]*\n/g, '')
fs.writeFileSync('app/vymc/weeks/page.tsx', p)
console.log('strips OK')
