import {
  CalendarDays,
  LayoutDashboard,
  RadioTower,
  Sprout,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

export const mainNavItems: NavItem[] = [
  {
    label: "Today",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Harvest Plan",
    href: "/calendar",
    icon: CalendarDays,
  },
  {
    label: "Crops",
    href: "/crops",
    icon: Sprout,
  },
  {
    label: "Devices & Locations",
    href: "/sensors",
    icon: RadioTower,
  },
  {
    label: "Improvements",
    href: "/learning",
    icon: TrendingUp,
  },
]
