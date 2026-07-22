import api from '../api/api'

export const getUpcomingCamps = async () => {
  const response = await api.get('donor/camps/upcoming/');
  return response.data;
};

export const getLatestPublicCamp = async () => {
  const response = await api.get('donor/camps/public/latest/');
  return response.data;
};

export const registerForCamp = async (campId) => {
  const response = await api.post(`donor/camps/${campId}/register/`);
  return response.data;
};

// Organizer methods
export const getOrganizerCamps = async () => {
  const response = await api.get('donor/camps/');
  return response.data;
};

export const createBloodCamp = async (campData) => {
  const response = await api.post('donor/camps/', campData);
  return response.data;
};

export const getCampRegistrations = async (campId) => {
  const response = await api.get(`donor/camps/${campId}/registrations/`);
  return response.data;
};

export const getScreeningQueue = async (campId = null) => {
  const response = await api.get("donor/camps/registrations/screening/", {
    params: campId ? { camp_id: campId } : {},
  });
  return response.data;
};

export const markRegistrationArrived = async (registrationId) => {
  const response = await api.post(`donor/camps/registrations/${registrationId}/arrive/`);
  return response.data;
};

export const getOrganizerDonatedHistory = async () => {
  const response = await api.get("donor/camps/donated-history/");
  return response.data;
};

export const sendRegistrationToScreening = async (registrationId) => {
  const response = await api.post(`donor/camps/registrations/${registrationId}/screening/`);
  return response.data;
};

export const approveCampRegistration = async (registrationId) => {
  const response = await api.post(`donor/camps/registrations/${registrationId}/approve/`);
  return response.data;
};

export const rejectCampRegistration = async (registrationId, reason) => {
  const response = await api.post(`donor/camps/registrations/${registrationId}/reject/`, { reason });
  return response.data;
};

export const completeCampRegistration = async (registrationId) => {
  const response = await api.post(`donor/camps/registrations/${registrationId}/donate/`);
  return response.data;
};

export const getWorkflowNotifications = async (params = {}) => {
  const response = await api.get("donor/notifications/", { params });
  return response.data;
};

export const markWorkflowNotificationRead = async (id) => {
  const response = await api.patch(`donor/notifications/${id}/read/`, { is_read: true });
  return response.data;
};

// Blood Collection and Dispatch
export const getCampCollections = async (campId) => {
  const response = await api.get(`donor/camps/${campId}/collections/`);
  return response.data;
};

export const dispatchCampBlood = async (campId) => {
  const response = await api.post(`donor/camps/${campId}/collections/dispatch/`);
  return response.data;
};
