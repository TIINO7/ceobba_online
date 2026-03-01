import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Grid, Chip, Card, CardContent, Button
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, 
    ResponsiveContainer, BarChart, Bar
} from 'recharts';
import logoImage from '../../../assets/logomini.PNG';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../../api'; // Import your configured Axios instance

export default function MainGrid() {
const [grades, setGrades] = useState([]);
    const [attendance, setAttendance] = useState([]);
    
    // Analytics State
    const [overallAverage, setOverallAverage] = useState(0);
    const [subjectAverages, setSubjectAverages] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [attendanceRate, setAttendanceRate] = useState(0);

    useEffect(() => {
        const fetchAcademicData = async () => {
            try {
                const [gradesRes, attendanceRes] = await Promise.all([
                    api.get('/portal/me/grades'),
                    api.get('/portal/me/attendance')
                ]);
                
                const fetchedGrades = gradesRes.data;
                const fetchedAttendance = attendanceRes.data;
                
                setGrades(fetchedGrades);
                setAttendance(fetchedAttendance);
                processAnalytics(fetchedGrades, fetchedAttendance);

            } catch (error) {
                console.error("Failed to fetch academic data", error);
            }
        };
        fetchAcademicData();
    }, []);

    const processAnalytics = (gradesData, attendanceData) => {
        if (gradesData.length > 0) {
            // 1. Overall Average
            const totalPercent = gradesData.reduce((sum, g) => sum + g.percentage, 0);
            setOverallAverage((totalPercent / gradesData.length).toFixed(1));

            // 2. Subject Averages (For Bar Chart)
            const subjectMap = {};
            gradesData.forEach(g => {
                if (!subjectMap[g.subject_name]) {
                    subjectMap[g.subject_name] = { total: 0, count: 0 };
                }
                subjectMap[g.subject_name].total += g.percentage;
                subjectMap[g.subject_name].count += 1;
            });
            
            const subAvgArray = Object.keys(subjectMap).map(sub => ({
                subject: sub,
                average: parseFloat((subjectMap[sub].total / subjectMap[sub].count).toFixed(1))
            }));
            setSubjectAverages(subAvgArray);

            // 3. Trend Data (For Line Chart)
            // Reversing the array so the graph reads left-to-right (oldest to newest)
            const chronological = [...gradesData].reverse().map(g => ({
                name: g.assessment_title.substring(0, 10) + '...', // Shorten long titles
                percentage: g.percentage,
                subject: g.subject_name
            }));
            setTrendData(chronological);
        }

        // 4. Attendance Rate
        if (attendanceData.length > 0) {
            const presentCount = attendanceData.filter(a => a.status === 'Present').length;
            setAttendanceRate(((presentCount / attendanceData.length) * 100).toFixed(1));
        }
    };

    // --- WEEKLY REPORT CARD GENERATOR ---
    const handleDownloadWeeklyReport = async () => {
    // --- 1. Filter grades from the last 7 days ---
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const weeklyGrades = grades.filter(g => {
        const gradeDate = new Date(g.date);
        return gradeDate >= sevenDaysAgo;
    });

    // --- 2. Initialize PDF ---
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // --- 3. Safely Load Logo Image ---
    const img = new Image();
    img.src = logoImage; // Assumes logoImage is imported at the top of your file
    
    await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; 
    });

    // --- 4. Premium Header Layout ---
    try {
        doc.addImage(img, 'PNG', 15, 12, 25, 25); 
    } catch (e) {
        console.warn("Logo could not be loaded into PDF.");
    }

    // Company Details (Right Aligned)
    doc.setFontSize(22);
    doc.setTextColor(44, 62, 80); // Premium dark slate
    doc.setFont(undefined, 'bold');
    doc.text('CEOBBA INSTITUTE', pageWidth - 15, 22, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setTextColor(127, 140, 141); // Soft gray
    doc.setFont(undefined, 'normal');
    doc.text('13421 Kuwadzana Ext, Harare, Zimbabwe', pageWidth - 15, 28, { align: 'right' });
    doc.text('Phone: 078 627 0643 | 077 237 5519', pageWidth - 15, 33, { align: 'right' });

    // Header Divider Line
    doc.setDrawColor(189, 195, 199);
    doc.setLineWidth(0.5);
    doc.line(15, 42, pageWidth - 15, 42);

    // --- 5. Document Title & Meta Info ---
    doc.setFontSize(16);
    doc.setTextColor(41, 128, 185); // Theme Blue
    doc.setFont(undefined, 'bold');
    doc.text('WEEKLY ACADEMIC REPORT', 15, 52);

    // Date Range Info
    doc.setFontSize(11);
    doc.setTextColor(44, 62, 80);
    doc.setFont(undefined, 'normal');
    doc.text(`Period: ${sevenDaysAgo.toLocaleDateString()} to ${new Date().toLocaleDateString()}`, 15, 60);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - 15, 60, { align: 'right' });

    // --- 6. Table Rendering ---
    if (weeklyGrades.length === 0) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'italic');
        doc.setTextColor(127, 140, 141);
        doc.text('No assessments were recorded in the last 7 days.', pageWidth / 2, 80, { align: 'center' });
    } else {
        autoTable(doc, {
            startY: 68,
            head: [['Date', 'Subject', 'Assessment', 'Score', '%', 'Comment']],
            body: weeklyGrades.map(g => [
                new Date(g.date).toLocaleDateString(),
                g.subject_name,
                g.assessment_title,
                `${g.score} / ${g.max_marks}`,
                `${g.percentage}%`,
                g.comment || '-'
            ]),
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
                fontSize: 10,
                cellPadding: 5
            },
            columnStyles: {
                1: { halign: 'left', fontStyle: 'bold' }, // Subject Name
                2: { halign: 'left' },                    // Assessment Title
                5: { halign: 'left', fontStyle: 'italic' } // Comment
            },
            willDrawCell: function(data) {
                // Apply dynamic coloring to the Percentage column (Index 4)
                if (data.column.index === 4 && data.cell.section === 'body') {
                    const percentValue = parseFloat(data.cell.raw);
                    if (!isNaN(percentValue)) {
                        if (percentValue >= 50) {
                            doc.setTextColor(39, 174, 96); // Passing Green
                        } else {
                            doc.setTextColor(231, 76, 60); // Failing Red
                        }
                    }
                }
            }
        });
    }
    
    // --- 7. Professional Footer ---
    // Ensure footer is placed correctly whether the table rendered or not
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 90; 

    doc.setDrawColor(189, 195, 199);
    doc.setLineWidth(0.5);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
    
    doc.setFontSize(9);
    doc.setTextColor(127, 140, 141);
    doc.setFont(undefined, 'normal');
    doc.text('Generated by CEOBBA Institute Academic System', pageWidth / 2, pageHeight - 8, { align: 'center' });

    // --- 8. Trigger Download ---
    doc.save(`Weekly_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
    const getGradeColor = (percentage) => {
        if (percentage >= 80) return 'success';
        if (percentage >= 50) return 'warning';
        return 'error';
    };

    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4">My Academics Dashboard</Typography>
                <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadWeeklyReport}
                >
                    Download Weekly Report
                </Button>
            </Box>

            {/* KPI CARDS */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ borderLeft: '5px solid #16d281', boxShadow: 2 }}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Overall Average</Typography>
                            <Typography variant="h3" color={overallAverage >= 50 ? 'success.main' : 'error.main'}>
                                {overallAverage}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ borderLeft: '5px solid #2196f3', boxShadow: 2 }}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Attendance Rate</Typography>
                            <Typography variant="h3" color="primary">
                                {attendanceRate}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ borderLeft: '5px solid #ff9800', boxShadow: 2 }}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Total Assessments Taken</Typography>
                            <Typography variant="h3" color="warning.main">
                                {grades.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* ANALYTICS GRAPHS */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: 350, boxShadow: 2 }}>
                        <Typography variant="h6" gutterBottom>Performance Over Time</Typography>
                        <ResponsiveContainer width="100%" height="90%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" fontSize={12} />
                                <YAxis domain={[0, 100]} />
                                <ChartTooltip />
                                <Line type="monotone" dataKey="percentage" stroke="#16d281" strokeWidth={3} dot={{ r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: 350, boxShadow: 2 }}>
                        <Typography variant="h6" gutterBottom>Average by Subject</Typography>
                        <ResponsiveContainer width="100%" height="90%">
                            <BarChart data={subjectAverages}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="subject" fontSize={12} />
                                <YAxis domain={[0, 100]} />
                                <ChartTooltip />
                                <Bar dataKey="average" fill="#2196f3" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>

            {/* DETAILED GRADES TABLE */}
            <Typography variant="h6" gutterBottom>Recent Results Feed</Typography>
            <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
                <Table size="small">
                    <TableHead sx={{ backgroundColor: '#16d281' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white' }}>Date</TableCell>
                            <TableCell sx={{ color: 'white' }}>Subject</TableCell>
                            <TableCell sx={{ color: 'white' }}>Assessment</TableCell>
                            <TableCell sx={{ color: 'white' }}>Score</TableCell>
                            <TableCell sx={{ color: 'white' }}>Percentage</TableCell>
                            <TableCell sx={{ color: 'white' }}>Teacher Comment</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {grades.length === 0 ? (
                            <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>No grades posted yet.</TableCell></TableRow>
                        ) : (
                            grades.map((g, idx) => (
                                <TableRow key={idx} hover>
                                    <TableCell>{new Date(g.date).toLocaleDateString()}</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>{g.subject_name}</TableCell>
                                    <TableCell>{g.assessment_title}</TableCell>
                                    <TableCell>{g.score} / {g.max_marks}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={`${g.percentage}%`} 
                                            color={getGradeColor(g.percentage)} 
                                            size="small" 
                                            sx={{ fontWeight: 'bold' }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                        {g.comment || '-'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}