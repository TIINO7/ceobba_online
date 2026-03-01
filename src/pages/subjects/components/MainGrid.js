import Box from '@mui/material/Box';
import Copyright from '../internals/components/Copyright';
import * as React from 'react';
import {
  Button,
  Grid,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../../api';

export default function MainGrid() {
  const [subjects, setSubjects] = React.useState([]);
  const [addOpen, setAddOpen] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [editName, setEditName] = React.useState('');
  const [editId, setEditId] = React.useState(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [notification, setNotification] = React.useState({ open: false, message: '' });


  React.useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/subjects/');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  // Add Subject
  const handleAddOpen = () => setAddOpen(true);
  const handleAddClose = () => {
    setNewName('');
    setAddOpen(false);
  };
  const handleAddSubmit = async () => {
    try {
      await api.post('/subjects/', { name: newName });
      fetchSubjects();
      handleAddClose();
      showNotification('Subject added successfully');
    } catch (error) {
      console.error('Error adding subject:', error);
      showNotification('Error adding subject');
    }
  };

  const showNotification = msg => {
    setNotification({ open: true, message: msg });
    setTimeout(() => setNotification({ open: false, message: '' }), 3000);
  };
  const handleCloseNotification = () => setNotification({ open: false, message: '' });



  // Edit Subject
  const handleEditOpen = (subject) => {
    setEditId(subject.id);
    setEditName(subject.name);
    setEditOpen(true);
  };
  const handleEditClose = () => {
    setEditId(null);
    setEditName('');
    setEditOpen(false);
  };
  const handleEditSubmit = async () => {
    try {
      await api.put(`/subjects/`, null, {
        params: { name: editName, subject_id: editId },
      });
      fetchSubjects();
      handleEditClose();
      showNotification('Subject edited successfully');
    } catch (error) {
      console.error('Error editing subject:', error);
      showNotification(error || 'Error editing subject');
    }
  };

  // Delete Subject
  const handleDelete = async (id) => {
    try {
      await api.delete(`/subjects/${id}`);
      fetchSubjects();
      showNotification('Subject deleted successfully');
    } catch (error) {
      console.error('Error deleting subject:', error);
      showNotification(error || 'Error deleting subject');
    }
  };




  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Box sx={{ width: '100%', p: 3 }}>
      
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Button fullWidth variant="outlined"  size='small'  onClick={handleAddOpen}>
              Add Subject
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
           
          </Grid>
          <Grid item xs={12} sm={4} />
        </Grid>

        <Dialog open={addOpen} onClose={handleAddClose}>
          <DialogTitle>Add Subject</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Name"
              fullWidth
              variant='standard'
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAddClose}>Close</Button>
            <Button onClick={handleAddSubmit} disabled={!newName}>Submit</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={editOpen} onClose={handleEditClose}>
          <DialogTitle>Edit Subject</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Name"
              fullWidth
              variant='standard'
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditClose}>Close</Button>
            <Button onClick={handleEditSubmit} disabled={!editName}>Save</Button>
          </DialogActions>
        </Dialog>


        <TableContainer component={Paper}>
          <Table size='small'>
            <TableHead sx={{ backgroundColor: '#16d281' }}>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell>{subject.id}</TableCell>
                  <TableCell>{subject.name}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <IconButton size="small" onClick={() => handleEditOpen(subject)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(subject.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

           <Snackbar open={notification.open} autoHideDuration={3000} onClose={handleCloseNotification} anchorOrigin={{ vertical:'top', horizontal:'center' }}>
                <Alert onClose={handleCloseNotification} severity="info" sx={{ width:'100%' }}>{notification.message}</Alert>
              </Snackbar>
            
      <Copyright sx={{ my: 4 }} />
    </Box>
  );
}