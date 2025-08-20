import React from "react";

const GOOGLE_AUTH_URI = "https://accounts.google.com/o/oauth2/v2/auth";

function buildAuthUrl() {
  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",   // refresh_token 확보
    include_granted_scopes: "true",
    prompt: "consent",         // 항상 동의창 (필요 시 제거)
  });
  return `${GOOGLE_AUTH_URI}?${params.toString()}`;
}

export default function GoogleLoginButton({ className, children }) {
  const onClick = () => {
    window.location.href = buildAuthUrl();
  };
  return (
    <button
      onClick={onClick}
      className={className}
      style={{
        width: "100%",
        height: 48,
        borderRadius: 12,
        border: "1px solid #dfe3ea",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        fontWeight: 700,
        boxShadow: "0 6px 18px rgba(0,0,0,.06)",
      }}
    >
      <img src="/google.svg" alt="" width={20} height={20} />
      {children || "Sign in with Google"}
    </button>
  );
}