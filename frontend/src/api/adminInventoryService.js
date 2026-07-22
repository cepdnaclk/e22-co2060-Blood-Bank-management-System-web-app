import api from '../api/api';

// --- Existing API calls ---
export const getAllBloodRequests = async () => {
    try {
        const response = await api.get('blood/admin/blood-requests/');
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};

export const updateBloodRequestStatus = async (id, data) => {
    try {
        const response = await api.patch(`blood/admin/blood-requests/${id}/`, data);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};

export const getInventoryChanges = async () => {
    try {
        const response = await api.get('blood/admin/change-requests/pending/');
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};

export const createInventoryChange = async (data) => {
    try {
        const response = await api.post('blood/officer/change-requests/', data);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};

// --- NEW API calls for Hospital-Wise Inventory & Dashboard ---

export const getNationalDashboard = async () => {
    try {
        const response = await api.get('blood/national/dashboard/');
        if (response.status !== 200) {
            return { success: false, error: 'Could not load dashboard data.' };
        }
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: 'Could not load dashboard data.' };
    }
};

export const getHospitalInventoryDetail = async (hospitalId) => {
    try {
        const response = await api.get(`blood/hospital/${hospitalId}/inventory/`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};

export const getExpiryAlerts = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await api.get(`blood/expiry/alerts/?${queryParams}`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};

export const resolveExpiryAlert = async (alertId, action) => {
    try {
        const response = await api.post(`blood/expiry/alerts/${alertId}/resolve/`, { action });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};

// --- NEW API calls for Camp Blood Tracking ---

export const getPendingCampBlood = async (hospitalId = '') => {
    try {
        const url = hospitalId 
            ? `donor/camp-blood/pending/?hospital_id=${hospitalId}`
            : `donor/camp-blood/pending/`;
        const response = await api.get(url);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};

export const receiveCampBlood = async (collectionId) => {
    try {
        const response = await api.post(`donor/camp-blood/${collectionId}/receive/`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};

export const verifyCampBlood = async (collectionId, verificationData) => {
    try {
        const response = await api.post(`donor/camp-blood/${collectionId}/verify/`, verificationData);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};
