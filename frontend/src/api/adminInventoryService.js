import api from '../api/api';

export const getAllBloodRequests = async () => {
    try {
        const response = await api.get('bloodinventor/admin/blood-requests/');
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};

export const updateBloodRequestStatus = async (id, data) => {
    try {
        const response = await api.patch(`bloodinventor/admin/blood-requests/${id}/`, data);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};

export const getInventoryChanges = async () => {
    try {
        const response = await api.get('bloodinventor/admin/change-requests/pending/');
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};

// For Inventory Officer
export const createInventoryChange = async (data) => {
    try {
        const response = await api.post('bloodinventor/officer/change-requests/', data);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};
