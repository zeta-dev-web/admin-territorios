import { TermsGuard } from '@/components/auth/TermsGuard'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <TermsGuard>{children}</TermsGuard>
}
