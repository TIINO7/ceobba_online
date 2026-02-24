import * as React from 'react';
import Box from '@mui/material/Box';
import {
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  Typography,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Stack,
  Snackbar,
  Alert,
  TablePagination
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../../../api';
import Copyright from '../internals/components/Copyright';

export default function MainGrid() {
  const [users, setUsers] = React.useState([]);
  const [openForm, setOpenForm] = React.useState(false);
  const [formMode, setFormMode] = React.useState('add');
  const [selectedUser, setSelectedUser] = React.useState({ id: '', email: '', name: '', role: '', password: '' });
  const [notification, setNotification] = React.useState({ open: false, message: '', severity: 'success' });
  const [expenses, setExpenses] = React.useState([]);
  const [categoryFilter, setCategoryFilter] = React.useState('');
  const [dateFilter, setDateFilter] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [openExpenseForm, setOpenExpenseForm] = React.useState(false);
  const [expenseForm, setExpenseForm] = React.useState({ amount: '', description: '', category: 'salary' });

  React.useEffect(() => {
    fetchUsers();
    fetchExpenses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    fetchExpenses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, dateFilter]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/user/users');
      setUsers(res.data);
    } catch {
      showNotification('Failed to fetch users', 'error');
    }
  };

  const fetchExpenses = async () => {
    try {
      let res;
      if (dateFilter) {
        const [year, month] = dateFilter.split('-');
        res = await api.get(`/expenses/month?year=${year}&month=${month}`);
      } else {
        res = await api.get('/expenses/all_expenses');
      }
      let data = res.data;
      if (categoryFilter) data = data.filter(e => e.category === categoryFilter);
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(data);
    } catch {
      showNotification('Error loading expenses', 'error');
    }
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const handleDeleteUser = async user => {
    if (user.role === 'admin') {
      if (!window.confirm('This user is an admin. Are you sure you want to delete this account?')) return;
    }
    try {
      await api.delete(`/user/delete/${user.id}`);
      showNotification('User deleted', 'success');
      fetchUsers();
    } catch {
      showNotification('Delete failed', 'error');
    }
  };

  const handleFormSubmit = async () => {
    try {
      if (formMode === 'add') {
        await api.post('/user/register', selectedUser);
      } else {
        await api.put(`/user/edit/${selectedUser.id}`, selectedUser);
      }
      showNotification('User saved', 'success');
      fetchUsers();
      setOpenForm(false);
    } catch {
      showNotification('Operation failed', 'error');
    }
  };

  const handleExpenseSubmit = async () => {
    try {
      await api.post('/expenses/create_expense', expenseForm);
      showNotification('Expense added', 'success');
      setOpenExpenseForm(false);
      fetchExpenses();
    } catch {
      showNotification('Error adding expense', 'error');
    }
  };

  const handleDeleteExpense = async id => {
    try {
      await api.delete('/expenses/expense_id', { params: { expense_id: id } });
      showNotification('Expense deleted', 'success');
      fetchExpenses();
    } catch {
      showNotification('Error deleting expense', 'error');
    }
  };

  return (
    <Box sx={{ p: 3, width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Button variant="outlined" size="small" onClick={() => {
          setFormMode('add');
          setSelectedUser({ id: '', email: '', name: '', role: 'user', password: '' });
          setOpenForm(true);
        }}>Add New User</Button>
      </Grid>
      <Typography variant="h4" component="h1" sx={{ color: 'text.primary' }}>Users</Typography>
      <TableContainer component={Paper} sx={{ mb: 4, mt: 2 }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#16d281' }}>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell >
                   <Stack direction="row" spacing={1}>
                  <IconButton size="small" onClick={() => {
                    setFormMode('edit');
                    setSelectedUser(user);
                    setOpenForm(true);
                  }}><EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteUser(user)}><DeleteIcon /></IconButton>
                </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h4" component="h1" sx={{ color: 'text.primary' }}>Expenses</Typography>
      <Grid container spacing={2} sx={{ mt: 2 ,mb: 2 }}>
        <Grid item>
         <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Category</InputLabel>
            <Select label="Category" onChange={(e) => setCategoryFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="salary">Salary</MenuItem>
              <MenuItem value="stationary">Stationary</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item>
          <TextField  type="month" size="small" sx={{minWidth:100}} label="Select Month" InputLabelProps={{ shrink: true }} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </Grid>
        <Grid item>
          <Button variant="outlined" size="small" onClick={() => setOpenExpenseForm(true)}>Add Expense</Button>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#16d281' }}>
            <TableRow>
              <TableCell>Amount</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(exp => (
              <TableRow key={exp.id}>
                <TableCell>${exp.amount}</TableCell>
                <TableCell>{exp.description}</TableCell>
                <TableCell>{exp.category}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                  <IconButton size='small' onClick={() => alert(JSON.stringify(exp, null, 2))}><VisibilityIcon /></IconButton>
                  <IconButton size='small' onClick={() => handleDeleteExpense(exp.id)}><DeleteIcon /></IconButton>
                </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={expenses.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="sm">
        <DialogTitle>{formMode === 'add' ? 'Add New User' : 'Edit User'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Email" fullWidth value={selectedUser.email} onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })} />
            <TextField label="Name" fullWidth value={selectedUser.name} onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={selectedUser.role} label="Role" onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            {formMode === 'add' && <TextField label="Password" type="password" fullWidth value={selectedUser.password} onChange={(e) => setSelectedUser({ ...selectedUser, password: e.target.value })} />}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancel</Button>
          <Button onClick={handleFormSubmit} variant="contained">{formMode === 'add' ? 'Register' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openExpenseForm} onClose={() => setOpenExpenseForm(false)} fullWidth maxWidth="sm">
        <DialogTitle >Add Expense</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Amount"  fullWidth value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
            <TextField label="Description" fullWidth value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select value={expenseForm.category} label="Category" onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                <MenuItem value="salary">Salary</MenuItem>
                <MenuItem value="stationary">Stationary</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExpenseForm(false)}>Cancel</Button>
          <Button onClick={handleExpenseSubmit} variant="outlined">Submit</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={notification.severity} sx={{ width: '100%' }}>{notification.message}</Alert>
      </Snackbar>

      <Box sx={{ mt: 4 }}>
        <Copyright sx={{ my: 4 }} />
      </Box>
    </Box>
  );
}
