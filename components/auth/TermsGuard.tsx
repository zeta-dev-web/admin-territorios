import { hasAcceptedTerms } from '@/server/auth'
import { TermsModal } from './TermsModal'

export async function TermsGuard({ children }: { children: React.ReactNode }) {
  const accepted = await hasAcceptedTerms()

  if (!accepted) {
    return (
      <>
        {children}
        <TermsModal />
      </>
    )
  }

  return <>{children}</>
}
