// SMS-ui/src/pages/cms-fin/CmsPayments.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config/middleware_config";

export default function CmsPayments() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [form, setForm] = useState({
    cms_pymts_tran_id: "",   // maps to cms_stu_inv_id from invoice
    cms_pymts_inv_id: "",
    cms_pymts_stuid: "",     // student_master id
    cms_pymts_gw_name: "",
    cms_pymts_gw_ord_id: "",
    cms_pymts_amt_pd: "",
    cms_pymts_response_pl: "",
    cms_pymts_callbk_time: "",
  });

  // Human readable labels
  const fieldLabels = {
    cms_pymts_tran_id: "Invoice Transaction ID",
    cms_pymts_inv_id: "Invoice ID",
    cms_pymts_stuid: "Student",
    cms_pymts_gw_name: "Payment Gateway",
    cms_pymts_gw_ord_id: "Gateway Order ID",
    cms_pymts_amt_pd: "Amount Paid",
    cms_pymts_response_pl: "Gateway Response Payload",
    cms_pymts_callbk_time: "Callback Time (ISO)",
  };

  // Fetch all resources
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}${import.meta.env.VITE_API_PREFIX}/cms-payments`);
      setPayments(res.data.payments || res.data || []);
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError("Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${config.STUDENT_ROUTE}/list`);
      setStudents(res.data.students || res.data || []);
    } catch (err) {
      console.error("Error fetching students:", err);
      setStudents([]);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await axios.get(config.FIN_UI_STUDENT_FEE_INVOICE_ROUTE);
      setInvoices(res.data.invoices || res.data || []);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setInvoices([]);
    }
  };

  const fetchFeeStructures = async () => {
    try {
      const res = await axios.get(config.FIN_UI_FEE_STRUCTURE_ROUTE);
      setFeeStructures(res.data.feeStructures || res.data || []);
    } catch (err) {
      console.error("Error fetching fee structures:", err);
      setFeeStructures([]);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStudents();
    fetchInvoices();
    fetchFeeStructures();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = async (payment) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}${import.meta.env.VITE_API_PREFIX}/cms-payments/${payment.cms_pymts_tran_id}`
      );
      setForm(res.data.payment || payment);
      setSelectedId(payment.cms_pymts_tran_id);
      setEditMode(true);
      setShowModal(true);
      setError("");
    } catch (err) {
      console.error("Error fetching payment by id:", err);
      setError("Failed to fetch payment details");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this payment?")) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_BASE_URL}${import.meta.env.VITE_API_PREFIX}/cms-payments/${id}`
      );
      fetchPayments();
    } catch (err) {
      console.error("Error deleting payment:", err);
      setError("Failed to delete payment");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.cms_pymts_tran_id || !form.cms_pymts_inv_id || !form.cms_pymts_stuid) {
      setError("Invoice Transaction ID, Invoice ID, and Student ID are required");
      return;
    }

    try {
      if (editMode && selectedId) {
        await axios.put(
          `${import.meta.env.VITE_BASE_URL}${import.meta.env.VITE_API_PREFIX}/cms-payments/${selectedId}`,
          form
        );
      } else {
        await axios.post(
          `${import.meta.env.VITE_BASE_URL}${import.meta.env.VITE_API_PREFIX}/cms-payments`,
          form
        );
      }
      setShowModal(false);
      setEditMode(false);
      setSelectedId(null);
      resetForm();
      fetchPayments();
    } catch (err) {
      console.error("Error saving payment:", err);
      setError(editMode ? "Failed to update payment" : "Failed to add payment");
    }
  };

  const resetForm = () => {
    setForm({
      cms_pymts_tran_id: "",
      cms_pymts_inv_id: "",
      cms_pymts_stuid: "",
      cms_pymts_gw_name: "",
      cms_pymts_gw_ord_id: "",
      cms_pymts_amt_pd: "",
      cms_pymts_response_pl: "",
      cms_pymts_callbk_time: "",
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Payments Management</h2>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          onClick={() => {
            resetForm();
            setShowModal(true);
            setEditMode(false);
          }}
        >
          + Add Payment
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-500">Loading payments...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="overflow-x-auto shadow rounded-lg border border-gray-200">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-100 text-gray-800 text-sm">
              <tr>
                {Object.values(fieldLabels).map((label) => (
                  <th key={label} className="px-4 py-2">{label}</th>
                ))}
                <th className="px-4 py-2">Created At</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center p-4 text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.cms_pymts_tran_id} className="border-t hover:bg-gray-50">
                    {Object.keys(fieldLabels).map((key) => (
                      <td key={key} className="px-4 py-2">{p[key]}</td>
                    ))}
                    <td className="px-4 py-2">
                      {p.createdat ? new Date(p.createdat).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-2 flex gap-2 justify-center">
                      <button
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                        onClick={() => handleEdit(p)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        onClick={() => handleDelete(p.cms_pymts_tran_id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-2/3 max-w-2xl">
            <h3 className="text-xl font-semibold mb-4">
              {editMode ? "Edit Payment" : "Add Payment"}
            </h3>
            {error && <p className="text-red-500 mb-2">{error}</p>}

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              {/* Invoice Transaction ID (as input) */}
              <div className="flex flex-col">
                <label className="text-gray-700 mb-1">{fieldLabels.cms_pymts_tran_id}</label>
                <input
                  type="text"
                  name="cms_pymts_tran_id"
                  value={form.cms_pymts_tran_id}
                  onChange={handleChange}
                  required
                  disabled={editMode}
                  className="border rounded-lg px-3 py-2"
                />
              </div>

              {/* Invoice ID (selector) */}
              <div className="flex flex-col">
                <label className="text-gray-700 mb-1">{fieldLabels.cms_pymts_inv_id}</label>
                <select
                  name="cms_pymts_inv_id"
                  value={form.cms_pymts_inv_id}
                  onChange={handleChange}
                  required
                  className="border rounded-lg px-3 py-2"
                >
                  <option value="">Select Invoice ID</option>
                  {invoices.map((inv) => (
                    <option key={inv.cms_stu_inv_id} value={inv.cms_stu_inv_id}>
                      {inv.cms_stu_inv_id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Selector */}
              <div className="flex flex-col">
                <label className="text-gray-700 mb-1">{fieldLabels.cms_pymts_stuid}</label>
                <select
                  name="cms_pymts_stuid"
                  value={form.cms_pymts_stuid}
                  onChange={handleChange}
                  required
                  className="border rounded-lg px-3 py-2"
                >
                  <option value="">Select Student</option>
                  {students.map((s) => (
                    <option key={s.stuid} value={s.stuid}>
                      {s.stuname} ({s.stuid})
                    </option>
                  ))}
                </select>
              </div>

              {/* Rest inputs */}
              {["cms_pymts_gw_name","cms_pymts_gw_ord_id","cms_pymts_amt_pd","cms_pymts_response_pl","cms_pymts_callbk_time"].map((key) => (
                <div key={key} className="flex flex-col">
                  <label className="text-gray-700 mb-1">{fieldLabels[key]}</label>
                  <input
                    type={key === "cms_pymts_amt_pd" ? "number" : "text"}
                    name={key}
                    value={form[key]}
                    onChange={handleChange}
                    className="border rounded-lg px-3 py-2"
                    required={key === "cms_pymts_amt_pd"}
                  />
                </div>
              ))}

              <div className="col-span-2 flex justify-end gap-3 mt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editMode ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                  onClick={() => {
                    setShowModal(false);
                    setEditMode(false);
                    setSelectedId(null);
                  }}
                >
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

