import * as React from 'react';
import { styled } from '@mui/material/styles';
import Divider, { dividerClasses } from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import { Snackbar, Alert } from '@mui/material';
import MuiMenuItem from '@mui/material/MenuItem';
import { paperClasses } from '@mui/material/Paper';
import { listClasses } from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon, { listItemIconClasses } from '@mui/material/ListItemIcon';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import MenuButton from './MenuButton';
import { useAuth } from '../../../Authentication';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import api from '../../../api';

const MenuItem = styled(MuiMenuItem)({
  margin: '2px 0',
});

export default function OptionsMenu() {
  const { logout, user } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  
  // Dialog States
  const [accountOpen, setAccountOpen] = React.useState(false);
  const [pwdDialogOpen, setPwdDialogOpen] = React.useState(false);
  const [notification, setNotification] = React.useState({ open: false, message: '', severity: 'info' });

  // Form States (Only for passwords now)
  const [passwords, setPasswords] = React.useState({ oldPassword: '', newPassword: '' });
  const [error, setError] = React.useState('');

  const open = Boolean(anchorEl);
  
  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const showNotification = (msg, severity = 'success') => {
    setNotification({ open: true, message: msg, severity });
  };
  
  const handleCloseNotification = () => setNotification({ ...notification, open: false });

  const openAccount = () => {
    setError('');
    setAccountOpen(true);
  };
  
  const closeAccount = () => setAccountOpen(false);

  const handlePwdChange = (e) => setPasswords({ ...passwords, [e.target.name]: e.target.value });

// --- CHANGE PASSWORD ---
  const handleChangePassword = async () => {
    try {
      setError('');
      // Removed id: user.id from the payload
      await api.put('/user/change_password', { 
          old_password: passwords.oldPassword, 
          new_password: passwords.newPassword 
      });
      
      setPwdDialogOpen(false);
      setPasswords({ oldPassword: '', newPassword: '' });
      showNotification('Password changed successfully', 'success');
    } catch (err) {
      const detail = err.response?.data?.detail;
      let errorMessage = 'Password change failed.';
      
      if (typeof detail === 'string') {
          errorMessage = detail; 
      } else if (Array.isArray(detail) && detail.length > 0) {
          errorMessage = detail[0].msg; 
      }
      
      setError(errorMessage);
    }
  };
  return (
    <>
      <React.Fragment>
        <MenuButton aria-label="Open menu" onClick={handleClick} sx={{ borderColor: 'transparent' }}>
          <MoreVertRoundedIcon />
        </MenuButton>
        <Menu
          anchorEl={anchorEl}
          id="menu"
          open={open}
          onClose={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          sx={{
            [`& .${listClasses.root}`]: { padding: '4px' },
            [`& .${paperClasses.root}`]: { padding: 0 },
            [`& .${dividerClasses.root}`]: { margin: '4px -4px' },
          }}
        >
          <MenuItem onClick={() => { handleClose(); openAccount(); }}>
            My account
          </MenuItem>
          <Divider />
          <MenuItem onClick={logout} sx={{ [`& .${listItemIconClasses.root}`]: { ml: 'auto', minWidth: 0 } }}>
            <ListItemText>Logout</ListItemText>
            <ListItemIcon>
              <LogoutRoundedIcon fontSize="small" />
            </ListItemIcon>
          </MenuItem>
        </Menu>
      </React.Fragment>

      {/* Account Details Dialog (Read-Only) */}
      <Dialog open={accountOpen} onClose={closeAccount} fullWidth maxWidth="xs">
        <DialogTitle>My Account</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Contact an administrator if you need to change your username.
          </Typography>
          
          <TextField 
             margin="dense" 
             label="Username" 
             variant="filled" 
             value={user?.username || ''} 
             InputProps={{ readOnly: true }}
             fullWidth 
          />
          
          <TextField 
             margin="dense" 
             label="Account Role" 
             variant="filled" 
             value={user?.role?.toUpperCase() || ''} 
             InputProps={{ readOnly: true }}
             fullWidth 
             sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" color="primary" onClick={() => setPwdDialogOpen(true)} sx={{ mr: 'auto' }}>
            Change Password
          </Button>
          <Button onClick={closeAccount}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={pwdDialogOpen} onClose={() => setPwdDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent dividers>
          {error && <Typography color="error" variant="body2" sx={{ mb: 2 }}>{error}</Typography>}
          <TextField margin="dense" label="Old Password" type="password" name="oldPassword" variant="standard" value={passwords.oldPassword} onChange={handlePwdChange} fullWidth />
          <TextField margin="dense" label="New Password" type="password" name="newPassword" variant="standard" value={passwords.newPassword} onChange={handlePwdChange} fullWidth />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPwdDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleChangePassword} disabled={!passwords.oldPassword || !passwords.newPassword}>
            Update Password
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={notification.open} autoHideDuration={4000} onClose={handleCloseNotification} anchorOrigin={{ vertical:'top', horizontal:'center' }}>
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width:'100%' }}>{notification.message}</Alert>
      </Snackbar>
    </>
  );
}