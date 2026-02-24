import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {
  Snackbar
  , Alert
} from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import ForgotPassword from './components/ForgotPassword';
import AppTheme from '../shared-theme/AppTheme';
import ColorModeSelect from '../shared-theme/ColorModeSelect';

import api from '../../api';
import { useAuth } from '../../Authentication';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logomini.PNG'; // Adjust the path if needed
const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

export default function SignIn(props) {
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [open, setOpen] = React.useState(false);
  
  // Custom Hooks
  const { login } = useAuth(); 
  const navigate = useNavigate();
  const [notification, setNotification] = React.useState({ open: false, message: '' });

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const showNotification = (msg) => {
    setNotification({ open: true, message: msg });
    setTimeout(() => setNotification({ open: false, message: '' }), 3000);
  };
  
  const handleCloseNotification = () => setNotification({ open: false, message: '' });

  // --- CONNECTING TO OUR BACKEND ---
  const handleSubmit = async (event) => {
    event.preventDefault();

    // 1. Validate Form UI
    if (!validateInputs()) return;

    const data = new FormData(event.currentTarget);
    
    // 2. Format Data for FastAPI (OAuth2PasswordRequestForm)
    // FastAPI expects form-data fields 'username' and 'password'
    const formData = new URLSearchParams();
    formData.append('username', data.get('email')); // Mapping email input to username
    formData.append('password', data.get('password'));

    try {
      // 3. Send Request
      const response = await api.post('/auth/login', formData);
      const userData = response.data;

      // 4. Update Context
      login(userData);
      
      if (props.onLoginSuccess) {
        props.onLoginSuccess();
      }
      
      // 5. Navigate based on Role
      if (userData.role === 'admin') {
        navigate('/dashboard');
      } else if (userData.role === 'teacher') {
        navigate('/teacher');
      } else if (userData.role === 'student' || userData.role === 'user') {
        navigate('/students');
      } else {
        // Fallback
        navigate('/admin');
      }
      
    } catch (error) {
      console.error('Login Error:', error);
      const errorMsg = error.response?.data?.detail || 'Login failed. Please check your credentials.';
      showNotification(errorMsg);
    }
  };

  const validateInputs = () => {
    const email = document.getElementById('email');
    const password = document.getElementById('password');

    let isValid = true;

    if (!email.value || !/\S+/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid username or email.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password.value || password.value.length < 3) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 3 characters long.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignInContainer direction="column" justifyContent="space-between">
        <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
        <Card variant="outlined">
          
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <img
              src={logo}
              alt="Logo"
              style={{ height: '80px', objectFit: 'contain' }}
            />
            <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 600 }}>
              CEOBBA
            </Typography>
          </Box>

          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
          >
            Sign in
          </Typography>
          
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              gap: 2,
            }}
          >
            <FormControl>
              <FormLabel htmlFor="email">Username </FormLabel>
              <TextField
                error={emailError}
                helperText={emailErrorMessage}
                id="email"
                type="email" // Keeping type email for UI, but logic treats it as username
                name="email"
                placeholder="username"
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={emailError ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                error={passwordError}
                helperText={passwordErrorMessage}
                name="password"
                placeholder="••••••"
                type="password"
                id="password"
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={passwordError ? 'error' : 'primary'}
              />
            </FormControl>
            
            <ForgotPassword open={open} handleClose={handleClose} />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              onClick={validateInputs}
            >
              Sign in
            </Button>
            
            <Link
              component="button"
              type="button"
              onClick={handleClickOpen}
              variant="body2"
              sx={{ alignSelf: 'center' }}
            >
              Forgot your password?
            </Link>
          </Box>
          
          <Divider></Divider>
        

        </Card>
      </SignInContainer>

      <Snackbar 
        open={notification.open} 
        autoHideDuration={3000} 
        onClose={handleCloseNotification} 
        anchorOrigin={{ vertical:'top', horizontal:'center' }}
      >
          <Alert onClose={handleCloseNotification} severity="error" sx={{ width:'100%' }}>
            {notification.message}
          </Alert>
      </Snackbar>
    </AppTheme>
  );
}