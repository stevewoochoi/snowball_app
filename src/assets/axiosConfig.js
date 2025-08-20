import axios from "axios";

const instance = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("snowball_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

instance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // 토큰 만료 등
      // 필요시 자동 로그아웃 처리
    }
    return Promise.reject(err);
  }
);

export default instance;