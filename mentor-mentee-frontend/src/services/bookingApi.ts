import api from './api';
import { Booking, CreateBookingData } from '../types/booking';
import { ApiResponse } from '../types/common';

export const bookingApi = {
  // Create booking (MENTEE books a schedule)
  createBooking: async (data: CreateBookingData): Promise<Booking> => {
    const response = await api.post<ApiResponse<Booking>>('/bookings', data);
    return response.data.data;
  },

  // Confirm booking (MENTOR confirms)
  confirmBooking: async (id: number): Promise<Booking> => {
    const response = await api.patch<ApiResponse<Booking>>(`/bookings/${id}/confirm`);
    return response.data.data;
  },

  // Cancel booking
  cancelBooking: async (id: number): Promise<Booking> => {
    const response = await api.patch<ApiResponse<Booking>>(`/bookings/${id}/cancel`);
    return response.data.data;
  },

  // Get my bookings
  getMyBookings: async (): Promise<Booking[]> => {
    const response = await api.get<ApiResponse<Booking[]>>('/bookings/my');
    return response.data.data;
  },
};
