"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-neutral-200">
      <div className="h-14 md:h-16 flex items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-3 text-[15px] font-semibold text-neutral-900">
          <span className="inline-block h-4 w-4 rounded-full bg-black" />
          <span>OpenAI API Demo Hub</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/settings">
            <Button aria-label="Settings" variant="ghost" size="icon" className={pathname === '/settings' ? 'bg-neutral-100' : ''}>
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}


