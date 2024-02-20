import Content from '@/components/Content';

export default function Usuarios() {
  return (
    <Content
      breadcrumbs={[
        { label: 'Usuários', href: '/usuarios' }
      ]}
      titulo='Usuários'
      pagina='/usuarios'
    >
    </Content>
  );
}