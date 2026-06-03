import api from './api';

/**
 * FETCH ALL DOCTORS
 * GET /adminDashboard/doctors/list/
 * Returns: List of all doctors
 */
export const fetchAllDoctors = async () => {
  try {
    const response = await api.get('adminDashboard/doctors/list/');
    return {
      success: true,
      data: response.data,
      message: 'Doctors fetched successfully',
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error.response?.data?.detail || 'Failed to fetch doctors',
    };
  }
};

/**
 * GET SINGLE DOCTOR BY ID
 * GET /adminDashboard/doctor/profile/:id/
 * Returns: Doctor details
 */
export const fetchDoctorById = async (id) => {
  try {
    const response = await api.get(`adminDashboard/doctor/profile/${id}/`);
    return {
      success: true,
      data: response.data,
      message: 'Doctor fetched successfully',
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error.response?.data?.detail || 'Failed to fetch doctor',
    };
  }
};

/**
 * SEARCH DOCTORS BY ID
 * GET /adminDashboard/doctors/list/?search=:searchTerm
 * Returns: Filtered doctors list
 */
export const searchDoctors = async (searchTerm) => {
  try {
    const response = await api.get('adminDashboard/doctors/list/', {
      params: { search: searchTerm },
    });
    return {
      success: true,
      data: response.data,
      message: 'Search completed',
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error.response?.data?.detail || 'Search failed',
    };
  }
};

/**
 * CREATE NEW DOCTOR
 * POST /adminDashboard/doctor/create/
 * Payload:
 * {
 *   username: string,
 *   email: string,
 *   full_name: string,
 *   specialization: string,
 *   license_number: string,
 *   phone: string,
 *   hospital: string (optional)
 * }
 * Returns: Created doctor object with ID
 */
export const createDoctor = async (doctorData) => {
  try {
    const response = await api.post('adminDashboard/doctor/create/', doctorData);
    return {
      success: true,
      data: response.data,
      message: 'Doctor created successfully',
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error.response?.data?.detail || 'Failed to create doctor',
      errors: error.response?.data, // Validation errors
    };
  }
};

/**
 * UPDATE DOCTOR DETAILS
 * PUT /adminDashboard/doctor/profile/:id/
 * Payload: Any fields to update
 * Returns: Updated doctor object
 */
export const updateDoctor = async (doctorId, updateData) => {
  try {
    const response = await api.put(`adminDashboard/doctor/profile/${doctorId}/`, updateData);
    return {
      success: true,
      data: response.data,
      message: 'Doctor updated successfully',
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error.response?.data?.detail || 'Failed to update doctor',
      errors: error.response?.data,
    };
  }
};

/**
 * CREATE LOGIN CREDENTIALS FOR DOCTOR
 * POST /adminDashboard/doctors/:id/create-credentials/
 * Payload:
 * {
 *   password: string (temporary password)
 * }
 * Returns: Credentials info
 */
export const createDoctorCredentials = async (doctorId, password) => {
  try {
    const response = await api.post(`adminDashboard/doctors/${doctorId}/create-credentials/`, {
      password,
    });
    return {
      success: true,
      data: response.data,
      message: 'Credentials created successfully',
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error.response?.data?.detail || 'Failed to create credentials',
    };
  }
};

/**
 * RESET DOCTOR PASSWORD
 * POST /adminDashboard/doctors/:id/reset-password/
 * Payload:
 * {
 *   new_password: string
 * }
 * Returns: Success message
 */
export const resetDoctorPassword = async (doctorId, newPassword) => {
  try {
    const response = await api.post(`adminDashboard/doctors/${doctorId}/reset-password/`, {
      new_password: newPassword,
    });
    return {
      success: true,
      data: response.data,
      message: 'Password reset successfully',
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error.response?.data?.detail || 'Failed to reset password',
    };
  }
};

/**
 * DELETE DOCTOR
 * DELETE /adminDashboard/doctor/profile/:id/
 * Returns: Success message
 */
export const deleteDoctor = async (doctorId) => {
  try {
    const response = await api.delete(`adminDashboard/doctor/profile/${doctorId}/`);
    return {
      success: true,
      data: response.data,
      message: 'Doctor deleted successfully',
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error.response?.data?.detail || 'Failed to delete doctor',
    };
  }
};

/**
 * SEND MESSAGE TO DOCTOR
 * POST /adminDashboard/doctors/:id/send-message/
 * Payload:
 * {
 *   subject: string,
 *   message: string
 * }
 * Returns: Message sent confirmation
 */
export const sendMessageToDoctor = async (doctorId, subject, message) => {
  try {
    const response = await api.post(`adminDashboard/doctors/${doctorId}/send-message/`, {
      subject,
      message,
    });
    return {
      success: true,
      data: response.data,
      message: 'Message sent successfully',
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error.response?.data?.detail || 'Failed to send message',
    };
  }
};

/**
 * GET DOCTOR STATISTICS (Optional - for dashboard)
 * GET /adminDashboard/doctor/total/
 * Returns: Doctor count, active doctors, etc.
 */
export const getDoctorStats = async () => {
  try {
    const response = await api.get('adminDashboard/doctor/total/');
    return {
      success: true,
      data: response.data,
      message: 'Stats fetched successfully',
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error.response?.data?.detail || 'Failed to fetch stats',
    };
  }
};

export default api;
