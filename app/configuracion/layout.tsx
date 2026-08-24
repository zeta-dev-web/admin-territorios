import { TermsGuard } from '@/components/auth/TermsGuard'

export default function ConfiguracionLayout({ children }: { children: React.ReactNode }) {
  return <TermsGuard>{children}</TermsGuard>
}
