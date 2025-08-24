// Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaFileAlt,
  FaCreditCard,
  FaFileInvoice,
  FaGraduationCap,
  FaChartLine,
  FaUsers,
  FaMoneyBillWave,
  FaSearch,
  FaBell,
  FaCog,
  FaUserCircle,
} from 'react-icons/fa';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Nav,
  Navbar,
  Offcanvas,
  Form,
  Badge,
  Dropdown,
  Spinner,
  Alert,
} from 'react-bootstrap';

// ------------------------------------------------------------------
// 1.  API ROUTES (mapped from your env vars)
// ------------------------------------------------------------------
const API_ROUTES = {
  FEE_STRUCTURE: `${import.meta.env.VITE_BASE_URL}${import.meta.env.VITE_API_PREFIX}/cms-fee-structure`,
  PAYMENTS: `${import.meta.env.VITE_BASE_URL}${import.meta.env.VITE_API_PREFIX}/cms-payments`,
  INVOICES: `${import.meta.env.VITE_BASE_URL}${import.meta.env.VITE_API_PREFIX}/cms-student-fee-invoice`,
  SCHOLARSHIPS: `${import.meta.env.VITE_BASE_URL}${import.meta.env.VITE_API_PREFIX}/cms-stu-scholarship`,
};

// ------------------------------------------------------------------
// 2.  HELPER: FETCH + TRANSFORM
// ------------------------------------------------------------------
const fetchJson = (url) => fetch(url).then((r) => r.json());

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  
  // Live data
  const [revenueData, setRevenueData] = useState([]);
  const [studentData, setStudentData] = useState([]);
  const [feeDistributionData, setFeeDistributionData] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    growth: 0,
    students: 0,
    scholarships: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ----------------------------------------------------------------
  // 3.  DATA FETCHING WITH IMPROVED MOCK DATA
  // ----------------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        // For development, we'll use mock data
        // In production, this would be replaced with actual API calls
        const mockRevenueData = [
          { name: 'Jan', revenue: 42000, expenses: 28000 },
          { name: 'Feb', revenue: 48000, expenses: 32000 },
          { name: 'Mar', revenue: 55000, expenses: 35000 },
          { name: 'Apr', revenue: 51000, expenses: 33000 },
          { name: 'May', revenue: 59000, expenses: 38000 },
          { name: 'Jun', revenue: 64000, expenses: 41000 },
          { name: 'Jul', revenue: 68000, expenses: 43000 },
          { name: 'Aug', revenue: 72000, expenses: 45000 },
          { name: 'Sep', revenue: 78000, expenses: 48000 },
          { name: 'Oct', revenue: 82000, expenses: 51000 },
          { name: 'Nov', revenue: 87000, expenses: 53000 },
          { name: 'Dec', revenue: 92000, expenses: 56000 },
        ];
        
        const mockStudentData = [
          { name: 'Jan', students: 2200 },
          { name: 'Feb', students: 2350 },
          { name: 'Mar', students: 2500 },
          { name: 'Apr', students: 2650 },
          { name: 'May', students: 2800 },
          { name: 'Jun', students: 2950 },
          { name: 'Jul', students: 3100 },
          { name: 'Aug', students: 3250 },
          { name: 'Sep', students: 3400 },
          { name: 'Oct', students: 3550 },
          { name: 'Nov', students: 3700 },
          { name: 'Dec', students: 3850 },
        ];
        
        const mockFeeDistributionData = [
          { name: 'Tuition', value: 65 },
          { name: 'Lab Fees', value: 12 },
          { name: 'Library', value: 8 },
          { name: 'Sports', value: 7 },
          { name: 'Other', value: 8 },
        ];
        
        setRevenueData(mockRevenueData);
        setStudentData(mockStudentData);
        setFeeDistributionData(mockFeeDistributionData);
        
        // --- Summary stats ---
        setStats({
          totalRevenue: 856000,
          growth: 12.5,
          students: 3850,
          scholarships: 420,
        });
      } catch (err) {
        setError('Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  
  // ----------------------------------------------------------------
  // 4.  NAVIGATION
  // ----------------------------------------------------------------
  const navigation = [
    { name: 'Dashboard', path: '/finDashbord', icon: <FaTachometerAlt /> },
    { name: 'Fee Structure', path: '/cmsFeeStructure', icon: <FaFileAlt /> },
    { name: 'Payments', path: '/cmsPayments', icon: <FaCreditCard /> },
    { name: 'Fee Invoices', path: '/cmsStuFeeInvoice', icon: <FaFileInvoice /> },
    { name: 'Scholarships', path: '/cmsStuScholarship', icon: <FaGraduationCap /> },
  ];
  
  const handleNavigationClick = (path) => {
    setActiveSection(path);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };
  
  // ----------------------------------------------------------------
  // 5.  COLOR PALETTE FOR PIE
  // ----------------------------------------------------------------
  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  // ----------------------------------------------------------------
  // 6.  LOADING / ERROR
  // ----------------------------------------------------------------
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }
  
  // ----------------------------------------------------------------
  // 7.  MAIN DASHBOARD CONTENT
  // ----------------------------------------------------------------
  const renderDashboardContent = () => (
    <>
      {/* Stats Cards */}
      <Row className="g-4 mb-4">
        <Col xs={12} sm={6} lg={3}>
          <Card className="h-100 border-start border-4 border-primary shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <Card.Subtitle className="text-muted mb-1">Total Revenue</Card.Subtitle>
                  <Card.Title className="mb-1">
                    ${stats.totalRevenue.toLocaleString()}
                  </Card.Title>
                  <div className="text-success small d-flex align-items-center">
                    <FaChartLine className="me-1" /> {stats.growth}% from last month
                  </div>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded-3">
                  <FaMoneyBillWave className="text-primary fs-4" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col xs={12} sm={6} lg={3}>
          <Card className="h-100 border-start border-4 border-success shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <Card.Subtitle className="text-muted mb-1">Growth</Card.Subtitle>
                  <Card.Title className="mb-1">
                    {stats.growth}%
                  </Card.Title>
                  <div className="text-success small d-flex align-items-center">
                    <FaChartLine className="me-1" /> 2.3% from last month
                  </div>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded-3">
                  <FaChartLine className="text-success fs-4" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col xs={12} sm={6} lg={3}>
          <Card className="h-100 border-start border-4 border-warning shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <Card.Subtitle className="text-muted mb-1">Students</Card.Subtitle>
                  <Card.Title className="mb-1">
                    {stats.students.toLocaleString()}
                  </Card.Title>
                  <div className="text-success small d-flex align-items-center">
                    <FaChartLine className="me-1" /> 4.2% from last month
                  </div>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded-3">
                  <FaUsers className="text-warning fs-4" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col xs={12} sm={6} lg={3}>
          <Card className="h-100 border-start border-4 border-info shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <Card.Subtitle className="text-muted mb-1">Scholarships</Card.Subtitle>
                  <Card.Title className="mb-1">
                    {stats.scholarships.toLocaleString()}
                  </Card.Title>
                  <div className="text-success small d-flex align-items-center">
                    <FaChartLine className="me-1" /> 8.7% from last month
                  </div>
                </div>
                <div className="bg-info bg-opacity-10 p-3 rounded-3">
                  <FaGraduationCap className="text-info fs-4" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Charts Section */}
      <Row className="g-4 mb-4">
        <Col lg={6} className="mb-4 mb-lg-0">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white border-0 pt-4 pb-0">
              <div className="d-flex justify-content-between align-items-center">
                <Card.Title className="mb-0">Revenue vs Expenses</Card.Title>
                <Badge bg="primary" pill>Q2 2023</Badge>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="w-100" style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`$${value.toLocaleString()}`, '']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#4f46e5" 
                      strokeWidth={2} 
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#ef4444" 
                      strokeWidth={2} 
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white border-0 pt-4 pb-0">
              <div className="d-flex justify-content-between align-items-center">
                <Card.Title className="mb-0">Student Enrollment</Card.Title>
                <Badge bg="success" pill>+4.2%</Badge>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="w-100" style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [value.toLocaleString(), 'Students']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend />
                    <Bar 
                      dataKey="students" 
                      fill="#10b981" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="g-4">
        <Col lg={8} className="mb-4 mb-lg-0">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white border-0 pt-4 pb-0">
              <Card.Title className="mb-0">Fee Distribution</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="w-100" style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={feeDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      innerRadius={40}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {feeDistributionData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Percentage']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white border-0 pt-4 pb-0">
              <div className="d-flex justify-content-between align-items-center">
                <Card.Title className="mb-0">Recent Activity</Card.Title>
                <Button variant="link" size="sm">View All</Button>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="d-flex flex-column gap-3">
                {[
                  { 
                    icon: <FaCreditCard />, 
                    color: 'primary', 
                    title: 'Payment received', 
                    desc: 'John Doe - $2,500', 
                    time: '2h ago' 
                  },
                  { 
                    icon: <FaGraduationCap />, 
                    color: 'success', 
                    title: 'Scholarship approved', 
                    desc: 'Jane Smith - $1,000', 
                    time: '1d ago' 
                  },
                  { 
                    icon: <FaFileInvoice />, 
                    color: 'warning', 
                    title: 'Invoice generated', 
                    desc: 'Robert Johnson - $3,200', 
                    time: '2d ago' 
                  },
                  { 
                    icon: <FaFileAlt />, 
                    color: 'info', 
                    title: 'Fee structure updated', 
                    desc: 'Science Program', 
                    time: '3d ago' 
                  },
                ].map((item, i) => (
                  <div key={i} className={`p-3 bg-${item.color}-bg-subtle rounded-3`}>
                    <div className="d-flex">
                      <div className={`me-3 mt-1 bg-${item.color} bg-opacity-10 p-2 rounded-3`}>
                        <span className={`text-${item.color}`}>{item.icon}</span>
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-medium">{item.title}</div>
                        <div className="text-muted small">{item.desc}</div>
                      </div>
                      <div className="text-muted small">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
  
  // ----------------------------------------------------------------
  // 8.  IFRAME SECTION
  // ----------------------------------------------------------------
  const renderIframeContent = () => {
    const section = navigation.find((item) => item.path === activeSection);
    return (
      <Card className="shadow-sm h-100">
        <Card.Header className="bg-white border-0 pt-4 pb-0">
          <div className="d-flex justify-content-between align-items-center">
            <Card.Title className="mb-0">{section.name}</Card.Title>
            <Button 
              variant="outline-secondary" 
              onClick={() => setActiveSection('dashboard')}
            >
              <FaTachometerAlt className="me-2" /> Back to Dashboard
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="w-100" style={{ height: 'calc(100vh - 200px)' }}>
            <iframe 
              src={section.path} 
              title={section.name} 
              className="w-100 h-100 border-0"
            />
          </div>
        </Card.Body>
      </Card>
    );
  };
  
  // ----------------------------------------------------------------
  // 9.  LAYOUT (SIDEBAR + MAIN)
  // ----------------------------------------------------------------
  return (
    <div className="d-flex flex-column flex-lg-row min-vh-100 bg-light">
      {/* Mobile Sidebar */}
      <Offcanvas 
        show={sidebarOpen} 
        onHide={() => setSidebarOpen(false)}
        className="d-lg-none"
        style={{ width: '250px' }}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Finance Dashboard</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <Nav className="flex-column">
            {navigation.map((item) => (
              <Nav.Link
                key={item.name}
                onClick={() => handleNavigationClick(item.path)}
                className={`d-flex align-items-center px-3 py-3 ${
                  activeSection === item.path ? 'active bg-primary text-white' : 'text-dark'
                }`}
              >
                <span className="me-3">{item.icon}</span>
                {item.name}
              </Nav.Link>
            ))}
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>
      
      {/* Desktop Sidebar */}
      <div className="d-none d-lg-block bg-white border-end" style={{ width: '250px' }}>
        <div className="p-3 border-bottom">
          <h4 className="mb-0">Finance Dashboard</h4>
        </div>
        <Nav className="flex-column p-2">
          {navigation.map((item) => (
            <Nav.Link
              key={item.name}
              onClick={() => handleNavigationClick(item.path)}
              className={`d-flex align-items-center rounded-3 my-1 px-3 py-2 ${
                activeSection === item.path ? 'bg-primary text-white' : 'text-dark'
              }`}
            >
              <span className="me-3">{item.icon}</span>
              {item.name}
            </Nav.Link>
          ))}
        </Nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column">
        {/* Top Bar */}
        <Navbar bg="white" expand="lg" className="shadow-sm">
          <Container fluid>
            <Button 
              variant="light" 
              className="d-lg-none me-2"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="navbar-toggler-icon"></span>
            </Button>
            
            <Form className="d-flex me-auto" style={{ maxWidth: '400px' }}>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <FaSearch />
                </span>
                <Form.Control
                  type="search"
                  placeholder="Search..."
                  className="bg-light border-start-0"
                />
              </div>
            </Form>
            
            <div className="d-flex align-items-center">
              <Button variant="light" className="position-relative me-3">
                <FaBell />
                <Badge 
                  pill 
                  bg="danger" 
                  className="position-absolute top-0 start-100 translate-middle"
                >
                  3
                </Badge>
              </Button>
              
              <Button variant="light" className="me-3">
                <FaCog />
              </Button>
              
              <Dropdown align="end">
                <Dropdown.Toggle variant="light" id="user-dropdown">
                  <FaUserCircle className="fs-4" />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Header>
                    <div className="fw-bold">Admin User</div>
                    <div className="small text-muted">admin@university.edu</div>
                  </Dropdown.Header>
                  <Dropdown.Item>Profile</Dropdown.Item>
                  <Dropdown.Item>Settings</Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item>Sign out</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </Container>
        </Navbar>
        
        {/* Page Content */}
        <Container fluid className="p-4 flex-grow-1">
          {activeSection === 'dashboard' || activeSection === '/finDashbord'
            ? renderDashboardContent()
            : renderIframeContent()}
        </Container>
      </div>
    </div>
  );
};

export default Dashboard;