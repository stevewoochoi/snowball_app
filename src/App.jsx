import "./axiosConfig";
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import MapWithSpots from "./components/MapWithSpots";
import SpotView from "./components/SpotView";
import axios from "axios";
import "./axiosConfig";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 모바일 100vh 버그 대응 (iOS 사파리, 모바일 크롬 등)
  useEffect(() => {
    function setRealVh() {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--real-vh', `${vh}px`);
    }
    setRealVh();
    window.addEventListener('resize', setRealVh);
    return () => window.removeEventListener('resize', setRealVh);
  }, []);

  // 앱 진입 시 항상 최신 유저 정보를 서버에서 다시 fetch (level, nickname 등 동기화)
  useEffect(() => {
    const uid = localStorage.getItem("snowball_uid");
    const nickname = localStorage.getItem("snowball_nickname");
    const token = localStorage.getItem("snowball_token");

    // localStorage 기반 임시값
    if (uid && nickname && token) {
      setUser({ id: Number(uid), nickname, token });
      setLoading(true);

      // 서버에서 유저 정보 fetch 후 동기화
      axios.get(`/api/users/${uid}`)
        .then(res => {
          if (res.data && res.data.id) {
            localStorage.setItem("snowball_uid", res.data.id);
            localStorage.setItem("snowball_nickname", res.data.nickname);
            localStorage.setItem("snowball_level", res.data.level ?? "0");
            setUser({
              id: Number(res.data.id),
              nickname: res.data.nickname,
              token: token,
              level: res.data.level ? Number(res.data.level) : 0
            });
            console.log('[App.jsx] (server fetch) user:', res.data);
          }
        })
        .catch(() => {
          // 서버 fetch 실패시 기존 localStorage 값만 사용
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div style={{textAlign:'center', marginTop:60, color:'#888', fontSize:20}}>Loading...</div>;
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }
  return (
    <Routes>
      <Route path="/" element={<MapWithSpots user={user} />} />
      <Route path="/spot/:spotId" element={<SpotView user={user} />} />
    </Routes>
  );
}

export default function AppWithRouter() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}