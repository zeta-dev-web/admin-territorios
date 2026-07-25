import { TermsGuard } from '@/components/auth/TermsGuard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <TermsGuard>{children}</TermsGuard>
}
