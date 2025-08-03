// src/hooks/useSpots.js
import { useState, useEffect } from "react";
import axios from "axios";

// user: { id, ... } 또는 undefined
// scope는 "PRIVATE"이 default, 필요시 외부에서 인자 전달도 가능
export function useSpots(user, scope = "PRIVATE") {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // spots 데이터 불러오기
  const fetchSpots = async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = user?.id || localStorage.getItem("snowball_uid");
      if (!userId) {
        setSpots([]);
        setLoading(false);
        return;
      }
      const url = `/api/spots?ownerId=${userId}&scope=${scope}`;
      const res = await axios.get(url);
      setSpots(Array.isArray(res.data) ? res.data : res.data.spots || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // user(로그인) 또는 scope 변경시마다 자동 로드
  useEffect(() => {
    fetchSpots();
    // eslint-disable-next-line
  }, [user, scope]);

  // spots 상태와 setter, fetch 함수, 상태값 반환
  return {
    spots,
    setSpots,      // 수동 변경 필요시
    fetchSpots,    // 수동으로 새로고침 하고 싶을 때
    loading,
    error,
  };
}