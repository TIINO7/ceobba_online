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

  const handleDownload = async () => {
    const year = selectedDate.getFullYear();
    const monthNum = selectedDate.getMonth() + 1;
    const monthString = selectedDate.toLocaleString('default', { month: 'long' });
    
    // Initialize Landscape document
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // --- 1. Safely Load Logo Image ---
    const img = new Image();
    img.src = logoImage; // Assumes logoImage is imported at the top of your file
    
    await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; 
    });

    // --- 2. Premium Header Layout ---
    try {
        doc.addImage(img, 'PNG', 15, 12, 25, 25); 
    } catch (e) {
        console.warn("Logo could not be loaded into PDF.");
    }

    // Company Details (Right Aligned dynamically for Landscape)
    doc.setFontSize(22);
    doc.setTextColor(44, 62, 80); // Premium dark slate
    doc.setFont(undefined, 'bold');
    doc.text('CEOBBA INSTITUTE', pageWidth - 15, 22, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setTextColor(127, 140, 141); // Soft gray
    doc.setFont(undefined, 'normal');
    doc.text('13421 Kuwadzana Ext, Harare, Zimbabwe', pageWidth - 15, 28, { align: 'right' });
    doc.text('Phone:  078 627 0643 | 077 237 5519', pageWidth - 15, 33, { align: 'right' });

    // Header Divider Line
    doc.setDrawColor(189, 195, 199);
    doc.setLineWidth(0.5);
    doc.line(15, 42, pageWidth - 15, 42);

    // --- 3. Document Title & Meta Info ---
    doc.setFontSize(16);
    doc.setTextColor(41, 128, 185); // Theme Blue
    doc.setFont(undefined, 'bold');
    doc.text(`ATTENDANCE REGISTER - ${monthString.toUpperCase()} ${year}`, 15, 52);

    doc.setFontSize(10);
    doc.setTextColor(44, 62, 80);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - 15, 52, { align: 'right' });

    // --- 4. Original Table Logic (Preserved) ---
    const headers = ['Name', 'Surname', ...isoList.map(iso => parseInt(iso.slice(-2), 10))];
    const rows = registerData.map(r => [r.name, r.surname, ...isoList.map(iso => r.register[iso] || '')]);

    autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 58,
        theme: 'grid', // Kept as requested
        styles: { 
            fontSize: 8, // Kept as requested
            textColor: [44, 62, 80],
            cellPadding: 2 
        },
        headStyles: { 
            fillColor: [41, 128, 185], // Updated to match brand blue
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'left', fontStyle: 'bold' }, // Name
            1: { halign: 'left', fontStyle: 'bold' }  // Surname
        },
        margin: { left: 10, right: 10 } // Kept as requested
    });

    // --- 5. Professional Footer ---
    doc.setDrawColor(189, 195, 199);
    doc.setLineWidth(0.5);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
    
    doc.setFontSize(9);
    doc.setTextColor(127, 140, 141);
    doc.text('Generated by CEOBBA Institute Management System', pageWidth / 2, pageHeight - 8, { align: 'center' });

    // --- 6. Trigger Download ---
    doc.save(`Attendance_${year}_${monthNum}.pdf`);
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