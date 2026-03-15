"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConnectWallet } from "@/components/connect-wallet";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const pathname = usePathname();
  const { session } = useAuth();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "Claims", href: "/claims" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#050505]/85 border-b border-[rgba(255,255,255,0.06)]">
      <div className="max-w-[1140px] mx-auto px-5 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-base font-bold text-white font-heading tracking-tight">
            AgentCover
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[14px] transition-colors ${
                    isActive ? "text-[#b5f542]" : "text-[#d4d4d8] hover:text-white"
                  } font-mono`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ConnectWallet />
        </div>
      </div>
    </nav>
  );
}
