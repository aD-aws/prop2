import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { validateAwsConfig } from '@/lib/config/aws';
import { AuthProvider } from '@/components/auth/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'UK Home Improvement Platform',
  description: 'Streamline your home improvement projects with AI-powered planning and builder connections',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Validate AWS configuration on app start
  if (typeof window === 'undefined') {
    validateAwsConfig();
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}