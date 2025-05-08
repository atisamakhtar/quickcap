
'use client';

import Link from 'next/link';
import { Twitter, Linkedin, Github, Instagram, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'; // Added SheetTitle
import { useIsMobile } from '@/hooks/use-mobile';

const socialLinks = [
  { href: 'https://twitter.com/yourprofile', icon: Twitter, label: 'Twitter' },
  { href: 'https://linkedin.com/in/yourprofile', icon: Linkedin, label: 'LinkedIn' },
  { href: 'https://github.com/yourprofile', icon: Github, label: 'GitHub' },
  { href: 'https://instagram.com/yourprofile', icon: Instagram, label: 'Instagram' },
];

const NavLinks = ({ onClick }: { onClick?: () => void }) => (
  <>
    {socialLinks.map((link) => (
      <Link
        key={link.label}
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground hover:text-primary transition-colors p-2 sm:p-0"
        aria-label={`Visit our ${link.label} page`}
        onClick={onClick}
      >
        <link.icon className="h-5 w-5 sm:h-6 sm:w-6" />
      </Link>
    ))}
  </>
);

export default function Header() {
  const isMobile = useIsMobile();
  const [isClient, setIsClient] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);


  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Render a placeholder or null on the server to avoid hydration mismatch
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
                 <Link href="/" className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-primary">QuikCap</span>
                </Link>
                <div className="h-6 w-24 rounded-md bg-muted animate-pulse sm:hidden"></div>
                <div className="hidden sm:flex items-center space-x-4">
                    <div className="h-6 w-6 rounded-full bg-muted animate-pulse"></div>
                    <div className="h-6 w-6 rounded-full bg-muted animate-pulse"></div>
                    <div className="h-6 w-6 rounded-full bg-muted animate-pulse"></div>
                    <div className="h-6 w-6 rounded-full bg-muted animate-pulse"></div>
                </div>
            </div>
        </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2">
          {/* You can replace this with an SVG logo if you have one */}
          {/* <img src="/logo.svg" alt="QuikCap Logo" className="h-8 w-auto" /> */}
          <span className="text-2xl font-bold text-primary">QuikCap</span>
        </Link>

        {isMobile ? (
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[240px] p-6">
              <SheetTitle className="sr-only">Menu</SheetTitle> {/* Added for accessibility */}
              <div className="flex flex-col space-y-4">
                <Link href="/" className="mb-4" onClick={() => setIsSheetOpen(false)}>
                  <span className="text-xl font-bold text-primary">QuikCap</span>
                </Link>
                <NavLinks onClick={() => setIsSheetOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <nav className="hidden sm:flex items-center space-x-3 md:space-x-4">
            <NavLinks />
          </nav>
        )}
      </div>
    </header>
  );
}
