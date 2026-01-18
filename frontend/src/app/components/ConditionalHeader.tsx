'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';

export function ConditionalHeader() {
  const pathname = usePathname();
  
  // Don't show the old Header on the landing page (it has its own Navigation)
  if (pathname === '/') {
    return null;
  }
  
  return <Header />;
}
