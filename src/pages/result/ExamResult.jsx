import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config/middleware_config'; // adjust path if needed

/** Safely join base + path.
 * - If `path` is absolute (http/https), return it.
 * - Otherwise, join BASE_URL + API_PREFIX + route and normalize slashes.
 */
function joinUrl(base, path = '') {
  if (!base) return path || '';
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path; // absolute route in env
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path.slice(1) : path;
  return `${b}/${p}`;
}

// Build base from env (works with "" or "/api")
const API_BASE = joinUrl(config.BASE_URL || '', config.API_PREFIX || '');
// Final endpoint from env (works with "/exam-result" or full absolute URL)
const EXAM_RESULT_API = joinUrl(API_BASE, config.EXAM_RESULT_ROUTE || '/exam-result');

const initialForm = {
  examresultid: '',
  examresult_examid: '',
  examstudentid: '',
  exammarksobtained: '',
  examgrade: '',
  examremarks: '',
  createdat: '',
  updatedat: ''
};

export default function ExamResult() {
  const [results, setResults] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fetchResults = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(EXAM_RESULT_API);
      const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      setResults(data);
    } catch {
      setError('Failed to load results.');
    }
    setLoading(false);
  };

  useEffect(() => { fetchResults(); }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const openModal = (result = null) => {
    setShowModal(true);
    setError('');
    setSuccess('');
    if (result) {
      setForm({
        ...result,
        exammarksobtained: result.exammarksobtained ?? '',
        createdat: result.createdat ? result.createdat.substring(0, 19) : '',
        updatedat: result.updatedat ? result.updatedat.substring(0, 19) : '',
      });
      setEditingId(result.examresultid);
    } else {
      setForm(initialForm);
      setEditingId(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (editingId) {
        await axios.put(`${EXAM_RESULT_API}/${encodeURIComponent(editingId)}`, form);
        setSuccess('Exam result updated.');
      } else {
        await axios.post(EXAM_RESULT_API, form);
        setSuccess('Exam result added.');
      }
      fetchResults();
      closeModal();
    } catch {
      setError('Failed to save result. Check data.');
    }
    setLoading(false);
  };

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this result?')) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.delete(`${EXAM_RESULT_API}/${encodeURIComponent(id)}`);
      setSuccess('Exam result deleted.');
      fetchResults();
    } catch {
      setError('Failed to delete.');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 1200, margin: 'auto', padding: 20 }}>
      <h2>Exam Results</h2>
      <button
        style={{ background: '#4f8cff', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 4, marginBottom: 12, cursor: 'pointer' }}
        onClick={() => openModal()}
      >
        + Add Result
      </button>
      {error && <div style={{ color: 'red', margin: 8 }}>{error}</div>}
      {success && <div style={{ color: 'green', margin: 8 }}>{success}</div>}
      {loading && <div>Loading...</div>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#e8eaf6' }}>
          <tr>
            <th style={th}>Result ID</th>
            <th style={th}>Exam ID</th>
            <th style={th}>Student ID</th>
            <th style={th}>Marks</th>
            <th style={th}>Grade</th>
            <th style={th}>Remarks</th>
            <th style={th}>Created At</th>
            <th style={th}>Updated At</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {results.length === 0 && (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center' }}>No results found.</td>
            </tr>
          )}
          {results.map(result => (
            <tr key={result.examresultid} style={{ borderBottom: '1px solid #eee' }}>
              <td style={td}>{result.examresultid}</td>
              <td style={td}>{result.examresult_examid}</td>
              <td style={td}>{result.examstudentid}</td>
              <td style={td}>{result.exammarksobtained}</td>
              <td style={td}>{result.examgrade}</td>
              <td style={td}>{result.examremarks}</td>
              <td style={td}>{result.createdat?.substring(0, 19)}</td>
              <td style={td}>{result.updatedat?.substring(0, 19)}</td>
              <td style={td}>
                <button onClick={() => openModal(result)} style={actionBtn}>Edit</button>
                <button onClick={() => handleDelete(result.examresultid)} style={{ ...actionBtn, background: '#e53935' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div style={modalBackdrop}>
          <div style={modalStyle}>
            <h3>{editingId ? 'Edit Exam Result' : 'Add Exam Result'}</h3>
            <form onSubmit={handleSubmit}>
              {[
                { name: 'examresultid', label: 'Result ID', disabled: !!editingId, required: false },
                { name: 'examresult_examid', label: 'Exam ID', required: true },
                { name: 'examstudentid', label: 'Student ID', required: true },
                { name: 'exammarksobtained', label: 'Marks Obtained', type: 'number', step: '0.01' },
                { name: 'examgrade', label: 'Grade' },
                { name: 'examremarks', label: 'Remarks' },
                { name: 'createdat', label: 'Created At', type: 'datetime-local' },
                { name: 'updatedat', label: 'Updated At', type: 'datetime-local' }
              ].map(f => (
                <div key={f.name} style={{ marginBottom: 10 }}>
                  <label>
                    {f.label}
                    <input
                      type={f.type || 'text'}
                      name={f.name}
                      value={form[f.name]}
                      disabled={f.disabled}
                      step={f.step}
                      onChange={handleChange}
                      style={{ marginLeft: 8, padding: 5, width: '75%' }}
                      required={!!f.required}
                    />
                  </label>
                </div>
              ))}
              <div style={{ marginTop: 18 }}>
                <button type="submit" style={{ ...actionBtn, marginRight: 8, background: '#43a047' }} disabled={loading}>
                  {editingId ? 'Update' : 'Add'}
                </button>
                <button type="button" style={actionBtn} onClick={closeModal} disabled={loading}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const th = { padding: 8, border: '1px solid #d1c4e9', fontWeight: 'bold', background: '#e8eaf6' };
const td = { padding: 8, border: '1px solid #ede7f6', textAlign: 'center' };
const actionBtn = { background: '#3949ab', color: 'white', border: 'none', borderRadius: 4, padding: '6px 12px', marginRight: 4, cursor: 'pointer' };
const modalBackdrop = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 };
const modalStyle = { background: '#fff', padding: 30, borderRadius: 8, boxShadow: '0 2px 16px rgba(0,0,0,0.15)', minWidth: 350, maxWidth: 400 };
