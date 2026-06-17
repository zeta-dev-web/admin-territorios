import { ReactNode } from 'react'

interface TableProps {
  children: ReactNode
  minWidth?: string
}

/**
 * Componente de tabla genérico con scroll horizontal.
 * Añade overflow-x-auto y un min-width para que en mobile
 * la tabla se pueda desplazar horizontalmente.
 */
export function Table({ children, minWidth = '700px' }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ minWidth }}>
        {children}
      </table>
    </div>
  )
}
