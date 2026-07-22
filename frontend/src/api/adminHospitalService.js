import api from './api';

export const getHospitals = async () => {
    const response = await api.get('auth/hospitals/');
    return response.data;
};

export const createHospital = async (hospitalData) => {
    const response = await api.post('auth/hospitals/', hospitalData);
    return response.data;
};
