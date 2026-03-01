import Box from '@mui/material/Box';
import Copyright from '../internals/components/Copyright';
import * as React from 'react';
import {
  Grid, IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, TablePagination, Snackbar, Alert, Typography, Chip, MenuItem,
  Select, FormControl, InputLabel, Tooltip
} from '@mui/material';
import logoImage from '../../../assets/logomini.PNG';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaymentIcon from '@mui/icons-material/Payment';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import api from '../../../api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getStatusChip = (status) => {
  let color = 'default';
  if (status === 'Paid') color = 'success';
  if (status === 'Partial') color = 'warning';
  if (status === 'Unpaid') color = 'error';
  return <Chip label={status} color={color} size="small" />;
};

export default function MainGrid() {
  const [students, setStudents] = React.useState([]);
  const [searchText, setSearchText] = React.useState('');
  const [page, setPage] = React.useState(0);
  const rowsPerPage = 15;
  const [notification, setNotification] = React.useState({ open: false, message: '', severity: 'info' });
  
  // Modals State
  const [invoicesOpen, setInvoicesOpen] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState(null);
  const [studentInvoices, setStudentInvoices] = React.useState([]);

  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [selectedInvoice, setSelectedInvoice] = React.useState(null);
  const [paymentDetails, setPaymentDetails] = React.useState({ amount_paid: '', method: 'Cash', recorded_by: 'Admin' });

  const [editInvoiceOpen, setEditInvoiceOpen] = React.useState(false);
  const [editInvoiceDetails, setEditInvoiceDetails] = React.useState({ id: null, total_amount: '' });

  const [viewPaymentsOpen, setViewPaymentsOpen] = React.useState(false);
  const [invoicePayments, setInvoicePayments] = React.useState([]);

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = React.useState({ open: false, title: '', message: '', onConfirm: null });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/finance/students-balances');
      setStudents(response.data);
    } catch (error) { showNotification('Failed to load students', 'error'); }
  };

  const refreshInvoices = async (studentId) => {
    try {
      const response = await api.get(`/finance/student/${studentId}`);
      setStudentInvoices(response.data);
      fetchStudents(); // Refresh balances in main table
    } catch (error) { console.error(error); }
  };

  // --- PDF GENERATION (Kept same as before) ---
  const generateBatchInvoicesPDF = async (invoices) => {
    if (!invoices || invoices.length === 0) {
        alert("No invoices to generate.");
        return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // --- 1. Safely Load Logo Image ---
    const img = new Image();
    img.src = logoImage; // Make sure logoImage is imported at the top of the file
    
    // Wait for the image to load
    await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; 
    });

    // --- 2. Iterate Through Invoices ---
    invoices.forEach((invoice, index) => {
        // Create a new page for every invoice after the first one
        if (index > 0) {
            doc.addPage();
        }

        // Extract student info gracefully (handles different possible backend structures)
        const sName = invoice.studentName || invoice.student?.first_name || 'Student';
        const sSurname = invoice.studentSurname || invoice.student?.surname || '';
        const fullName = `${sName} ${sSurname}`.trim();
        const invRef = invoice.id || 'N/A';
        const monthRef = invoice.month_reference || new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
        
        // Ensure total is safely parsed as a number
        const totalAmountRaw = invoice.total_amount !== undefined ? invoice.total_amount : invoice.amount;
        const total = typeof totalAmountRaw === 'number' ? totalAmountRaw : parseFloat(totalAmountRaw || 0);

        // --- 3. Header Section ---
        try {
            doc.addImage(img, 'PNG', 15, 15, 25, 25); 
        } catch (e) {
            console.warn("Logo could not be loaded into PDF.");
        }

        // Company Details (Right Aligned)
        doc.setFontSize(22);
        doc.setTextColor(44, 62, 80); // Premium dark slate/blue
        doc.setFont(undefined, 'bold');
        doc.text('CEOBBA INSTITUTE', pageWidth - 15, 25, { align: 'right' });
        
        doc.setFontSize(10);
        doc.setTextColor(127, 140, 141); // Soft gray
        doc.setFont(undefined, 'normal');
        doc.text('13421 Kuwadzana Ext, Harare, Zimbabwe', pageWidth - 15, 31, { align: 'right' });
        doc.text('Phone:  078 627 0643 | 077 237 5519', pageWidth - 15, 36, { align: 'right' });

        // Header Divider Line
        doc.setDrawColor(189, 195, 199);
        doc.setLineWidth(0.5);
        doc.line(15, 45, pageWidth - 15, 45);

        // --- 4. Invoice Title & Meta Info ---
        doc.setFontSize(16);
        doc.setTextColor(41, 128, 185); // Theme Blue
        doc.setFont(undefined, 'bold');
        doc.text('TUITION INVOICE', 15, 55);

        // Two-column layout for details
        doc.setFontSize(11);
        doc.setTextColor(44, 62, 80);
        
        // Left Column: Billed To
        doc.setFont(undefined, 'bold');
        doc.text('Billed To:', 15, 65);
        doc.setFont(undefined, 'normal');
        doc.text(`Student: ${fullName}`, 15, 72);
        doc.text(`Grade/Level: ${invoice.student?.level || 'N/A'}`, 15, 78);

        // Right Column: Invoice Details
        doc.setFont(undefined, 'bold');
        doc.text('Invoice Details:', pageWidth - 70, 65);
        doc.setFont(undefined, 'normal');
        doc.text(`Invoice Ref: #${invRef}`, pageWidth - 70, 72);
        doc.text(`Billing Period: ${monthRef}`, pageWidth - 70, 78);
        doc.text(`Issue Date: ${new Date().toLocaleDateString()}`, pageWidth - 70, 84);

        // --- 5. Transaction Table ---
        autoTable(doc, {
            startY: 95,
            head: [['Item Description', 'Period', 'Amount Due']],
            body: [
                [
                    'Monthly Tuition Fee',
                    monthRef,
                    `$${total.toFixed(2)}`
                ]
            ],
            theme: 'grid',
            headStyles: { 
                fillColor: [41, 128, 185], 
                textColor: 255, 
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                halign: 'center',
                textColor: [44, 62, 80],
                fontSize: 11,
                cellPadding: 6
            },
            columnStyles: {
                0: { halign: 'left' } 
            }
        });

        // --- 6. Summary & Footer ---
        const finalY = doc.lastAutoTable.finalY + 15;

        // Total Amount Callout Box
        doc.setFillColor(241, 242, 246);
        doc.rect(pageWidth - 85, finalY, 70, 22, 'F');
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(44, 62, 80);
        doc.text('Total Amount Due:', pageWidth - 80, finalY + 14);
        
        doc.setTextColor(231, 76, 60); // Alert Red for owed amount
        doc.text(`$${total.toFixed(2)}`, pageWidth - 20, finalY + 14, { align: 'right' });

        // Payment Instructions
        doc.setFontSize(11);
        doc.setTextColor(127, 140, 141);
        doc.setFont(undefined, 'italic');
        doc.text('Please remit payment by the end of the first week of the month.', 15, finalY + 10);
      
        // Footer Divider & Copyright
        doc.setDrawColor(189, 195, 199);
        doc.setLineWidth(0.5);
        doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text('Generated by CEOBBA Institute Finance System', pageWidth / 2, pageHeight - 13, { align: 'center' });
    });

    // --- 7. Trigger Download ---
    // Extract a descriptive name for the file based on the first invoice's month
    const batchMonthName = invoices[0]?.month_reference ? invoices[0].month_reference.replace(/\s+/g, '_') : new Date().toISOString().slice(0, 7);
    doc.save(`Batch_Invoices_${batchMonthName}.pdf`);
};
 const generateReceiptPDF = async (data) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // --- 1. Safely Load Logo Image ---
    const img = new Image();
    img.src = logoImage;
    
    // Wait for the image to load to ensure it renders in the PDF
    await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // Continue generating PDF even if image fails to load
    });

    // --- 2. Header Section ---
    try {
        // (image, format, x, y, width, height)
        doc.addImage(img, 'PNG', 15, 15, 25, 25); 
    } catch (e) {
        console.warn("Logo could not be loaded into PDF.");
    }

    // Company Details (Right Aligned)
    doc.setFontSize(22);
    doc.setTextColor(44, 62, 80); // Premium dark slate/blue
    doc.setFont(undefined, 'bold');
    doc.text('CEOBBA INSTITUTE', pageWidth - 15, 25, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setTextColor(127, 140, 141); // Soft gray
    doc.setFont(undefined, 'normal');
    doc.text('13421 kuwadzana Ext, Harare, Zimbabwe', pageWidth - 15, 31, { align: 'right' });
    doc.text('Phone:  078 627 0643 | 077 237 5519', pageWidth - 15, 36, { align: 'right' });

    // Header Divider Line
    doc.setDrawColor(189, 195, 199);
    doc.setLineWidth(0.5);
    doc.line(15, 45, pageWidth - 15, 45);

    // --- 3. Receipt Title & Meta Info ---
    doc.setFontSize(16);
    doc.setTextColor(41, 128, 185); // Theme Blue
    doc.setFont(undefined, 'bold');
    doc.text('OFFICIAL PAYMENT RECEIPT', 15, 55);

    // Two-column layout for details
    doc.setFontSize(11);
    doc.setTextColor(44, 62, 80);
    
    // Left Column: Billed To
    doc.setFont(undefined, 'bold');
    doc.text('Billed To:', 15, 65);
    doc.setFont(undefined, 'normal');
    doc.text(`Student: ${data.studentName} ${data.studentSurname}`, 15, 72);
    doc.text(`Description: ${data.monthReference}`, 15, 78);

    // Right Column: Receipt Details
    doc.setFont(undefined, 'bold');
    doc.text('Receipt Details:', pageWidth - 70, 65);
    doc.setFont(undefined, 'normal');
    doc.text(`Invoice Ref: #${data.invoiceId}`, pageWidth - 70, 72);
    doc.text(`Date Recorded: ${data.date}`, pageWidth - 70, 78);

    // --- 4. Transaction Table ---
    autoTable(doc, {
        startY: 90,
        head: [['Description', 'Invoice Total', 'Total Paid to Date', 'Remaining Balance']],
        body: [
            [
                `Tuition - ${data.monthReference}`,
                `$${data.totalAmount.toFixed(2)}`, 
                `$${data.amountPaid.toFixed(2)}`, 
                `$${data.remainingBalance.toFixed(2)}`
            ]
        ],
        theme: 'grid',
        headStyles: { 
            fillColor: [41, 128, 185], 
            textColor: 255, 
            fontStyle: 'bold',
            halign: 'center'
        },
        bodyStyles: {
            halign: 'center',
            textColor: [44, 62, 80],
            fontSize: 11,
            cellPadding: 6
        },
        columnStyles: {
            0: { halign: 'left' } 
        }
    });

    // --- 5. Summary & Footer ---
    const finalY = doc.lastAutoTable.finalY + 15;

    // Remaining Balance Callout Box
    doc.setFillColor(241, 242, 246);
    doc.rect(pageWidth - 85, finalY, 70, 22, 'F');
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('Balance Due:', pageWidth - 80, finalY + 14);
    
    // Dynamic coloring: Red if owed, Green if fully paid
    if (data.remainingBalance > 0) {
        doc.setTextColor(231, 76, 60); 
    } else {
        doc.setTextColor(39, 174, 96); 
    }
    doc.text(`$${data.remainingBalance.toFixed(2)}`, pageWidth - 20, finalY + 14, { align: 'right' });

    // Thank You Note
    doc.setFontSize(11);
    doc.setTextColor(127, 140, 141);
    doc.setFont(undefined, 'italic');
    doc.text('Thank you for your payment! If you have any questions,', 15, finalY + 10);
    doc.text('please feel free to contact us .', 15, finalY + 16);

    // Footer Divider & Copyright
    const pageHeight = doc.internal.pageSize.height;
    doc.setDrawColor(189, 195, 199);
    doc.setLineWidth(0.5);
    doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('Generated by Ceobba Institute Finance System', pageWidth / 2, pageHeight - 13, { align: 'center' });

    // --- 6. Trigger Download ---
    doc.save(`Receipt_${data.studentName}_${data.studentSurname}_Inv${data.invoiceId}.pdf`);
};
  // --- ACTIONS ---

  const handleGenerateInvoices = () => {
      setConfirmDialog({
          open: true,
          title: "Generate Monthly Invoices",
          message: "Are you sure you want to run the billing cycle? This will generate invoices for all due students.",
          onConfirm: async () => {
              try {
                  const response = await api.post('/finance/generate-batch');
                  showNotification(response.data.message, 'success');
                  fetchStudents(); 
              } catch (error) { showNotification('Error generating invoices', 'error'); }
          }
      });
  };

  const handleOpenInvoices = async (student) => {
    setSelectedStudent(student);
    await refreshInvoices(student.id);
    setInvoicesOpen(true);
  };

  // --- INVOICE CRUD ACTIONS ---

  const handleOpenEditInvoice = (invoice) => {
      setEditInvoiceDetails({ id: invoice.id, total_amount: invoice.total_amount });
      setEditInvoiceOpen(true);
  };

  const handleSubmitEditInvoice = () => {
      setConfirmDialog({
          open: true,
          title: "Confirm Invoice Update",
          message: `Are you sure you want to change the invoice amount to $${editInvoiceDetails.total_amount}?`,
          onConfirm: async () => {
              try {
                  await api.put(`/finance/invoices/${editInvoiceDetails.id}`, { total_amount: parseFloat(editInvoiceDetails.total_amount) });
                  showNotification("Invoice updated successfully", "success");
                  setEditInvoiceOpen(false);
                  refreshInvoices(selectedStudent.id);
              } catch (error) { showNotification("Failed to update invoice", "error"); }
          }
      });
  };

  const handleDeleteInvoice = (invoiceId) => {
      setConfirmDialog({
          open: true,
          title: "Delete Invoice",
          message: "Are you sure you want to delete this invoice? This will roll the student's due date back by 1 month.",
          onConfirm: async () => {
              try {
                  await api.delete(`/finance/invoices/${invoiceId}`);
                  showNotification("Invoice deleted successfully", "success");
                  refreshInvoices(selectedStudent.id);
              } catch (error) { showNotification(error.response?.data?.detail || "Failed to delete invoice", "error"); }
          }
      });
  };

  // --- PAYMENT ACTIONS ---

  const handleOpenPayment = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentDetails({ amount_paid: invoice.remaining_balance, method: 'Cash', recorded_by: 'Admin' });
    setPaymentOpen(true);
  };

  const handleSubmitPayment = () => {
      const amount = parseFloat(paymentDetails.amount_paid);
      setConfirmDialog({
          open: true,
          title: "Confirm Payment",
          message: `Process payment of $${amount} via ${paymentDetails.method}?`,
          onConfirm: async () => {
              try {
                  await api.post(`/finance/invoices/${selectedInvoice.id}/pay`, {
                      amount_paid: amount, method: paymentDetails.method, recorded_by: paymentDetails.recorded_by
                  });
                  
                  generateReceiptPDF({
                      invoiceId: selectedInvoice.id, studentName: selectedStudent.first_name, studentSurname: selectedStudent.surname,
                      totalAmount: selectedInvoice.total_amount, amountPaid: selectedInvoice.amount_paid + amount, 
                      remainingBalance: selectedInvoice.remaining_balance - amount, monthReference: selectedInvoice.month_reference,
                      date: new Date().toLocaleDateString()
                  });

                  showNotification('Payment recorded successfully!', 'success');
                  setPaymentOpen(false);
                  refreshInvoices(selectedStudent.id);
              } catch (error) { showNotification('Payment failed. Please try again.', 'error'); }
          }
      });
  };

  const handleOpenViewPayments = (invoice) => {
      setSelectedInvoice(invoice);
      setInvoicePayments(invoice.payments);
      setViewPaymentsOpen(true);
  };

  const handleDeletePayment = (paymentId) => {
      setConfirmDialog({
          open: true,
          title: "Delete Payment",
          message: "Are you sure you want to delete this payment record? This will revert the invoice balance.",
          onConfirm: async () => {
              try {
                  await api.delete(`/finance/payments/${paymentId}`);
                  showNotification("Payment deleted", "success");
                  setViewPaymentsOpen(false);
                  refreshInvoices(selectedStudent.id);
              } catch (error) { showNotification("Failed to delete payment", "error"); }
          }
      });
  };

  const handleDownloadManualReceipt = (invoice) => {
     generateReceiptPDF({
        invoiceId: invoice.id, studentName: selectedStudent.first_name, studentSurname: selectedStudent.surname,
        totalAmount: invoice.total_amount, amountPaid: invoice.amount_paid, remainingBalance: invoice.remaining_balance,
        monthReference: invoice.month_reference, date: new Date().toLocaleDateString()
    });
  };

  const showNotification = (msg, severity = 'info') => { setNotification({ open: true, message: msg, severity }); };
  const handleCloseNotification = () => setNotification({ ...notification, open: false });

  const filteredStudents = students.filter((s) => {
    const term = searchText.toLowerCase();
    return ((s.first_name && s.first_name.toLowerCase().includes(term)) || (s.surname && s.surname.toLowerCase().includes(term)));
  });

  const paginatedStudents = filteredStudents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
            <Button variant="contained" startIcon={<ReceiptLongIcon />} onClick={handleGenerateInvoices} sx={{ backgroundColor: '#16d281' }}>
                Run Monthly Billing
            </Button>
        </Grid>
        <Grid item xs={12} sm={8}>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <OutlinedInput size="small" placeholder="Search Student..." value={searchText} onChange={(e) => setSearchText(e.target.value)} sx={{ flexGrow: 1, maxWidth: '400px' }} startAdornment={<InputAdornment position="start" sx={{ color: 'text.primary' }}><SearchRoundedIcon fontSize="small" /></InputAdornment>} />
          </Stack>
        </Grid>
      </Grid>

      {/* Main Students Table */}
      <TableContainer component={Paper}>
        <Table size='small'>
          <TableHead sx={{ backgroundColor: '#16d281' }}>
            <TableRow>
              <TableCell sx={{ color: 'white' }}>First Name</TableCell><TableCell sx={{ color: 'white' }}>Surname</TableCell>
              <TableCell sx={{ color: 'white' }}>Next Due Date</TableCell><TableCell sx={{ color: 'white' }}>Total Arrears ($)</TableCell>
              <TableCell sx={{ color: 'white' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedStudents.map((student) => (
              <TableRow key={student.id} hover>
                <TableCell>{student.first_name}</TableCell><TableCell>{student.surname}</TableCell><TableCell>{student.next_payment_due_date}</TableCell>
                <TableCell sx={{ color: student.balance > 0 ? 'error.main' : 'text.primary', fontWeight: 'bold' }}>${student.balance?.toFixed(2) || '0.00'}</TableCell>
                <TableCell><Button size="small" variant="outlined" startIcon={<VisibilityIcon />} onClick={() => handleOpenInvoices(student)}>View Invoices</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination component="div" count={filteredStudents.length} page={page} onPageChange={(e, newPage) => setPage(newPage)} rowsPerPage={rowsPerPage} rowsPerPageOptions={[15]} />
      </TableContainer>

      {/* INVOICES MODAL */}
      <Dialog open={invoicesOpen} onClose={() => setInvoicesOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Invoices for {selectedStudent?.first_name} {selectedStudent?.surname}</DialogTitle>
        <DialogContent>
            {studentInvoices.length === 0 ? (
                <Typography sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>No invoices found for this student.</Typography>
            ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                    <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Invoice #</TableCell><TableCell>Cycle</TableCell><TableCell>Total</TableCell>
                            <TableCell>Paid</TableCell><TableCell>Remaining</TableCell><TableCell>Status</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {studentInvoices.map((inv) => (
                            <TableRow key={inv.id}>
                                <TableCell>#{inv.id}</TableCell><TableCell>{inv.month_reference}</TableCell>
                                <TableCell>${inv.total_amount.toFixed(2)}</TableCell><TableCell sx={{ color: 'success.main' }}>${inv.amount_paid.toFixed(2)}</TableCell>
                                <TableCell sx={{ color: 'error.main', fontWeight: 'bold' }}>${inv.remaining_balance.toFixed(2)}</TableCell>
                                <TableCell>{getStatusChip(inv.status)}</TableCell>
                                <TableCell align="center">
                                    <Stack direction="row" spacing={0.5} justifyContent="center">
                                        
                                        {/* Pay Button */}
                                        {(inv.status === 'Unpaid' || inv.status === 'Partial') && (
                                            <Tooltip title="Add Payment"><IconButton size="small" color="success" onClick={() => handleOpenPayment(inv)}><PaymentIcon fontSize="small" /></IconButton></Tooltip>
                                        )}

                                        {/* View Payments / History */}
                                        {inv.amount_paid > 0 && (
                                            <Tooltip title="View Payments History"><IconButton size="small" color="primary" onClick={() => handleOpenViewPayments(inv)}><FormatListBulletedIcon fontSize="small" /></IconButton></Tooltip>
                                        )}

                                        {/* Download Receipt */}
                                        {inv.amount_paid > 0 && (
                                            <Tooltip title="Download Receipt"><IconButton size="small" color="primary" onClick={() => handleDownloadManualReceipt(inv)}><DownloadIcon fontSize="small" /></IconButton></Tooltip>
                                        )}
                                        
                                        {/* Edit Invoice Amount */}
                                        <Tooltip title="Edit Invoice Amount"><IconButton size="small" color="warning" onClick={() => handleOpenEditInvoice(inv)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                        
                                        {/* Delete Invoice (Only if no payments made) */}
                                        {inv.amount_paid === 0 && (
                                            <Tooltip title="Delete Invoice"><IconButton size="small" color="error" onClick={() => handleDeleteInvoice(inv.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                                        )}
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </TableContainer>
            )}
        </DialogContent>
        <DialogActions><Button onClick={() => setInvoicesOpen(false)}>Close</Button></DialogActions>
      </Dialog>

      {/* VIEW PAYMENTS HISTORY MODAL */}
      <Dialog open={viewPaymentsOpen} onClose={() => setViewPaymentsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Payment History - Invoice #{selectedInvoice?.id}</DialogTitle>
        <DialogContent>
            {invoicePayments.length === 0 ? (
                <Typography sx={{ py: 2 }}>No payments recorded.</Typography>
            ) : (
                <Table size="small">
                    <TableHead>
                        <TableRow><TableCell>Date</TableCell><TableCell>Method</TableCell><TableCell>Amount</TableCell><TableCell>Action</TableCell></TableRow>
                    </TableHead>
                    <TableBody>
                        {invoicePayments.map(payment => (
                            <TableRow key={payment.id}>
                                <TableCell>{new Date(payment.date_paid).toLocaleDateString()}</TableCell>
                                <TableCell>{payment.method}</TableCell>
                                <TableCell>${payment.amount_paid.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Tooltip title="Delete Payment Record">
                                        <IconButton size="small" color="error" onClick={() => handleDeletePayment(payment.id)}><DeleteIcon fontSize="small" /></IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </DialogContent>
        <DialogActions><Button onClick={() => setViewPaymentsOpen(false)}>Close</Button></DialogActions>
      </Dialog>

      {/* EDIT INVOICE MODAL */}
      <Dialog open={editInvoiceOpen} onClose={() => setEditInvoiceOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Invoice Amount</DialogTitle>
        <DialogContent>
            <Box sx={{ mt: 2 }}>
                <TextField label="New Total Amount ($)" type="number" fullWidth value={editInvoiceDetails.total_amount} onChange={(e) => setEditInvoiceDetails({ ...editInvoiceDetails, total_amount: e.target.value })} />
            </Box>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setEditInvoiceOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmitEditInvoice}>Update Invoice</Button>
        </DialogActions>
      </Dialog>

      {/* PAYMENT MODAL */}
      <Dialog open={paymentOpen} onClose={() => setPaymentOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">Paying Invoice #{selectedInvoice?.id} ({selectedInvoice?.month_reference})</Typography>
                <TextField label="Amount ($)" type="number" fullWidth value={paymentDetails.amount_paid} onChange={(e) => setPaymentDetails({ ...paymentDetails, amount_paid: e.target.value })} />
                <FormControl fullWidth>
                    <InputLabel>Method</InputLabel>
                    <Select value={paymentDetails.method} label="Method" onChange={(e) => setPaymentDetails({ ...paymentDetails, method: e.target.value })}>
                        <MenuItem value="Cash">Cash</MenuItem><MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                        <MenuItem value="Ecocash">Ecocash</MenuItem><MenuItem value="InnBucks">InnBucks</MenuItem>
                    </Select>
                </FormControl>
                <TextField label="Recorded By" fullWidth value={paymentDetails.recorded_by} onChange={(e) => setPaymentDetails({ ...paymentDetails, recorded_by: e.target.value })} />
            </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitPayment} disabled={!paymentDetails.amount_paid || paymentDetails.amount_paid <= 0}>Confirm Payment</Button>
        </DialogActions>
      </Dialog>

      {/* GLOBAL CONFIRMATION DIALOG */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent><Typography>{confirmDialog.message}</Typography></DialogContent>
        <DialogActions>
            <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>Cancel</Button>
            <Button variant="contained" color="primary" onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ ...confirmDialog, open: false }); }}>
                Yes, Proceed
            </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={notification.open} autoHideDuration={4000} onClose={handleCloseNotification} anchorOrigin={{ vertical:'top', horizontal:'center' }}>
          <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width:'100%' }}>{notification.message}</Alert>
      </Snackbar>
      <Copyright sx={{ my: 4 }} />
    </Box>
  );
}