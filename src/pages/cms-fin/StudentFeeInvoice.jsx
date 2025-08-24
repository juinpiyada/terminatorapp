// SMS-ui/src/pages/cms-fin/CmsFeeInvoice.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import config from "../../config/middleware_config";

export default function CmsFeeInvoice() {
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);
  const [terms, setTerms] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    cms_stu_inv_id: "",
    cms_stu_id: "",
    cms_term_id: "",
    cms_fee_head: "",
    cms_fee_amt: "",
    cms_due_dt: "",
    cmc_fee_is_paid: false,
    cmc_fee_paiddt: "",
    cmc_fee_pymt_mode: "",
    cmc_fee_trans_id: "",
    cmc_stu_fee_remarks: "",
  });
  const [editInvoice, setEditInvoice] = useState(null);
  const API_URL = config.FIN_UI_STUDENT_FEE_INVOICE_ROUTE;
  
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
  
  const fetchTerms = async () => {
    try {
      const res = await axios.get(config.MASTER_ACADYEAR_ROUTE);
      const list = res.data.acadyears || res.data || [];
      setTerms(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error fetching terms:", err);
      setTerms([]);
    }
  };
  
  const fetchInvoices = async () => {
    try {
      const res = await axios.get(API_URL);
      setInvoices(res.data.invoices || res.data || []);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setInvoices([]);
    }
  };
  
  useEffect(() => {
    fetchInvoices();
    fetchStudents();
    fetchTerms();
  }, []);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  
  const resetForm = () => {
    setFormData({
      cms_stu_inv_id: "",
      cms_stu_id: "",
      cms_term_id: "",
      cms_fee_head: "",
      cms_fee_amt: "",
      cms_due_dt: "",
      cmc_fee_is_paid: false,
      cmc_fee_paiddt: "",
      cmc_fee_pymt_mode: "",
      cmc_fee_trans_id: "",
      cmc_stu_fee_remarks: "",
    });
    setEditInvoice(null);
    setIsModalOpen(false);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editInvoice) {
        await axios.put(`${API_URL}/${editInvoice.cms_stu_inv_id}`, formData, {
          headers: { "Content-Type": "application/json" },
        });
      } else {
        await axios.post(API_URL, formData, {
          headers: { "Content-Type": "application/json" },
        });
      }
      resetForm();
      fetchInvoices();
    } catch (err) {
      console.error("❌ Error saving invoice:", err.response?.data || err.message);
      alert("❌ Failed to save invoice. Check console.");
    }
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this invoice?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchInvoices();
    } catch (err) {
      console.error("Error deleting invoice:", err);
    }
  };
  
  const handleEdit = (invoice) => {
    setEditInvoice(invoice);
    setFormData(invoice);
    setIsModalOpen(true);
  };
  
  const getStudentName = (id) => {
    const s = students.find((st) => String(st.stuid) === String(id));
    return s ? `${s.stuname} (${s.stuid})` : id;
  };
  
  const getTermName = (id) => {
    const t = terms.find((term) => String(term.id) === String(id));
    return t ? `Academic Year ${t.id}` : id;
  };
  
  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.cms_stu_id?.toString().toLowerCase().includes(search.toLowerCase()) ||
      inv.cms_fee_head?.toLowerCase().includes(search.toLowerCase())
  );
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fee Invoice Management</h1>
            <p className="text-gray-600 mt-1">Manage student fee invoices and payments</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Invoice
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow mb-6 p-3">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              placeholder="Search by Student ID or Fee Head..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full py-1 px-2 text-sm text-gray-700 focus:outline-none"
            />
          </div>
        </div>
        
        {/* Invoice Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9V7a1 1 0 011-1h10a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      ID
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                      Student
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      Term
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      Fee Head
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                      Amount
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      Due Date
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Payment Date
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                      </svg>
                      Remarks
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Status
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.cms_stu_inv_id} className="hover:bg-gray-50 text-xs">
                      <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900 truncate">{inv.cms_stu_inv_id}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500 truncate">{getStudentName(inv.cms_stu_id)}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500 truncate">{getTermName(inv.cms_term_id)}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500 truncate">{inv.cms_fee_head}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-medium truncate">₹{inv.cms_fee_amt}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500 truncate">{inv.cms_due_dt?.slice(0, 10)}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500 truncate">
                        {inv.cmc_fee_paiddt ? inv.cmc_fee_paiddt.slice(0, 10) : "-"}
                      </td>
                      <td className="px-3 py-2 text-gray-500 truncate" title={inv.cmc_stu_fee_remarks || ""}>
                        {inv.cmc_stu_fee_remarks || "-"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${inv.cmc_fee_is_paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {inv.cmc_fee_is_paid ? "Paid" : "Pending"}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap font-medium">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEdit(inv)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(inv.cms_stu_inv_id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="px-4 py-4 text-center text-sm text-gray-500">
                      No invoices found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editInvoice ? "Edit Invoice" : "Add New Invoice"}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="cms_stu_inv_id" className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice ID
                    </label>
                    <input
                      type="text"
                      id="cms_stu_inv_id"
                      name="cms_stu_inv_id"
                      value={formData.cms_stu_inv_id}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="cms_stu_id" className="block text-sm font-medium text-gray-700 mb-1">
                      Student
                    </label>
                    <select
                      id="cms_stu_id"
                      name="cms_stu_id"
                      value={formData.cms_stu_id}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="">Select Student</option>
                      {students.map((s) => (
                        <option key={s.stuid} value={s.stuid}>
                          {s.stuname} ({s.stuid})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="cms_term_id" className="block text-sm font-medium text-gray-700 mb-1">
                      Academic Year
                    </label>
                    <select
                      id="cms_term_id"
                      name="cms_term_id"
                      value={formData.cms_term_id}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="">Select Academic Year</option>
                      {terms.map((t) => (
                        <option key={t.id} value={t.id}>
                          Academic Year {t.id}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="cms_fee_head" className="block text-sm font-medium text-gray-700 mb-1">
                      Fee Head
                    </label>
                    <input
                      type="text"
                      id="cms_fee_head"
                      name="cms_fee_head"
                      value={formData.cms_fee_head}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="cms_fee_amt" className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      id="cms_fee_amt"
                      name="cms_fee_amt"
                      value={formData.cms_fee_amt}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="cms_due_dt" className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      id="cms_due_dt"
                      name="cms_due_dt"
                      value={formData.cms_due_dt}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="cmc_fee_is_paid"
                      name="cmc_fee_is_paid"
                      checked={formData.cmc_fee_is_paid}
                      onChange={handleChange}
                      className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="cmc_fee_is_paid" className="ml-2 block text-sm text-gray-900">
                      Payment Completed
                    </label>
                  </div>
                  
                  <div>
                    <label htmlFor="cmc_fee_paiddt" className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      id="cmc_fee_paiddt"
                      name="cmc_fee_paiddt"
                      value={formData.cmc_fee_paiddt}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="cmc_fee_pymt_mode" className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Mode
                    </label>
                    <input
                      type="text"
                      id="cmc_fee_pymt_mode"
                      name="cmc_fee_pymt_mode"
                      value={formData.cmc_fee_pymt_mode}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="cmc_fee_trans_id" className="block text-sm font-medium text-gray-700 mb-1">
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      id="cmc_fee_trans_id"
                      name="cmc_fee_trans_id"
                      value={formData.cmc_fee_trans_id}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="cmc_stu_fee_remarks" className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks
                  </label>
                  <textarea
                    id="cmc_stu_fee_remarks"
                    name="cmc_stu_fee_remarks"
                    value={formData.cmc_stu_fee_remarks}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  ></textarea>
                </div>
                
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    {editInvoice ? "Update Invoice" : "Add Invoice"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}