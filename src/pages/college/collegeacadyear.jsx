import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import config from "../../config/middleware_config";
import "../../index.css";

// ---- Safe URL joiner (prevents double slashes)
function joinUrl(base = "", path = "") {
  if (!base) return path || "";
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path;
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${b}/${p}`;
}

// Build routes from env-driven config
const API = joinUrl(config.MASTER_ACADYEAR_ROUTE);
const DEPTS_API = joinUrl(config.MASTER_DEPTS_ROUTE);

const initialForm = {
  id: "",
  collegeid: "",
  collegedeptid: "",
  collegeacadyear: "",
  collegeacadyearsemester: "",
  collegeacadyearname: "",
  collegeacadyeartype: "",
  collegeacadyearstartdt: "",
  collegeacadyearenddt: "",
  collegeacadyeariscurrent: false,
  collegeacadyearstatus: "",
  createdat: "",
  updatedat: ""
};

const PAGE_SIZE = 4;

export default function CollegeAcadYear() {
  const [years, setYears] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchYears();
    fetchCollegesAndDepts();
  }, []);

  function normalizeColleges(data) {
    let arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
    return arr
      .filter(c => (c.collegeid ?? c.college_id) && (c.collegename ?? c.college_name))
      .map(c => ({
        collegeid: String(c.collegeid ?? c.college_id),
        collegename: String(c.collegename ?? c.college_name),
      }));
  }

  function extractDepartments(data) {
    let arr = [];
    if (Array.isArray(data)) arr = data;
    else if (Array.isArray(data.departments)) arr = data.departments;
    else if (Array.isArray(data.data)) arr = data.data;
    return arr
      .filter(d => (d.collegedeptid ?? d.dept_id ?? d.college_dept_id) && (d.collegedeptdesc ?? d.dept_desc ?? d.department_name))
      .map(d => ({
        collegedeptid: String(d.collegedeptid ?? d.dept_id ?? d.college_dept_id),
        collegedeptdesc: String(d.collegedeptdesc ?? d.dept_desc ?? d.department_name),
        collegeid: String(d.collegeid ?? d.college_id ?? d.parent_college_id ?? "")
      }));
  }

  const fetchYears = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API);
      setYears(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setMsg("Failed to fetch records. " + (e.message || ""));
    }
    setLoading(false);
  };

  const fetchCollegesAndDepts = async () => {
    try {
      const deptsRes = await axios.get(DEPTS_API);
      setDepartments(extractDepartments(deptsRes.data));
    } catch (e) {
      setMsg("Failed to fetch department options. " + (e.message || ""));
    }
    // Fetch colleges via BASE_URL effect
    const COLLEGES_URL = `${config.BASE_URL}/master-college/view-colleges`;
    axios
      .get(COLLEGES_URL)
      .then(res => {
        const raw = res?.data?.colleges ?? res?.data;
        setColleges(normalizeColleges(raw));
      })
      .catch(() => setColleges([]));
  };

  // Filter departments by selected college
  const filteredDepartments = useMemo(() => {
    if (!form.collegeid) return departments;
    const hasCollegeKey = departments.some(d => d.collegeid && d.collegeid !== "");
    return hasCollegeKey
      ? departments.filter(d => String(d.collegeid) === String(form.collegeid))
      : departments;
  }, [departments, form.collegeid]);

  // Filter + pagination
  const filteredYears = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return years;
    return years.filter(item =>
      [
        item.id,
        item.collegeid,
        item.collegedeptid,
        item.collegeacadyear,
        item.collegeacadyearsemester,
        item.collegeacadyearname,
        item.collegeacadyeartype,
        item.collegeacadyearstartdt,
        item.collegeacadyearenddt,
        item.collegeacadyearstatus,
      ]
        .map(v => String(v ?? '').toLowerCase())
        .some(txt => txt.includes(s))
    );
  }, [years, query]);

  const totalPages = Math.max(1, Math.ceil(filteredYears.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const pageItems = filteredYears.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => { setPage(1); }, [query]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "collegeid") {
      setForm(prev => ({
        ...prev,
        collegeid: value,
        collegedeptid: ""
      }));
      return;
    }
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    setLoading(true);
    try {
      if (editingId) {
        await axios.put(joinUrl(API, `update/${editingId}`), form);
        setMsg("Academic year updated.");
      } else {
        await axios.post(joinUrl(API, "add"), {
          ...form,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        });
        setMsg("Academic year added.");
      }
      handleCancel();
      fetchYears();
    } catch (err) {
      setError("Error: " + (err.response?.data?.error || "Operation failed."));
    }
    setLoading(false);
  };

  const handleEdit = (item) => {
    setForm({
      id: item.id,
      collegeid: item.collegeid ? String(item.collegeid) : "",
      collegedeptid: item.collegedeptid ? String(item.collegedeptid) : "",
      collegeacadyear: item.collegeacadyear || "",
      collegeacadyearsemester: item.collegeacadyearsemester || "",
      collegeacadyearname: item.collegeacadyearname || "",
      collegeacadyeartype: item.collegeacadyeartype || "",
      collegeacadyearstartdt: item.collegeacadyearstartdt?.substring(0, 10) || "",
      collegeacadyearenddt: item.collegeacadyearenddt?.substring(0, 10) || "",
      collegeacadyeariscurrent: item.collegeacadyeariscurrent || false,
      collegeacadyearstatus: item.collegeacadyearstatus || "",
      createdat: item.createdat || "",
      updatedat: item.updatedat || ""
    });
    setEditingId(item.id);
    setShowForm(true);
    setMsg("");
    setError("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    setLoading(true);
    setMsg("");
    setError("");
    try {
      await axios.delete(joinUrl(API, `delete/${id}`));
      setMsg("Academic year deleted.");
      fetchYears();
    } catch {
      setError("Delete failed.");
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
    setMsg("");
    setError("");
  };

  return (
    <div className="mu-page">
      {(msg || error) && (
        <div className="toast-wrapper">
          <div className={`toast-box ${error ? 'toast--error' : ''}`}>
            <span className="toast-emoji">{error ? '⚠️' : '✅'}</span>
            <span className="toast-text">{error || msg}</span>
            <button className="toast-close" onClick={() => { setMsg(''); setError(''); }}>×</button>
          </div>
        </div>
      )}

      <h1 className="mu-title">College Academic Years</h1>

      {/* Toolbar with Search + Add button */}
      <div className="mu-toolbar">
        <label className="searchbox" aria-label="Search academic years">
          <span className="searchbox__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false" role="img" aria-hidden="true">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="20" y1="20" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input
            className="searchbox__input"
            type="text"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <button
          className="btn btn--add"
          onClick={() => { setShowForm(true); setEditingId(null); setForm(initialForm); setMsg(""); setError(""); }}
        >
          <span className="btn-plus">＋</span> Add
        </button>
      </div>

      {/* Table Card */}
      <div className="mu-tablewrap-outer">
        <div className="mu-tablewrap">
          <h2 className="mu-subtitle">All Academic Years</h2>
          <div className="mu-tablecard" style={{ overflow: 'visible' }}>
            <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
              <table className="mu-table">
                <thead>
                  <tr className="mu-thead-row">
                    <th className="mu-th">ID</th>
                    <th className="mu-th">College</th>
                    <th className="mu-th">Department</th>
                    <th className="mu-th">Year</th>
                    <th className="mu-th">Semester</th>
                    <th className="mu-th">Year Name</th>
                    <th className="mu-th">Type</th>
                    <th className="mu-th">Start</th>
                    <th className="mu-th">End</th>
                    <th className="mu-th">Current</th>
                    <th className="mu-th">Status</th>
                    <th className="mu-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td className="mu-td mu-empty" colSpan={12}>Loading...</td></tr>
                  ) : pageItems.length === 0 ? (
                    <tr><td className="mu-td mu-empty" colSpan={12}>No records found.</td></tr>
                  ) : pageItems.map((item) => (
                    <tr key={item.id}>
                        <td className="mu-td">{item.id}</td>
                        <td className="mu-td">{
                          colleges.find(c => String(c.collegeid) === String(item.collegeid))?.collegename || item.collegeid
                        }</td>
                        <td className="mu-td">{
                          departments.find(d => String(d.collegedeptid) === String(item.collegedeptid))?.collegedeptdesc || item.collegedeptid
                        }</td>
                      <td className="mu-td">{item.collegeacadyear}</td>
                      <td className="mu-td">{item.collegeacadyearsemester}</td>
                      <td className="mu-td">{item.collegeacadyearname}</td>
                      <td className="mu-td">{item.collegeacadyeartype}</td>
                      <td className="mu-td">{item.collegeacadyearstartdt?.substring(0, 10)}</td>
                      <td className="mu-td">{item.collegeacadyearenddt?.substring(0, 10)}</td>
                      <td className="mu-td">{item.collegeacadyeariscurrent ? "✅" : ""}</td>
                      <td className="mu-td">{item.collegeacadyearstatus}</td>
                      <td className="mu-td">
                        <button className="btn btn--primary" onClick={() => handleEdit(item)} disabled={loading}>Edit</button>
                        <button className="btn btn--danger" onClick={() => handleDelete(item.id)} disabled={loading}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="mu-pagination mu-pagination--chips">
              <span className="mu-pageinfo mu-pageinfo--chips">
                {`Showing page ${page} of ${totalPages} pages`}
              </span>
              <div className="mu-pagebtns mu-pagebtns--chips">
                <button
                  className="pagechip"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  «
                </button>
                <span className="pagechip pagechip--active">{page}</span>
                <button
                  className="pagechip"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                >
                  »
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={handleCancel}>
          <form className="modal modal--wide" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <button type="button" className="modal-x" onClick={handleCancel}>×</button>
            <h3 className="modal-heading">{editingId ? 'Edit Academic Year' : 'Add Academic Year'}</h3>
            <div className="form-grid form-grid--3">
              <div className="form-row">
                <label className="form-label">ID</label>
                <input
                  className="form-input"
                  name="id"
                  value={form.id}
                  onChange={handleChange}
                  disabled={!!editingId}
                  required={!editingId}
                />
              </div>
              <div className="form-row">
                <label className="form-label">College</label>
                <select
                  className="form-input"
                  name="collegeid"
                  value={form.collegeid}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select College</option>
                  {colleges.map((col) => (
                    <option key={col.collegeid} value={col.collegeid}>
                      {col.collegename} ({col.collegeid})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label className="form-label">Department</label>
                <select
                  className="form-input"
                  name="collegedeptid"
                  value={form.collegedeptid}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    {form.collegeid ? "Select Department" : "Select College first"}
                  </option>
                  {filteredDepartments.map((d) => (
                    <option key={d.collegedeptid} value={d.collegedeptid}>
                      {d.collegedeptdesc} ({d.collegedeptid})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label className="form-label">Year</label>
                <input
                  className="form-input"
                  name="collegeacadyear"
                  value={form.collegeacadyear}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-row">
                <label className="form-label">Semester</label>
                <input
                  className="form-input"
                  name="collegeacadyearsemester"
                  value={form.collegeacadyearsemester}
                  onChange={handleChange}
                />
              </div>
              <div className="form-row">
                <label className="form-label">Year Name</label>
                <input
                  className="form-input"
                  name="collegeacadyearname"
                  value={form.collegeacadyearname}
                  onChange={handleChange}
                />
              </div>
              <div className="form-row">
                <label className="form-label">Type</label>
                <input
                  className="form-input"
                  name="collegeacadyeartype"
                  value={form.collegeacadyeartype}
                  onChange={handleChange}
                />
              </div>
              <div className="form-row">
                <label className="form-label">Start Date</label>
                <input
                  className="form-input"
                  type="date"
                  name="collegeacadyearstartdt"
                  value={form.collegeacadyearstartdt}
                  onChange={handleChange}
                />
              </div>
              <div className="form-row">
                <label className="form-label">End Date</label>
                <input
                  className="form-input"
                  type="date"
                  name="collegeacadyearenddt"
                  value={form.collegeacadyearenddt}
                  onChange={handleChange}
                />
              </div>
              <div className="form-row">
                <label className="form-label">
                  <input
                    type="checkbox"
                    name="collegeacadyeariscurrent"
                    checked={form.collegeacadyeariscurrent}
                    onChange={handleChange}
                  /> Current
                </label>
              </div>
              <div className="form-row">
                <label className="form-label">Status</label>
                <input
                  className="form-input"
                  name="collegeacadyearstatus"
                  value={form.collegeacadyearstatus}
                  onChange={handleChange}
                />
              </div>
            </div>
            {!!error && <div className="modal-desc modal-desc--error">{error}</div>}
            {!!msg && <div className="modal-desc modal-desc--ok">{msg}</div>}
            <div className="modal-actions">
              <button type="submit" className="btn btn--primary" disabled={loading}>
                {editingId ? "Update" : "Add"}
              </button>
              <button type="button" className="btn btn--secondary" onClick={handleCancel} disabled={loading}>
                Cancel
              </button>
            </div>
            <button type="button" className="btn btn--close-fullwidth" onClick={handleCancel}>Close</button>
          </form>
        </div>
      )}
    </div>
  );
}