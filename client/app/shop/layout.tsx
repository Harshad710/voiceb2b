import { Metadata } from 'next';
import { ReactNode } from 'react';
import ShopLayoutClient from './ShopLayoutClient';

export const metadata: Metadata = {
  title: 'VoiceB2B Shop',
  description: 'Order fresh stock today',
};

export default function ShopLayout({ children }: { children: ReactNode }) {
  return <ShopLayoutClient>{children}</ShopLayoutClient>;
}
