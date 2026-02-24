import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import AnalyticsRoundedIcon from '@mui/icons-material/AnalyticsRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import {useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../Authentication';

const mainListItems = [
  { text: 'Dashboard', icon: <HomeRoundedIcon />, path: '/dashboard', roles: ['admin'] },
  { text: 'Students',  icon: <AnalyticsRoundedIcon/>, path: '/student', roles: ['admin', 'user'] },
  { text: 'Payment',   icon: <AttachMoneyIcon/>,  path: '/payment',  roles: ['admin','user'] },
  { text: 'Register',  icon: <AssignmentRoundedIcon/>, path: '/register', roles: ['admin','user'] },
  { text: 'Subject',   icon: <AssignmentRoundedIcon/>, path: '/subject', roles: ['admin'] },
  { text: 'Admin',     icon: <PeopleRoundedIcon/>,     path: '/users',    roles: ['admin'] },
];


export default function MenuContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;
  const location = useLocation();
  
  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
      <List dense>
        {mainListItems
          .filter(item => item.roles.includes(role)) // Filter items based on user role
          .map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: 'block' }}>
            <ListItemButton selected={location.pathname === item.path} onClick={() => navigate(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <List dense>
      </List>
    </Stack>
  );
}
