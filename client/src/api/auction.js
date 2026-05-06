import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export const fetchAuctions = async (filters = {}, page = 1, limit = 8) => {
  const params = new URLSearchParams();

  if (filters.name) params.append('name', filters.name);
  if (filters.category) params.append('category', filters.category);
  if (filters.status) params.append('status', filters.status);
  if (filters.minPrice) params.append('minPrice', filters.minPrice);
  if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);

  params.append('page', page);
  params.append('limit', limit);

  const response = await API.get(`/auctions?${params.toString()}`);
  return response.data;
};


