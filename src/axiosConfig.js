// src/axiosConfig.js
import axios from "axios";

// 인스턴스 생성 (baseURL은 필요시 추가)
const api = axios.create({
  // baseURL: process.env.REACT_APP_API_BASE || "",  // 환경변수 사용시
  withCredentials: true
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem("snowball_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;