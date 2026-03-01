import * as React from 'react';
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../Authentication';

// Import your icons here...
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import PaymentIcon from '@mui/icons-material/Payment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';
import ChecklistIcon from '@mui/icons-material/Checklist';

// 1. Define ALL possible menu items and WHO is allowed to see them
const ALL_MENU_ITEMS = [
  // Admin Links
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['admin'] },
  { text: 'Students', icon: <PeopleIcon />, path: '/student', roles: ['admin'] },
  { text: 'Finance', icon: <PaymentIcon />, path: '/payment', roles: ['admin'] },
  { text: 'Subjects', icon: <SchoolIcon />, path: '/subject', roles: ['admin'] },
  { text: 'Users', icon: <PeopleIcon />, path: '/users', roles: ['admin'] },
  
  // Teacher Links
  { text: 'Attendance Register', icon: <ChecklistIcon />, path: '/register', roles: ['admin', 'teacher'] },
  { text: 'Manage Assessments', icon: <AssignmentIcon />, path: '/teacher/assessments', roles: ['admin', 'teacher'] },
  { text: 'Analytics & Reports', icon: <SchoolIcon />, path: '/teacher/analytics', roles: ['admin', 'teacher'] },
  // Student Links
  { text: 'My Academics', icon: <SchoolIcon />, path: '/student/academics', roles: ['student'] },
  { text: 'My Finance', icon: <PaymentIcon />, path: '/student/finance', roles: ['student'] },
];

export default function MenuContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth(); // Get the logged-in user

  // 2. Filter the items based on the user's role
  const visibleItems = ALL_MENU_ITEMS.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <List dense>
      {visibleItems.map((item, index) => (
        <ListItem key={index} disablePadding sx={{ display: 'block' }}>
          <ListItemButton 
            selected={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}