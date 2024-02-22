import { authOptions } from './api/auth/[...nextauth]/route';
import { Business, Home, Person } from '@mui/icons-material';

export interface IMenuOption {
    title:  string;
    href:   string;
    name:   string;
    icon:   any; 
};

export interface IMenu {
    userOptions:    IMenuOption[];
    adminOptions:   IMenuOption[];
}


export const menu: IMenu = {
    userOptions: [
        {
            title: 'Página Inicial',
            href: '/',
            name: '/',
            icon: Home,
        },
    ],
    adminOptions: [
        {
            title: 'Usuários',
            href: '/usuarios',
            name: '/usuarios',
            icon: Person,
        },
        {
            title: 'Unidades',
            href: '/unidades',
            name: '/unidades',
            icon: Business,
        }           
    ]
}