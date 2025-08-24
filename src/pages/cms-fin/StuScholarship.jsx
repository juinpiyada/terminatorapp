import React, { useEffect, useState } from "react";
import axios from "axios";
import config from "../../config/middleware_config";
import "../../sms-fin.css";
import { FaEdit, FaTrash, FaSave, FaPlus, FaUserGraduate, FaChalkboardTeacher, FaCalendarAlt, FaMoneyBillWave, FaFileAlt, FaTimes } from 'react-icons/fa';

export default function Scholarships() {
  const [scholarships, setScholarships] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [terms, setTerms] = useState([]);
  const [formData, setFormData] = useState({
    cms_schol_id: "",
    cms_schol_stuid: "",
    cms_schol_term_id: "",
    cms_schol_fee_head: "",
    cms_stu_schol_amt: "",
    cms_schol_reason: "",
    cms_schol_apprved_by: ""
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const API_URL = config.FIN_UI_STUDENT_SCHOLARSHIP_ROUTE;

  // Fetch functions remain the same
  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${config.STUDENT_ROUTE}/list`);
      const list = res.data.students || res.data || [];
      setStudents(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error fetching students:", err);
      setStudents([]);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`${config.TEACHER_ROUTE}`);
      const list = res.data.teachers || res.data || [];
      setTeachers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error fetching teachers:", err);
      setTeachers([]);
    }
  };

  const fetchTerms = async () => {
    try {
      const res = await axios.get(`${config.MASTER_ACADYEAR_ROUTE}`);
      const list = res.data.terms || res.data || [];
      setTerms(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error fetching terms:", err);
      setTerms([]);
    }
  };

  const fetchScholarships = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setScholarships(
        res.data && Array.isArray(res.data.scholarships)
          ? res.data.scholarships
          : []
      );
    } catch (err) {
      console.error("Error fetching scholarships:", err);
      setScholarships([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScholarships();
    fetchStudents();
    fetchTeachers();
    fetchTerms();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`${API_URL}/${editId}`, formData);
      } else {
        await axios.post(API_URL, formData);
      }
      setFormData({
        cms_schol_id: "",
        cms_schol_stuid: "",
        cms_schol_term_id: "",
        cms_schol_fee_head: "",
        cms_stu_schol_amt: "",
        cms_schol_reason: "",
        cms_schol_apprved_by: ""
      });
      setEditId(null);
      setIsModalOpen(false);
      fetchScholarships();
    } catch (err) {
      console.error("Error saving scholarship:", err);
    }
  };

  const handleEdit = (sch) => {
    setEditId(sch.cms_schol_id);
    setFormData({
      cms_schol_id: sch.cms_schol_id || "",
      cms_schol_stuid: sch.cms_schol_stuid || "",
      cms_schol_term_id: sch.cms_schol_term_id || "",
      cms_schol_fee_head: sch.cms_schol_fee_head || "",
      cms_stu_schol_amt: sch.cms_stu_schol_amt || "",
      cms_schol_reason: sch.cms_schol_reason || "",
      cms_schol_apprved_by: sch.cms_schol_apprved_by || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this scholarship?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchScholarships();
    } catch (err) {
      console.error("Error deleting scholarship:", err);
    }
  };

  const openAddModal = () => {
    setFormData({
      cms_schol_id: "",
      cms_schol_stuid: "",
      cms_schol_term_id: "",
      cms_schol_fee_head: "",
      cms_stu_schol_amt: "",
      cms_schol_reason: "",
      cms_schol_apprved_by: ""
    });
    setEditId(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
  };

  // Helper functions remain the same
  const getStudentName = (id) => {
    const s = students.find((st) => String(st.stuid) === String(id));
    return s ? `${s.stuname} (${s.stuid})` : id;
  };

  const getTeacherName = (id) => {
    const t = teachers.find((th) => String(th.teacherid) === String(id));
    return t ? `${t.teachername} (${t.teacherid})` : id;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left mb-6 md:mb-0">
            <h1 className="text-4xl font-bold text-indigo-800 mb-2">Scholarship Management</h1>
            <p className="text-lg text-indigo-600">Manage student scholarships and financial aid</p>
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <FaPlus />
            Add Scholarship
          </button>
        </div>

        {/* Scholarships Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <FaFileAlt className="text-indigo-600" />
              Scholarship Records
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Head</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved By</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(scholarships) && scholarships.length > 0 ? (
                    scholarships.map((sch) => (
                      <tr key={sch.cms_schol_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sch.cms_schol_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{getStudentName(sch.cms_schol_stuid)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{sch.cms_schol_term_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{sch.cms_schol_fee_head}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${sch.cms_stu_schol_amt}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{sch.cms_schol_reason}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{getTeacherName(sch.cms_schol_apprved_by)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => handleEdit(sch)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4 transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            onClick={() => handleDelete(sch.cms_schol_id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <FaFileAlt className="text-4xl text-gray-300 mb-3" />
                          <p>No scholarships found</p>
                          <button 
                            onClick={openAddModal}
                            className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                          >
                            <FaPlus /> Add First Scholarship
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Scholarship Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                <FaPlus className="text-indigo-600" />
                {editId ? "Edit Scholarship" : "Add New Scholarship"}
              </h2>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FaFileAlt className="text-indigo-500" /> Scholarship ID
                  </label>
                  <input
                    type="text"
                    name="cms_schol_id"
                    placeholder="Enter scholarship ID"
                    value={formData.cms_schol_id}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FaUserGraduate className="text-indigo-500" /> Student
                  </label>
                  <select
                    name="cms_schol_stuid"
                    value={formData.cms_schol_stuid}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  >
                    <option value="">Select Student</option>
                    {students.map((s) => (
                      <option key={s.stuid} value={s.stuid}>
                        {s.stuname} ({s.stuid})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FaCalendarAlt className="text-indigo-500" /> Term
                  </label>
                  <select
                    name="cms_schol_term_id"
                    value={formData.cms_schol_term_id}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  >
                    <option value="">Select Term</option>
                    {terms.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FaFileAlt className="text-indigo-500" /> Fee Head
                  </label>
                  <input
                    type="text"
                    name="cms_schol_fee_head"
                    placeholder="Enter fee head"
                    value={formData.cms_schol_fee_head}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FaMoneyBillWave className="text-indigo-500" /> Amount
                  </label>
                  <input
                    type="number"
                    name="cms_stu_schol_amt"
                    placeholder="Enter amount"
                    value={formData.cms_stu_schol_amt}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FaFileAlt className="text-indigo-500" /> Reason
                  </label>
                  <input
                    type="text"
                    name="cms_schol_reason"
                    placeholder="Enter reason"
                    value={formData.cms_schol_reason}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FaChalkboardTeacher className="text-indigo-500" /> Approved By
                  </label>
                  <select
                    name="cms_schol_apprved_by"
                    value={formData.cms_schol_apprved_by}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map((t) => (
                      <option key={t.teacherid} value={t.teacherid}>
                        {t.teachername} ({t.teacherid})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <FaSave />
                  {editId ? "Update Scholarship" : "Add Scholarship"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}