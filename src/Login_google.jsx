// src/Login.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

// ===== API Base URL (env 우선, 없으면 현재 origin) =====
const API_BASE =
  (import.meta.env.VITE_API_BASE && String(import.meta.env.VITE_API_BASE).trim()) ||
  (window.location.hostname === "localhost" ? "http://localhost:8080" : "https://snowball.iuorder.com");
console.log("[Login] API_BASE:", API_BASE);

/**
 * ===== Google OAuth Redirect URI 전략 =====
 * - 프로덕션/로컬 모두에서 기본값을 `window.location.origin` 기반 실제 콜백으로 사용합니다.
 * - 필요 시 .env 의 VITE_GOOGLE_REDIRECT_URI 로 덮어쓸 수 있습니다.
 * - 예)
 *     VITE_GOOGLE_REDIRECT_URI=https://snowball.iuorder.com/auth/google/callback
 *     VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
 */
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const ENV_REDIRECT = (import.meta.env.VITE_GOOGLE_REDIRECT_URI && String(import.meta.env.VITE_GOOGLE_REDIRECT_URI).trim()) || "";
const DEFAULT_REDIRECT = `${window.location.origin}/auth/google/callback`;
const REDIRECT_URI = ENV_REDIRECT || DEFAULT_REDIRECT;

if (!CLIENT_ID) {
  console.warn("[Login] VITE_GOOGLE_CLIENT_ID가 비어있습니다. 구글 OAuth Client ID 환경변수를 설정하세요.");
}
// 현재 origin 과 redirect_uri 를 함께 로깅하여 환경 불일치 즉시 확인
console.debug("[Login] OAuth config", { CLIENT_ID, REDIRECT_URI, origin: window.location.origin, API_BASE });
// 프로덕션인데 로컬호스트 리다이렉트면 경고
if (window.location.hostname !== "localhost" && /localhost/.test(REDIRECT_URI)) {
  console.warn("[Login] Production origin에서 localhost redirect_uri가 감지되었습니다. .env 의 VITE_GOOGLE_REDIRECT_URI를 도메인 콜백으로 바꾸세요.");
}

function Login({ onLogin }) {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [gReady, setGReady] = useState(false);
  const codeClientRef = useRef(null);

  // ===== Helpers =====
  const persistAndLiftUser = (data) => {
    const userId = data.userId ?? data.id;
    const token = data.token ?? data.jwt ?? data.accessToken;
    const nick = data.nickname ?? data.nick ?? data.username ?? "User";
    const level = Number(data.level ?? 0);

    if (userId && token) {
      localStorage.setItem("snowball_uid", userId);
      localStorage.setItem("snowball_nickname", nick);
      localStorage.setItem("snowball_token", token);
      localStorage.setItem("snowball_level", String(level));
      onLogin && onLogin({ id: Number(userId), nickname: nick, token, level });
    } else {
      console.warn("[Login] Unexpected auth payload:", data);
      alert("로그인 응답 형식이 예상과 다릅니다.");
    }
  };

  // ===== Guest flow =====
  const handleGuestLogin = () => {
    const guestNick = "게스트" + Math.floor(Math.random() * 10000);
    const guestEmail = "guest" + Date.now() + "@mail.com";
    registerUser(guestNick, guestEmail);
  };

  const registerUser = (nick, mail) => {
    api
      .post("/api/users", { nickname: nick, email: mail })
      .then((res) => {
        console.log("[Login] register response:", res.data);
        persistAndLiftUser(res.data);
      })
      .catch((err) => {
        console.error("[Login] register error:", err?.response?.data || err);
        alert("회원가입에 실패했습니다.");
      });
  };

  // ===== Google OAuth 2.0 Authorization Code (GIS CodeClient) =====
  useEffect(() => {
    if (!CLIENT_ID) {
      console.warn("[Login] VITE_GOOGLE_CLIENT_ID 가 설정되어 있지 않습니다.");
      return;
    }

    const init = () => {
      const gsi = window.google?.accounts?.oauth2;
      if (!gsi) return false;

      try {
        codeClientRef.current = gsi.initCodeClient({
          client_id: CLIENT_ID,
          scope: "openid email profile",
          ux_mode: "popup",
          redirect_uri: REDIRECT_URI, // 기본 postmessage
          callback: async (resp) => {
            try {
              if (!resp?.code) {
                console.warn("[Google] no auth code in response", resp);
                alert("구글 로그인에 실패했습니다.");
                return;
              }

              // 🔎 받은 Authorization Code 로깅
              console.log("[Google] raw OAuth authorization code:", resp.code);

              // 🔎 바로 테스트 가능한 curl 템플릿 출력
              //   - client_secret 은 실제 구글 콘솔의 웹 클라이언트 시크릿으로 변경하세요.
              //   - 코드 유효시간이 짧으므로 즉시 테스트하세요.
              console.log(
                `[curl-test] curl -i https://oauth2.googleapis.com/token \\` +
                  `\n  -d grant_type=authorization_code \\` +
                  `\n  -d code="${resp.code}" \\` +
                  `\n  -d client_id="${CLIENT_ID}" \\` +
                  `\n  -d client_secret="<YOUR_CLIENT_SECRET>" \\` +
                  `\n  -d redirect_uri="${REDIRECT_URI}"`
              );

              // 백엔드로 교환 요청
              const result = await axios.post(`${API_BASE}/api/auth/google`, {
              code: resp.code,
              redirectUri: REDIRECT_URI,
              });
              console.log("[Login] Google login response:", result.data);
              persistAndLiftUser(result.data);
            } catch (e) {
              console.error("[Login] Google login error:", e?.response?.data || e);
              alert("구글 로그인에 실패했습니다.");
            }
          },
        });
        setGReady(true);
        return true;
      } catch (e) {
        console.error("[Google] initCodeClient error", e);
        return false;
      }
    };

    // 초기화 시도 (gsi 스크립트가 늦게 로드되는 경우 대비)
    if (!init()) {
      const timer = setInterval(() => {
        if (init()) clearInterval(timer);
      }, 300);
      return () => clearInterval(timer);
    }
  }, []);

  const handleGoogleLogin = () => {
    if (!gReady || !codeClientRef.current) {
      alert("Google API가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    try {
      codeClientRef.current.requestCode();
    } catch (e) {
      console.error("[Google] requestCode error", e);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nickname && email) {
      registerUser(nickname, email);
    }
  };

  return (
    <div
      style={{
        maxWidth: 360,
        margin: "60px auto",
        padding: 24,
        borderRadius: 12,
        boxShadow: "0 2px 16px #0002",
        background: "#fff",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 16, fontWeight: 900 }}>스노우볼 로그인</h2>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="닉네임"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          style={{
            width: "100%",
            marginBottom: 10,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #e3e8ef",
          }}
        />
        <input
          placeholder="이메일"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            marginBottom: 16,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #e3e8ef",
          }}
        />
        <button
          type="submit"
          style={{
            width: "100%",
            background: "#2563EB",
            color: "#fff",
            border: 0,
            borderRadius: 8,
            padding: 12,
            fontWeight: 800,
          }}
        >
          로그인 / 회원가입
        </button>
      </form>

      <button
        onClick={handleGuestLogin}
        style={{
          marginTop: 12,
          width: "100%",
          background: "#f3f4f6",
          color: "#111827",
          border: 0,
          borderRadius: 8,
          padding: 12,
          fontWeight: 700,
        }}
      >
        간편 체험(게스트)
      </button>

      <button
        onClick={handleGoogleLogin}
        disabled={!gReady}
        style={{
          marginTop: 12,
          width: "100%",
          background: "#fff",
          color: "#1f2937",
          border: "1px solid #e3e8ef",
          borderRadius: 8,
          padding: 12,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
        aria-label="Sign in with Google"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="google" width="18" height="18" />
        구글로 로그인
      </button>
    </div>
  );
}

export default Login;