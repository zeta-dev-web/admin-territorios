import Image from 'next/image'

interface BrandMarkProps {
  size?: number
  className?: string
  priority?: boolean
  decorative?: boolean
}

export function BrandMark({
  size = 48,
  className,
  priority = false,
  decorative = true,
}: BrandMarkProps) {
  return (
    <Image
      src="/brand/territorios-app-mark.svg"
      width={size}
      height={size}
      alt={decorative ? '' : 'Territorios App'}
      className={className}
      priority={priority}
    />
  )
}
