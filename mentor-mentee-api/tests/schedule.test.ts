import axios, { AxiosError } from 'axios';
import ExcelJS from 'exceljs';
import * as path from 'path';
import prisma from '../src/db/client';

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const OUTPUT_FILE = 'schedule-and-feedback-test-report.xlsx';
const LEGACY_OUTPUT_FILE = 'schedule-test-results.xlsx';
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
  SCHEDULE_MANAGEMENT = 'Schedule Management - Test Cases',
  SESSION_MANAGEMENT = 'Session Management - Test Cases',
  FEEDBACK_SUCCESS = 'Mentee Feedback - Success Cases',
  FEEDBACK_FAILURE = 'Mentee Feedback - Failure Cases',
  FEEDBACK_QUERY = 'Mentee Feedback - Query & Stats Cases'
}

class ScheduleAndFeedbackTest {
  private results: TestResult[] = [];
  private testCounter: number = 0;
  private mentorToken: string = '';
  private menteeToken: string = '';
  private mentorId: number = 0;
  private menteeId: number = 0;
  private slotCounter: number = 0;
  private baseRunTime: number = Date.now() + 100 * 24 * 60 * 60 * 1000;

  private getUniqueFutureSlot(durationMinutes: number = 60) {
    this.slotCounter++;
    // Mỗi slot cách nhau 3 tiếng đều đặn, không bao giờ trùng lặp
    const start = new Date(this.baseRunTime + this.slotCounter * 3 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    return {
      startAt: start.toISOString(),
      endAt: end.toISOString()
    };
  }

  private async cleanupTestData() {
    try {
      const futureCutoff = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const testSchedules = await prisma.schedule.findMany({
        where: {
          mentorId: this.mentorId,
          startAt: { gte: futureCutoff }
        },
        select: { id: true }
      });

      if (testSchedules.length === 0) return;

      const scheduleIds = testSchedules.map(s => s.id);
      const bookings = await prisma.booking.findMany({
        where: { scheduleId: { in: scheduleIds } },
        select: { id: true }
      });
      const bookingIds = bookings.map(b => b.id);

      if (bookingIds.length > 0) {
        const sessions = await prisma.session.findMany({
          where: { bookingId: { in: bookingIds } },
          select: { id: true }
        });
        const sessionIds = sessions.map(s => s.id);

        if (sessionIds.length > 0) {
          await prisma.feedback.deleteMany({
            where: { sessionId: { in: sessionIds } }
          });
          await prisma.session.deleteMany({
            where: { id: { in: sessionIds } }
          });
        }

        await prisma.booking.deleteMany({
          where: { id: { in: bookingIds } }
        });
      }

      await prisma.schedule.deleteMany({
        where: { id: { in: scheduleIds } }
      });
    } catch (e) {
      console.warn('⚠️  Cleanup notice:', (e as Error).message);
    }
  }

  async runAllTests() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║    SCHEDULE & FEEDBACK AUTOMATION TEST SUITE              ║');
    console.log('║   Testing Schedule, Booking, Session & Mentee Feedback    ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // Setup: Login to get tokens
    await this.setupAuth();

    // 1. Schedule Create Success Tests
    await this.testMentorCreateSlotSuccess();
    
    // 2. Schedule Create Failure Tests
    await this.testMentorCreateSlotOverlapping();
    await this.testMenteeCreateSlotUnauthorized();
    await this.testCreateSlotInvalidTimeRange();
    await this.testCreateSlotPastDate();
    
    // 3. Schedule Booking Success Tests
    await this.testMenteeBookSlotSuccess();
    await this.testMenteeCancelBookingSuccess();
    await this.testMentorDeleteScheduleSuccess();
    
    // 4. Schedule Booking Failure Tests
    await this.testMenteeBookAlreadyBookedSlot();
    await this.testMentorBookSlotUnauthorized();
    await this.testBookNonExistentSlot();
    await this.testMentorDeleteNonExistentSchedule();
    await this.testMenteeDeleteScheduleUnauthorized();
    
    // 5. Schedule Management Tests
    await this.testGetMentorScheduleList();

    // 6. Meeting Session & Mentee Feedback Flow
    await this.testMeetingSessionAndFeedbackFlow();

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
      this.mentorId = mentorResponse.data.data.user.id;
      console.log(`   ✅ Mentor logged in (ID: ${this.mentorId})`);

      // Login as Mentee
      const menteeResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'mentee1@example.com',
        password: '123456'
      });
      this.menteeToken = menteeResponse.data.data.token;
      this.menteeId = menteeResponse.data.data.user.id;
      console.log(`   ✅ Mentee logged in (ID: ${this.menteeId})`);

      // Dọn dẹp các slot test cũ từ lần chạy trước để đảm bảo môi trường sạch
      await this.cleanupTestData();
      console.log('   🧹 Test environment cleaned up\n');
    } catch (error) {
      console.error('   ❌ Auth setup failed:', error);
      throw error;
    }
  }

  private getNextTestId(prefix: string = 'TC'): string {
    this.testCounter++;
    return `${prefix}${String(this.testCounter).padStart(3, '0')}`;
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
    authToken?: string,
    idPrefix: string = 'TC'
  ): Promise<TestResult> {
    const testId = this.getNextTestId(idPrefix);
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
        result.responseMessage = `ID: ${response.data.data.id}`;
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
    const { startAt, endAt } = this.getUniqueFutureSlot();

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
      `schedules table: INSERT 1 record {mentorId: (from token), topic: "Career Guidance", startAt: "${startAt}", endAt: "${endAt}", status: "AVAILABLE"}`,
      this.mentorToken,
      'SCH'
    );
  }

  // ============================================================================
  // SCHEDULE CREATE FAILURE TESTS
  // ============================================================================

  async testMentorCreateSlotOverlapping() {
    const { startAt: slot1Start, endAt: slot1End } = this.getUniqueFutureSlot();

    await axios.post(`${BASE_URL}/schedules`, {
      topic: 'First Slot',
      startAt: slot1Start,
      endAt: slot1End,
      description: 'First slot'
    }, {
      headers: { Authorization: `Bearer ${this.mentorToken}` }
    }).catch(() => {});

    // Try to create overlapping slot (starts 30 mins after slot 1 starts)
    const slot2Start = new Date(new Date(slot1Start).getTime() + 30 * 60 * 1000).toISOString();
    const slot2End = new Date(new Date(slot1Start).getTime() + 90 * 60 * 1000).toISOString();

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
      400,
      'HTTP 400 Bad Request; Body: {error: {message: "Schedule overlaps with existing schedule(s)"}}',
      `schedules table: No INSERT (conflict detected with existing slot)`,
      this.mentorToken,
      'SCH'
    );
  }

  async testMenteeCreateSlotUnauthorized() {
    const { startAt, endAt } = this.getUniqueFutureSlot();

    await this.executeTest(
      TestCategory.SCHEDULE_CREATE_FAILURE,
      'Mentee không thể tạo slot (Unauthorized)',
      '/schedules',
      'POST',
      {
        topic: 'Unauthorized Slot',
        startAt,
        endAt,
        description: 'Should fail'
      },
      403,
      'HTTP 403 Forbidden; Body: {error: {code: "FORBIDDEN", message: "Only mentors can create schedules"}}',
      `schedules table: No INSERT (permission denied)`,
      this.menteeToken,
      'SCH'
    );
  }

  async testCreateSlotInvalidTimeRange() {
    const { startAt } = this.getUniqueFutureSlot();
    const endAt = new Date(new Date(startAt).getTime() - 60 * 60 * 1000).toISOString(); // End before start

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
      this.mentorToken,
      'SCH'
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
      400,
      'HTTP 400 Bad Request; Body: {error: {message: "Schedule start time must be in the future"}}',
      `schedules table: No INSERT (past date validation failed)`,
      this.mentorToken,
      'SCH'
    );
  }

  // ============================================================================
  // SCHEDULE BOOKING SUCCESS TESTS
  // ============================================================================

  async testMenteeBookSlotSuccess() {
    const { startAt, endAt } = this.getUniqueFutureSlot();

    const createResponse = await axios.post(`${BASE_URL}/schedules`, {
      topic: 'Bookable Slot',
      startAt,
      endAt,
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
        this.menteeToken,
        'SCH'
      );
    } else {
      console.log('   ⚠️  Failed to create slot for booking test');
    }
  }

  async testMenteeCancelBookingSuccess() {
    const { startAt, endAt } = this.getUniqueFutureSlot();

    const createResponse = await axios.post(`${BASE_URL}/schedules`, {
      topic: 'Cancelable Slot',
      startAt,
      endAt,
      description: 'Slot for cancel test'
    }, {
      headers: { Authorization: `Bearer ${this.mentorToken}` }
    }).catch(() => null);

    if (createResponse?.data?.data?.id) {
      const scheduleId = createResponse.data.data.id;

      const bookResponse = await axios.post(`${BASE_URL}/bookings`, { scheduleId }, {
        headers: { Authorization: `Bearer ${this.menteeToken}` }
      }).catch(() => null);

      if (bookResponse?.data?.data?.id) {
        const bookingId = bookResponse.data.data.id;

        await this.executeTest(
          TestCategory.SCHEDULE_BOOKING_SUCCESS,
          'Mentee hủy slot thành công',
          `/bookings/${bookingId}/cancel`,
          'PATCH',
          {},
          200,
          'HTTP 200 OK; Body: {data: {id: number, status: "CANCELLED", cancelledAt: datetime}}',
          `bookings table: UPDATE status="CANCELLED", cancelledAt=now WHERE id=${bookingId}; schedules table: UPDATE status="AVAILABLE" WHERE id=${scheduleId}`,
          this.menteeToken,
          'SCH'
        );
      } else {
        console.log('   ⚠️  Failed to book slot for cancel test');
      }
    } else {
      console.log('   ⚠️  Failed to create slot for cancel test');
    }
  }

  async testMentorDeleteScheduleSuccess() {
    const { startAt, endAt } = this.getUniqueFutureSlot();

    const createResponse = await axios.post(`${BASE_URL}/schedules`, {
      topic: 'Deletable Schedule',
      startAt,
      endAt,
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
        `schedules table: UPDATE status="CANCELLED" WHERE id=${scheduleId}`,
        this.mentorToken,
        'SCH'
      );
    } else {
      console.log('   ⚠️  Failed to create slot for delete test');
    }
  }

  // ============================================================================
  // SCHEDULE BOOKING FAILURE TESTS
  // ============================================================================

  async testMenteeBookAlreadyBookedSlot() {
    const { startAt, endAt } = this.getUniqueFutureSlot();

    const createResponse = await axios.post(`${BASE_URL}/schedules`, {
      topic: 'Already Booked Slot',
      startAt,
      endAt,
      description: 'Already booked slot'
    }, {
      headers: { Authorization: `Bearer ${this.mentorToken}` }
    }).catch(() => null);

    if (createResponse?.data?.data?.id) {
      const scheduleId = createResponse.data.data.id;

      await axios.post(`${BASE_URL}/bookings`, { scheduleId }, {
        headers: { Authorization: `Bearer ${this.menteeToken}` }
      }).catch(() => {});

      await this.executeTest(
        TestCategory.SCHEDULE_BOOKING_FAILURE,
        'Mentee đăng ký slot đã được booked',
        `/bookings`,
        'POST',
        { scheduleId },
        409,
        'HTTP 409 Conflict; Body: {error: {code: "CONFLICT", message: "Schedule is not available"}}',
        `bookings table: No INSERT (slot already booked)`,
        this.menteeToken,
        'SCH'
      );
    }
  }

  async testMentorBookSlotUnauthorized() {
    const { startAt, endAt } = this.getUniqueFutureSlot();

    const createResponse = await axios.post(`${BASE_URL}/schedules`, {
      topic: 'Mentor Cannot Book',
      startAt,
      endAt,
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
        this.mentorToken,
        'SCH'
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
      this.menteeToken,
      'SCH'
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
      'HTTP 404 Not Found; Body: {error: {code: "NOT_FOUND", message: "Schedule not found or you do not have permission to delete it"}}',
      `schedules table: SELECT WHERE id=999999 returns NULL`,
      this.mentorToken,
      'SCH'
    );
  }

  async testMenteeDeleteScheduleUnauthorized() {
    const { startAt, endAt } = this.getUniqueFutureSlot();

    const createResponse = await axios.post(`${BASE_URL}/schedules`, {
      topic: 'Schedule Mentee Cannot Delete',
      startAt,
      endAt,
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
        this.menteeToken,
        'SCH'
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
      'HTTP 200 OK; Body: {data: [{id: number, mentorId: number, topic: string, startAt: datetime, endAt: datetime, status: string}]}',
      `schedules table: SELECT * WHERE mentorId=(from token) ORDER BY startAt`,
      this.mentorToken,
      'SCH'
    );
  }

  // ============================================================================
  // MEETING SESSION & MENTEE FEEDBACK TESTS
  // ============================================================================

  async testMeetingSessionAndFeedbackFlow() {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║       MEETING SESSION & FEEDBACK TEST SUITE               ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // 1. Chuẩn bị slot và booking
    const { startAt, endAt } = this.getUniqueFutureSlot();
    const createSlotRes = await axios.post(`${BASE_URL}/schedules`, {
      topic: 'Fullstack Career Consultation',
      startAt,
      endAt,
      description: 'Deep dive into roadmap and architecture'
    }, {
      headers: { Authorization: `Bearer ${this.mentorToken}` }
    });
    const scheduleId = createSlotRes.data.data.id;

    const bookRes = await axios.post(`${BASE_URL}/bookings`, {
      scheduleId,
      notes: 'Em muốn xin định hướng phát triển sự nghiệp Fullstack'
    }, {
      headers: { Authorization: `Bearer ${this.menteeToken}` }
    });
    const bookingId = bookRes.data.data.id;

    // 2. Mentor xác nhận lịch hẹn (Confirm booking)
    await this.executeTest(
      TestCategory.SCHEDULE_BOOKING_SUCCESS,
      'Mentor xác nhận yêu cầu đặt lịch hẹn của mentee',
      `/bookings/${bookingId}/confirm`,
      'PATCH',
      {},
      200,
      'HTTP 200 OK; Body: {data: {id: number, status: "CONFIRMED"}}',
      `bookings table: UPDATE status="CONFIRMED" WHERE id=${bookingId}`,
      this.mentorToken,
      'SES'
    );

    // 3. Mentor bắt đầu buổi gặp mặt (Start session)
    const startSessionResult = await this.executeTest(
      TestCategory.SESSION_MANAGEMENT,
      'Mentor bắt đầu buổi gặp mặt thành công',
      '/sessions/start',
      'POST',
      { bookingId },
      201,
      'HTTP 201 Created; Body: {data: {id: number, status: "IN_PROGRESS", startedAt: datetime}}',
      `sessions table: INSERT 1 record {bookingId: ${bookingId}, status: "IN_PROGRESS"}`,
      this.mentorToken,
      'SES'
    );

    let sessionId: number | null = null;
    try {
      const parsed = JSON.parse(startSessionResult.actualResult);
      sessionId = parsed?.data?.id || null;
    } catch {}

    // 4. Bắt đầu lại buổi gặp mặt đã diễn ra (Duplicate Start) -> 409
    await this.executeTest(
      TestCategory.SESSION_MANAGEMENT,
      'Không thể bắt đầu lại buổi gặp mặt đã diễn ra',
      '/sessions/start',
      'POST',
      { bookingId },
      409,
      'HTTP 409 Conflict; Body: {error: {message: "Session has already been started"}}',
      `sessions table: No changes (conflict detected)`,
      this.mentorToken,
      'SES'
    );

    // 5. Bắt đầu buổi gặp mặt với booking không tồn tại -> 404
    await this.executeTest(
      TestCategory.SESSION_MANAGEMENT,
      'Bắt đầu buổi gặp mặt với booking không tồn tại',
      '/sessions/start',
      'POST',
      { bookingId: 999999 },
      404,
      'HTTP 404 Not Found; Body: {error: {message: "Booking not found, not confirmed, or you do not have permission"}}',
      `sessions table: No INSERT (booking 999999 does not exist)`,
      this.mentorToken,
      'SES'
    );

    // 6. Mentee không thể đánh giá buổi gặp mặt khi ĐANG DIỄN RA -> 409
    if (sessionId) {
      await this.executeTest(
        TestCategory.FEEDBACK_FAILURE,
        'Mentee không thể đánh giá buổi gặp mặt khi chưa kết thúc (đang diễn ra)',
        '/feedbacks',
        'POST',
        {
          sessionId,
          rating: 5,
          comment: 'Buổi gặp đang diễn ra chưa được đánh giá!'
        },
        409,
        'HTTP 409 Conflict; Body: {error: {message: "Cannot provide feedback for ongoing session"}}',
        `feedbacks table: No INSERT (session ongoing, endedAt is null)`,
        this.menteeToken,
        'FDB'
      );

      // 7. Mentor kết thúc buổi gặp mặt (End session)
      await this.executeTest(
        TestCategory.SESSION_MANAGEMENT,
        'Mentor kết thúc buổi gặp mặt thành công',
        '/sessions/end',
        'POST',
        {
          sessionId,
          notes: 'Buổi trao đổi rất hiệu quả, đã giải đáp toàn bộ lộ trình cho mentee.'
        },
        200,
        'HTTP 200 OK; Body: {data: {id: number, status: "COMPLETED", endedAt: datetime}}',
        `sessions table: UPDATE status="COMPLETED", endedAt=now; bookings & schedules status="COMPLETED"`,
        this.mentorToken,
        'SES'
      );

      // 8. Mentee gửi đánh giá buổi gặp mặt thành công (5 sao + nhận xét chi tiết)
      await this.executeTest(
        TestCategory.FEEDBACK_SUCCESS,
        'Mentee đánh giá buổi gặp mặt thành công (5 sao + nhận xét)',
        '/feedbacks',
        'POST',
        {
          sessionId,
          rating: 5,
          comment: 'Mentor hướng dẫn rất tận tình, kiến thức thực tế và truyền cảm hứng!'
        },
        201,
        'HTTP 201 Created; Body: {data: {id: number, sessionId: number, rating: 5, comment: string}}',
        `feedbacks table: INSERT 1 record {sessionId: ${sessionId}, rating: 5, comment: ...}`,
        this.menteeToken,
        'FDB'
      );

      // 9. Mentee không thể đánh giá 2 lần cho cùng một buổi gặp mặt (Duplicate Feedback) -> 409
      await this.executeTest(
        TestCategory.FEEDBACK_FAILURE,
        'Mentee không thể gửi đánh giá trùng lặp cho cùng một buổi gặp mặt',
        '/feedbacks',
        'POST',
        {
          sessionId,
          rating: 4,
          comment: 'Thử gửi đánh giá lần 2'
        },
        409,
        'HTTP 409 Conflict; Body: {error: {message: "Feedback already provided for this session"}}',
        `feedbacks table: No INSERT (feedback already exists for this session)`,
        this.menteeToken,
        'FDB'
      );
    }

    // 10. Đánh giá buổi gặp mặt với rating > 5 (Ví dụ 6 sao) -> 400
    await this.executeTest(
      TestCategory.FEEDBACK_FAILURE,
      'Đánh giá với số sao không hợp lệ (> 5 sao)',
      '/feedbacks',
      'POST',
      {
        sessionId: sessionId || 1,
        rating: 6,
        comment: 'Quá 5 sao'
      },
      400,
      'HTTP 400 Bad Request; Body: {error: {message: "Validation failed"}}',
      `feedbacks table: No INSERT (Zod validation failed: Rating must be between 1 and 5)`,
      this.menteeToken,
      'FDB'
    );

    // 11. Đánh giá buổi gặp mặt với rating < 1 (Ví dụ 0 sao) -> 400
    await this.executeTest(
      TestCategory.FEEDBACK_FAILURE,
      'Đánh giá với số sao không hợp lệ (< 1 sao)',
      '/feedbacks',
      'POST',
      {
        sessionId: sessionId || 1,
        rating: 0,
        comment: 'Dưới 1 sao'
      },
      400,
      'HTTP 400 Bad Request; Body: {error: {message: "Validation failed"}}',
      `feedbacks table: No INSERT (Zod validation failed: Rating must be between 1 and 5)`,
      this.menteeToken,
      'FDB'
    );

    // 12. Đánh giá buổi gặp mặt không tồn tại -> 404
    await this.executeTest(
      TestCategory.FEEDBACK_FAILURE,
      'Đánh giá buổi gặp mặt không tồn tại (ID 999999)',
      '/feedbacks',
      'POST',
      {
        sessionId: 999999,
        rating: 5,
        comment: 'Session không tồn tại'
      },
      404,
      'HTTP 404 Not Found; Body: {error: {message: "Session not found or you do not have permission"}}',
      `feedbacks table: No INSERT (session 999999 does not exist)`,
      this.menteeToken,
      'FDB'
    );

    // 13. Mentor cố tình gửi đánh giá (chỉ Mentee mới được gửi đánh giá) -> 401
    await this.executeTest(
      TestCategory.FEEDBACK_FAILURE,
      'Mentor không thể gửi đánh giá buổi gặp mặt (Unauthorized)',
      '/feedbacks',
      'POST',
      {
        sessionId: sessionId || 1,
        rating: 5,
        comment: 'Mentor tự đánh giá'
      },
      401,
      'HTTP 401 Unauthorized; Body: {error: {message: "Only mentees can provide feedback"}}',
      `feedbacks table: No INSERT (only mentees allowed)`,
      this.mentorToken,
      'FDB'
    );

    // 14. Mentee xem danh sách đánh giá của mình (My Feedbacks) -> 200
    await this.executeTest(
      TestCategory.FEEDBACK_QUERY,
      'Mentee xem danh sách các đánh giá đã gửi (My Feedbacks)',
      '/feedbacks/my',
      'GET',
      {},
      200,
      'HTTP 200 OK; Body: {data: {data: Array, total: number, page: number, totalPages: number}}',
      `feedbacks table: SELECT * WHERE menteeId=(from token)`,
      this.menteeToken,
      'FDB'
    );

    // 15. Xem danh sách đánh giá & thống kê điểm trung bình của Mentor -> 200
    await this.executeTest(
      TestCategory.FEEDBACK_QUERY,
      'Xem danh sách đánh giá và điểm trung bình của Mentor',
      `/feedbacks/mentor/${this.mentorId}`,
      'GET',
      {},
      200,
      'HTTP 200 OK; Body: {data: {feedbacks: Array, stats: {averageRating: number, totalFeedbacks: number}}}',
      `feedbacks table: SELECT * WHERE mentorId=${this.mentorId} with calculated averageRating`,
      this.menteeToken,
      'FDB'
    );
  }

  // ============================================================================
  // EXPORT TO EXCEL
  // ============================================================================

  async exportToExcel() {
    console.log('\n\n📊 Exporting results to Excel...');
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Mentor-Mentee Automation Test Suite';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Detailed Results', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
    });

    worksheet.columns = [
      { header: 'Test ID', key: 'id', width: 12 },
      { header: 'Category', key: 'category', width: 38 },
      { header: 'Test Case Description', key: 'description', width: 55 },
      { header: 'Endpoint', key: 'endpoint', width: 32 },
      { header: 'Method', key: 'method', width: 10 },
      { header: 'Request Data', key: 'requestData', width: 35 },
      { header: 'Expected Status', key: 'expectedStatus', width: 16 },
      { header: 'Actual Status', key: 'actualStatus', width: 16 },
      { header: 'Status', key: 'passed', width: 12 },
      { header: 'Expected Body Structure', key: 'expectedBodyStructure', width: 60 },
      { header: 'Expected Database State', key: 'expectedDatabaseState', width: 80 },
      { header: 'Response Message', key: 'responseMessage', width: 45 },
      { header: 'Duration (ms)', key: 'duration', width: 15 },
      { header: 'Timestamp', key: 'timestamp', width: 22 }
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F3A60' }
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
        timestamp: new Date(result.timestamp).toLocaleTimeString('vi-VN')
      });

      const statusCell = row.getCell('passed');
      if (result.passed) {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF52C41A' } // Green
        };
        statusCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      } else {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5222D' } // Red
        };
        statusCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      }

      statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('expectedStatus').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('actualStatus').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('method').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('id').alignment = { vertical: 'middle', horizontal: 'center' };

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

      row.height = 55;
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
      fgColor: { argb: 'FF1F3A60' }
    };

    const summaryData = [
      { metric: 'Total Tests', value: totalTests },
      { metric: 'Passed', value: passedTests },
      { metric: 'Failed', value: failedTests },
      { metric: 'Pass Rate (%)', value: `${passRate}%` },
      { metric: 'Average Duration (ms)', value: `${avgDuration} ms` },
      { metric: 'Test Execution Date', value: new Date().toLocaleString('vi-VN') }
    ];

    summaryData.forEach((data) => {
      const row = summarySheet.addRow(data);
      row.font = { bold: true, size: 11 };
    });

    // Add Category breakdown table
    summarySheet.addRow({});
    const categoryHeaderRow = summarySheet.addRow({ metric: 'Test Category Breakdown', value: 'Passed / Total' });
    categoryHeaderRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    categoryHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2C3E50' }
    };

    const categories = Object.values(TestCategory);
    categories.forEach(cat => {
      const catResults = this.results.filter(r => r.category === cat);
      if (catResults.length > 0) {
        const catPassed = catResults.filter(r => r.passed).length;
        summarySheet.addRow({
          metric: cat,
          value: `${catPassed} / ${catResults.length} (${((catPassed / catResults.length) * 100).toFixed(0)}%)`
        });
      }
    });

    const fileName1 = `${OUTPUT_FILE.replace('.xlsx', '')}_${TIMESTAMP}.xlsx`;
    await workbook.xlsx.writeFile(fileName1);

    const fileName2 = `${LEGACY_OUTPUT_FILE.replace('.xlsx', '')}_${TIMESTAMP}.xlsx`;
    await workbook.xlsx.writeFile(fileName2);
    
    console.log(`✅ Results exported to: ${fileName1}`);
    console.log(`✅ Results also saved to: ${fileName2}\n`);
  }

  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================

  printSummary() {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║        SCHEDULE & FEEDBACK TEST EXECUTION SUMMARY         ║');
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
        if (result.errorDetails) {
          console.log(`   Error Details: ${result.errorDetails}`);
        }
      });
    } else {
      console.log('🎉 ALL TESTS PASSED! 100% SUCCESS RATE!\n');
    }

    console.log('\n📝 Summary of Verified Features:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log('   • Mentor: Quản lý lịch rảnh (Create, List, Cancel, Overlap check)');
    console.log('   • Mentee: Đặt lịch hẹn (Book, Cancel, Prevent duplicate/self book)');
    console.log('   • Mentor: Xác nhận lịch hẹn (Confirm booking)');
    console.log('   • Meeting Session: Bắt đầu (Start) và Kết thúc (End) buổi gặp mặt');
    console.log('   • Mentee Feedback: Đánh giá buổi gặp mặt (5 sao, nhận xét)');
    console.log('   • Feedback Validation: Chặn feedback khi session đang diễn ra, chặn duplicate, kiểm tra rating 1-5');
    console.log('   • Feedback Queries: Xem lịch sử đánh giá của Mentee & điểm trung bình của Mentor');
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

    const testSuite = new ScheduleAndFeedbackTest();
    await testSuite.runAllTests();
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️  Total time: ${totalTime}s\n`);
    console.log('✨ Test execution finished successfully!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { ScheduleAndFeedbackTest, TestResult, TestCategory };
