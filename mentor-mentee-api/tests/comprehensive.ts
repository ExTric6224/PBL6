import axios, { AxiosError } from 'axios';
import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const OUTPUT_FILE = 'auth-test-results.xlsx';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];

// Test result interface
interface TestResult {
  id: string;
  category: string;
  testCase: string;
  description: string;
  endpoint: string;
  method: string;
  requestData: any;
  expectedStatus: number;
  actualStatus: number;
  expectedResult: string;
  actualResult: string;
  responseMessage: string;
  passed: boolean;
  duration: number;
  timestamp: string;
  errorDetails?: string;
}

// Test categories
enum TestCategory {
  REGISTER_SUCCESS = 'Register - Success Cases',
  REGISTER_VALIDATION = 'Register - Validation Errors',
  REGISTER_BUSINESS = 'Register - Business Logic Errors',
  LOGIN_SUCCESS = 'Login - Success Cases',
  LOGIN_FAILURE = 'Login - Failure Cases'
}

class AuthAutomationTest {
  private results: TestResult[] = [];
  private testCounter: number = 0;
  private createdUsers: Map<string, { email: string; password: string; role: string }> = new Map();

  async runAllTests() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║       AUTHENTICATION AUTOMATION TEST SUITE                ║');
    console.log('║       Testing Registration & Login Functionality          ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // Registration Success Tests
    await this.testRegisterMentorSuccess();
    await this.testRegisterMenteeSuccess();
    await this.testRegisterWithLongPassword();

    // Registration Validation Tests
    await this.testRegisterWithExistingEmail();
    await this.testRegisterWithInvalidEmail();
    await this.testRegisterWithEmptyEmail();
    await this.testRegisterWithShortPassword();
    await this.testRegisterWithInvalidRole();
    await this.testRegisterWithEmptyRole();

    // Login Success Tests
    await this.testLoginMentorSuccess();
    await this.testLoginMenteeSuccess();

    // Login Failure Tests
    await this.testLoginWithNonExistentEmail();
    await this.testLoginWithWrongPassword();
    await this.testLoginWithInvalidEmail();
    await this.testLoginWithEmptyPassword();

    // Export results
    await this.exportToExcel();
    
    // Print summary
    this.printSummary();
  }

  private getNextTestId(): string {
    this.testCounter++;
    return `TC${String(this.testCounter).padStart(3, '0')}`;
  }

  private async executeTest(
    category: TestCategory,
    description: string,
    endpoint: string,
    method: string,
    data: any,
    expectedStatus: number,
    expectedResult: string
  ): Promise<TestResult> {
    const testId = this.getNextTestId();
    const startTime = Date.now();
    
    let result: TestResult = {
      id: testId,
      category,
      testCase: `${testId} - ${description}`,
      description,
      endpoint,
      method,
      requestData: data,
      expectedStatus,
      actualStatus: 0,
      expectedResult,
      actualResult: '',
      responseMessage: '',
      passed: false,
      duration: 0,
      timestamp: new Date().toISOString()
    };

    try {
      console.log(`\n┌─────────────────────────────────────────────────────────┐`);
      console.log(`│ ${testId}: ${description.padEnd(50)} │`);
      console.log(`└─────────────────────────────────────────────────────────┘`);
      console.log(`   Category: ${category}`);
      console.log(`   Endpoint: ${method} ${endpoint}`);
      console.log(`   Data: ${JSON.stringify(data, null, 2).substring(0, 100)}...`);
      
      const response = await axios({
        method: method.toLowerCase() as any,
        url: `${BASE_URL}${endpoint}`,
        data,
        validateStatus: () => true
      });

      result.actualStatus = response.status;
      result.actualResult = JSON.stringify(response.data, null, 2);
      
      // Extract response message
      if (response.data?.error?.message) {
        result.responseMessage = response.data.error.message;
      } else if (response.data?.data?.user) {
        result.responseMessage = `User created/logged in: ${response.data.data.user.email}`;
      } else if (response.data?.message) {
        result.responseMessage = response.data.message;
      }

      result.passed = response.status === expectedStatus;
      
      console.log(`   Expected Status: ${expectedStatus}`);
      console.log(`   Actual Status: ${response.status}`);
      console.log(`   Response: ${result.responseMessage}`);
      console.log(`   Result: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);

      // Store successful registrations
      if (result.passed && endpoint === '/auth/register' && response.data?.data?.user) {
        const user = response.data.data.user;
        this.createdUsers.set(user.email, {
          email: user.email,
          password: data.password,
          role: user.role
        });
        console.log(`   ✓ User stored for login tests`);
      }

    } catch (error) {
      const axiosError = error as AxiosError;
      result.actualStatus = axiosError.response?.status || 0;
      result.actualResult = JSON.stringify(
        axiosError.response?.data || { error: axiosError.message }, 
        null, 
        2
      );
      result.passed = false;
      result.errorDetails = axiosError.message;
      result.responseMessage = axiosError.message;
      
      console.log(`   Expected Status: ${expectedStatus}`);
      console.log(`   Actual Status: ${result.actualStatus}`);
      console.log(`   Result: ❌ FAILED - ${axiosError.message}`);
    }

    result.duration = Date.now() - startTime;
    this.results.push(result);
    console.log(`   Duration: ${result.duration}ms`);
    
    return result;
  }

  // ============================================================================
  // REGISTRATION SUCCESS TESTS
  // ============================================================================

  async testRegisterMentorSuccess() {
    await this.executeTest(
      TestCategory.REGISTER_SUCCESS,
      'Đăng ký thành công với role MENTOR',
      '/auth/register',
      'POST',
      {
        email: `mentor_${Date.now()}@test.com`,
        password: 'SecurePass123',
        role: 'MENTOR'
      },
      201,
      'User created successfully with MENTOR role and access token returned'
    );
  }

  async testRegisterMenteeSuccess() {
    await this.executeTest(
      TestCategory.REGISTER_SUCCESS,
      'Đăng ký thành công với role MENTEE',
      '/auth/register',
      'POST',
      {
        email: `mentee_${Date.now()}@test.com`,
        password: 'SecurePass456',
        role: 'MENTEE'
      },
      201,
      'User created successfully with MENTEE role and access token returned'
    );
  }

  async testRegisterWithLongPassword() {
    await this.executeTest(
      TestCategory.REGISTER_SUCCESS,
      'Đăng ký thành công với password dài (50 ký tự)',
      '/auth/register',
      'POST',
      {
        email: `longpass_${Date.now()}@test.com`,
        password: 'ThisIsAVeryLongPasswordWith50CharactersInTotal!!',
        role: 'MENTEE'
      },
      201,
      'User created successfully with long password'
    );
  }

  // ============================================================================
  // REGISTRATION VALIDATION TESTS
  // ============================================================================

  async testRegisterWithExistingEmail() {
    // First create a user
    const existingEmail = `existing_${Date.now()}@test.com`;
    await axios.post(`${BASE_URL}/auth/register`, {
      email: existingEmail,
      password: 'password123',
      role: 'MENTEE'
    }).catch(() => {});

    // Wait a bit to ensure the first registration is processed
    await new Promise(resolve => setTimeout(resolve, 500));

    // Try to register with same email
    await this.executeTest(
      TestCategory.REGISTER_BUSINESS,
      'Đăng ký với Email đã tồn tại',
      '/auth/register',
      'POST',
      {
        email: existingEmail,
        password: 'password123',
        role: 'MENTEE'
      },
      409,
      'Conflict error - Email already registered'
    );
  }

  async testRegisterWithInvalidEmail() {
    await this.executeTest(
      TestCategory.REGISTER_VALIDATION,
      'Đăng ký với Email không hợp lệ',
      '/auth/register',
      'POST',
      {
        email: 'invalid-email-format',
        password: 'password123',
        role: 'MENTEE'
      },
      400,
      'Validation error - Invalid email format'
    );
  }

  async testRegisterWithEmptyEmail() {
    await this.executeTest(
      TestCategory.REGISTER_VALIDATION,
      'Đăng ký với Email rỗng',
      '/auth/register',
      'POST',
      {
        email: '',
        password: 'password123',
        role: 'MENTEE'
      },
      400,
      'Validation error - Email is required'
    );
  }

  async testRegisterWithShortPassword() {
    await this.executeTest(
      TestCategory.REGISTER_VALIDATION,
      'Đăng ký với Password dưới 6 ký tự',
      '/auth/register',
      'POST',
      {
        email: `short_${Date.now()}@test.com`,
        password: '12345',
        role: 'MENTEE'
      },
      400,
      'Validation error - Password must be at least 6 characters'
    );
  }

  async testRegisterWithInvalidRole() {
    await this.executeTest(
      TestCategory.REGISTER_VALIDATION,
      'Đăng ký với Role không hợp lệ (ADMIN)',
      '/auth/register',
      'POST',
      {
        email: `admin_${Date.now()}@test.com`,
        password: 'password123',
        role: 'ADMIN'
      },
      400,
      'Validation error - Role must be either MENTOR or MENTEE'
    );
  }

  async testRegisterWithEmptyRole() {
    await this.executeTest(
      TestCategory.REGISTER_VALIDATION,
      'Đăng ký với Role rỗng',
      '/auth/register',
      'POST',
      {
        email: `norole_${Date.now()}@test.com`,
        password: 'password123',
        role: ''
      },
      400,
      'Validation error - Role is required'
    );
  }

  // ============================================================================
  // LOGIN SUCCESS TESTS
  // ============================================================================

  async testLoginMentorSuccess() {
    // Get a registered mentor
    const mentor = Array.from(this.createdUsers.values()).find(u => u.role === 'MENTOR');
    
    if (mentor) {
      await this.executeTest(
        TestCategory.LOGIN_SUCCESS,
        'Đăng nhập thành công với MENTOR',
        '/auth/login',
        'POST',
        {
          email: mentor.email,
          password: mentor.password
        },
        200,
        'Login successful - Access token and user data returned'
      );
    } else {
      console.log('\n⚠️  Warning: No MENTOR user available for login test');
    }
  }

  async testLoginMenteeSuccess() {
    // Get a registered mentee
    const mentee = Array.from(this.createdUsers.values()).find(u => u.role === 'MENTEE');
    
    if (mentee) {
      await this.executeTest(
        TestCategory.LOGIN_SUCCESS,
        'Đăng nhập thành công với MENTEE',
        '/auth/login',
        'POST',
        {
          email: mentee.email,
          password: mentee.password
        },
        200,
        'Login successful - Access token and user data returned'
      );
    } else {
      console.log('\n⚠️  Warning: No MENTEE user available for login test');
    }
  }

  // ============================================================================
  // LOGIN FAILURE TESTS
  // ============================================================================

  async testLoginWithNonExistentEmail() {
    await this.executeTest(
      TestCategory.LOGIN_FAILURE,
      'Đăng nhập với Email không tồn tại',
      '/auth/login',
      'POST',
      {
        email: `nonexistent_${Date.now()}@test.com`,
        password: 'password123'
      },
      401,
      'Unauthorized - Invalid email or password'
    );
  }

  async testLoginWithWrongPassword() {
    // Get any registered user
    const user = Array.from(this.createdUsers.values())[0];
    
    if (user) {
      await this.executeTest(
        TestCategory.LOGIN_FAILURE,
        'Đăng nhập với Password sai',
        '/auth/login',
        'POST',
        {
          email: user.email,
          password: 'WrongPassword123'
        },
        401,
        'Unauthorized - Invalid email or password'
      );
    }
  }

  async testLoginWithInvalidEmail() {
    await this.executeTest(
      TestCategory.LOGIN_FAILURE,
      'Đăng nhập với Email không hợp lệ',
      '/auth/login',
      'POST',
      {
        email: 'not-an-email',
        password: 'password123'
      },
      400,
      'Validation error - Invalid email format'
    );
  }

  async testLoginWithEmptyPassword() {
    await this.executeTest(
      TestCategory.LOGIN_FAILURE,
      'Đăng nhập với Password rỗng',
      '/auth/login',
      'POST',
      {
        email: 'user@test.com',
        password: ''
      },
      400,
      'Validation error - Password is required'
    );
  }

  // ============================================================================
  // EXCEL EXPORT
  // ============================================================================

  async exportToExcel() {
    console.log('\n\n📊 Exporting results to Excel...');
    
    const workbook = new ExcelJS.Workbook();
    
    // Add metadata
    workbook.creator = 'Auth Test Suite';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Create main results worksheet
    const worksheet = workbook.addWorksheet('Test Results', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
    });

    // Define columns
    worksheet.columns = [
      { header: 'Test ID', key: 'id', width: 10 },
      { header: 'Category', key: 'category', width: 30 },
      { header: 'Test Case', key: 'description', width: 45 },
      { header: 'Endpoint', key: 'endpoint', width: 25 },
      { header: 'Method', key: 'method', width: 10 },
      { header: 'Request Data', key: 'requestData', width: 40 },
      { header: 'Expected Status', key: 'expectedStatus', width: 15 },
      { header: 'Actual Status', key: 'actualStatus', width: 15 },
      { header: 'Status', key: 'passed', width: 12 },
      { header: 'Response Message', key: 'responseMessage', width: 50 },
      { header: 'Expected Result', key: 'expectedResult', width: 50 },
      { header: 'Duration (ms)', key: 'duration', width: 15 },
      { header: 'Timestamp', key: 'timestamp', width: 25 }
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2C3E50' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Add border to header
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Group results by category
    const categories = [
      TestCategory.REGISTER_SUCCESS,
      TestCategory.REGISTER_VALIDATION,
      TestCategory.REGISTER_BUSINESS,
      TestCategory.LOGIN_SUCCESS,
      TestCategory.LOGIN_FAILURE
    ];

    let currentRow = 2;

    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      
      if (categoryResults.length > 0) {
        // Add category results
        categoryResults.forEach(result => {
          const row = worksheet.addRow({
            id: result.id,
            category: result.category,
            description: result.description,
            endpoint: result.endpoint,
            method: result.method,
            requestData: JSON.stringify(result.requestData, null, 2),
            expectedStatus: result.expectedStatus,
            actualStatus: result.actualStatus,
            passed: result.passed ? 'PASSED' : 'FAILED',
            responseMessage: result.responseMessage,
            expectedResult: result.expectedResult,
            duration: result.duration,
            timestamp: new Date(result.timestamp).toLocaleString('vi-VN')
          });

          // Style status column
          const statusCell = row.getCell('passed');
          if (result.passed) {
            statusCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF52C41A' }
            };
            statusCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          } else {
            statusCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF5222D' }
            };
            statusCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          }

          // Center align status cells
          statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
          row.getCell('expectedStatus').alignment = { vertical: 'middle', horizontal: 'center' };
          row.getCell('actualStatus').alignment = { vertical: 'middle', horizontal: 'center' };
          row.getCell('method').alignment = { vertical: 'middle', horizontal: 'center' };

          // Wrap text for long columns
          row.getCell('requestData').alignment = { wrapText: true, vertical: 'top' };
          row.getCell('responseMessage').alignment = { wrapText: true, vertical: 'top' };
          row.getCell('expectedResult').alignment = { wrapText: true, vertical: 'top' };

          // Add borders
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
              left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
              bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
              right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
            };
          });

          row.height = 40;
          currentRow++;
        });
      }
    });

    // Add summary worksheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];

    // Calculate statistics
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const passRate = ((passedTests / totalTests) * 100).toFixed(2);
    const avgDuration = (this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests).toFixed(2);
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    // Style summary header
    const summaryHeaderRow = summarySheet.getRow(1);
    summaryHeaderRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    summaryHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2C3E50' }
    };
    summaryHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Add summary data
    const summaryData = [
      { metric: 'Total Tests', value: totalTests },
      { metric: 'Passed', value: passedTests },
      { metric: 'Failed', value: failedTests },
      { metric: 'Pass Rate (%)', value: passRate },
      { metric: 'Average Duration (ms)', value: avgDuration },
      { metric: 'Total Duration (ms)', value: totalDuration },
      { metric: 'Test Date', value: new Date().toLocaleString('vi-VN') },
      { metric: 'Base URL', value: BASE_URL }
    ];

    summaryData.forEach((data, index) => {
      const row = summarySheet.addRow(data);
      row.font = { bold: true, size: 11 };
      
      // Color code pass/fail rows
      if (data.metric === 'Passed' && passedTests > 0) {
        row.getCell('value').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD4EDDA' }
        };
      } else if (data.metric === 'Failed' && failedTests > 0) {
        row.getCell('value').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8D7DA' }
        };
      }
    });

    // Add category breakdown
    summarySheet.addRow([]);
    summarySheet.addRow(['Category Breakdown', '']);
    summarySheet.addRow(['Category', 'Total', 'Passed', 'Failed']);

    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      const passed = categoryResults.filter(r => r.passed).length;
      const failed = categoryResults.length - passed;
      
      summarySheet.addRow([
        category,
        categoryResults.length,
        passed,
        failed
      ]);
    });

    // Save workbook
    const fileName = `${OUTPUT_FILE.replace('.xlsx', '')}_${TIMESTAMP}.xlsx`;
    await workbook.xlsx.writeFile(fileName);
    
    console.log(`✅ Results exported to: ${fileName}\n`);
  }

  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================

  printSummary() {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    TEST SUMMARY REPORT                    ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const passRate = ((passedTests / totalTests) * 100).toFixed(2);
    const avgDuration = (this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests).toFixed(2);
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('📊 Overall Statistics:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`   Total Tests:        ${totalTests}`);
    console.log(`   Passed:             ${passedTests} ✅`);
    console.log(`   Failed:             ${failedTests} ❌`);
    console.log(`   Pass Rate:          ${passRate}%`);
    console.log(`   Avg Duration:       ${avgDuration}ms`);
    console.log(`   Total Duration:     ${totalDuration}ms`);
    console.log('─────────────────────────────────────────────────────────────\n');

    // Category breakdown
    console.log('📂 Results by Category:\n');
    
    const categories = [
      TestCategory.REGISTER_SUCCESS,
      TestCategory.REGISTER_VALIDATION,
      TestCategory.REGISTER_BUSINESS,
      TestCategory.LOGIN_SUCCESS,
      TestCategory.LOGIN_FAILURE
    ];

    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      const passed = categoryResults.filter(r => r.passed).length;
      const failed = categoryResults.length - passed;
      const rate = categoryResults.length > 0 
        ? ((passed / categoryResults.length) * 100).toFixed(1)
        : '0';

      console.log(`   ${category}`);
      console.log(`   ├─ Total: ${categoryResults.length} | Passed: ${passed} | Failed: ${failed} | Rate: ${rate}%`);
      
      categoryResults.forEach((result, index) => {
        const isLast = index === categoryResults.length - 1;
        const prefix = isLast ? '   └─' : '   ├─';
        const status = result.passed ? '✅' : '❌';
        console.log(`   ${prefix} ${status} ${result.id}: ${result.description}`);
      });
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Failed tests detail
    if (failedTests > 0) {
      console.log('❌ Failed Tests Details:\n');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`   ${result.id}: ${result.description}`);
        console.log(`   Expected: ${result.expectedStatus} | Actual: ${result.actualStatus}`);
        console.log(`   Message: ${result.responseMessage}`);
        console.log('');
      });
    } else {
      console.log('🎉 All tests passed successfully!\n');
    }
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const startTime = Date.now();
  
  try {
    // Check server availability
    console.log('🔍 Checking server availability...');
    try {
      await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is running\n');
    } catch (error) {
      console.error('❌ Server is not accessible. Please ensure the server is running on', BASE_URL);
      console.error('   Start the server with: npm run dev\n');
      process.exit(1);
    }

    // Run test suite
    const testSuite = new AuthAutomationTest();
    await testSuite.runAllTests();
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️  Total execution time: ${totalTime}s\n`);
    console.log('✨ Test suite completed successfully!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { AuthAutomationTest, TestResult, TestCategory };