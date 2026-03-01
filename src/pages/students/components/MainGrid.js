import Box from '@mui/material/Box';
import Copyright from '../internals/components/Copyright';
import * as React from 'react';
import {
  Button,
  Grid,
  IconButton,
  Modal,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  TablePagination,
  OutlinedInput,
  InputAdornment,
  Snackbar,
  Alert,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SyncIcon from '@mui/icons-material/Sync';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import logoImage from '../../../assets/logomini.PNG';
import api from '../../../api';
import AddSubjectsModal from './AddSubjectsModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #ccc',
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh',
  overflowY: 'auto'
};

export default function MainGrid() {
  const [students, setStudents] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(15);
  const [searchSurname, setSearchSurname] = React.useState('');
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [viewStudent, setViewStudent] = React.useState(null);
  const [selectedStudentId, setSelectedStudentId] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [toDeleteId, setToDeleteId] = React.useState(null);
  const [openRegisterModal, setOpenRegisterModal] = React.useState(false);
  const [notification, setNotification] = React.useState({ open: false, message: '' });
  
  // State variables updated to match backend schema names exactly
  const [newStudent, setNewStudent] = React.useState({
    id: null,
    first_name: '',
    surname: '',
    address: '',
    level: '',
    phone: '',
    guardian_phone_1: '',
    guardian_phone_2: '',
    medical_info: '',
    agreed_monthly_fee: 0,
    enrollment_date: new Date().toISOString().split('T')[0] // Backend expects a date
  });

  React.useEffect(() => { fetchStudents(); }, []);
  React.useEffect(() => { setPage(0); }, [searchSurname, rowsPerPage]);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students/get_all');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleUploadStudents = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      // Note: You don't have this endpoint in the students.py provided, 
      // but I'm leaving it assuming you have it elsewhere or will add it.
      const response = await api.post('/students/upload-students', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      showNotification(`Inserted: ${response.data.inserted}, Skipped: ${response.data.skipped}`);
      fetchStudents();
    } catch (error) {
      console.error('Error uploading students:', error);
      showNotification(error.response?.data?.detail || 'Upload failed');
    }
  };

  const handleDownloadStudentSheet = async () => {
    try {
        const response = await api.get('/students/info');
        
        // --- SAFETY NET FIX ---
        // Ensure data is ALWAYS an array, even if the backend returns null or wraps it in an object.
        let data = [];
        if (Array.isArray(response.data)) {
            data = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
            data = response.data.data; // Handles { data: [...] } format
        } else if (response.data && Array.isArray(response.data.students)) {
            data = response.data.students; // Handles { students: [...] } format
        }
        
        // Initialize Landscape document
        const doc = new jsPDF({ orientation: 'landscape' });
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        // Safely Load Logo Image
        const img = new Image();
        img.src = logoImage; 
        
        await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve; 
        });

        // Premium Header Layout
        try { doc.addImage(img, 'PNG', 15, 12, 25, 25); } catch (e) { console.warn("Logo failed to load."); }
        
        doc.setFontSize(22); doc.setTextColor(44, 62, 80); doc.setFont(undefined, 'bold');
        doc.text('CEOBBA INSTITUTE', pageWidth - 15, 22, { align: 'right' });
        
        doc.setFontSize(10); doc.setTextColor(127, 140, 141); doc.setFont(undefined, 'normal');
        doc.text('13421 Kuwadzana Ext, Harare, Zimbabwe', pageWidth - 15, 28, { align: 'right' });
        doc.text('Phone:  078 627 0643 | 077 237 5519', pageWidth - 15, 33, { align: 'right' });
        
        doc.setDrawColor(189, 195, 199); doc.setLineWidth(0.5); doc.line(15, 42, pageWidth - 15, 42);

        // Document Title & Meta Info
        doc.setFontSize(16); doc.setTextColor(41, 128, 185); doc.setFont(undefined, 'bold');
        doc.text('STUDENT MASTER DIRECTORY', 15, 52);

        doc.setFontSize(10); doc.setTextColor(44, 62, 80); doc.setFont(undefined, 'normal');
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - 15, 52, { align: 'right' });
        
        // It will now safely read data.length because data is guaranteed to be an array
        doc.text(`Total Registered Students: ${data.length}`, 15, 58);

        // Professional Table Rendering
        autoTable(doc, {
            startY: 65,
            head: [['First Name', 'Surname', 'Last Paid', 'Address', 'Level', 'Phone', 'Guardian 1', 'Guardian 2', 'Subjects']],
            body: data.map(s => [
                s.first_name || '-', 
                s.surname || '-', 
                s.last_payed || '-', 
                s.address || '-',
                s.level || '-', 
                s.phone || '-', 
                s.guardian_phone_1 || '-', 
                s.guardian_phone_2 || '-', 
                s.numberofsubjects || '0'
            ]),
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', halign: 'center' },
            bodyStyles: { textColor: [44, 62, 80], fontSize: 8, cellPadding: 3, valign: 'middle' },
            columnStyles: {
                0: { halign: 'left', fontStyle: 'bold' },
                1: { halign: 'left', fontStyle: 'bold' },
                3: { cellWidth: 40 }, 
                4: { halign: 'center' },
                8: { halign: 'center' }  
            }
        });

        // Professional Footer
        doc.setDrawColor(189, 195, 199); doc.setLineWidth(0.5); 
        doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
        doc.setFontSize(9); doc.setTextColor(127, 140, 141);
        doc.text('Generated by CEOBBA Institute Management System', pageWidth / 2, pageHeight - 8, { align: 'center' });

        doc.save(`Student_Master_Sheet_${new Date().toISOString().split('T')[0]}.pdf`);
        
        // If your original code was using showNotification, it goes here safely:
        if (typeof showNotification === 'function') {
            showNotification(response.data?.message || 'Student sheet downloaded successfully');
        }

    } catch (error) {
        console.error('Error downloading student sheet:', error);
        if (typeof showNotification === 'function') {
            showNotification(error.response?.data?.message || 'Failed to download student sheet');
        } else {
            alert('Failed to download student sheet');
        }
    }
};
  
  const handleOpenModal = (id) => { setSelectedStudentId(id); setModalOpen(true); };  
  const confirmDelete = (id) => { setToDeleteId(id); setConfirmOpen(true); };
  const handleConfirmYes = () => { if (toDeleteId !== null) handleDelete(toDeleteId); setConfirmOpen(false); setToDeleteId(null); };
  const handleConfirmNo = () => { setConfirmOpen(false); setToDeleteId(null); };

  const handleDelete = async (id) => {
    try {
      const response = await api.delete(`/students/${id}`);
      showNotification(response.data.message || 'Student deleted successfully');
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const handleViewStudent = async (student) => {
    try {
      // Changed to match GET /{student_id} from backend
      const response = await api.get(`/students/${student.id}`);
      setViewStudent(response.data);
    } catch (error) {
      console.error('Error viewing student:', error);
    }
  };

  const handleEdit = (student) => {
    setNewStudent({
      id: student.id,
      first_name: student.first_name || '', // mapped from first_name
      surname: student.surname || '',
      address: student.address || '',
      level: student.level || '',
      phone: student.phone || '', // mapped from phone
      guardian_phone_1: student.guardian_phone_1 || '', // mapped
      guardian_phone_2: student.guardian_phone_2 || '', // mapped
      medical_info: student.medical_info || '',
      agreed_monthly_fee: student.agreed_monthly_fee || 0,
      enrollment_date: student.enrollment_date || new Date().toISOString().split('T')[0]
    });
    setOpenRegisterModal(true);
  };

  const handleToggleActive = async (student) => {
    try {
      // Note: This endpoint is missing from students.py. 
      // Ensure you add it to the backend or handle it via PUT /{student_id}
      const response = await api.get(`/students/toogle_active/${student.id}`);
      showNotification(response.data.message || 'Student active status toggled');
      fetchStudents();
    } catch (error) {
      //console.error('Error toggling active status:', error);
      showNotification(error.response?.data?.message || 'Failed to toggle student active status');
    }
  };

  const handleRegisterSubmit = async () => {
    try {
      if (newStudent.id) {
        // Edit mode
        await api.put(`/students/${newStudent.id}`, newStudent);
        showNotification('Student updated successfully');
      } else {
        // Create mode (Changed to match POST / )
        await api.post('/students/', newStudent);
        showNotification('Student registered successfully');
      }
      fetchStudents();
      setNewStudent({ id: null, first_name: '', surname: '', address: '', level: '', phone: '', guardian_phone_1: '', guardian_phone_2: '', medical_info: '', agreed_monthly_fee: 0, enrollment_date: new Date().toISOString().split('T')[0] });
      setOpenRegisterModal(false);
    } catch (error) { 
        //console.error('Error registering/updating student:', error); 
        showNotification('Failed to register/update student. Please try again.');
    }
  };

  const showNotification = msg => { setNotification({ open: true, message: msg }); setTimeout(() => setNotification({ open: false, message: '' }), 3000); };
  const handleCloseNotification = () => setNotification({ open: false, message: '' });

  const filteredStudents = students.filter(s => s.surname && s.surname.toLowerCase().includes(searchSurname.toLowerCase()));
  const paginatedStudents = filteredStudents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, p: 3 }}>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs={12} sm={2}><Button fullWidth size="small" variant="outlined" onClick={() => setOpenRegisterModal(true)}>Register Student</Button></Grid>
        <Grid item xs={12} sm={2}><Button fullWidth size="small" variant="outlined" onClick={handleDownloadStudentSheet}>Download Sheet</Button></Grid>
        <Grid item xs={12} sm={4}><OutlinedInput size="small" placeholder="Search by Surname…" value={searchSurname} onChange={e => setSearchSurname(e.target.value)} sx={{ flexGrow: 1 }} startAdornment={<InputAdornment position="start"><SearchRoundedIcon fontSize="small"/></InputAdornment>}/></Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table size='small'>
          <TableHead sx={{ backgroundColor: '#16d281' }}>
            <TableRow>
              <TableCell>ID</TableCell><TableCell>First Name</TableCell><TableCell>Surname</TableCell><TableCell>Level</TableCell><TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedStudents.map(student => (
              <TableRow key={student.id}>
                <TableCell>{student.id}</TableCell>
                <TableCell>{student.first_name}</TableCell>
                <TableCell>{student.surname}</TableCell>
                <TableCell>{student.level}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                  <IconButton size="small" color="primary" onClick={() => handleViewStudent(student)}><VisibilityIcon/></IconButton>
                  <IconButton size="small" onClick={() => handleEdit(student)}><EditIcon/></IconButton>
                  <IconButton size="small" onClick={() => confirmDelete(student.id)}><DeleteIcon/></IconButton>
                  <IconButton size="small" onClick={() => handleToggleActive(student)}><SyncIcon/></IconButton>
                  <IconButton size="small" onClick={() => handleOpenModal(student.id)}><AddIcon/></IconButton>
                </Stack></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination component="div" count={filteredStudents.length} page={page} onPageChange={handleChangePage} rowsPerPage={rowsPerPage} onRowsPerPageChange={handleChangeRowsPerPage} rowsPerPageOptions={[5,10,25,50]}/>
      </TableContainer>

      {/* Confirmation Modal */}
      <Modal open={confirmOpen} onClose={handleConfirmNo}>
        <Box sx={style}>
          <Typography variant="h6" gutterBottom>Are you sure you want to delete this student?</Typography>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="outlined" onClick={handleConfirmNo}>No</Button>
            <Button variant="contained" color="error" onClick={handleConfirmYes}>Yes</Button>
          </Stack>
        </Box>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewStudent} onClose={() => setViewStudent(null)}>
        <Box sx={style}>
          <Button sx={{ position: 'absolute', top: 8, right: 8 }} onClick={() => setViewStudent(null)}><CloseIcon/></Button>
          <Typography variant="h5" gutterBottom>Student Information</Typography>
          {viewStudent && <Stack spacing={1}>
            <Typography><strong>First Name:</strong> {viewStudent.first_name}</Typography>
            <Typography><strong>Surname:</strong> {viewStudent.surname}</Typography>
            <Typography><strong>Address:</strong> {viewStudent.address}</Typography>
            <Typography><strong>Level:</strong> {viewStudent.level}</Typography>
            <Typography><strong>Student Phone:</strong> {viewStudent.phone}</Typography>
            <Typography><strong>Guardian Phone 1:</strong> {viewStudent.guardian_phone_1}</Typography>
            <Typography><strong>Guardian Phone 2:</strong> {viewStudent.guardian_phone_2}</Typography>
            {/* Note: In your DB the relation is student.subjects, check how it returns in the dict */}
            <Typography><strong>Subjects:</strong> {viewStudent.subjects ? viewStudent.subjects.map(sub => sub.name).join(', ') : 'None'}</Typography>
            <Typography><strong>Monthly Fee:</strong> ${viewStudent.agreed_monthly_fee}</Typography>
          </Stack>}
        </Box>
      </Modal>

      {/* Register / Edit Modal */}
      <Modal open={openRegisterModal} onClose={() => setOpenRegisterModal(false)}>
        <Box sx={style}>
          <Button sx={{ position: 'absolute', top: 8, right: 8 }} onClick={() => setOpenRegisterModal(false)}><CloseIcon/></Button>
          <Typography variant="h5" gutterBottom>{newStudent.id ? 'Edit Student' : 'Register Student'}</Typography>
          <Stack spacing={2}>
            <TextField label="First Name" variant="standard" value={newStudent.first_name} onChange={e => setNewStudent({ ...newStudent, first_name: e.target.value })} fullWidth/>
            <TextField label="Surname" variant="standard" value={newStudent.surname} onChange={e => setNewStudent({ ...newStudent, surname: e.target.value })} fullWidth/>
            <TextField label="Address" variant="standard" value={newStudent.address} onChange={e => setNewStudent({ ...newStudent, address: e.target.value })} fullWidth/>
            <TextField label="Level" variant="standard" value={newStudent.level} onChange={e => setNewStudent({ ...newStudent, level: e.target.value })} fullWidth/>
            <TextField label="Student Phone" variant="standard" value={newStudent.phone} onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })} fullWidth/>
            <TextField label="Guardian Phone 1" variant="standard" value={newStudent.guardian_phone_1} onChange={e => setNewStudent({ ...newStudent, guardian_phone_1: e.target.value })} fullWidth/>
            <TextField label="Guardian Phone 2" variant="standard" value={newStudent.guardian_phone_2} onChange={e => setNewStudent({ ...newStudent, guardian_phone_2: e.target.value })} fullWidth/>
            <TextField label="Agreed Monthly Fee" type="number" variant="standard" value={newStudent.agreed_monthly_fee} onChange={e => setNewStudent({ ...newStudent, agreed_monthly_fee: parseFloat(e.target.value) })} fullWidth/>
            <TextField label="Enrollment Date" type="date" variant="standard" value={newStudent.enrollment_date} onChange={e => setNewStudent({ ...newStudent, enrollment_date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
            <Button variant="outlined" color="primary" onClick={handleRegisterSubmit} fullWidth>Submit</Button>
          </Stack>
        </Box>
      </Modal>

      {/* Subject Enroll Modal */}
      <AddSubjectsModal open={modalOpen} onClose={() => setModalOpen(false)} studentId={selectedStudentId}/>

      <Snackbar open={notification.open} autoHideDuration={3000} onClose={handleCloseNotification} anchorOrigin={{ vertical:'top', horizontal:'center' }}>
        <Alert onClose={handleCloseNotification} severity="info" sx={{ width:'100%' }}>{notification.message}</Alert>
      </Snackbar>

      <Copyright sx={{ my: 4 }} />
    </Box>
  );
}