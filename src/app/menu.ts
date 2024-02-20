import { Home, Person } from '@mui/icons-material';

interface IMenu {
    title: string;
    href: string;
    name: string;
    icon: any; 
};

export const menu: IMenu[] = [
    {
        title: 'Página Inicial',
        href: '/',
        name: '/',
        icon: Home,
    },
    {
        title: 'Usuários',
        href: '/usuarios',
        name: '/usuarios',
        icon: Person,
    }
]