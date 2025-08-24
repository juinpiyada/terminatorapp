// src/pages/FeeStructureManager.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import config from "../../config/middleware_config";
import { FaPlus, FaTrash, FaEdit, FaSearch } from "react-icons/fa";

export default function FeeStructureManager() {
  const [feeStructures, setFeeStructures] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" });
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  
  const [form, setForm] = useState({
    fee_struct_id: "",
    fee_prg_id: "",
    fee_acad_year: "",
    fee_semester_no: "",
    fee_head: "",
    fee_amount: "",
    fee_is_mandatory: true,
    fee_due_dt: "",
    fee_remarks: "",
  });
  
  // ===================== Fetch Courses =====================
  const fetchCourses = async () => {
    setCoursesLoading(true);
    try {
      const res = await axios.get(`${config.COURSE_ROUTE}/list`);
      setCourses(res.data.courses || []);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setAlert({ show: true, message: "Failed to fetch courses", variant: "danger" });
    } finally {
      setCoursesLoading(false);
    }
  };
  
  // ===================== Fetch Fee Structures =====================
  const fetchFeeStructures = async () => {
    setLoading(true);
    try {
      const res = await axios.get(config.FIN_UI_FEE_STRUCTURE_ROUTE);
      setFeeStructures(res.data.feeStructures || []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Error fetching fee structures:", err);
      setAlert({ show: true, message: "Failed to fetch fee structures", variant: "danger" });
    } finally {
      setLoading(false);
    }
  };
  
  // ===================== Auto Refresh =====================
  useEffect(() => {
    // Initial fetch
    fetchFeeStructures();
    fetchCourses();
    
    // Set up auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      fetchFeeStructures();
      fetchCourses();
    }, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // ===================== Handle Input =====================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };
  
  // ===================== Add / Update =====================
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(
          `${config.FIN_UI_FEE_STRUCTURE_ROUTE}/${editing.fee_struct_id}`,
          form
        );
        setAlert({ show: true, message: "Fee structure updated successfully", variant: "success" });
        setEditing(null);
      } else {
        await axios.post(config.FIN_UI_FEE_STRUCTURE_ROUTE, form);
        setAlert({ show: true, message: "Fee structure added successfully", variant: "success" });
      }
      resetForm();
      setShowModal(false);
      fetchFeeStructures();
    } catch (err) {
      console.error("Error saving fee structure:", err);
      setAlert({ show: true, message: "Failed to save fee structure", variant: "danger" });
    }
  };
  
  // ===================== Reset Form =====================
  const resetForm = () => {
    setForm({
      fee_struct_id: "",
      fee_prg_id: "",
      fee_acad_year: "",
      fee_semester_no: "",
      fee_head: "",
      fee_amount: "",
      fee_is_mandatory: true,
      fee_due_dt: "",
      fee_remarks: "",
    });
  };
  
  // ===================== Delete =====================
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this fee structure?")) return;
    try {
      await axios.delete(`${config.FIN_UI_FEE_STRUCTURE_ROUTE}/${id}`);
      setAlert({ show: true, message: "Fee structure deleted successfully", variant: "success" });
      fetchFeeStructures();
    } catch (err) {
      console.error("Error deleting fee structure:", err);
      setAlert({ show: true, message: "Failed to delete fee structure", variant: "danger" });
    }
  };
  
  // ===================== Edit =====================
  const handleEdit = (item) => {
    setEditing(item);
    setForm(item);
    setShowModal(true);
  };
  
  // ===================== Open Add Modal =====================
  const openAddModal = () => {
    setEditing(null);
    resetForm();
    setShowModal(true);
  };
  
  // ===================== Filter Fee Structures =====================
  const filteredFeeStructures = feeStructures.filter((item) =>
    Object.values(item).some(
      (val) =>
        val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <FaEdit className="mr-3 text-blue-600" /> Fee Structure Manager
              </h1>
              <div className="text-sm text-gray-500 flex items-center">
                <span className="hidden sm:inline">Last refreshed: </span>
                {lastRefreshed.toLocaleTimeString()}
              </div>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <FaPlus className="mr-2" /> Add Fee Structure
            </button>
          </div>
          
          {/* Alert Section */}
          {alert.show && (
            <div className={`mb-4 px-4 py-3 rounded-md ${alert.variant === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="flex justify-between items-center">
                <span>{alert.message}</span>
                <button 
                  onClick={() => setAlert({ show: false })} 
                  className="text-lg leading-none"
                >
                  &times;
                </button>
              </div>
            </div>
          )}
          
          {/* Search Section */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search fee structures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Table Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600">Loading fee structures...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Head</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mandatory</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFeeStructures.length > 0 ? (
                      filteredFeeStructures.map((f) => (
                        <tr key={f.fee_struct_id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{f.fee_struct_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {courses.find(c => c.courseid === f.fee_prg_id)?.coursedesc || f.coursedesc}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{f.fee_acad_year}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{f.fee_semester_no}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{f.fee_head}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">₹{f.fee_amount}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {f.fee_is_mandatory ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Yes</span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">No</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {f.fee_due_dt ? new Date(f.fee_due_dt).toLocaleDateString() : "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{f.fee_remarks}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(f)}
                                className="text-yellow-600 hover:text-yellow-900 transition-colors duration-150"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(f.fee_struct_id)}
                                className="text-red-600 hover:text-red-900 transition-colors duration-150"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <FaTrash className="text-4xl mb-3" />
                            <h5 className="text-lg font-medium mb-1">No Fee Structures Found</h5>
                            <p className="text-sm">Try adjusting your search or add a new fee structure</p>
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
      </div>
      
      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {editing ? "Edit Fee Structure" : "Add New Fee Structure"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors duration-150"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fee Structure ID</label>
                    <input
                      type="text"
                      name="fee_struct_id"
                      value={form.fee_struct_id}
                      onChange={handleChange}
                      required
                      disabled={editing !== null}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                    {coursesLoading ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500">
                        Loading programs...
                      </div>
                    ) : (
                      <select
                        name="fee_prg_id"
                        value={form.fee_prg_id}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select a program</option>
                        {courses.map(course => (
                          <option key={course.courseid} value={course.courseid}>
                            {(course.coursedesc)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                    <input
                      type="text"
                      name="fee_acad_year"
                      value={form.fee_acad_year}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester No</label>
                    <input
                      type="text"
                      name="fee_semester_no"
                      value={form.fee_semester_no}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fee Head</label>
                    <input
                      type="text"
                      name="fee_head"
                      value={form.fee_head}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fee Amount</label>
                    <input
                      type="number"
                      name="fee_amount"
                      value={form.fee_amount}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        name="fee_is_mandatory"
                        checked={form.fee_is_mandatory}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label className="font-medium text-gray-700">Mandatory</label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      name="fee_due_dt"
                      value={form.fee_due_dt}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <textarea
                    name="fee_remarks"
                    value={form.fee_remarks}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                >
                  {editing ? (
                    <>
                      <FaEdit className="mr-2" /> Update Fee Structure
                    </>
                  ) : (
                    <>
                      <FaPlus className="mr-2" /> Add Fee Structure
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}