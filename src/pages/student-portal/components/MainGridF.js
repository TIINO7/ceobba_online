import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Chip , Grid, Card, CardContent
} from '@mui/material';
import api from '../../../api'; // Import your configured Axios instance

export default function MainGridF() {const [invoices, setInvoices] = useState([]);
    const [totalArrears, setTotalArrears] = useState(0);

    useEffect(() => {
        // Fetch the logged-in student's invoices
        const fetchFinances = async () => {
            try {
                const res = await api.get('/portal/me/invoices');
                const fetchedInvoices = res.data;
                setInvoices(fetchedInvoices);
                
                // Calculate total amount still owed across all invoices
                const arrears = fetchedInvoices.reduce((sum, inv) => sum + inv.remaining_balance, 0);
                setTotalArrears(arrears);
            } catch (error) {
                console.error("Failed to fetch financial data", error);
            }
        };
        fetchFinances();
    }, []);

    const getStatusChip = (status) => {
        let color = 'default';
        if (status === 'Paid') color = 'success';
        if (status === 'Partial') color = 'warning';
        if (status === 'Unpaid') color = 'error';
        return <Chip label={status} color={color} size="small" />;
    };

    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
            
            {/* SUMMARY CARD */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ backgroundColor: totalArrears > 0 ? '#fff4f4' : '#f4fff8', border: '1px solid', borderColor: totalArrears > 0 ? 'error.light' : 'success.light' }}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Total Outstanding Balance
                            </Typography>
                            <Typography variant="h3" component="div" color={totalArrears > 0 ? 'error.main' : 'success.main'}>
                                ${totalArrears.toFixed(2)}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                {totalArrears > 0 ? "Please visit the office to make a payment." : "Your account is fully paid. Thank you!"}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* INVOICES TABLE */}
            <Typography variant="h6" gutterBottom>Billing History</Typography>
            <TableContainer component={Paper} variant="outlined">
                <Table>
                    <TableHead sx={{ backgroundColor: '#16d281' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white' }}>Invoice #</TableCell>
                            <TableCell sx={{ color: 'white' }}>Billing Cycle</TableCell>
                            <TableCell sx={{ color: 'white' }}>Total</TableCell>
                            <TableCell sx={{ color: 'white' }}>Paid</TableCell>
                            <TableCell sx={{ color: 'white' }}>Remaining</TableCell>
                            <TableCell sx={{ color: 'white' }}>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {invoices.length === 0 ? (
                            <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>No invoices found.</TableCell></TableRow>
                        ) : (
                            invoices.map((inv) => (
                                <TableRow key={inv.id} hover>
                                    <TableCell>#{inv.id}</TableCell>
                                    <TableCell>{inv.month_reference}</TableCell>
                                    <TableCell>${inv.total_amount.toFixed(2)}</TableCell>
                                    <TableCell sx={{ color: 'success.main' }}>${inv.amount_paid.toFixed(2)}</TableCell>
                                    <TableCell sx={{ color: 'error.main', fontWeight: 'bold' }}>
                                        ${inv.remaining_balance.toFixed(2)}
                                    </TableCell>
                                    <TableCell>{getStatusChip(inv.status)}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}