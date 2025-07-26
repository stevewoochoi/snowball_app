import { useState, useEffect } from "react";
import axios from "axios";

function SpotGallery({ spotId }) {
  const [photos, setPhotos] = useState([]);
  const [file, setFile] = useState(null);

  useEffect(() => {
    axios.get(`/api/spots/${spotId}/gallery`).then(res => setPhotos(res.data || []));
  }, [spotId]);

  // 파일 업로드 핸들러 (로컬/테스트 버전)
  const handleUpload = async () => {
    if (!file) return;
    // TODO: 이미지 업로드 서버 연동 필요
    const imageUrl = URL.createObjectURL(file); // 임시 미리보기용, 실제는 S3/클라우드 업로드
    await axios.post(`/api/spots/${spotId}/gallery`, { imageUrl });
    setFile(null);
    axios.get(`/api/spots/${spotId}/gallery`).then(res => setPhotos(res.data || []));
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {photos.map(photo => (
          <img key={photo.id} src={photo.imageUrl} alt="" style={{ width: 110, height: 110, objectFit: "cover", borderRadius: 8, border: "1px solid #eee" }} />
        ))}
      </div>
      <input type="file" onChange={e => setFile(e.target.files[0])} style={{ marginTop: 12 }} />
      <button onClick={handleUpload} style={{ marginLeft: 10 }}>사진 업로드</button>
    </div>
  );
}
export default SpotGallery;