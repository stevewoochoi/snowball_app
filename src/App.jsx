import "./axiosConfig";
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import MapWithSpots from "./components/MapWithSpots";
import SpotView from "./components/SpotView";
import "./axiosConfig";

function App() {
  const [user, setUser] = useState(null);

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

  useEffect(() => {
    const uid = localStorage.getItem("snowball_uid");
    const nickname = localStorage.getItem("snowball_nickname");
    const token = localStorage.getItem("snowball_token");
    console.log('[App.jsx] localStorage:', { uid, nickname, token });
    // token까지 user에 포함해 전달
    if (uid && nickname && token) {
      console.log('[App.jsx] user state set:', { id: Number(uid), nickname, token });
      setUser({ id: Number(uid), nickname, token });
    } else if (uid && nickname) {
      console.log('[App.jsx] user state set:', { id: Number(uid), nickname });
      setUser({ id: Number(uid), nickname });
    }
  }, []);

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