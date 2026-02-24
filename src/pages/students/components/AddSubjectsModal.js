import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Box,
} from '@mui/material';
import api from '../../../api';

/**
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - studentId: number
 */
export default function AddSubjectsModal({ open, onClose, studentId }) {
  const [allSubjects, setAllSubjects] = useState([]);
  const [checkedSubjectIds, setCheckedSubjectIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && studentId != null) {
      setLoading(true);
      Promise.all([
        api.get('/subjects/'),
        api.get('students/subjects', { params: { student_id: studentId } }),
      ])
        .then(([allRes, enrolledRes]) => {
          setAllSubjects(allRes.data);
          setCheckedSubjectIds(enrolledRes.data.map((s) => s.id));
        })
        .catch((err) => {
          console.error('Error fetching subjects:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [open, studentId]);

  const handleToggle = (subjectId) => {
    setCheckedSubjectIds((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSubmit = () => {
    setSubmitting(true);
    api.post(`students/subjects/${studentId}`, checkedSubjectIds)
      .then(() => {
        onClose();
      })
      .catch((err) => {
        console.error('Error enrolling subjects:', err);
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Manage Subjects</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <FormGroup>
            {allSubjects.map((subject) => (
              <FormControlLabel
                key={subject.id}
                control={
                  <Checkbox
                    checked={checkedSubjectIds.includes(subject.id)}
                    onChange={() => handleToggle(subject.id)}
                  />
                }
                label={subject.name}
              />
            ))}
          </FormGroup>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button onClick={handleSubmit} variant="outlined" disabled={submitting || loading}>
          {submitting ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
