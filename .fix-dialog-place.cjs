const fs = require('fs')
const f = 'app/vymc/weeks/[id]/page.tsx'
let s = fs.readFileSync(f, 'utf-8')

// 1) Quitar el bloque mal ubicado dentro del spinner de carga
const misplaced = `
      <WhatsAppShareDialog
        isOpen={isWhatsAppDialogOpen}
        onClose={() => setIsWhatsAppDialogOpen(false)}
        data={whatsAppShareData}
        onPhoneUpdated={handlePhoneUpdated}
      />
`
if (!s.includes(misplaced)) { console.error('bloque mal ubicado no encontrado'); process.exit(1) }
s = s.replace(misplaced, '\n')

// 2) Insertarlo dentro del return principal, tras el SpecialAssignmentDialog
const anchor = /(<SpecialAssignmentDialog[\s\S]*?\/>)(\n\s*<\/div>)/
if (!anchor.test(s)) { console.error('ancla del return principal no encontrada'); process.exit(1) }
s = s.replace(anchor,
  `$1

      <WhatsAppShareDialog
        isOpen={isWhatsAppDialogOpen}
        onClose={() => setIsWhatsAppDialogOpen(false)}
        data={whatsAppShareData}
        onPhoneUpdated={handlePhoneUpdated}
      />
$2`)

fs.writeFileSync(f, s)
console.log('diálogo recolocado en el return principal')
