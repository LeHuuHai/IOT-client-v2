import axios from 'axios';
const accessToken = localStorage.getItem('accessToken');
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
    },
});

const login = async (username, password) => {
    try {
        const response = await api.post('/auth/login-basic', { username, password });
        return response.data;
    } catch (error) {
        console.error('Error during login:', error);
        throw error;
    }
};

const dailyData = async (deviceId) => {
    try {
        const response = await api.get(`/api/soilMoisture/today/${deviceId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
};

const listDevice = async () => {
    try {
        const response = await api.get('/api/devices');
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
};

const weeklyData = async (deviceId) => {
    try {
        const response = await api.get(`/api/soilMoisture/last-week/${deviceId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

const getThreshold = async (deviceId) => {
    try{
        const res = await api.get(`/api/threshold/${deviceId}`);
        console.log("get threshhold successful");
        return res.data;
    }catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

const postThreshold = async (low, high, deviceId) => {
    try {
      const response = await api.post('/api/threshold', {
        low: low,
        high: high,
        deviceId: deviceId
      });
      return response.data
    } catch (error) {
        console.error('Error sending threshold:', error);
        throw error; 
    }
}

export default { dailyData, weeklyData, login, listDevice, postThreshold, getThreshold }

