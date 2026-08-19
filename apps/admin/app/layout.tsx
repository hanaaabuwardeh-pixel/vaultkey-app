import type { Metadata } from 'next';
import './styles.css';

export const metadata: Metadata = { title: 'VaultKey Admin', description: 'VaultKey review and operations portal' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
