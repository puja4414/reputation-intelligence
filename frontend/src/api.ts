import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const getAnalytics = async (company: string) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/${company}`, {
        params: { _t: Date.now() } // Cache busting
    });
    return response.data;
};

export const searchReviews = async (company: string, query: string) => {
    const response = await axios.get(`${API_BASE_URL}/search/${company}`, { 
        params: { query, _t: Date.now() } // Cache busting
    });
    return response.data;
};

export const uploadDataset = async (name: string, file: File) => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('file', file);
    try {
        const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error: any) {
        const message = error.response?.data?.detail || "Upload failed. Please check your CSV format.";
        throw new Error(message);
    }
};

export const getAvailableCompanies = async () => {
    const response = await axios.get(`${API_BASE_URL}/`);
    return response.data.companies;
};
