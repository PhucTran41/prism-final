import { LucideIcon, LucideProps, icons } from "lucide-react"

interface IconProps extends LucideProps {
  name: string
}

export function Icon({ name, ...props }: IconProps) {
  const IconComponent = icons[name as keyof typeof icons] as LucideIcon

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in Lucide icons`)
    return null
  }

  return <IconComponent {...props} />
} 