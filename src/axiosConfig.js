// src/axiosConfig.js
import axios from "axios";

// 모든 요청에 토큰 자동 첨부
axios.interceptors.request.use(config => {
  const token = localStorage.getItem("snowball_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});