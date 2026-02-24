import React, { useEffect, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  CircularProgress
} from "@mui/material";
import api from '../../../api'

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 4
};

const AddSubjectsModal = ({ open, onClose, studentId }) => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all subjects
  useEffect(() => {
    if (open) {
      api.get("/subjects/all_subjects")
        .then((res) => setSubjects(res.data))
        .catch((err) => console.error(err));
    }
  }, [open]);

  const handleToggle = (subjectId) => {
    setSelectedSubjects((prevSelected) =>
      prevSelected.includes(subjectId)
        ? prevSelected.filter((id) => id !== subjectId)
        : [...prevSelected, subjectId]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post(`/students/subjects/${studentId}`, selectedSubjects, {
        headers: { "Content-Type": "application/json" }
      });
      onClose(); // Close modal on success
    } catch (error) {
      console.error("Error enrolling student:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6" gutterBottom>
          Enroll Student in Subjects
        </Typography>

        <List dense>
          {subjects.map((subject) => (
            <ListItem key={subject.id} disablePadding>
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={selectedSubjects.includes(subject.id)}
                  onChange={() => handleToggle(subject.id)}
                />
              </ListItemIcon>
              <ListItemText primary={subject.name} />
            </ListItem>
          ))}
        </List>

        <Box mt={2} display="flex" justifyContent="flex-end" gap={2}>
          <Button onClick={onClose} color="secondary" variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            color="primary"
            variant="contained"
            disabled={loading || selectedSubjects.length === 0}
          >
            {loading ? <CircularProgress size={20} /> : "Submit"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default AddSubjectsModal;
