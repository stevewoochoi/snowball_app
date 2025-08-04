import { useEffect, useState } from "react";
import axios from "axios";

export default function FriendManagerModal({ onClose, myUserId }) {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]); // [추가] 내가 보낸 요청
  const [loading, setLoading] = useState(false);

  // 친구, 요청 목록 불러오기
  const fetchFriends = () => {
    setLoading(true);
    Promise.all([
      axios.get(`/api/friends?userId=${myUserId}`),
      axios.get(`/api/friends/requests?userId=${myUserId}`),
      axios.get(`/api/friends/requests/sent?userId=${myUserId}`), // [추가] 내가 보낸 요청
    ]).then(([friendsRes, requestsRes, sentRes]) => {
      setFriends(friendsRes.data || []);
      setRequests(requestsRes.data || []);
      setSentRequests(sentRes.data || []); // [추가]
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFriends();
  }, [myUserId]);

  // 친구 요청 수락/거절
  const handleAccept = (friendId) => {
    axios.post(`/api/friends/accept?userId=${myUserId}&friendId=${friendId}`)
      .then(() => {
        fetchFriends(); // 전체 갱신
      });
  };
  const handleReject = (friendId) => {
    axios.delete(`/api/friends?userId=${myUserId}&friendId=${friendId}`)
      .then(() => {
        fetchFriends(); // 전체 갱신
      });
  };

  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.15)', zIndex: 2120, display: 'flex',
      alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        minWidth: 320, background: '#fff', borderRadius: 18, padding: 26,
        boxShadow: '0 6px 24px #0002', position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position:'absolute', top:10, right:15, background:'none', border:'none', fontSize:21, color:'#666', cursor:'pointer'
          }}
        >×</button>
        <div style={{fontSize: 18, fontWeight: 700, marginBottom: 10}}>친구 관리</div>
        <div style={{marginBottom: 18}}>
          <div style={{fontWeight: 600, marginBottom: 6, color: '#197ad6'}}>받은 친구 요청</div>
          {loading && <div style={{ color: '#999' }}>로딩 중...</div>}
          {requests.length === 0 && !loading && <div style={{ color: '#888', fontSize: 14 }}>받은 요청 없음</div>}
          {requests.map(r => (
            <div key={r.id} style={{display:'flex', alignItems:'center', marginBottom:6}}>
              <span style={{flex:1, fontSize:15, color:'#283040'}}>{r.nickname ?? '(닉네임없음)'}</span>
              <button
                onClick={() => {
                  console.log('[친구수락] 내 userId:', myUserId, '요청자:', r.friendId, r);
                  handleAccept(r.friendId);
                }}
                style={{marginRight:5, color:"#fff", background:"#1a9ad6", border:"none", borderRadius:4, padding:"4px 10px"}}
              >수락</button>
              <button
                onClick={() => {
                  console.log('[친구거절] 내 userId:', myUserId, '요청자:', r.friendId, r);
                  handleReject(r.friendId);
                }}
                style={{color:"#fff", background:"#eee", border:"none", borderRadius:4, padding:"4px 10px"}}
              >거절</button>
            </div>
          ))}

          {/* === 내가 보낸 친구 요청 (OUTGOING) === */}
          <div style={{fontWeight: 600, marginTop: 20, marginBottom: 6, color: '#197ad6'}}>내가 보낸 친구 요청</div>
          {sentRequests.length === 0 && !loading && <div style={{ color: '#888', fontSize: 14 }}>보낸 요청 없음</div>}
          {sentRequests.map(r => (
            <div key={r.id} style={{display:'flex', alignItems:'center', marginBottom:6}}>
              <span style={{flex:1, fontSize:15, color:'#283040'}}>{r.nickname ?? '(닉네임없음)'}</span>
              <span style={{color:'#197ad6', fontWeight:500, fontSize:13, marginLeft:5}}>요청중</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{fontWeight: 600, marginBottom: 6, color: '#197ad6'}}>내 친구 목록</div>
          {loading && <div style={{ color: '#999' }}>로딩 중...</div>}
          {friends.length === 0 && !loading && <div style={{ color: '#888', fontSize: 14 }}>아직 친구 없음</div>}
          {friends.map(f => (
            <div key={f.id} style={{display:'flex', alignItems:'center', marginBottom:6}}>
              <span style={{flex:1, fontSize:15, color:'#283040'}}>{f.nickname ?? '(닉네임없음)'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}