import api from './api';
import { Schedule, CreateScheduleData, UpdateScheduleData, ScheduleQueryParams } from '../types/schedule';
import { ApiResponse, PaginatedResponse } from '../types/common';

export const scheduleApi = {
  // Create schedule (MENTOR only)
  createSchedule: async (data: CreateScheduleData): Promise<Schedule> => {
    const response = await api.post<ApiResponse<Schedule>>('/schedules', data);
    return response.data.data;
  },

  // Get all schedules
  getAllSchedules: async (params?: ScheduleQueryParams): Promise<PaginatedResponse<Schedule>> => {
    const queryParams = new URLSearchParams();
    if (params?.mentorId) queryParams.append('mentorId', params.mentorId.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get<PaginatedResponse<Schedule>>(`/schedules?${queryParams.toString()}`);
    return response.data;
  },

  // Get my schedules (MENTOR only)
  getMySchedules: async (params?: ScheduleQueryParams): Promise<PaginatedResponse<Schedule>> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get<PaginatedResponse<Schedule>>(`/schedules/my-schedules?${queryParams.toString()}`);
    return response.data;
  },

  // Get schedule by ID
  getScheduleById: async (id: number): Promise<Schedule> => {
    const response = await api.get<ApiResponse<Schedule>>(`/schedules/${id}`);
    return response.data.data;
  },

  // Update schedule
  updateSchedule: async (id: number, data: UpdateScheduleData): Promise<Schedule> => {
    const response = await api.patch<ApiResponse<Schedule>>(`/schedules/${id}`, data);
    return response.data.data;
  },

  // Delete schedule
  deleteSchedule: async (id: number): Promise<void> => {
    await api.delete(`/schedules/${id}`);
  },
};
