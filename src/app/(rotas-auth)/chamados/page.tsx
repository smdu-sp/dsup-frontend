'use client'

import Content from "@/components/Content";

export default function Chamados(props: { params: { id: string } }) {
    return (
        <Content
            breadcrumbs={[
                { label: 'Chamados', href: '/chamados' },
            ]}
            titulo={'Chamados'}
            pagina="chamados"
        >
        </Content>
    );
}
