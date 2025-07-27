import { useState, useEffect } from "react";
import axios from "axios";

function getMasonryColumns(items, columnsCount) {
  const columns = Array.from({ length: columnsCount }, () => []);
  items.forEach((item, idx) => columns[idx % columnsCount].push(item));
  return columns;
}

function SpotGallery({ spotId }) {
  const [photos, setPhotos] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    axios.get(`/api/spots/${spotId}/gallery`).then(res => setPhotos(res.data || []));
  }, [spotId]);

  // 파일 선택 + 미리보기
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    setPreview(selected ? URL.createObjectURL(selected) : null);
    if (selected) uploadPhotoToS3(selected);
  };

  // S3 presigned URL 방식
  const uploadPhotoToS3 = async (selectedFile) => {
    setUploading(true);
    try {
      const ext = selectedFile.name.split('.').pop();
      const safeFileName = `spot_gallery/spot_${spotId}_${Date.now()}.${ext}`;
      if (!safeFileName) throw new Error("파일명이 없습니다.");

      // 1. Presign 요청
      let presignResponse;
      try {
        presignResponse = await axios.post("/api/s3/presign", {
          fileName: safeFileName,
          contentType: selectedFile.type
        });
      } catch (err) {
        alert("사진 업로드 실패: Presign URL 생성 오류");
        setUploading(false);
        setFile(null);
        setPreview(null);
        return;
      }
      const { url } = presignResponse.data;
      if (!url) throw new Error("Presign 응답에 URL 없음");

      // 2. S3 업로드
      try {
        await axios.put(url, selectedFile, {
          headers: { "Content-Type": selectedFile.type }
        });
      } catch (err) {
        alert("S3 업로드 실패: " + (err.response?.data?.message || err.message));
        setUploading(false);
        setFile(null);
        setPreview(null);
        return;
      }

      // 3. DB 등록 (반드시 /gallery/presigned)
      const publicUrl = url.split('?')[0];
      try {
        await axios.post(`/api/spots/${spotId}/gallery/presigned`, {
          imageUrl: publicUrl
        });
      } catch (err) {
        alert("DB 등록 실패: " + (err.response?.data?.message || err.message));
      }

      setFile(null);
      setPreview(null);
      axios.get(`/api/spots/${spotId}/gallery`).then(res => setPhotos(res.data || []));
    } catch (err) {
      alert("업로드 실패: " + (err.response?.data?.message || err.message));
      setFile(null);
      setPreview(null);
    }
    setUploading(false);
  };

  const columnsCount = 3;
  const displayPhotos = preview ? [{ id: "preview", imageUrl: preview, isPreview: true }, ...photos] : photos;
  const columns = getMasonryColumns(displayPhotos, columnsCount);

  const AddPhotoTile = () => (
    <label
      htmlFor="file-upload"
      style={{
        cursor: uploading ? "default" : "pointer",
        borderRadius: 12,
        background: "#f6f6fa",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        aspectRatio: "1 / 1",
        color: "#999",
        fontWeight: 600,
        fontSize: 17,
        opacity: uploading ? 0.6 : 1,
        pointerEvents: uploading ? "none" : "auto",
      }}
      className="add-photo-tile"
    >
      {uploading ? "업로드중..." : "+ 사진 추가"}
      <input
        id="file-upload"
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        disabled={uploading}
        onChange={handleFileChange}
      />
    </label>
  );

  const photoTileStyle = {
    width: "100%",
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    marginBottom: 0,
    overflow: "hidden",
    cursor: "pointer",
    background: "#f8f9fc",
    aspectRatio: "1 / 1",
  };

  return (
    <div>
      <div style={{
        display: "flex",
        gap: 8,
        padding: 0,
        margin: 0,
        maxWidth: 1200,
        marginLeft: "auto",
        marginRight: "auto",
      }}>
        {columns.map((column, colIndex) => (
          <div key={colIndex} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, maxWidth: 300 }}>
            {colIndex === 0 && <AddPhotoTile />}
            {column.map(photo =>
              <div
                key={photo.id}
                style={{
                  ...photoTileStyle,
                  opacity: photo.isPreview ? 0.6 : 1,
                  cursor: "default"
                }}
                className="photo-tile"
              >
                <img
                  src={photo.imageUrl}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 12,
                    userSelect: "none",
                    display: "block"
                  }}
                  draggable={false}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <style>{`
        .photo-tile:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 14px rgba(0,0,0,0.23);
          z-index: 1;
        }
        .add-photo-tile:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
          color: #666;
        }
      `}</style>
    </div>
  );
}

export default SpotGallery;