import axios from 'axios';

// Update baseURL to point to the base bloodinventor so we can access both /public and our new endpoints easily
const inventoryAPI = axios.create({
    baseURL: 'http://localhost:8000/api/v1/blood',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getBloodStock = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams(filters).toString();
        // Pointing to the new national live endpoint which supports filters, but falls back to same structure
        const response = await inventoryAPI.get(`/national/live/?${queryParams}`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};

export const getAllHospitalsStock = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await inventoryAPI.get(`/hospitals/stock/?${queryParams}`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};
