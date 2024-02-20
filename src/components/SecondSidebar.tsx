import { useContext } from 'react';
import { Link, ListItemButton, ListItemDecorator, ListItemContent, ListItem, List, Sheet, Box, SvgIcon } from '@mui/joy';
import { menu } from '../app/menu';
import { MenuContext } from '@/shared/contexts/MenuContext';
import { useRouter } from 'next/navigation';
import Usuario from './Usuario';

export default function SecondSidebar({
  pagina,
  menuOverride,
} : {
  pagina?: string;
  menuOverride?: {
    title: string;
    href: string;
    name: string;
    icon: any;
  }[];
}) {
  const { closeSidebar } = useContext(MenuContext);
  return (
    <>
      <Box
        className="SecondSidebar-overlay"
        sx={{
          position: 'fixed',
          zIndex: 99,
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          opacity: 'var(--SideNavigation-slideIn)',
          backgroundColor: 'var(--joy-palette-background-backdrop)',
          transition: 'opacity 0.4s',
          transform: {
            xs: 'translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1) + var(--SideNavigation-slideIn, 0) * var(--FirstSidebar-width, 0px)))',
            lg: 'translateX(-100%)',
          },
        }}
        onClick={() => closeSidebar()}
      />
      <Sheet
        className="SecondSidebar"
        color="neutral"
        sx={{
          position: {
            xs: 'fixed',
            lg: 'sticky',
          },
          transform: {
            xs: 'translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1) + var(--SideNavigation-slideIn, 0) * var(--FirstSidebar-width, 0px)))',
            lg: 'none',
          },
          transition: 'transform 0.4s',
          zIndex: 99,
          height: '100dvh',
          top: 0,
          p: 2,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          borderRight: '1px solid',
          borderColor: 'divider',
          maxWidth: 250,
        }}
      >
        <List
          size="sm"
          sx={{
            '--ListItem-radius': '6px',
            '--List-gap': '6px',
          }}
        >
          {menuOverride ?
            menuOverride.map((page) => (
              <Link 
                href={page.href}
                underline='none'
                key={page.name}
              >
                <ListItem sx={{width: '100%'}}>
                    <ListItemButton selected={pagina===page.name}>
                      <ListItemDecorator>
                        <SvgIcon component={page.icon} />
                      </ListItemDecorator>
                      <ListItemContent>{page.title}</ListItemContent>
                    </ListItemButton>
                </ListItem>
              </Link>
            ))
          : menu.map((page) => (
            <Link 
              href={page.href}
              underline='none'
              key={page.name}
            >
              <ListItem sx={{width: '100%'}}>
                  <ListItemButton selected={page.name === pagina}>
                    <ListItemDecorator >
                      <SvgIcon component={page.icon} />
                    </ListItemDecorator>
                    <ListItemContent>{page.title}</ListItemContent>
                  </ListItemButton>
              </ListItem>
            </Link>
          ))}
        </List>
        <Usuario />
      </Sheet>
    </>
  );
}
