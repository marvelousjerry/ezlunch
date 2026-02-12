import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'EzLunch',
  description: '오늘 점심 뭐 먹지?',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen pb-20 md:pb-0">
        <Header />
        <main className="pt-24 px-4 max-w-5xl mx-auto min-h-screen animate-enter">
          {children}
        </main>
      </body>
    </html>
  );
}
