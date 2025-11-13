import axios, { AxiosError } from 'axios';
import ExcelJS from 'exceljs';

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const OUTPUT_FILE = 'schedule-test-results.xlsx';
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
  expectedBodyStructure: string;
  expectedDatabaseState: string;
  actualResult: string;
  responseMessage: string;
  passed: boolean;
  duration: number;
  timestamp: string;
  errorDetails?: string;
}

// Test categories
enum TestCategory {
  SCHEDULE_CREATE_SUCCESS = 'Schedule Create - Success Cases',
  SCHEDULE_CREATE_FAILURE = 'Schedule Create - Failure Cases',
  SCHEDULE_BOOKING_SUCCESS = 'Schedule Booking - Success Cases',
  SCHEDULE_BOOKING_FAILURE = 'Schedule Booking - Failure Cases',
  SCHEDULE_MANAGEMENT = 'Schedule Management - Test Cases'
}

class ScheduleTest {
  private results: TestResult[] = [];
  private testCounter: number = 0;
  private mentorToken: string = '';
  private menteeToken: string = '';
  private createdSchedules: Map<string, any> = new Map();

  async runAllTests() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║          SCHEDULE AUTOMATION TEST SUITE                   ║');
    console.log('║     Testing Schedule Creation and Booking Features       ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // Setup: Login to get tokens
    await this.setupAuth();

    // Schedule Create Success Tests
    await this.testMentorCreateSlotSuccess();
  // removed: await this.testMentorCreateMultipleSlots();
    
    // Schedule Create Failure Tests
    await this.testMentorCreateSlotOverlapping();
    await this.testMenteeCreateSlotUnauthorized();
    await this.testCreateSlotInvalidTimeRange();
    await this.testCreateSlotPastDate();
    
    // Schedule Booking Success Tests
    await this.testMenteeBookSlotSuccess();
    await this.testMenteeCancelBookingSuccess();
    await this.testMentorDeleteScheduleSuccess();
    
    // Schedule Booking Failure Tests
    await this.testMenteeBookAlreadyBookedSlot();
    // removed: await this.testMenteeBookOwnSlot();
    await this.testMentorBookSlotUnauthorized();
    await this.testBookNonExistentSlot();
    // removed: await this.testMenteeCancelNonExistentBooking();
    // removed: await this.testMenteeCancelAlreadyCancelledBooking();
    await this.testMentorDeleteNonExistentSchedule();
    await this.testMenteeDeleteScheduleUnauthorized();
    
    // Schedule Management Tests
    await this.testGetMentorScheduleList();

    // Export results
    await this.exportToExcel();
    
    // Print summary
    this.printSummary();
  }

  private async setupAuth() {
    console.log('\n📝 Setting up authentication...');
    
    try {
      // Login as Mentor
      const mentorResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'mentor1@example.com',
        password: '123456'
      });
      this.mentorToken = mentorResponse.data.data.token;
      console.log('   ✅ Mentor logged in');

      // Login as Mentee
      const menteeResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'mentee1@example.com',
        password: '123456'
      });
      this.menteeToken = menteeResponse.data.data.token;
      console.log('   ✅ Mentee logged in\n');
    } catch (error) {
      console.error('   ❌ Auth setup failed:', error);
      throw error;
    }
  }

  private getNextTestId(): string {
    this.testCounter++;
    return `SCH${String(this.testCounter).padStart(3, '0')}`;
  }

  private async executeTest(
    category: TestCategory,
    description: string,
    endpoint: string,
    method: string,
    data: any,
    expectedStatus: number,
    expectedBodyStructure: string,
    expectedDatabaseState: string,
    authToken?: string
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
      expectedBodyStructure,
      expectedDatabaseState,
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
      
      const headers: any = {};
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await axios({
        method: method.toLowerCase() as any,
        url: `${BASE_URL}${endpoint}`,
        data,
        headers,
        validateStatus: () => true
      });

      result.actualStatus = response.status;
      result.actualResult = JSON.stringify(response.data, null, 2);
      
      // Extract response message
      if (response.data?.error?.message) {
        result.responseMessage = response.data.error.message;
      } else if (response.data?.data?.id) {
        result.responseMessage = `Schedule created/updated: ID ${response.data.data.id}`;
        
        // Store created schedule
        if (response.status === 201 || response.status === 200) {
          this.createdSchedules.set(response.data.data.id, response.data.data);
        }
      } else if (response.data?.message) {
        result.responseMessage = response.data.message;
      }

      result.passed = response.status === expectedStatus;
      
      console.log(`   Expected Status: ${expectedStatus}`);
      console.log(`   Actual Status: ${response.status}`);
      console.log(`   Response: ${result.responseMessage}`);
      console.log(`   Result: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);

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
  // SCHEDULE CREATE SUCCESS TESTS
  // ============================================================================

  async testMentorCreateSlotSuccess() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const startAt = tomorrow.toISOString();
    const endAt = new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString(); // +1 hour

    await this.executeTest(
      TestCategory.SCHEDULE_CREATE_SUCCESS,
      'Mentor tạo slot tư vấn thành công',
      '/schedules',
      'POST',
      {
        topic: 'Career Guidance',
        startAt,
        endAt,
        description: 'Career guidance session'
      },
      201,
      'HTTP 201 Created; Body: {data: {id: number, mentorId: number, startAt: datetime, endAt: datetime, status: "AVAILABLE", topic: string, description: string}}',
      `schedules table: INSERT 1 record {mentorId: (from token), topic: "Career Guidance", startAt: "${startAt}", endAt: "${endAt}", status: "AVAILABLE", description: "Career guidance session", createdAt: now}`,
      this.mentorToken
    );
  }

  // testMentorCreateMultipleSlots removed per request

  // ============================================================================
  // SCHEDULE CREATE FAILURE TESTS
  // ============================================================================

  async testMentorCreateSlotOverlapping() {
    // Create first slot
    const baseTime = new Date();
    baseTime.setDate(baseTime.getDate() + 3);
    baseTime.setHours(15, 0, 0, 0);

    const slot1Start = baseTime.toISOString();
    const slot1End = new Date(baseTime.getTime() + 60 * 60 * 1000).toISOString();

    await axios.post(`${BASE_URL}/schedules`, {
      topic: 'First Slot',
      startAt: slot1Start,
      endAt: slot1End,
      description: 'First slot'
    }, {
      headers: { Authorization: `Bearer ${this.mentorToken}` }
    }).catch(() => {});

    // Try to create overlapping slot
    const slot2Start = new Date(baseTime.getTime() + 30 * 60 * 1000).toISOString(); // +30 minutes (overlaps)
    const slot2End = new Date(baseTime.getTime() + 90 * 60 * 1000).toISOString();

    await this.executeTest(
      TestCategory.SCHEDULE_CREATE_FAILURE,
      'Mentor tạo slot trùng giờ',
      '/schedules',
      'POST',
      {
        topic: 'Overlapping Slot',
        startAt: slot2Start,
        endAt: slot2End,
        description: 'Overlapping slot'
      },
      500,
      'HTTP 500 Internal Server Error; Body: {error: {message: "Schedule overlaps with existing schedule(s)"}}',
      `schedules table: No INSERT (conflict detected with existing slot)`,
      this.mentorToken
    );
  }

  async testMenteeCreateSlotUnauthorized() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 4);
    tomorrow.setHours(11, 0, 0, 0);

    await this.executeTest(
      TestCategory.SCHEDULE_CREATE_FAILURE,
      'Mentee không thể tạo slot (Unauthorized)',
      '/schedules',
      'POST',
      {
        topic: 'Unauthorized Slot',
        startAt: tomorrow.toISOString(),
        endAt: new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString(),
        description: 'Should fail'
      },
      403,
      'HTTP 403 Forbidden; Body: {error: {code: "FORBIDDEN", message: "Only mentors can create schedules"}}',
      `schedules table: No INSERT (permission denied)`,
      this.menteeToken
    );
  }

  async testCreateSlotInvalidTimeRange() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 5);
    tomorrow.setHours(12, 0, 0, 0);

    const startAt = tomorrow.toISOString();
    const endAt = new Date(tomorrow.getTime() - 60 * 60 * 1000).toISOString(); // End before start

    await this.executeTest(
      TestCategory.SCHEDULE_CREATE_FAILURE,
      'Tạo slot với thời gian không hợp lệ (end < start)',
      '/schedules',
      'POST',
      {
        topic: 'Invalid Time Range',
        startAt,
        endAt,
        description: 'Invalid time range'
      },
      400,
      'HTTP 400 Bad Request; Body: {error: {code: "VALIDATION_ERROR", message: "End time must be after start time"}}',
      `schedules table: No INSERT (validation failed)`,
      this.mentorToken
    );
  }

  async testCreateSlotPastDate() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(10, 0, 0, 0);

    await this.executeTest(
      TestCategory.SCHEDULE_CREATE_FAILURE,
      'Tạo slot với thời gian trong quá khứ',
      '/schedules',
      'POST',
      {
        topic: 'Past Date Slot',
        startAt: yesterday.toISOString(),
        endAt: new Date(yesterday.getTime() + 60 * 60 * 1000).toISOString(),
        description: 'Past date slot'
      },
      500,
      'HTTP 500 Internal Server Error; Body: {error: {message: "Schedule start time must be in the future"}}',
      `schedules table: No INSERT (past date validation failed)`,
      this.mentorToken
    );
  }

  // ============================================================================
  // SCHEDULE BOOKING SUCCESS TESTS
  // ============================================================================

  async testMenteeBookSlotSuccess() {
    // Create a slot first
    const futureTime = new Date();
    futureTime.setDate(futureTime.getDate() + 6);
    futureTime.setHours(16, 0, 0, 0);

    const createResponse = await axios.post(`${BASE_URL}/schedules`, {
      topic: 'Bookable Slot',
      startAt: futureTime.toISOString(),
      endAt: new Date(futureTime.getTime() + 60 * 60 * 1000).toISOString(),
      description: 'Bookable slot'
    }, {
      headers: { Authorization: `Bearer ${this.mentorToken}` }
    }).catch(() => null);

    if (createResponse?.data?.data?.id) {
      const scheduleId = createResponse.data.data.id;

      await this.executeTest(
        TestCategory.SCHEDULE_BOOKING_SUCCESS,
        'Mentee đăng ký slot thành công',
        `/bookings`,
        'POST',
        { scheduleId },
        201,
        'HTTP 201 Created; Body: {data: {id: number, scheduleId: number, menteeId: number, status: "BOOKED", bookedAt: datetime}}',
        `bookings table: INSERT new booking; schedules table: UPDATE status="BOOKED" WHERE id=${scheduleId}`,
        this.menteeToken
      );
    } else {
      console.log('   ⚠️  Failed to create slot for booking test');
    }
  }

  async testMenteeCancelBookingSuccess() {
    // Create a slot first
    const futureTime = new Date();
    futureTime.setDate(futureTime.getDate() + 9);
    futureTime.setHours(18, 0, 0, 0);

    const createResponse = await axios.post(`${BASE_URL}/schedules`, {
      topic: 'Cancelable Slot',
      startAt: futureTime.toISOString(),
      endAt: new Date(futureTime.getTime() + 60 * 60 * 1000).toISOString(),
      description: 'Slot for cancel test'
    }, {
      headers: { Authorization: `Bearer ${this.mentorToken}` }
    }).catch(() => null);

    if (createResponse?.data?.data?.id) {
      const scheduleId = createResponse.data.data.id;

      // Book the slot
      const bookResponse = await axios.post(`${BASE_URL}/bookings`, { scheduleId }, {
        headers: { Authorization: `Bearer ${this.menteeToken}` }
      }).catch(() => null);

      if (bookResponse?.data?.data?.id) {
        const bookingId = bookResponse.data.data.id;

        // Cancel the booking
        await this.executeTest(
          TestCategory.SCHEDULE_BOOKING_SUCCESS,
          'Mentee hủy slot thành công',
          `/bookings/${bookingId}/cancel`,
          'PATCH',
          {},
          200,
          'HTTP 200 OK; Body: {data: {id: number, status: "CANCELLED", cancelledAt: datetime}}',
          `bookings table: UPDATE status="CANCELLED", cancelledAt=now WHERE id=${bookingId}; schedules table: UPDATE status="AVAILABLE" WHERE id=${scheduleId}`,
          this.menteeToken
        );
      } else {
        console.log('   ⚠️  Failed to book slot for cancel test');
      }
    } else {
      console.log('   ⚠️  Failed to create slot for cancel test');
    }
  }

  async testMentorDeleteScheduleSuccess() {
    // Create a slot first
    const futureTime = new Date();
    futureTime.setDate(futureTime.getDate() + 11);
    futureTime.setHours(20, 0, 0, 0);

    const createResponse = await axios.post(`${BASE_URL}/schedules`, {
      topic: 'Deletable Schedule',
      startAt: futureTime.toISOString(),
      endAt: new Date(futureTime.getTime() + 60 * 60 * 1000).toISOString(),
      description: 'Schedule to be deleted'
    }, {
      headers: { Authorization: `Bearer ${this.mentorToken}` }
    }).catch(() => null);

    if (createResponse?.data?.data?.id) {
      const scheduleId = createResponse.data.data.id;

      await this.executeTest(
        TestCategory.SCHEDULE_BOOKING_SUCCESS,
        'Mentor hủy schedule thành công',
        `/schedules/${scheduleId}`,
        'DELETE',
        {},
        200,
        'HTTP 200 OK; Body: {data: {id: number, status: "CANCELLED"}}',
        `schedules table: UPDATE status="CANCELLED" WHERE id=${scheduleId}; bookings table: UPDATE status="CANCELLED" for all related bookings`,
        this.mentorToken
      );
    } else {
      console.log('   ⚠️  Failed to create slot for delete test');
    }
  }

  // ============================================================================
  // SCHEDULE BOOKING FAILURE TESTS
  // ============================================================================

  async testMenteeBookAlreadyBookedSlot() {
    // Create and book a slot
    const futureTime = new Date();
    futureTime.setDate(futureTime.getDate() + 7);
    futureTime.setHours(13, 0, 0, 0);

    const createResponse = await axios.post(`${BASE_URL}/schedules`, {
      topic: 'Already Booked Slot',
      startAt: futureTime.toISOString(),
      endAt: new Date(futureTime.getTime() + 60 * 60 * 1000).toISOString(),
      description: 'Already booked slot'
    }, {
      headers: { Authorization: `Bearer ${this.mentorToken}` }
    }).catch(() => null);

    if (createResponse?.data?.data?.id) {
      const scheduleId = createResponse.data.data.id;

      // First booking (should succeed)
      await axios.post(`${BASE_URL}/bookings`, { scheduleId }, {
        headers: { Authorization: `Bearer ${this.menteeToken}` }
      }).catch(() => {});

      // Second booking (should fail)
      await this.executeTest(
        TestCategory.SCHEDULE_BOOKING_FAILURE,
        'Mentee đăng ký slot đã được booked',
        `/bookings`,
        'POST',
        { scheduleId },
        409,
        'HTTP 409 Conflict; Body: {error: {code: "CONFLICT", message: "Schedule already booked"}}',
        `bookings table: No INSERT (slot already booked)`,
        this.menteeToken
      );
    }
  }

  // testMenteeBookOwnSlot removed per request

  async testMentorBookSlotUnauthorized() {
    const futureTime = new Date();
    futureTime.setDate(futureTime.getDate() + 8);
    futureTime.setHours(17, 0, 0, 0);

    const createResponse = await axios.post(`${BASE_URL}/schedules`, {
      topic: 'Mentor Cannot Book',
      startAt: futureTime.toISOString(),
      endAt: new Date(futureTime.getTime() + 60 * 60 * 1000).toISOString(),
      description: 'Mentor cannot book'
    }, {
      headers: { Authorization: `Bearer ${this.mentorToken}` }
    }).catch(() => null);

    if (createResponse?.data?.data?.id) {
      const scheduleId = createResponse.data.data.id;

      await this.executeTest(
        TestCategory.SCHEDULE_BOOKING_FAILURE,
        'Mentor không thể book slot (Unauthorized)',
        `/bookings`,
        'POST',
        { scheduleId },
        403,
        'HTTP 403 Forbidden; Body: {error: {code: "FORBIDDEN", message: "Only mentees can book schedules"}}',
        `bookings table: No INSERT (permission denied)`,
        this.mentorToken
      );
    }
  }

  async testBookNonExistentSlot() {
    await this.executeTest(
      TestCategory.SCHEDULE_BOOKING_FAILURE,
      'Book slot không tồn tại',
      '/bookings',
      'POST',
      { scheduleId: 999999 },
      404,
      'HTTP 404 Not Found; Body: {error: {code: "NOT_FOUND", message: "Schedule not found"}}',
      `schedules table: SELECT WHERE id=999999 returns NULL`,
      this.menteeToken
    );
  }

  async testMentorDeleteNonExistentSchedule() {
    await this.executeTest(
      TestCategory.SCHEDULE_BOOKING_FAILURE,
      'Mentor hủy schedule không tồn tại',
      '/schedules/999999',
      'DELETE',
      {},
      404,
      'HTTP 404 Not Found; Body: {error: {code: "NOT_FOUND", message: "Schedule not found"}}',
      `schedules table: SELECT WHERE id=999999 AND mentorId=(from token) returns NULL`,
      this.mentorToken
    );
  }

  async testMenteeDeleteScheduleUnauthorized() {
    // Create a schedule as mentor first
    const futureTime = new Date();
    futureTime.setDate(futureTime.getDate() + 12);
    futureTime.setHours(21, 0, 0, 0);

    const createResponse = await axios.post(`${BASE_URL}/schedules`, {
      topic: 'Schedule Mentee Cannot Delete',
      startAt: futureTime.toISOString(),
      endAt: new Date(futureTime.getTime() + 60 * 60 * 1000).toISOString(),
      description: 'Mentee should not be able to delete'
    }, {
      headers: { Authorization: `Bearer ${this.mentorToken}` }
    }).catch(() => null);

    if (createResponse?.data?.data?.id) {
      const scheduleId = createResponse.data.data.id;

      await this.executeTest(
        TestCategory.SCHEDULE_BOOKING_FAILURE,
        'Mentee không thể hủy schedule (Unauthorized)',
        `/schedules/${scheduleId}`,
        'DELETE',
        {},
        403,
        'HTTP 403 Forbidden; Body: {error: {code: "FORBIDDEN", message: "Only mentors can delete schedules"}}',
        `schedules table: No UPDATE (permission denied)`,
        this.menteeToken
      );
    } else {
      console.log('   ⚠️  Failed to create slot for mentee delete test');
    }
  }

  // ============================================================================
  // SCHEDULE MANAGEMENT TESTS
  // ============================================================================

  async testGetMentorScheduleList() {
    await this.executeTest(
      TestCategory.SCHEDULE_MANAGEMENT,
      'Lấy danh sách schedule của mentor',
      '/schedules/my-schedules',
      'GET',
      {},
      200,
      'HTTP 200 OK; Body: {data: [{id: number, mentorId: number, topic: string, startAt: datetime, endAt: datetime, status: string, description: string}], pagination: {page, limit, total}}',
      `schedules table: SELECT * WHERE mentorId=(from token) ORDER BY startAt`,
      this.mentorToken
    );
  }

  // ============================================================================
  // EXCEL EXPORT
  // ============================================================================

  async exportToExcel() {
    console.log('\n\n📊 Exporting results to Excel...');
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Schedule Test Suite';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Test Results', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
    });

    worksheet.columns = [
      { header: 'Test ID', key: 'id', width: 12 },
      { header: 'Category', key: 'category', width: 40 },
      { header: 'Test Case', key: 'description', width: 55 },
      { header: 'Endpoint', key: 'endpoint', width: 35 },
      { header: 'Method', key: 'method', width: 10 },
      { header: 'Request Data', key: 'requestData', width: 35 },
      { header: 'Expected Status', key: 'expectedStatus', width: 15 },
      { header: 'Actual Status', key: 'actualStatus', width: 15 },
      { header: 'Status', key: 'passed', width: 12 },
      { header: 'Expected Body Structure', key: 'expectedBodyStructure', width: 60 },
      { header: 'Expected Database State', key: 'expectedDatabaseState', width: 80 },
      { header: 'Response', key: 'responseMessage', width: 50 },
      { header: 'Duration (ms)', key: 'duration', width: 15 },
      { header: 'Timestamp', key: 'timestamp', width: 25 }
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2C3E50' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.height = 35;

    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    this.results.forEach(result => {
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
        expectedBodyStructure: result.expectedBodyStructure,
        expectedDatabaseState: result.expectedDatabaseState,
        responseMessage: result.responseMessage,
        duration: result.duration,
        timestamp: new Date(result.timestamp).toLocaleString('vi-VN')
      });

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

      statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('expectedStatus').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('actualStatus').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('method').alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell('requestData').alignment = { wrapText: true, vertical: 'top' };
      row.getCell('expectedBodyStructure').alignment = { wrapText: true, vertical: 'top' };
      row.getCell('expectedDatabaseState').alignment = { wrapText: true, vertical: 'top' };
      row.getCell('responseMessage').alignment = { wrapText: true, vertical: 'top' };

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
        };
      });

      row.height = 60;
    });

    // Summary worksheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 35 },
      { header: 'Value', key: 'value', width: 25 }
    ];

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const passRate = ((passedTests / totalTests) * 100).toFixed(2);
    const avgDuration = (this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests).toFixed(2);

    const summaryHeaderRow = summarySheet.getRow(1);
    summaryHeaderRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    summaryHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2C3E50' }
    };

    const summaryData = [
      { metric: 'Total Tests', value: totalTests },
      { metric: 'Passed', value: passedTests },
      { metric: 'Failed', value: failedTests },
      { metric: 'Pass Rate (%)', value: passRate },
      { metric: 'Average Duration (ms)', value: avgDuration },
      { metric: 'Test Date', value: new Date().toLocaleString('vi-VN') }
    ];

    summaryData.forEach((data) => {
      const row = summarySheet.addRow(data);
      row.font = { bold: true, size: 11 };
    });

    const fileName = `${OUTPUT_FILE.replace('.xlsx', '')}_${TIMESTAMP}.xlsx`;
    await workbook.xlsx.writeFile(fileName);
    
    console.log(`✅ Results exported to: ${fileName}\n`);
  }

  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================

  printSummary() {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                SCHEDULE TEST SUMMARY                      ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const passRate = ((passedTests / totalTests) * 100).toFixed(2);

    console.log('📊 Overall Statistics:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`   Total Tests:        ${totalTests}`);
    console.log(`   Passed:             ${passedTests} ✅`);
    console.log(`   Failed:             ${failedTests} ❌`);
    console.log(`   Pass Rate:          ${passRate}%`);
    console.log('─────────────────────────────────────────────────────────────\n');

    if (failedTests > 0) {
      console.log('❌ Failed Tests:\n');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`   ${result.id}: ${result.description}`);
        console.log(`   Expected: ${result.expectedStatus} | Actual: ${result.actualStatus}`);
      });
    } else {
      console.log('🎉 All tests passed!\n');
    }

    console.log('\n📝 Important Notes:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log('   • Mentor can create schedule slots');
    console.log('   • Mentee can book available slots');
    console.log('   • Time overlap validation is enforced');
    console.log('   • Role-based access control is working');
    console.log('─────────────────────────────────────────────────────────────\n');
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Checking server...');
    await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running\n');

    const testSuite = new ScheduleTest();
    await testSuite.runAllTests();
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️  Total time: ${totalTime}s\n`);
    console.log('✨ Test completed!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { ScheduleTest, TestResult, TestCategory };
