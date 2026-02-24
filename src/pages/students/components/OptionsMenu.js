import * as React from 'react';
import { styled } from '@mui/material/styles';
import Divider, { dividerClasses } from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import {
  Snackbar,
  Alert
} from '@mui/material';
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
  const [accountOpen, setAccountOpen] = React.useState(false);
  const [pwdDialogOpen, setPwdDialogOpen] = React.useState(false);
  const [notification, setNotification] = React.useState({ open: false, message: '' });

  const [form, setForm] = React.useState({
    email: user?.email || '',
    name: user?.name || '',
  });
  const [passwords, setPasswords] = React.useState({ oldPassword: '', newPassword: '' });
  const [error, setError] = React.useState('');

  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

    const showNotification = msg => {
    setNotification({ open: true, message: msg });
    setTimeout(() => setNotification({ open: false, message: '' }), 3000);
  };
  const handleCloseNotification = () => setNotification({ open: false, message: '' });

  const openAccount = () => {
    setForm({ email: user.email, name: user.name });
    setAccountOpen(true);
  };
  const closeAccount = () => setAccountOpen(false);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const response = await api.put(`/user/edit/${user.id}`, { id: user.id, ...form });
      user.email = response.data.email;
      user.name = response.data.name;
      closeAccount();
      showNotification('Details change successfully');
    } catch (err) {
      setError(err.response?.data?.detail || 'Update failed');
      showNotification('Update failed');
    }
  };

  const handlePwdChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleChangePassword = async () => {
    try {
      await api.put('/user/change_password', { id: user.id, old_password: passwords.oldPassword, new_password: passwords.newPassword });
      setPwdDialogOpen(false);
      setPasswords({ oldPassword: '', newPassword: '' });
      showNotification('password change successfully');
    } catch (err) {
      setError(err.response?.data?.detail || 'Password change failed');
    }
  };

  return (
    <>
      <React.Fragment>
        <MenuButton
          aria-label="Open menu"
          onClick={handleClick}
          sx={{ borderColor: 'transparent' }}
        >
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
          <MenuItem sx={{ [`& .${listItemIconClasses.root}`]: { ml: 'auto', minWidth: 0 } }}>
            <ListItemText onClick={logout}>Logout</ListItemText>
            <ListItemIcon>
              <LogoutRoundedIcon fontSize="small" />
            </ListItemIcon>
          </MenuItem>
        </Menu>
      </React.Fragment>

      {/* Account Edit Dialog */}
      <Dialog open={accountOpen} onClose={closeAccount} fullWidth>
        <DialogTitle>My Account</DialogTitle>
        <DialogContent dividers>
          {error && <Typography color="error">{error}</Typography>}
          <TextField
            margin="dense"
            label="Email"
            name="email"
            variant="standard"
            value={form.email}
            onChange={handleFormChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Name"
            name="name"
            variant="standard"
            value={form.name}
            onChange={handleFormChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            variant="standard"
            value="********"
            disabled
            helperText="Click 'Change Password' to update"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setPwdDialogOpen(true)}>Change Password</Button>
          <Button variant="outlined" onClick={closeAccount}>Cancel</Button>
          <Button variant="outlined" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={pwdDialogOpen} onClose={() => setPwdDialogOpen(false)} fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent dividers>
          <TextField
            margin="dense"
            label="Old Password"
            type="password"
            name="oldPassword"
            variant="standard"
            value={passwords.oldPassword}
            onChange={handlePwdChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="New Password"
            type="password"
            name="newPassword"
            variant="standard"
            value={passwords.newPassword}
            onChange={handlePwdChange}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setPwdDialogOpen(false)}>Cancel</Button>
          <Button variant="outlined" onClick={handleChangePassword}>Change</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={notification.open} autoHideDuration={3000} onClose={handleCloseNotification} anchorOrigin={{ vertical:'top', horizontal:'center' }}>
        <Alert onClose={handleCloseNotification} severity="info" sx={{ width:'100%' }}>{notification.message}</Alert>
      </Snackbar>
    </>
  );
}
