// src/Login.jsx
import React, { useState } from "react";
import axios from "axios";

function Login({ onLogin }) {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");

  // 간편 체험: 랜덤 닉네임/이메일 생성
  const handleGuestLogin = () => {
    const guestNick = "게스트" + Math.floor(Math.random() * 10000);
    const guestEmail = "guest" + Date.now() + "@mail.com";
    registerUser(guestNick, guestEmail);
  };

  // 회원가입(API 호출)
  const registerUser = (nick, mail) => {
    axios.post("/api/users", {
      nickname: nick,
      email: mail
    })
    .then(res => {
      console.log("[Login] register response:", res.data);
      localStorage.setItem("snowball_uid", res.data.id);
      localStorage.setItem("snowball_nickname", res.data.nickname);
      localStorage.setItem("snowball_token", res.data.token);
      localStorage.setItem("snowball_level", res.data.level);
      console.log("[Login] token 저장됨?", localStorage.getItem("snowball_token"));
            console.log("[Login] level 저장됨?", localStorage.getItem("snowball_level"));

      onLogin && onLogin(res.data); // 상위 컴포넌트로 로그인 이벤트 전달
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nickname && email) {
      registerUser(nickname, email);
    }
  };

  return (
    <div style={{maxWidth: 320, margin: "60px auto", padding: 24, borderRadius: 12, boxShadow: "0 2px 16px #0002"}}>
      <h2>스노우볼 로그인</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="닉네임"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          style={{width: "100%", marginBottom: 10}}
        />
        <input
          placeholder="이메일"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{width: "100%", marginBottom: 16}}
        />
        <button type="submit" style={{width: "100%", background: "#28a", color: "#fff", border: 0, borderRadius: 8, padding: 10, fontWeight: "bold"}}>
          로그인 / 회원가입
        </button>
      </form>
      <button onClick={handleGuestLogin} style={{marginTop: 12, width: "100%", background: "#eee", color: "#333", border: 0, borderRadius: 8, padding: 10}}>
        간편 체험(게스트)
      </button>
    </div>
  );
}

export default Login;