import React, { useState, useEffect } from 'react';
import axios from 'axios';

function SubmissionForm({ submissionId, onCancel }) {
  const [formData, setFormData] = useState({ title: '', description: '', github_url: '', tech_stack: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (submissionId) {
      axios.get(`${process.env.REACT_APP_API_URL}/api/submissions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        const submission = res.data.find(sub => sub.id === submissionId);
        if (submission) {
          setFormData({
            title: submission.title,
            description: submission.description,
            github_url: submission.github_url,
            tech_stack: submission.tech_stack
          });
        }
      });
    }
  }, [submissionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.github_url) newErrors.github_url = 'GitHub URL is required';
    if (!formData.tech_stack) newErrors.tech_stack = 'Tech stack is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    try {
      if (submissionId) {
        await axios.patch(`${process.env.REACT_APP_API_URL}/api/submissions/${submissionId}`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/api/submit`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
      alert(submissionId ? 'Project updated!' : 'Project submitted!');
      window.location.href = '/dashboard';
    } catch (error) {
      setErrors({ general: error.response?.data?.message || 'Operation failed' });
    }
  };

  return (
    <div className="card p-4 mx-auto mb-4" style={{ maxWidth: '600px' }}>
      <h2>{submissionId ? 'Edit Project' : 'Submit Project'}</h2>
      {errors.general && <div className="alert alert-danger">{errors.general}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Title</label>
          <input
            type="text"
            className={`form-control ${errors.title ? 'is-invalid' : ''}`}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          {errors.title && <div className="invalid-feedback">{errors.title}</div>}
        </div>
        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea
            className={`form-control ${errors.description ? 'is-invalid' : ''}`}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          ></textarea>
          {errors.description && <div className="invalid-feedback">{errors.description}</div>}
        </div>
        <div className="mb-3">
          <label className="form-label">GitHub URL</label>
          <input
            type="url"
            className={`form-control ${errors.github_url ? 'is-invalid' : ''}`}
            value={formData.github_url}
            onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
          />
          {errors.github_url && <div className="invalid-feedback">{errors.github_url}</div>}
        </div>
        <div className="mb-3">
          <label className="form-label">Tech Stack (comma-separated)</label>
          <input
            type="text"
            className={`form-control ${errors.tech_stack ? 'is-invalid' : ''}`}
            value={formData.tech_stack}
            onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
          />
          {errors.tech_stack && <div className="invalid-feedback">{errors.tech_stack}</div>}
        </div>
        <button type="submit" className="btn btn-primary bg-gradient me-2">
          {submissionId ? 'Update' : 'Submit'}
        </button>
        {submissionId && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </form>
    </div>
  );
}

export default SubmissionForm;