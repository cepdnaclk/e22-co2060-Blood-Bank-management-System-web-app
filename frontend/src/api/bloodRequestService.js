import api from './api';

const getAuthToken = () => {
    const stored = localStorage.getItem('authTokens');
    return stored ? JSON.parse(stored)?.access : null;
};

export const getDoctorRequests = async () => {
    try {
        const response = await api.get('bloodinventor/doctor/requests/');
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};

export const createBloodRequest = async (requestData) => {
    try {
        const response = await api.post('bloodinventor/doctor/requests/', requestData);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};
