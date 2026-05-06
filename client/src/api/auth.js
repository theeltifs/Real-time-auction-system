import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

//Register new user.
export const registerUser = (formData) => API.post('/users/register', formData);

//Login user.
export const loginUser = (formData) => API.post('/users/login', formData);
