import {
  ArrowLeftRight,
  BookOpen,
  Layers,
  Mail,
  Search,
  type LucideIcon,
} from "lucide-react";

/** Single source of truth for primary navigation — used by the desktop header
 * nav and the mobile bottom nav. */
export const NAV_LINKS: ReadonlyArray<{
  href: string;
  label: string;
  icon: LucideIcon;
}> = [
  { href: "/", label: "Chuyển đổi", icon: ArrowLeftRight },
  { href: "/bulk", label: "Hàng loạt", icon: Layers },
  { href: "/tra-cuu", label: "Tra cứu", icon: Search },
  { href: "/blog", label: "Cẩm nang", icon: BookOpen },
  { href: "/lien-he", label: "Liên hệ", icon: Mail },
];

/** Active-state rule shared by both navs: exact match for home, prefix elsewhere. */
export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
