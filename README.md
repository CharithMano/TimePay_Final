# HRMS - Human Resource Management System

A comprehensive HRMS solution built with the MERN stack (MongoDB, Express.js, React.js, Node.js) featuring modern UI/UX design and complete HR functionality.

## 🚀 Features

### Core Modules
- **Employee Management** - Add, edit, view, and manage employee profiles
- **Attendance & Leave Management** - Track attendance, apply for leaves, approve/reject requests
- **Payroll & Compensation** - Generate payslips, manage salaries, bonuses, and deductions
- **Reports & Analytics** - Comprehensive reporting with charts and export functionality
- **Notifications & Alerts** - Real-time notifications for important HR events
- **Role-based Access Control** - Admin, HR Manager, and Employee roles with specific permissions

### Key Features
- **Modern UI/UX** - Beautiful, responsive design with Tailwind CSS
- **Real-time Dashboard** - Role-specific dashboards with key metrics
- **PDF Generation** - Automated payslip generation and download
- **Excel Export** - Export reports in Excel format
- **Email Notifications** - Automated email alerts for approvals and updates
- **Document Management** - Upload and manage employee documents
- **Clock In/Out System** - Employee attendance tracking
- **Leave Balance Management** - Track and manage different types of leaves
- **Department-wise Analytics** - Detailed insights by department

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File upload handling
- **PDFKit** - PDF generation
- **ExcelJS** - Excel file generation
- **Nodemailer** - Email sending

### Frontend
- **React.js** - Frontend framework
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Chart library
- **React Hook Form** - Form handling
- **React Toastify** - Notifications
- **Lucide React** - Icon library

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd HRMS
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory with the following variables:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hrms_db
JWT_SECRET=your_jwt_secret_key_here_change_in_production
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
CLIENT_URL=http://localhost:3000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Database Setup
Make sure MongoDB is running on your system. The application will create the database and collections automatically.

### 5. Run the Application

Start the backend server:
```bash
cd backend
npm run dev
```

Start the frontend development server:
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 👥 Default User Accounts

For testing purposes, you can create these demo accounts:

### Admin Account
- **Email:** admin@hrms.com
- **Password:** admin123
- **Role:** Admin (Full access)

### HR Manager Account
- **Email:** hr@hrms.com
- **Password:** hr123
- **Role:** HR Manager (Employee management, reports)

### Employee Account
- **Email:** employee@hrms.com
- **Password:** emp123
- **Role:** Employee (Limited access)

## 🔐 Role-Based Access

### Admin
- Full access to all modules
- User and role management
- System settings
- All reports and analytics

### HR Manager
- Employee management
- Attendance and leave management
- Payroll management
- Reports and analytics
- Notification management

### Employee
- View personal profile
- Clock in/out
- Apply for leaves
- View payslips
- Personal notifications

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create employee
- `GET /api/employees/:id` - Get employee by ID
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Attendance
- `POST /api/attendance/clock-in` - Clock in
- `POST /api/attendance/clock-out` - Clock out
- `GET /api/attendance/my-attendance` - Get my attendance
- `GET /api/attendance/all` - Get all attendance

### Leaves
- `POST /api/leaves/apply` - Apply for leave
- `GET /api/leaves/my-leaves` - Get my leaves
- `GET /api/leaves/all` - Get all leaves
- `PUT /api/leaves/:id/approve` - Approve leave
- `PUT /api/leaves/:id/reject` - Reject leave

### Payroll
- `POST /api/payroll/generate` - Generate payroll
- `GET /api/payroll/my-payslips` - Get my payslips
- `GET /api/payroll/all` - Get all payrolls
- `GET /api/payroll/download/:id` - Download payslip

### Reports
- `GET /api/reports/employee-summary` - Employee summary
- `GET /api/reports/attendance-summary` - Attendance summary
- `GET /api/reports/leave-summary` - Leave summary
- `GET /api/reports/payroll-summary` - Payroll summary

## 🎨 UI/UX Features

- **Responsive Design** - Works on all device sizes
- **Modern Interface** - Clean, professional design
- **Dark/Light Theme Support** - Easy on the eyes
- **Interactive Charts** - Visual data representation
- **Smooth Animations** - Enhanced user experience
- **Accessible** - WCAG compliant design
- **Fast Loading** - Optimized performance

## 🔧 Configuration

### Email Setup
To enable email notifications, configure your SMTP settings in the backend `.env` file:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### File Upload
The system supports document upload with the following formats:
- Images: JPG, JPEG, PNG, GIF
- Documents: PDF, DOC, DOCX, XLS, XLSX
- Maximum file size: 10MB

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or your preferred MongoDB hosting
2. Update the `MONGODB_URI` in your production environment
3. Deploy to platforms like Heroku, AWS, or DigitalOcean
4. Set all environment variables in your hosting platform

### Frontend Deployment
1. Build the React application: `npm run build`
2. Deploy the build folder to platforms like Netlify, Vercel, or AWS S3
3. Update the API URL to point to your backend deployment

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support and questions, please contact:
- Email: support@hrms.com
- Documentation: [Link to documentation]
- Issues: [GitHub Issues Page]

## 🎯 Future Enhancements

- Mobile application (React Native)
- Advanced reporting with custom filters
- Integration with third-party services
- Multi-language support
- Advanced approval workflows
- Time tracking integration
- Performance management module