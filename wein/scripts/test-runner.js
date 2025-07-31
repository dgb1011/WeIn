#!/usr/bin/env node

/**
 * BrainBased EMDR - Comprehensive Test Runner
 * Tests all features developed through Phases 2-7
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Test configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  testUsers: {
    student: { email: 'student1@test.com', password: 'TestPass123!' },
    consultant: { email: 'consultant1@test.com', password: 'TestPass123!' },
    admin: { email: 'admin1@test.com', password: 'TestPass123!' }
  },
  timeout: 10000
};

// Test results storage
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const assert = (condition, message) => {
  testResults.total++;
  if (condition) {
    testResults.passed++;
    log(`PASS: ${message}`, 'success');
  } else {
    testResults.failed++;
    testResults.errors.push(message);
    log(`FAIL: ${message}`, 'error');
  }
};

const testAPI = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${CONFIG.baseUrl}${endpoint}`, {
      timeout: CONFIG.timeout,
      ...options
    });
    return { success: true, response, data: await response.json() };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Authentication tests
const testAuthentication = async () => {
  log('🧪 Testing Authentication System...');
  
  // Test student registration
  const registerResult = await testAPI('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'register',
      email: 'teststudent@example.com',
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'Student',
      userType: 'STUDENT'
    })
  });
  
  assert(registerResult.success, 'Student registration should work');
  if (registerResult.success) {
    assert(registerResult.data.token, 'Registration should return JWT token');
    assert(registerResult.data.user.userType === 'STUDENT', 'User type should be STUDENT');
  }
  
  // Test login
  const loginResult = await testAPI('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      email: CONFIG.testUsers.student.email,
      password: CONFIG.testUsers.student.password
    })
  });
  
  assert(loginResult.success, 'Student login should work');
  if (loginResult.success) {
    assert(loginResult.data.token, 'Login should return JWT token');
    assert(loginResult.data.user.email === CONFIG.testUsers.student.email, 'Login should return correct user');
  }
  
  return loginResult.success ? loginResult.data.token : null;
};

// Student services tests
const testStudentServices = async (token) => {
  log('🧪 Testing Student Services...');
  
  const headers = { 'Authorization': `Bearer ${token}` };
  
  // Test progress tracking
  const progressResult = await testAPI('/api/students?action=progress', { headers });
  assert(progressResult.success, 'Progress tracking should work');
  if (progressResult.success) {
    assert(progressResult.data.progress, 'Progress data should be returned');
  }
  
  // Test session history
  const sessionsResult = await testAPI('/api/students?action=sessions', { headers });
  assert(sessionsResult.success, 'Session history should work');
  if (sessionsResult.success) {
    assert(Array.isArray(sessionsResult.data), 'Session history should be an array');
  }
};

// Consultant services tests
const testConsultantServices = async () => {
  log('🧪 Testing Consultant Services...');
  
  // Login as consultant
  const loginResult = await testAPI('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      email: CONFIG.testUsers.consultant.email,
      password: CONFIG.testUsers.consultant.password
    })
  });
  
  assert(loginResult.success, 'Consultant login should work');
  if (!loginResult.success) return;
  
  const token = loginResult.data.token;
  const headers = { 'Authorization': `Bearer ${token}` };
  
  // Test availability management
  const availabilityResult = await testAPI('/api/consultants?action=availability', { headers });
  assert(availabilityResult.success, 'Availability management should work');
  
  // Test session management
  const sessionsResult = await testAPI('/api/consultants?action=sessions', { headers });
  assert(sessionsResult.success, 'Session management should work');
};

// Video platform tests
const testVideoPlatform = async (studentToken) => {
  log('🧪 Testing Video Platform...');
  
  const headers = { 
    'Authorization': `Bearer ${studentToken}`,
    'Content-Type': 'application/json'
  };
  
  // Test video room creation
  const createRoomResult = await testAPI('/api/video', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'createRoom',
      sessionId: 'test-session-1',
      recordingEnabled: true,
      maxParticipants: 2,
      quality: '720p'
    })
  });
  
  assert(createRoomResult.success, 'Video room creation should work');
  if (createRoomResult.success) {
    assert(createRoomResult.data.room.roomId, 'Room ID should be returned');
    assert(createRoomResult.data.room.joinUrl, 'Join URL should be returned');
  }
  
  // Test video session joining
  if (createRoomResult.success) {
    const joinResult = await testAPI('/api/video', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'joinRoom',
        roomId: createRoomResult.data.room.roomId
      })
    });
    
    assert(joinResult.success, 'Video room joining should work');
  }
};

// Scheduling system tests
const testSchedulingSystem = async (studentToken) => {
  log('🧪 Testing Scheduling System...');
  
  const headers = { 
    'Authorization': `Bearer ${studentToken}`,
    'Content-Type': 'application/json'
  };
  
  // Test available slots
  const slotsResult = await testAPI('/api/scheduling?action=availableSlots&startDate=2024-02-01&endDate=2024-02-28', { headers });
  assert(slotsResult.success, 'Available slots should work');
  if (slotsResult.success) {
    assert(Array.isArray(slotsResult.data.slots), 'Slots should be an array');
  }
  
  // Test session booking (if slots available)
  if (slotsResult.success && slotsResult.data.slots.length > 0) {
    const slot = slotsResult.data.slots[0];
    const bookingResult = await testAPI('/api/scheduling', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'bookSession',
        consultantId: slot.consultantId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        sessionType: 'EMDR_CONSULTATION'
      })
    });
    
    assert(bookingResult.success, 'Session booking should work');
    if (bookingResult.success) {
      assert(bookingResult.data.confirmation.bookingId, 'Booking ID should be returned');
    }
  }
};

// Progress tracking tests
const testProgressTracking = async (studentToken) => {
  log('🧪 Testing Progress Tracking...');
  
  const headers = { 'Authorization': `Bearer ${studentToken}` };
  
  // Test progress overview
  const overviewResult = await testAPI('/api/progress?action=overview', { headers });
  assert(overviewResult.success, 'Progress overview should work');
  if (overviewResult.success) {
    assert(overviewResult.data.progress, 'Progress data should be returned');
    assert(typeof overviewResult.data.progress.totalVerifiedHours === 'number', 'Total hours should be a number');
    assert(typeof overviewResult.data.progress.completionPercentage === 'number', 'Completion percentage should be a number');
  }
  
  // Test milestones
  const milestonesResult = await testAPI('/api/progress?action=milestones', { headers });
  assert(milestonesResult.success, 'Milestones should work');
  if (milestonesResult.success) {
    assert(Array.isArray(milestonesResult.data.milestones), 'Milestones should be an array');
  }
  
  // Test weekly progress
  const weeklyResult = await testAPI('/api/progress?action=weekly', { headers });
  assert(weeklyResult.success, 'Weekly progress should work');
  if (weeklyResult.success) {
    assert(Array.isArray(weeklyResult.data.weeklyProgress), 'Weekly progress should be an array');
  }
};

// Document management tests
const testDocumentManagement = async (studentToken) => {
  log('🧪 Testing Document Management...');
  
  const headers = { 
    'Authorization': `Bearer ${studentToken}`,
    'Content-Type': 'application/json'
  };
  
  // Test document list
  const listResult = await testAPI('/api/documents?action=list', { headers });
  assert(listResult.success, 'Document list should work');
  if (listResult.success) {
    assert(Array.isArray(listResult.data.documents), 'Documents should be an array');
  }
  
  // Test requirements status
  const requirementsResult = await testAPI('/api/documents?action=requirements', { headers });
  assert(requirementsResult.success, 'Requirements status should work');
  if (requirementsResult.success) {
    assert(requirementsResult.data.requirements, 'Requirements data should be returned');
  }
  
  // Test document upload (mock)
  const mockFileContent = 'Test document content for EMDR consultation log';
  const mockFileBuffer = Buffer.from(mockFileContent);
  const base64Data = mockFileBuffer.toString('base64');
  
  const uploadResult = await testAPI('/api/documents', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'upload',
      documentType: 'CONSULTATION_LOG',
      fileName: 'test-consultation-log.pdf',
      fileSize: mockFileBuffer.length,
      mimeType: 'application/pdf',
      fileData: base64Data,
      metadata: {
        originalFilename: 'test-consultation-log.pdf',
        uploadTimestamp: new Date().toISOString()
      }
    })
  });
  
  assert(uploadResult.success, 'Document upload should work');
  if (uploadResult.success) {
    assert(uploadResult.data.result.success, 'Upload should be successful');
    assert(uploadResult.data.result.documentId, 'Document ID should be returned');
  }
};

// Admin services tests
const testAdminServices = async () => {
  log('🧪 Testing Admin Services...');
  
  // Login as admin
  const loginResult = await testAPI('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      email: CONFIG.testUsers.admin.email,
      password: CONFIG.testUsers.admin.password
    })
  });
  
  assert(loginResult.success, 'Admin login should work');
  if (!loginResult.success) return;
  
  const token = loginResult.data.token;
  const headers = { 'Authorization': `Bearer ${token}` };
  
  // Test user management
  const usersResult = await testAPI('/api/admin?action=users', { headers });
  assert(usersResult.success, 'User management should work');
  if (usersResult.success) {
    assert(Array.isArray(usersResult.data.users), 'Users should be an array');
  }
  
  // Test system health
  const healthResult = await testAPI('/api/admin?action=systemHealth', { headers });
  assert(healthResult.success, 'System health should work');
  
  // Test analytics
  const analyticsResult = await testAPI('/api/admin?action=analytics', { headers });
  assert(analyticsResult.success, 'Analytics should work');
};

// Integration tests
const testIntegration = async (studentToken) => {
  log('🧪 Testing Integration Points...');
  
  const headers = { 'Authorization': `Bearer ${studentToken}` };
  
  // Test that document upload affects progress
  const initialProgress = await testAPI('/api/progress?action=overview', { headers });
  if (initialProgress.success) {
    const initialHours = initialProgress.data.progress.totalVerifiedHours;
    
    // Upload a document
    const mockFileContent = 'Test document for integration testing';
    const mockFileBuffer = Buffer.from(mockFileContent);
    const base64Data = mockFileBuffer.toString('base64');
    
    const uploadResult = await testAPI('/api/documents', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'upload',
        documentType: 'CONSULTATION_LOG',
        fileName: 'integration-test.pdf',
        fileSize: mockFileBuffer.length,
        mimeType: 'application/pdf',
        fileData: base64Data
      })
    });
    
    if (uploadResult.success) {
      // Check if progress was updated
      const updatedProgress = await testAPI('/api/progress?action=overview', { headers });
      assert(updatedProgress.success, 'Progress should be accessible after document upload');
    }
  }
  
  // Test that booking affects scheduling
  const slotsResult = await testAPI('/api/scheduling?action=availableSlots&startDate=2024-02-01&endDate=2024-02-28', { headers });
  if (slotsResult.success && slotsResult.data.slots.length > 0) {
    const slot = slotsResult.data.slots[0];
    const bookingResult = await testAPI('/api/scheduling', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'bookSession',
        consultantId: slot.consultantId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        sessionType: 'EMDR_CONSULTATION'
      })
    });
    
    if (bookingResult.success) {
      // Check that video room was created
      const videoResult = await testAPI('/api/video', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createRoom',
          sessionId: bookingResult.data.confirmation.bookingId,
          recordingEnabled: true,
          maxParticipants: 2,
          quality: '720p'
        })
      });
      
      assert(videoResult.success, 'Video room should be created for booked session');
    }
  }
};

// Performance tests
const testPerformance = async (studentToken) => {
  log('🧪 Testing Performance...');
  
  const headers = { 'Authorization': `Bearer ${studentToken}` };
  const endpoints = [
    '/api/students?action=progress',
    '/api/progress?action=overview',
    '/api/documents?action=list',
    '/api/scheduling?action=availableSlots&startDate=2024-02-01&endDate=2024-02-28'
  ];
  
  for (const endpoint of endpoints) {
    const startTime = Date.now();
    const result = await testAPI(endpoint, { headers });
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    assert(result.success, `${endpoint} should respond successfully`);
    assert(responseTime < 1000, `${endpoint} should respond within 1 second (${responseTime}ms)`);
  }
};

// Security tests
const testSecurity = async () => {
  log('🧪 Testing Security...');
  
  // Test invalid token rejection
  const invalidTokenResult = await testAPI('/api/students?action=progress', {
    headers: { 'Authorization': 'Bearer invalid-token' }
  });
  assert(!invalidTokenResult.success || invalidTokenResult.response.status === 401, 'Invalid tokens should be rejected');
  
  // Test missing token rejection
  const noTokenResult = await testAPI('/api/students?action=progress');
  assert(!noTokenResult.success || noTokenResult.response.status === 401, 'Missing tokens should be rejected');
  
  // Test student accessing admin endpoints
  const studentLogin = await testAPI('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      email: CONFIG.testUsers.student.email,
      password: CONFIG.testUsers.student.password
    })
  });
  
  if (studentLogin.success) {
    const adminAccessResult = await testAPI('/api/admin?action=users', {
      headers: { 'Authorization': `Bearer ${studentLogin.data.token}` }
    });
    assert(!adminAccessResult.success || adminAccessResult.response.status === 401, 'Students should not access admin endpoints');
  }
};

// Main test runner
const runTests = async () => {
  log('🚀 Starting BrainBased EMDR Comprehensive Testing...');
  log(`Testing against: ${CONFIG.baseUrl}`);
  
  try {
    // Phase 1: Authentication
    const studentToken = await testAuthentication();
    
    if (studentToken) {
      // Phase 2: Core Services
      await testStudentServices(studentToken);
      await testConsultantServices();
      await testAdminServices();
      
      // Phase 3: Video Platform
      await testVideoPlatform(studentToken);
      
      // Phase 4: Scheduling System
      await testSchedulingSystem(studentToken);
      
      // Phase 5: Progress Tracking
      await testProgressTracking(studentToken);
      
      // Phase 6: Document Management
      await testDocumentManagement(studentToken);
      
      // Phase 7: Integration Testing
      await testIntegration(studentToken);
      
      // Phase 8: Performance Testing
      await testPerformance(studentToken);
      
      // Phase 9: Security Testing
      await testSecurity();
    }
    
  } catch (error) {
    log(`Test execution failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`Test execution error: ${error.message}`);
  }
  
  // Generate test report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: testResults.total > 0 ? (testResults.passed / testResults.total * 100).toFixed(2) : 0
    },
    errors: testResults.errors,
    recommendations: []
  };
  
  if (testResults.failed > 0) {
    report.recommendations.push('Review failed tests and fix issues before deployment');
  }
  
  if (testResults.passed / testResults.total < 0.9) {
    report.recommendations.push('Success rate below 90%. Consider additional testing.');
  }
  
  // Save test report
  const reportPath = path.join(__dirname, '../test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Display results
  log('\n📊 Test Results Summary:');
  log(`Total Tests: ${testResults.total}`);
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
  log(`Success Rate: ${report.summary.successRate}%`);
  
  if (testResults.errors.length > 0) {
    log('\n❌ Failed Tests:');
    testResults.errors.forEach(error => log(`  - ${error}`, 'error'));
  }
  
  if (report.recommendations.length > 0) {
    log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => log(`  - ${rec}`));
  }
  
  log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
};

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { runTests, testResults }; 