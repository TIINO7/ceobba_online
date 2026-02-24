import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import {
  Button, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  OutlinedInput, Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel,
  Checkbox, TablePagination, Snackbar, Alert, Typography
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../../api';
import logoImage from '../../../assets/logo.PNG'; 

export default function MainGrid() {
  const [registerData, setRegisterData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => { fetchRegister(); }, [selectedDate]);

  const fetchRegister = async () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    try {
      const res = await api.get('/attendance/register', { params: { year, month } });
      setRegisterData(res.data);
      setPage(0);
    } catch (err) {
      console.error(err);
      showNotification('Failed to load register data.', 'error');
    }
  };

  // Helper to get local YYYY-MM-DD reliably
  const getLocalIsoDate = (dateObj) => {
      const offset = dateObj.getTimezoneOffset();
      const localDate = new Date(dateObj.getTime() - (offset*60*1000));
      return localDate.toISOString().split('T')[0];
  };

  const openModal = () => {
    // We are marking attendance for whatever date is currently selected in the DatePicker.
    // Usually, you only want to mark it for 'today', but allowing them to select past dates is better.
    const dateIso = getLocalIsoDate(selectedDate);
    const map = {};
    
    registerData.forEach(r => { 
        // Pre-check boxes if they were already marked 'P' in the database
        map[r.id] = r.register[dateIso] === 'P'; 
    });
    
    setAttendanceMap(map);
    setModalOpen(true);
  };

  const handleCheckbox = id => e => {
    setAttendanceMap(prev => ({ ...prev, [id]: e.target.checked }));
  };

  const submitAttendance = async () => {
    try {
      const dateIso = getLocalIsoDate(selectedDate);
      
      // Make API calls for every student on the roster
      await Promise.all(
        Object.entries(attendanceMap).map(([student_id, isPresent]) =>
          api.post('/attendance/', { 
              student_id: Number(student_id), 
              date: dateIso,
              status: isPresent ? "Present" : "Absent" 
          })
        )
      );
      
      setModalOpen(false);
      showNotification(`Attendance saved for ${dateIso}`, 'success');
      fetchRegister();
    } catch (err) {
      console.error(err);
      showNotification('Error saving attendance.', 'error');
    }
  };

  const showNotification = (msg, severity = 'info') => {
    setNotification({ open: true, message: msg, severity });
  };
  const handleCloseNotification = () => setNotification({ ...notification, open: false });

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  // Get the list of dates for the headers from the first student's dictionary
  const isoList = registerData.length ? Object.keys(registerData[0].register).sort() : [];

  const handleDownload = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.addImage(logoImage, 'PNG', 15, 10, 30, 30);
    doc.setFontSize(18);
    doc.text('CEOBBA INSTITUTE', 105, 20, null, null, 'center');
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text(`Register for ${month}/${year}`, 105, 36, null, null, 'center');

    const headers = ['Name', 'Surname', ...isoList.map(iso => parseInt(iso.slice(-2), 10))];
    const rows = registerData.map(r => [r.name, r.surname, ...isoList.map(iso => r.register[iso] || '')]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 55,
      theme: 'grid',
      styles: { fontSize: 8 },
      margin: { left: 10, right: 10 }
    });

    doc.save(`Attendance_${year}_${month}.pdf`);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Box sx={{ width: '100%', p: 3 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                // Note: Changed views to allow selecting specific dates for marking
                views={['year', 'month', 'day']} 
                label="Select Date"
                value={selectedDate}
                onChange={newVal => newVal && setSelectedDate(newVal)}
                renderInput={params => <OutlinedInput {...params} size="small" />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item>
            <Button variant="contained" color="primary" onClick={openModal}>
                Mark Register for {getLocalIsoDate(selectedDate)}
            </Button>
          </Grid>
          <Grid item>
            <Button variant="outlined" onClick={handleDownload}>Download PDF</Button>
          </Grid>
        </Grid>

        <TableContainer component={Paper} sx={{ overflowX: 'auto', maxHeight: '70vh' }}>
          <Table size='small' stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ backgroundColor: '#16d281', color: 'white', minWidth: 150, position: 'sticky', left: 0, zIndex: 3 }}>
                    Student Name
                </TableCell>
                
                {isoList.map(iso => (
                  <TableCell key={iso} align="center" sx={{ backgroundColor: '#16d281', color: 'white', minWidth: 35 }}>
                      {parseInt(iso.slice(-2), 10)}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {registerData.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={35} align="center"><Typography sx={{ py: 3 }}>No data for this month.</Typography></TableCell>
                  </TableRow>
              ) : (
                  registerData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(row => (
                    <TableRow key={row.id} hover>
                        <TableCell sx={{ position: 'sticky', left: 0, backgroundColor: 'background.paper', zIndex: 1, borderRight: '1px solid #e0e0e0' }}>
                            {row.name} {row.surname}
                        </TableCell>

                        {isoList.map(iso => {
                            const val = row.register[iso];
                            return (
                                <TableCell 
                                    key={iso} 
                                    align="center"
                                    sx={{ 
                                        color: val === 'P' ? 'success.main' : val === 'A' ? 'error.main' : 'text.primary',
                                        fontWeight: val ? 'bold' : 'normal',
                                        borderRight: '1px solid #f0f0f0'
                                    }}
                                >
                                    {val}
                                </TableCell>
                            );
                        })}
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={registerData.length} page={page} onPageChange={(e, newPage) => setPage(newPage)} rowsPerPage={rowsPerPage} onRowsPerPageChange={handleChangeRowsPerPage} rowsPerPageOptions={[5, 10, 25, 50]} />
      </Box>

      {/* MARK ATTENDANCE MODAL */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mark Attendance for {getLocalIsoDate(selectedDate)}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Check the box if the student is Present. Uncheck for Absent.
          </Typography>
          {registerData.map(r => (
            <FormControlLabel
              key={r.id}
              control={<Checkbox checked={!!attendanceMap[r.id]} onChange={handleCheckbox(r.id)} color="success" />}
              label={`${r.name} ${r.surname}`}
              labelPlacement="start"
              sx={{ width: '100%', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', py: 0.5, m: 0 }}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitAttendance}>Save Attendance</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={notification.open} autoHideDuration={4000} onClose={handleCloseNotification} anchorOrigin={{ vertical:'top', horizontal:'center' }}>
          <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width:'100%' }}>{notification.message}</Alert>
      </Snackbar>
    </Box>
  );
}