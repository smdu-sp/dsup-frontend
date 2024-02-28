'use client'

import Content from '@/components/Content';
import { useSearchParams } from 'next/navigation';

export default function Home() {
  const searchParams = useSearchParams();
  return (
    <Content
      titulo='Página Inicial'
      pagina='/'
    >
      
    </Content>
  );
}