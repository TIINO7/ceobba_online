import Stack from '@mui/material/Stack';
import NavbarBreadcrumbsF from './NavbarBreadcrumbsF';
import ColorModeIconDropdown from '../../shared-theme/ColorModeIconDropdown';


export default function Header() {
 
  return (
    <>
      <Stack
        direction="row"
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: '100%',
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          maxWidth: { sm: '100%', md: '1700px' },
          pt: 1.5,
        }}
        spacing={2}
      >
        <NavbarBreadcrumbsF />
        <Stack direction="row" sx={{ gap: 1 }}>
         
          <ColorModeIconDropdown />
        </Stack>
      </Stack>

      
    </>
  );
}
