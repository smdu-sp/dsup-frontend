'use client'

import Content from '@/components/Content';
import { Suspense } from 'react';

export default function Home() {
  return (
    <Suspense>
      <SearchHome />
    </Suspense>
  )
}

function SearchHome() {
  return (
    <Content
      titulo='Página Inicial'
      pagina='/'
    >
      
    </Content>
  );
}