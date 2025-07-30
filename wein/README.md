# BrainBased EMDR Consultation Tracking System

A comprehensive, full-stack application for managing EMDR consultation certification with integrated video conferencing, progress tracking, and automated certification delivery.

## 🚀 **Project Overview**

This is a custom-built platform that transforms the EMDR consultation certification process by providing:

- **Integrated Video Conferencing** - Custom WebRTC platform built specifically for EMDR consultations
- **Real-time Progress Tracking** - Live updates on certification progress with predictive completion estimates
- **Automated Certification** - Intelligent system that generates and delivers certificates automatically
- **Kajabi Integration** - Seamless integration with existing CRM for course completion triggers
- **Multi-role Dashboard** - Specialized interfaces for Students, Consultants, and Administrators

## 🛠️ **Tech Stack**

### **Frontend**
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible components
- **React Hook Form** - Form management
- **Zustand** - State management

### **Backend**
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Database management and migrations
- **PostgreSQL** - Primary database
- **JWT Authentication** - Secure user authentication
- **WebRTC** - Custom video conferencing

### **Infrastructure**
- **Vercel** - Hosting and deployment
- **Supabase/PlanetScale** - Database hosting
- **Cloudflare** - CDN and video streaming
- **SendGrid** - Email delivery

## 📋 **Prerequisites**

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** database
- **Git**

## 🚀 **Quick Start**

### 1. **Clone and Install**
```bash
cd wein
npm install
```

### 2. **Environment Setup**
Create a `.env.local` file:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/emdr_tracking"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"

# Video Platform
WEBRTC_API_KEY="your-webrtc-api-key"
WEBRTC_SECRET="your-webrtc-secret"

# Email
SENDGRID_API_KEY="your-sendgrid-api-key"

# Kajabi Integration
KAJABI_WEBHOOK_SECRET="your-kajabi-webhook-secret"
KAJABI_API_KEY="your-kajabi-api-key"
```

### 3. **Database Setup**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

### 4. **Start Development**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 **Project Structure**

```
wein/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── students/      # Student management
│   │   │   ├── consultants/   # Consultant management
│   │   │   ├── sessions/      # Session management
│   │   │   └── admin/         # Admin endpoints
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── video/             # Video conferencing
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── video/            # Video components
│   │   └── forms/            # Form components
│   ├── lib/                  # Utilities and services
│   │   ├── db.ts            # Database connection
│   │   ├── auth.ts          # Authentication utilities
│   │   └── services/        # Business logic services
│   └── types/               # TypeScript type definitions
├── prisma/                  # Database schema and migrations
├── public/                  # Static assets
└── docs/                    # Documentation
```

## 🎯 **Development Phases**

### **Phase 1A: Core Infrastructure (Weeks 1-5)**
- [x] Database schema design
- [x] Authentication system
- [x] Basic API structure
- [ ] User management system
- [ ] Kajabi webhook integration
- [ ] Basic dashboard layout

### **Phase 1B: Video Platform (Weeks 6-10)**
- [ ] WebRTC implementation
- [ ] Video session management
- [ ] Recording capabilities
- [ ] Quality monitoring
- [ ] Attendance tracking

### **Phase 1C: Core Features (Weeks 11-15)**
- [ ] Session scheduling system
- [ ] Progress tracking
- [ ] Document management
- [ ] Consultant availability
- [ ] Real-time notifications

### **Phase 1D: Automation (Weeks 16-18)**
- [ ] Certification engine
- [ ] PDF generation
- [ ] Email automation
- [ ] Payment processing
- [ ] Advanced analytics

### **Phase 2: Advanced Features (Weeks 19-24)**
- [ ] Machine learning integration
- [ ] Advanced reporting
- [ ] Directory automation
- [ ] Performance optimization
- [ ] Security hardening

## 🔧 **Available Scripts**

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
npm run format       # Format code with Prettier

# Testing
npm run test         # Run unit tests
npm run test:e2e     # Run end-to-end tests
```

## 🎨 **Component Library**

The project uses shadcn/ui components. To add new components:

```bash
npx shadcn@latest add [component-name]
```

Available components:
- Button, Card, Input, Label
- Dialog, Dropdown Menu, Select
- Table, Tabs, Accordion
- Progress, Badge, Avatar
- And many more...

## 🔐 **Authentication**

The system supports three user types:

1. **Students** - EMDR trainees tracking certification progress
2. **Consultants** - EMDR practitioners providing consultation services
3. **Administrators** - System managers with full access

Authentication is handled via JWT tokens with role-based access control.

## 📊 **Database Schema**

The database includes comprehensive models for:

- **Users** - Core user management
- **Students** - Student-specific data and progress
- **Consultants** - Consultant profiles and availability
- **Sessions** - Consultation session tracking
- **Video Sessions** - Video conferencing data
- **Documents** - Document upload and management
- **Certifications** - Automated certification tracking
- **Payments** - Consultant payment processing

## 🔗 **API Endpoints**

### **Authentication**
- `POST /api/auth` - Login/Register

### **Students**
- `GET /api/students/[id]/progress` - Get progress data
- `GET /api/students/[id]/sessions` - Get session history
- `POST /api/students/[id]/documents` - Upload documents

### **Consultants**
- `GET /api/consultants/[id]/availability` - Get availability
- `POST /api/consultants/[id]/availability` - Update availability
- `GET /api/consultants/[id]/sessions` - Get session schedule

### **Sessions**
- `POST /api/sessions` - Create new session
- `PUT /api/sessions/[id]` - Update session
- `GET /api/sessions/[id]/video` - Get video session data

### **Admin**
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/reports` - System reports
- `POST /api/admin/certifications` - Manual certification

## 🚀 **Deployment**

### **Vercel Deployment**
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### **Database Deployment**
- Use Supabase or PlanetScale for PostgreSQL hosting
- Set up connection pooling for production
- Configure automated backups

### **Video Platform**
- Deploy WebRTC servers on cloud infrastructure
- Set up CDN for global video delivery
- Configure monitoring and alerting

## 📈 **Performance Targets**

- **Page Load Time**: <2 seconds
- **API Response Time**: <500ms
- **Video Quality**: 720p minimum, 1080p preferred
- **System Uptime**: 99.9%
- **Concurrent Users**: 1000+ simultaneous video sessions

## 🔒 **Security**

- **End-to-end encryption** for video sessions
- **JWT token authentication** with secure storage
- **Input validation** and sanitization
- **Rate limiting** on API endpoints
- **CORS configuration** for cross-origin requests
- **Regular security audits** and penetration testing

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is proprietary software developed for BrainBased EMDR.

## 📞 **Support**

For technical support or questions:
- Email: tech@brainbasedemdr.com
- Documentation: [docs.brainbasedemdr.com](https://docs.brainbasedemdr.com)
- Issues: GitHub Issues page

---

**Built with ❤️ for the EMDR community** 