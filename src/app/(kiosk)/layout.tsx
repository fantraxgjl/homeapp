import { KioskShell } from "@/components/layout/KioskShell";

export default function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <KioskShell>{children}</KioskShell>;
}
