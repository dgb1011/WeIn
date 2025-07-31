# BrainBased EMDR - Manual Testing Guide

## 🎯 **Quick Start Testing**

This guide provides step-by-step instructions to manually test all features developed through Phases 2-7.

### **Prerequisites**
1. Ensure the development server is running: `npm run dev`
2. Database is connected and seeded with test data
3. All environment variables are configured

---

## 🔐 **Phase 2: Authentication Testing**

### **Test 1: User Registration**
1. Navigate to `http://localhost:3000/auth/register`
2. Fill out the registration form:
   - Email: `teststudent@example.com`
   - Password: `TestPass123!`
   - First Name: `Test`
   - Last Name: `Student`
   - User Type: `Student`
3. Click "Create Account"
4. **Expected Result**: User is created, JWT token is generated, redirected to student dashboard

### **Test 2: User Login**
1. Navigate to `http://localhost:3000/auth/login`
2. Login with test credentials:
   - **Student**: `student1@test.com` / `TestPass123!`
   - **Consultant**: `consultant1@test.com` / `TestPass123!`
   - **Admin**: `admin1@test.com` / `TestPass123!`
3. **Expected Result**: User is logged in and redirected to appropriate dashboard

### **Test 3: Role-Based Access**
1. Login as a student
2. Try to access `/dashboard/consultant` or `/dashboard/admin`
3. **Expected Result**: Access denied or redirected to student dashboard

---

## 👤 **Phase 2: Core Services Testing**

### **Test 4: Student Dashboard**
1. Login as a student
2. Navigate to `/dashboard/student`
3. Verify the following elements are present:
   - Progress indicator showing completion percentage
   - Recent sessions list
   - Quick actions (Book Session, Upload Document)
   - Navigation menu
4. **Expected Result**: Dashboard loads with all components

### **Test 5: Student Progress Tracking**
1. Login as a student
2. Navigate to `/dashboard/student/progress`
3. Verify progress components:
   - Circular progress indicator
   - Hour breakdown chart
   - Weekly progress chart
   - Milestone tracker
4. **Expected Result**: Progress data is displayed correctly

### **Test 6: Consultant Dashboard**
1. Login as a consultant
2. Navigate to `/dashboard/consultant`
3. Verify the following elements:
   - Availability management
   - Session schedule
   - Pending verifications
   - Performance metrics
4. **Expected Result**: Consultant dashboard loads with all features

### **Test 7: Admin Dashboard**
1. Login as an admin
2. Navigate to `/dashboard/admin`
3. Verify admin features:
   - User management
   - System health monitoring
   - Analytics dashboard
   - Configuration settings
4. **Expected Result**: Admin dashboard loads with all administrative tools

---

## 🎥 **Phase 4: Video Platform Testing**

### **Test 8: Video Room Creation**
1. Login as a student
2. Navigate to `/dashboard/student/schedule`
3. Book a consultation session
4. Navigate to the video session page
5. **Expected Result**: Video room is created and loads properly

### **Test 9: Video Session Interface**
1. Join a video session
2. Test video controls:
   - Mute/unmute microphone
   - Enable/disable camera
   - Screen sharing
   - Chat functionality
   - Recording controls
3. **Expected Result**: All video controls work correctly

### **Test 10: Video Quality**
1. Join a video session
2. Check video and audio quality
3. Test connection stability
4. **Expected Result**: Video quality is acceptable, audio is clear

---

## 📅 **Phase 5: Scheduling System Testing**

### **Test 11: Consultant Availability**
1. Login as a consultant
2. Navigate to availability management
3. Set availability for different time slots
4. **Expected Result**: Availability is saved and displayed correctly

### **Test 12: Session Booking**
1. Login as a student
2. Navigate to `/dashboard/student/schedule`
3. Browse available consultants
4. Select a time slot
5. Book a session
6. **Expected Result**: Session is booked successfully, confirmation is received

### **Test 13: Calendar Integration**
1. Login as a student
2. Navigate to scheduling page
3. Test calendar navigation:
   - Previous/next month
   - Date selection
   - Time slot selection
4. **Expected Result**: Calendar works smoothly, time slots are displayed correctly

### **Test 14: Session Management**
1. Login as a consultant
2. Navigate to session management
3. View scheduled sessions
4. Test session verification
5. **Expected Result**: Sessions can be viewed and verified

---

## 📊 **Phase 6: Progress Tracking Testing**

### **Test 15: Progress Overview**
1. Login as a student
2. Navigate to `/dashboard/student/progress`
3. Verify progress components:
   - Total hours completed
   - Completion percentage
   - Estimated completion date
   - Weekly progress chart
4. **Expected Result**: Progress data is accurate and up-to-date

### **Test 16: Milestone Tracking**
1. Login as a student
2. Navigate to progress page
3. Check milestone indicators:
   - 10-hour milestone
   - 20-hour milestone
   - 30-hour milestone
   - 40-hour completion
4. **Expected Result**: Milestones are tracked and celebrated appropriately

### **Test 17: Progress Analytics**
1. Login as a student
2. Navigate to progress analytics
3. Check various charts and metrics:
   - Weekly progress trends
   - Consultant distribution
   - Session frequency
   - Completion predictions
4. **Expected Result**: Analytics provide meaningful insights

---

## 📄 **Phase 7: Document Management Testing**

### **Test 18: Document Upload**
1. Login as a student
2. Navigate to `/dashboard/documents`
3. Click "Upload Documents"
4. Test file upload:
   - Drag and drop a PDF file
   - Select document type
   - Submit upload
5. **Expected Result**: File uploads successfully, validation runs

### **Test 19: Document Processing**
1. Upload a document
2. Wait for processing to complete
3. Check document status:
   - Validation score
   - Review status
   - Extracted text
4. **Expected Result**: Document is processed and status is updated

### **Test 20: Document Review (Consultant)**
1. Login as a consultant
2. Navigate to document review section
3. Review a pending document:
   - Read extracted content
   - Check validation score
   - Approve or reject
   - Add feedback
4. **Expected Result**: Review process works correctly

### **Test 21: Document Requirements**
1. Login as a student
2. Navigate to document requirements
3. Check requirements status:
   - Consultation Log (Required)
   - Evaluation Form (Required)
   - Reflection Paper (Required)
   - Case Study (Required)
4. **Expected Result**: Requirements are tracked correctly

---

## 🔗 **Integration Testing**

### **Test 22: End-to-End Student Journey**
1. **Register/Login** as a new student
2. **View Progress** - should show 0 hours initially
3. **Book Session** - schedule a consultation
4. **Join Video Session** - participate in consultation
5. **Upload Document** - submit consultation log
6. **Check Progress** - should show updated hours
7. **View Milestones** - should show progress toward completion
8. **Expected Result**: Complete journey works seamlessly

### **Test 23: End-to-End Consultant Journey**
1. **Login** as a consultant
2. **Set Availability** - configure available time slots
3. **View Sessions** - see scheduled consultations
4. **Join Video Session** - conduct consultation
5. **Verify Session** - mark session as completed
6. **Review Documents** - approve student submissions
7. **Check Payments** - view session earnings
8. **Expected Result**: Complete consultant workflow functions

### **Test 24: Cross-Service Integration**
1. **Book Session** as a student
2. **Verify** that video room is automatically created
3. **Complete Session** and upload document
4. **Verify** that progress is automatically updated
5. **Check** that milestones are triggered
6. **Expected Result**: All services work together seamlessly

---

## ⚡ **Performance Testing**

### **Test 25: Page Load Times**
1. Use browser developer tools (F12)
2. Navigate to each major page
3. Check load times in Network tab
4. **Expected Result**: All pages load within 2 seconds

### **Test 26: API Response Times**
1. Open browser developer tools
2. Navigate through the application
3. Monitor API calls in Network tab
4. **Expected Result**: API responses within 500ms

### **Test 27: Database Performance**
1. Perform multiple operations simultaneously
2. Monitor for any slowdowns
3. Check for error messages
4. **Expected Result**: System remains responsive

---

## 🔒 **Security Testing**

### **Test 28: Authentication Security**
1. Try to access protected pages without login
2. **Expected Result**: Redirected to login page

### **Test 29: Authorization Security**
1. Login as a student
2. Try to access consultant or admin pages
3. **Expected Result**: Access denied

### **Test 30: Input Validation**
1. Try to submit forms with invalid data
2. Test file upload with invalid file types
3. **Expected Result**: Proper validation and error messages

---

## 📱 **Responsive Design Testing**

### **Test 31: Mobile Responsiveness**
1. Open application on mobile device or use browser dev tools
2. Test all major pages and features
3. **Expected Result**: All features work on mobile devices

### **Test 32: Tablet Responsiveness**
1. Test on tablet-sized viewport
2. Verify layout adapts correctly
3. **Expected Result**: Layout is optimized for tablet

---

## 🐛 **Error Handling Testing**

### **Test 33: Network Errors**
1. Disconnect internet temporarily
2. Try to perform operations
3. **Expected Result**: Graceful error handling

### **Test 34: Invalid Data**
1. Submit forms with invalid data
2. Upload corrupted files
3. **Expected Result**: Clear error messages

---

## 📋 **Test Checklist**

### **Authentication (Phase 2)**
- [ ] User registration works
- [ ] User login works
- [ ] Role-based access control works
- [ ] Session management works
- [ ] Logout functions correctly

### **Core Services (Phase 2)**
- [ ] Student dashboard loads
- [ ] Consultant dashboard loads
- [ ] Admin dashboard loads
- [ ] Progress tracking works
- [ ] Session management works

### **Video Platform (Phase 4)**
- [ ] Video room creation works
- [ ] Video controls function
- [ ] Screen sharing works
- [ ] Recording functions
- [ ] Quality is acceptable

### **Scheduling (Phase 5)**
- [ ] Availability management works
- [ ] Session booking works
- [ ] Calendar navigation works
- [ ] Conflict detection works
- [ ] Notifications are sent

### **Progress Tracking (Phase 6)**
- [ ] Progress calculation is accurate
- [ ] Milestones are tracked
- [ ] Analytics display correctly
- [ ] Predictions are reasonable
- [ ] Weekly progress works

### **Document Management (Phase 7)**
- [ ] File upload works
- [ ] Document processing works
- [ ] Review workflow functions
- [ ] Requirements tracking works
- [ ] Integration with progress works

### **Integration**
- [ ] End-to-end student journey works
- [ ] End-to-end consultant journey works
- [ ] Cross-service communication works
- [ ] Data synchronization works

### **Performance & Security**
- [ ] Page load times are acceptable
- [ ] API response times are fast
- [ ] Security measures work
- [ ] Error handling is graceful
- [ ] Responsive design works

---

## 🚀 **Production Readiness Checklist**

### **Before Deployment**
- [ ] All tests pass
- [ ] Performance benchmarks met
- [ ] Security requirements satisfied
- [ ] Error handling comprehensive
- [ ] Documentation complete
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Backup systems configured
- [ ] Monitoring alerts set up

### **Post-Deployment**
- [ ] Smoke tests pass
- [ ] User acceptance testing complete
- [ ] Performance monitoring active
- [ ] Error tracking configured
- [ ] Support system ready
- [ ] Training materials available

---

**This manual testing guide ensures comprehensive validation of all features before production deployment.** 