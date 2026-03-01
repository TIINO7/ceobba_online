import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { DataGrid } from '@mui/x-data-grid';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import api from '../../../api'; 

export default function MainGrid() {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  // Modal State
  const [openModal, setOpenModal] = React.useState(false);
  const [formData, setFormData] = React.useState({
    new_username: '',
    new_password: '',
    new_role: 'student',
    admin_password: ''
  });
  const [addingError, setAddingError] = React.useState('');

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/users'); 
      setUsers(response.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users data.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/auth/users/${id}/toggle-status`);
      setUsers(users.map(u => u.id === id ? { ...u, is_active: !currentStatus } : u));
    } catch (err) {
      console.error("Failed to toggle status:", err);
      alert(err.response?.data?.detail || "Failed to update user status.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    
    try {
      await api.delete(`/auth/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert(err.response?.data?.detail || "Failed to delete user.");
    }
  };

  const handleAddUser = async () => {
    setAddingError('');
    try {
      const response = await api.post('/auth/users', formData);
      // Immediately push the new user into our table view
      setUsers([...users, response.data]);
      setOpenModal(false);
      // Reset form on success
      setFormData({ new_username: '', new_password: '', new_role: 'student', admin_password: '' });
    } catch (err) {
      setAddingError(err.response?.data?.detail || "Failed to create user.");
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'username', headerName: 'Username', flex: 1, minWidth: 150 },
    { 
      field: 'role', 
      headerName: 'Role', 
      width: 150,
      renderCell: (params) => (
        <Chip 
          label={params.value.toUpperCase()} 
          color={params.value === 'admin' ? 'primary' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" color={params.value ? 'success.main' : 'error.main'} sx={{ mt: 1.5 }}>
          {params.value ? 'Active' : 'Inactive'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
          <Button
            variant="outlined"
            size="small"
            color={params.row.is_active ? "warning" : "success"}
            onClick={() => handleToggleStatus(params.row.id, params.row.is_active)}
          >
            {params.row.is_active ? "Deactivate" : "Activate"}
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            Delete
          </Button>
        </Stack>
      ),
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      {/* Container holding Title and the Add New User Button above the table */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography component="h2" variant="h6">
          System Users
        </Typography>
        <Button variant="outlined" color="primary" onClick={() => setOpenModal(true)}>
          New User
        </Button>
      </Stack>
      
      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={users}
          columns={columns}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          disableColumnResize
          density="comfortable"
          sx={{
            boxShadow: 1,
            borderRadius: 2,
            p: 1,
            '& .MuiDataGrid-cell': {
              borderBottom: 'none',
            },
          }}
        />
      </Box>

      {/* Security-Gated Add User Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New User</DialogTitle>
        <DialogContent>
          {addingError && (
            <Typography color="error" sx={{ mb: 2 }}>{addingError}</Typography>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="New Username"
            fullWidth
            variant="outlined"
            value={formData.new_username}
            onChange={(e) => setFormData({...formData, new_username: e.target.value})}
          />
          <TextField
            margin="dense"
            label="New Password"
            type="password"
            fullWidth
            variant="outlined"
            value={formData.new_password}
            onChange={(e) => setFormData({...formData, new_password: e.target.value})}
          />
          <TextField
            select
            margin="dense"
            label="User Role"
            fullWidth
            variant="outlined"
            value={formData.new_role}
            onChange={(e) => setFormData({...formData, new_role: e.target.value})}
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="teacher">Teacher</MenuItem>
            <MenuItem value="student">Student</MenuItem>
          </TextField>
          
          <Box sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" color="error" gutterBottom>
              Admin Verification Required
            </Typography>
            <TextField
              margin="dense"
              label="Your Admin Password"
              type="password"
              fullWidth
              variant="outlined"
              value={formData.admin_password}
              onChange={(e) => setFormData({...formData, admin_password: e.target.value})}
              helperText="Please enter your own password to confirm this action."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)} color="inherit">Cancel</Button>
          <Button 
            onClick={handleAddUser} 
            variant="outlined" 
            color="primary"
            disabled={!formData.new_username || !formData.new_password || !formData.admin_password}
          >
            Verify & Add User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}