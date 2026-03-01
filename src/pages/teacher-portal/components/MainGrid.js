import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Button, TextField, Select, MenuItem, FormControl, 
    InputLabel, Paper, Grid, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Snackbar, Alert, Chip 
} from '@mui/material';

import api from '../../../api'; // Import your configured Axios instance

export default function MainGrid() {const [subjects, setSubjects] = useState([]);
    const [activeStudents, setActiveStudents] = useState([]);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

    // Form State
    const [formData, setFormData] = useState({
        subject_id: '',
        title: '',
        max_marks: 100,
        due_date: new Date().toISOString().split('T')[0]
    });

    // Grades State (Map of student_id -> { score, comment })
    const [grades, setGrades] = useState({});

    // 1. Load subjects on component mount
    useEffect(() => {
        api.get('/subjects/')
           .then(res => setSubjects(res.data))
           .catch(() => showNotification("Failed to load subjects", "error"));
    }, []);

    // 2. Load active students when a subject is selected
    useEffect(() => {
        if (!formData.subject_id) {
            setActiveStudents([]);
            setGrades({});
            return;
        }

        api.get(`/academics/subjects/${formData.subject_id}/active-students`)
           .then(res => {
               setActiveStudents(res.data);
               // Initialize empty grades for the roster
               const initialGrades = {};
               res.data.forEach(student => {
                   initialGrades[student.id] = { score: '', comment: '' };
               });
               setGrades(initialGrades);
           })
           .catch(() => showNotification("Failed to load active students", "error"));
    }, [formData.subject_id]);

    // Handle grade inputs
    const handleGradeChange = (studentId, field, value) => {
        setGrades(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value
            }
        }));
    };

    // Calculate percentage on the fly
    const calculatePercentage = (score) => {
        if (score === '' || !formData.max_marks || formData.max_marks <= 0) return '-';
        const percent = (parseFloat(score) / formData.max_marks) * 100;
        return `${percent.toFixed(1)}%`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Format payload to match the backend AssessmentWithGrades schema
        const gradesList = activeStudents
            .filter(student => grades[student.id].score !== '') // Only submit students with a score
            .map(student => ({
                student_id: student.id,
                score: parseFloat(grades[student.id].score),
                comment: grades[student.id].comment
            }));

        if (gradesList.length === 0) {
            showNotification("Please enter at least one grade to submit.", "warning");
            return;
        }

        const payload = {
            subject_id: formData.subject_id,
            title: formData.title,
            due_date: formData.due_date,
            max_marks: formData.max_marks,
            grades: gradesList
        };

        try {
            const res = await api.post('/academics/record-marks', payload);
            showNotification(res.data.message, "success");
            
            // Reset form for the next assessment
            setFormData({ ...formData, title: '' });
            const resetGrades = {};
            activeStudents.forEach(s => resetGrades[s.id] = { score: '', comment: '' });
            setGrades(resetGrades);
            
        } catch (error) {
            showNotification(error.response?.data?.detail || "Error saving marks", "error");
        }
    };

    const showNotification = (msg, severity = 'info') => setNotification({ open: true, message: msg, severity });

    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
            <Typography variant="h4" gutterBottom>Record Class Marks</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Fill in the assessment details below and enter the marks for the active enrolled students. The system will automatically calculate their percentages.
            </Typography>
            
            <form onSubmit={handleSubmit}>
                {/* TOP SECTION: Assessment Details */}
                <Paper sx={{ p: 3, mb: 4, borderTop: '4px solid #16d281' }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth required>
                                <InputLabel>Subject</InputLabel>
                                <Select
                                    value={formData.subject_id}
                                    label="Subject"
                                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                                >
                                    {subjects.map(sub => (
                                        <MenuItem key={sub.id} value={sub.id}>{sub.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField 
                                required fullWidth label="Assessment Title" 
                                placeholder="e.g. Midterm Exam"
                                value={formData.title} 
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField 
                                required fullWidth type="number" label="Total Marks" 
                                value={formData.max_marks} 
                                onChange={(e) => setFormData({ ...formData, max_marks: parseInt(e.target.value) })} 
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField 
                                required fullWidth type="date" label="Date of Assessment" 
                                InputLabelProps={{ shrink: true }}
                                value={formData.due_date} 
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} 
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* BOTTOM SECTION: Grade Roster */}
                {formData.subject_id && (
                    <Paper sx={{ p: 2 }}>
                        <TableContainer>
                            <Table size="small">
                                <TableHead sx={{ backgroundColor: '#16d281' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Student ID</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Student Name</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Mark Obtained</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Percentage</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>Teacher Feedback</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {activeStudents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                                No active students are currently enrolled in this subject.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        activeStudents.map((student) => {
                                            const score = grades[student.id]?.score || '';
                                            return (
                                                <TableRow key={student.id} hover>
                                                    <TableCell>#{student.id}</TableCell>
                                                    <TableCell>{student.first_name} {student.surname}</TableCell>
                                                    <TableCell>
                                                        <TextField 
                                                            size="small" type="number" 
                                                            placeholder={`/ ${formData.max_marks}`}
                                                            value={score} 
                                                            onChange={(e) => handleGradeChange(student.id, 'score', e.target.value)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip 
                                                            label={calculatePercentage(score)} 
                                                            color={score ? "primary" : "default"} 
                                                            variant={score ? "filled" : "outlined"}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField 
                                                            size="small" fullWidth placeholder="Optional comment..."
                                                            value={grades[student.id]?.comment || ''} 
                                                            onChange={(e) => handleGradeChange(student.id, 'comment', e.target.value)}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button 
                                type="submit" variant="contained" color="success" size="large" 
                                disabled={activeStudents.length === 0}
                            >
                                Submit All Marks
                            </Button>
                        </Box>
                    </Paper>
                )}
            </form>

            <Snackbar open={notification.open} autoHideDuration={4000} onClose={() => setNotification({ ...notification, open: false })}>
                <Alert severity={notification.severity} sx={{ width: '100%' }}>{notification.message}</Alert>
            </Snackbar>
        </Box>
    );
}