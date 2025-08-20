import { useEffect, useState } from "react";
import axios from "../axiosConfig";

export default function AuthCallback() {
  const [error, setError] = useState(null);

  useEffect(() => {
    const doExchange = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;

      if (!code) {
        setError("Missing authorization code");
        return;
      }
      try {
        const { data } = await axios.post("/auth/google", { code, redirectUri });
        // data: { token, userId, nickname, email, ... } 형태(백엔드 AuthResponse 기준)
        if (data?.token) localStorage.setItem("snowball_token", data.token);
        if (data?.userId) localStorage.setItem("snowball_uid", data.userId);
        if (data?.nickname) localStorage.setItem("snowball_nickname", data.nickname || "");
        // 홈으로 이동(원하면 이전 페이지로)
        window.location.replace("/");
      } catch (e) {
        setError(e?.response?.data || e?.message || "Login failed");
      }
    };
    doExchange();
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, -apple-system" }}>
      <h2>Signing you in…</h2>
      {error && <p style={{ color: "crimson" }}>{String(error)}</p>}
    </div>
  );
}