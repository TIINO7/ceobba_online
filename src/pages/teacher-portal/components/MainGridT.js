import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Grid, Select, MenuItem, FormControl, InputLabel, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Chip, Card, CardContent, Button, Autocomplete, TextField, CircularProgress, 
    Divider, Avatar, useTheme, alpha
} from '@mui/material';
import logoImage from '../../../assets/logomini.PNG';
// Icons for visual polish
import DownloadIcon from '@mui/icons-material/Download';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AnalyticsIcon from '@mui/icons-material/Analytics';

// Recharts - Upgraded to AreaChart for a premium look
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../../api'; 

export default function MainGridT() {
    const theme = useTheme(); // For accessing theme colors programmatically

    // --- STATE MANAGEMENT (Unchanged) ---
    const [subjects, setSubjects] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedAssessment, setSelectedAssessment] = useState('');

    const [trendData, setTrendData] = useState([]);
    const [atRiskStudents, setAtRiskStudents] = useState([]);
    const [subjectMarksData, setSubjectMarksData] = useState([]);
    
    const [assessmentRoster, setAssessmentRoster] = useState([]);
    const [assessmentStats, setAssessmentStats] = useState({ highest: 0, lowest: 0, average: 0, max_marks: 100 });

    const [studentOptions, setStudentOptions] = useState([]);
    const [selectedSearchStudent, setSelectedSearchStudent] = useState(null);
    const [loadingSearch, setLoadingSearch] = useState(false);

    // --- LOGIC & API CALLS (Unchanged) ---
    useEffect(() => {
        api.get('/subjects/').then(res => setSubjects(res.data)).catch(console.error);
    }, []);

    useEffect(() => {
        if (!selectedSubject) return;

        api.get(`/academics/assessments/subject/${selectedSubject}`)
           .then(res => setAssessments(res.data)).catch(console.error);

        api.get(`/academics/subjects/${selectedSubject}/insights`)
           .then(res => {
               setTrendData(res.data.trend);
               setAtRiskStudents(res.data.students.filter(s => s.average < 50));
           }).catch(console.error);

        api.get(`/analytics/teacher/subjects/${selectedSubject}/marks`)
           .then(res => setSubjectMarksData(res.data)).catch(console.error);
           
        setSelectedAssessment(''); 
        setAssessmentRoster([]);
    }, [selectedSubject]);

    useEffect(() => {
        if (!selectedSubject || !selectedAssessment) return;

        const fetchAssessmentDetails = async () => {
            try {
                const selectedAssObj = assessments.find(a => a.id === selectedAssessment);
                const maxMarks = selectedAssObj ? selectedAssObj.max_marks : 100;

                const [classRes, gradesRes] = await Promise.all([
                    api.get(`/academics/subjects/${selectedSubject}/active-students`),
                    api.get(`/academics/grades/assessment/${selectedAssessment}`)
                ]);

                const existingGradesMap = {};
                gradesRes.data.forEach(g => { existingGradesMap[g.student_id] = g; });

                let highest = 0, lowest = 100, totalPercent = 0, gradedCount = 0;

                const roster = classRes.data.map(student => {
                    const gradeData = existingGradesMap[student.id];
                    let percent = null;
                    
                    if (gradeData && gradeData.score !== undefined) {
                        percent = (gradeData.score / maxMarks) * 100;
                        if (percent > highest) highest = percent;
                        if (percent < lowest) lowest = percent;
                        totalPercent += percent;
                        gradedCount++;
                    }

                    return {
                        name: `${student.first_name} ${student.surname}`,
                        score: gradeData ? gradeData.score : '-',
                        percent: percent !== null ? percent.toFixed(1) : '-',
                        comment: gradeData ? gradeData.comment : '-'
                    };
                });

                setAssessmentRoster(roster);
                setAssessmentStats({
                    max_marks: maxMarks,
                    highest: gradedCount > 0 ? highest.toFixed(1) : 0,
                    lowest: gradedCount > 0 ? lowest.toFixed(1) : 0,
                    average: gradedCount > 0 ? (totalPercent / gradedCount).toFixed(1) : 0
                });
            } catch (error) {
                console.error("Failed to load assessment details", error);
            }
        };
        fetchAssessmentDetails();
    }, [selectedSubject, selectedAssessment, assessments]);

    const handleStudentSearch = async (event, newInputValue) => {
        if (!newInputValue) return;
        setLoadingSearch(true);
        try {
            const response = await api.get(`/analytics/teacher/students/search?q=${newInputValue}`);
            setStudentOptions(response.data || []);
        } catch (error) {
            console.error("Failed to search students", error);
        } finally {
            setLoadingSearch(false);
        }
    };

    // --- PDF GENERATORS (Unchanged) ---
// --- 1. INDIVIDUAL STUDENT COMPREHENSIVE REPORT ---
const handleDownloadStudentReport = async () => {
    if (!selectedSearchStudent) return;
    try {
        const response = await api.get(`/analytics/teacher/students/${selectedSearchStudent.id}/report`);
        const reportData = response.data;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        // Safely Load Logo
        const img = new Image();
        img.src = logoImage; 
        await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });

        // Header Section
        try { doc.addImage(img, 'PNG', 15, 12, 25, 25); } catch (e) { console.warn("Logo failed to load."); }
        doc.setFontSize(22); doc.setTextColor(44, 62, 80); doc.setFont(undefined, 'bold');
        doc.text('CEOBBA INSTITUTE', pageWidth - 15, 22, { align: 'right' });
        
        doc.setFontSize(10); doc.setTextColor(127, 140, 141); doc.setFont(undefined, 'normal');
        doc.text('13421 Kuwadzana Ext, Harare, Zimbabwe', pageWidth - 15, 28, { align: 'right' });
        doc.text('Phone: 078 627 0643 | 077 237 5519', pageWidth - 15, 33, { align: 'right' });
        
        doc.setDrawColor(189, 195, 199); doc.setLineWidth(0.5); doc.line(15, 42, pageWidth - 15, 42);

        // Title & Meta Info
        doc.setFontSize(16); doc.setTextColor(41, 128, 185); doc.setFont(undefined, 'bold');
        doc.text("COMPREHENSIVE ACADEMIC REPORT", 15, 52);

        doc.setFontSize(11); doc.setTextColor(44, 62, 80);
        // Left Column
        doc.setFont(undefined, 'bold'); doc.text('Student Details:', 15, 62);
        doc.setFont(undefined, 'normal');
        doc.text(`Name: ${reportData.student_name}`, 15, 69);
        doc.text(`Grade/Level: ${reportData.grade_level}`, 15, 75);
        // Right Column
        doc.setFont(undefined, 'bold'); doc.text('Report Details:', pageWidth - 70, 62);
        doc.setFont(undefined, 'normal');
        doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, pageWidth - 70, 69);

        // Table Data Prep
        const tableColumns = ["Subject", "Average Mark", "Status","Teacher Comments"];
        const tableRows = [];
        let totalMarks = 0;

        reportData.marks.forEach(item => {
            const markNum = Number(item.mark);
            const status = markNum >= 50 ? "Pass" : "Fail";
            tableRows.push([item.subject, `${markNum}%`, status, item.comment]);
            totalMarks += markNum;
        });

        const overallAverage = reportData.marks.length > 0 ? (totalMarks / reportData.marks.length).toFixed(2) : 0;

        // Render Table
        autoTable(doc, {
            head: [tableColumns],
            body: tableRows,
            startY: 85,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', halign: 'center' },
            bodyStyles: { textColor: [44, 62, 80], fontSize: 10, cellPadding: 5 },
            columnStyles: { 
                0: { halign: 'left', fontStyle: 'bold', cellWidth: 40 }, // Subject
                1: { halign: 'center', cellWidth: 25 },                // Mark
                2: { halign: 'center', cellWidth: 20 },                // Status
                3: { halign: 'left', fontStyle: 'italic' }             // Comments (takes remaining space)
            },
            willDrawCell: function(data) {
                if (data.column.index === 2 && data.cell.section === 'body') {
                    if (data.cell.raw === 'Fail') doc.setTextColor(231, 76, 60);
                    else doc.setTextColor(39, 174, 96);
                }
            },
        });

        // Summary Callout Box
        const finalY = doc.lastAutoTable.finalY + 15;
        doc.setFillColor(241, 242, 246);
        doc.rect(pageWidth - 85, finalY, 70, 22, 'F');
        doc.setFontSize(12); doc.setFont(undefined, 'bold'); doc.setTextColor(44, 62, 80);
        doc.text('Overall Average:', pageWidth - 80, finalY + 14);
        
        // Color the total based on pass/fail
        const isPassing = overallAverage >= 50;
        doc.setTextColor(isPassing ? 39 : 231, isPassing ? 174 : 76, isPassing ? 96 : 60);
        doc.text(`${overallAverage}%`, pageWidth - 20, finalY + 14, { align: 'right' });

        // Footer
        doc.setDrawColor(189, 195, 199); doc.setLineWidth(0.5); doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
        doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(127, 140, 141);
        doc.text('Generated by CEOBBA Institute Academic System', pageWidth / 2, pageHeight - 13, { align: 'center' });

        doc.save(`${reportData.student_name.replace(" ", "_")}_Report.pdf`);
    } catch (error) {
        console.error("Failed to generate report", error);
        alert("Failed to generate the report. Please try again.");
    }
};


// --- 2. CLASS ASSESSMENT REPORT ---
const handleDownloadReport = async () => {
    const subjectName = subjects.find(s => s.id === selectedSubject)?.name || 'Subject';
    const assessmentName = assessments.find(a => a.id === selectedAssessment)?.title || 'Assessment';
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Safely Load Logo
    const img = new Image();
    img.src = logoImage;
    await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });

    // Header Section
    try { doc.addImage(img, 'PNG', 15, 12, 25, 25); } catch (e) { console.warn("Logo failed to load."); }
    doc.setFontSize(22); doc.setTextColor(44, 62, 80); doc.setFont(undefined, 'bold');
    doc.text('CEOBBA INSTITUTE', pageWidth - 15, 22, { align: 'right' });
    
    doc.setFontSize(10); doc.setTextColor(127, 140, 141); doc.setFont(undefined, 'normal');
    doc.text('123 Education Avenue, Harare, Zimbabwe', pageWidth - 15, 28, { align: 'right' });
    doc.text('Phone: 0771683674 | Email: info@ceobba.ac.zw', pageWidth - 15, 33, { align: 'right' });
    
    doc.setDrawColor(189, 195, 199); doc.setLineWidth(0.5); doc.line(15, 42, pageWidth - 15, 42);

    // Title & Meta Info (Using your original green accent color here)
    doc.setFontSize(16); doc.setTextColor(22, 210, 129); doc.setFont(undefined, 'bold');
    doc.text("CLASS ASSESSMENT REPORT", 15, 52);

    doc.setFontSize(11); doc.setTextColor(44, 62, 80);
    // Left Column
    doc.setFont(undefined, 'bold'); doc.text('Assessment Details:', 15, 62);
    doc.setFont(undefined, 'normal');
    doc.text(`Subject: ${subjectName}`, 15, 69);
    doc.text(`Assessment: ${assessmentName}`, 15, 75);
    // Right Column
    doc.setFont(undefined, 'bold'); doc.text('Class Statistics:', pageWidth - 70, 62);
    doc.setFont(undefined, 'normal');
    doc.text(`Class Average: ${assessmentStats.average}%`, pageWidth - 70, 69);
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, pageWidth - 70, 75);

    // Render Table
    autoTable(doc, {
        startY: 85,
        head: [['Student Name', 'Mark', '%', 'Teacher Comment']],
        body: assessmentRoster.map(s => [
            s.name, 
            s.score !== '-' ? `${s.score}/${assessmentStats.max_marks}` : 'Not Graded', 
            s.percent !== '-' ? `${s.percent}%` : '-', 
            s.comment
        ]),
        theme: 'grid',
        headStyles: { fillColor: [22, 210, 129], textColor: 255, fontStyle: 'bold', halign: 'center' },
        bodyStyles: { halign: 'center', textColor: [44, 62, 80], fontSize: 10, cellPadding: 6 },
        columnStyles: { 
            0: { halign: 'left', fontStyle: 'bold' }, // Bold student names
            3: { halign: 'left', fontStyle: 'italic' } // Italicize comments
        }
    });

    // Footer
    doc.setDrawColor(189, 195, 199); doc.setLineWidth(0.5); doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
    doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(127, 140, 141);
    doc.text('Generated by CEOBBA Institute Academic System', pageWidth / 2, pageHeight - 13, { align: 'center' });

    doc.save(`${subjectName}_${assessmentName}_Report.pdf`);
};

    // --- REFINED UI ---
    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" display="flex" alignItems="center" gap={1.5} gutterBottom>
                    <AnalyticsIcon color="primary" fontSize="large" /> 
                    Teacher Analytics & Reports
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Gain deep insights into class performance, identify at-risk students, and generate comprehensive PDF reports.
                </Typography>
            </Box>
            
            {/* CONTROL PANEL: Polished Selection Card */}
            <Card variant="outlined" sx={{ mb: 4, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <Grid container>
                    {/* Class Context Area */}
                    <Grid item xs={12} md={7} sx={{ p: 3, borderRight: { md: '1px solid', xs: 'none' }, borderColor: 'divider' }}>
                        <Typography variant="overline" color="text.secondary" fontWeight="bold" letterSpacing={1} mb={2} display="block">
                            Class Overview Filters
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                            <FormControl sx={{ minWidth: 200, flex: 1 }}>
                                <InputLabel>Select Subject</InputLabel>
                                <Select value={selectedSubject} label="Select Subject" onChange={(e) => setSelectedSubject(e.target.value)}>
                                    {subjects.map(sub => <MenuItem key={sub.id} value={sub.id}>{sub.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl sx={{ minWidth: 200, flex: 1 }} disabled={!selectedSubject}>
                                <InputLabel>Select Assessment (Optional)</InputLabel>
                                <Select value={selectedAssessment} label="Select Assessment (Optional)" onChange={(e) => setSelectedAssessment(e.target.value)}>
                                    <MenuItem value=""><em>-- View Subject Overview --</em></MenuItem>
                                    {assessments.map(ass => <MenuItem key={ass.id} value={ass.id}>{ass.title}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </Grid>

                    {/* Student Report Area */}
                    <Grid item xs={40} md={15} sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                        <Typography variant="overline" color="primary.main" fontWeight="bold" letterSpacing={1} mb={2} display="flex" alignItems="center" gap={1}>
                            <PersonSearchIcon fontSize="small" /> Individual Student Report
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Autocomplete
                                sx={{ flex: 1, bgcolor: 'background.paper' }}
                                options={studentOptions}
                                getOptionLabel={(option) => option.name}
                                filterOptions={(x) => x}
                                onInputChange={handleStudentSearch}
                                onChange={(event, newValue) => setSelectedSearchStudent(newValue)}
                                renderInput={(params) => (
                                    <TextField 
                                        {...params} 
                                        label="Search byName" 
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <React.Fragment>
                                                    {loadingSearch ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </React.Fragment>
                                            ),
                                        }}
                                    />
                                )}
                            />
                            <Button 
                                variant="outlined" 
                                size="medium"
                                startIcon={<DownloadIcon />} 
                                disabled={!selectedSearchStudent}
                                onClick={handleDownloadStudentReport}
                                sx={{ height: 46, boxShadow: 0 }}
                            >
                                PDF
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Card>

            {/* SUBJECT OVERVIEW TIER */}
            {selectedSubject && !selectedAssessment && (
                <Grid container spacing={3}>
                    {/* Subject Marks Table */}
                    <Grid item xs={12} md={8}>
                        <Card variant="outlined" sx={{ height: 400, display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
                            <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.text.primary, 0.02) }}>
                                <Typography variant="h6" fontWeight="bold">Student Performance Roster</Typography>
                            </Box>
                            <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
                                <Table stickyHeader size="medium">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>First Name</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Surname</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Average Mark</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {subjectMarksData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                                    No marks recorded for this subject yet.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            subjectMarksData.map((row, index) => (
                                                <TableRow key={row.id} hover sx={{ bgcolor: index % 2 === 0 ? 'transparent' : alpha(theme.palette.action.hover, 0.4) }}>
                                                    <TableCell>{row.student_name}</TableCell>
                                                    <TableCell>{row.surname}</TableCell>
                                                    <TableCell>
                                                        <Chip 
                                                            label={`${row.mark}%`} 
                                                            size="small"
                                                            color={row.mark >= 50 ? 'success' : 'error'} 
                                                            variant={row.mark >= 50 ? 'outlined' : 'filled'}
                                                            sx={{ fontWeight: 'bold', minWidth: 60 }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Card>
                    </Grid>

                    {/* Needs Attention Radar */}
                    <Grid item xs={12} md={4}>
                        <Card variant="outlined" sx={{ height: 400, borderTop: `4px solid ${theme.palette.error.main}`, borderRadius: 2, overflowY: 'auto' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" color="error.main" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <WarningAmberIcon sx={{ mr: 1 }} /> Needs Attention
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Students averaging below 50% in this subject.
                                </Typography>
                                
                                {atRiskStudents.length === 0 ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, opacity: 0.7 }}>
                                        <EmojiEventsIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                                        <Typography variant="body1" fontWeight="bold" color="success.main">All Clear!</Typography>
                                        <Typography variant="body2" color="text.secondary">Every student is passing.</Typography>
                                    </Box>
                                ) : (
                                    atRiskStudents.map((student, idx) => (
                                        <Box key={idx} sx={{ 
                                            p: 2, mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            bgcolor: alpha(theme.palette.error.main, 0.05), borderRadius: 1, border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.1)
                                        }}>
                                            <Typography variant="body1" fontWeight="medium">{student.name}</Typography>
                                            <Typography variant="body1" color="error.main" fontWeight="bold">{student.average}%</Typography>
                                        </Box>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                    
                    {/* Modern Area Chart */}
                    <Grid item xs={12}>
                        <Card variant="outlined" sx={{ p: 3, height: 400, borderRadius: 2 }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>Class Average Over Time</Typography>
                            {trendData.length === 0 ? (
                                <Box display="flex" justifyContent="center" alignItems="center" height="80%">
                                    <Typography color="text.secondary">No assessments recorded yet to chart.</Typography>
                                </Box>
                            ) : (
                                <ResponsiveContainer width="100%" height="90%">
                                    <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                                        <XAxis dataKey="assessment" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} dy={10} />
                                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                                        <ChartTooltip 
                                            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                            itemStyle={{ color: theme.palette.primary.main, fontWeight: 'bold' }}
                                        />
                                        <Area type="monotone" dataKey="average" name="Class Average %" stroke={theme.palette.primary.main} strokeWidth={3} fillOpacity={1} fill="url(#colorAvg)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* ASSESSMENT DRILL-DOWN TIER */}
            {selectedAssessment && (
                <Box sx={{ animation: 'fadeIn 0.5s ease-in-out' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, mt: 2 }}>
                        <Typography variant="h5" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                            <AssignmentIcon color="primary" /> Assessment Breakdown
                        </Typography>
                        <Button variant="contained" color="primary" startIcon={<DownloadIcon />} onClick={handleDownloadReport} sx={{ boxShadow: 0 }}>
                            Generate Class Report
                        </Button>
                    </Box>

                    {/* Premium Stat Cards */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={4}>
                            <Card variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 3, gap: 2.5, borderRadius: 2 }}>
                                <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', width: 60, height: 60 }}>
                                    <EmojiEventsIcon fontSize="large" />
                                </Avatar>
                                <Box>
                                    <Typography color="text.secondary" variant="body2" fontWeight="bold" textTransform="uppercase">Highest Score</Typography>
                                    <Typography variant="h4" fontWeight="bold" color="success.main">{assessmentStats.highest}%</Typography>
                                </Box>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Card variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 3, gap: 2.5, borderRadius: 2 }}>
                                <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main', width: 60, height: 60 }}>
                                    <TrendingFlatIcon fontSize="large" />
                                </Avatar>
                                <Box>
                                    <Typography color="text.secondary" variant="body2" fontWeight="bold" textTransform="uppercase">Class Average</Typography>
                                    <Typography variant="h4" fontWeight="bold" color="warning.main">{assessmentStats.average}%</Typography>
                                </Box>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Card variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 3, gap: 2.5, borderRadius: 2 }}>
                                <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', width: 60, height: 60 }}>
                                    <TrendingDownIcon fontSize="large" />
                                </Avatar>
                                <Box>
                                    <Typography color="text.secondary" variant="body2" fontWeight="bold" textTransform="uppercase">Lowest Score</Typography>
                                    <Typography variant="h4" fontWeight="bold" color="error.main">{assessmentStats.lowest}%</Typography>
                                </Box>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Polished Detailed Table */}
                    <Card variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                        <TableContainer>
                            <Table size="medium">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.05rem' }}>Student Name</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.05rem' }}>Mark Obtained</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.05rem' }}>Percentage</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.05rem' }}>Teacher Comment</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {assessmentRoster.map((student, idx) => (
                                        <TableRow key={idx} hover sx={{ bgcolor: idx % 2 === 0 ? 'transparent' : alpha(theme.palette.action.hover, 0.2) }}>
                                            <TableCell sx={{ fontWeight: 'medium' }}>{student.name}</TableCell>
                                            <TableCell sx={{ color: 'text.secondary' }}>
                                                {student.score !== '-' ? `${student.score} / ${assessmentStats.max_marks}` : 'Not Graded'}
                                            </TableCell>
                                            <TableCell>
                                                {student.percent !== '-' ? (
                                                    <Chip 
                                                        label={`${student.percent}%`} 
                                                        color={student.percent >= 50 ? "success" : "error"} 
                                                        size="small" 
                                                        variant={student.percent >= 80 ? "filled" : "outlined"}
                                                        sx={{ fontWeight: 'bold', minWidth: 60 }}
                                                    />
                                                ) : <Typography variant="body2" color="text.disabled">-</Typography>}
                                            </TableCell>
                                            <TableCell sx={{ fontStyle: 'italic', color: student.comment !== '-' ? 'text.primary' : 'text.disabled' }}>
                                                {student.comment}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {assessmentRoster.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                                No students found in this assessment roster.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                </Box>
            )}
        </Box>
    );
}