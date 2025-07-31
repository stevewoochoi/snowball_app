import { useState, useEffect } from "react";
import axios from "axios";

const COLUMN_COUNT = 3; // 3열 고정

function SpotGallery({ spotId }) {
  const [photos, setPhotos] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [detailIdx, setDetailIdx] = useState(null); // 상세 모달 idx

  // 최신순(좌상단부터) 갤러리
  useEffect(() => {
    axios.get(`/api/spots/${spotId}/gallery`).then(res => {
      setPhotos((res.data || []).slice().reverse());
    });
  }, [spotId]);

  // 삭제 (논리 삭제)
  const handleDelete = async (photoId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    await axios.patch(`/api/spots/${spotId}/gallery/${photoId}/delete`);
    setPhotos(photos => photos.filter(p => p.id !== photoId));
  };

  // 파일 선택/업로드/미리보기 (기존과 동일)
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    if (!selected) {
      setPreview(null); return;
    }
    // HEIC/HEIF는 미리보기 없이 업로드, 그 외는 미리보기
    if (!/\.(heic|heif)$/i.test(selected.name)) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target.result);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
    uploadPhotoToS3(selected);
  };

  const uploadPhotoToS3 = async (selectedFile) => {
    setUploading(true);
    try {
      const ext = selectedFile.name.split('.').pop();
      const safeFileName = `spot_gallery/spot_${spotId}_${Date.now()}.${ext}`;
      // 1. Presign 요청
      let presignResponse;
      try {
        presignResponse = await axios.post("/api/s3/presign", {
          fileName: safeFileName,
          contentType: selectedFile.type
        });
      } catch (err) {
        alert("사진 업로드 실패: Presign URL 생성 오류");
        setUploading(false); setFile(null); setPreview(null); return;
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
        setUploading(false); setFile(null); setPreview(null); return;
      }
      // 3. DB 등록
      const publicUrl = url.split('?')[0];
      try {
        await axios.post(`/api/spots/${spotId}/gallery/presigned`, { imageUrl: publicUrl });
      } catch (err) {
        alert("DB 등록 실패: " + (err.response?.data?.message || err.message));
      }
      setFile(null); setPreview(null);
      axios.get(`/api/spots/${spotId}/gallery`).then(res => {
        setPhotos((res.data || []).slice().reverse());
      });
    } catch (err) {
      alert("업로드 실패: " + (err.response?.data?.message || err.message));
      setFile(null); setPreview(null);
    }
    setUploading(false);
  };

  // 갤러리: +사진추가/미리보기/나머지
  let galleryList = [];
  galleryList.push({ id: "addPhoto", addPhoto: true });
  if (preview) galleryList.push({ id: "preview", imageUrl: preview, isPreview: true });
  galleryList = galleryList.concat(photos);

  // 3열, 위→아래로 (빈칸 채움)
  const rows = [];
  for (let i = 0; i < galleryList.length; i += COLUMN_COUNT) {
    rows.push(galleryList.slice(i, i + COLUMN_COUNT));
  }
  if (rows.length > 0 && rows[rows.length - 1].length < COLUMN_COUNT) {
    const lastRow = rows[rows.length - 1];
    while (lastRow.length < COLUMN_COUNT) lastRow.push(null);
  }

  // 타일 스타일
  const tileStyle = {
    width: "100%", aspectRatio: "1/1", borderRadius: 14, overflow: "hidden",
    background: "#f5f6fa", boxShadow: "0 1px 10px #dde3ee", marginBottom: 12,
    display: "flex", alignItems: "center", justifyContent: "center", position: "relative"
  };
  const imgStyle = {
    width: "100%", height: "100%", objectFit: "cover", userSelect: "none"
  };

  // "+사진 추가" 버튼
  const AddPhotoTile = () => (
    <label style={{
      ...tileStyle, cursor: uploading ? "default" : "pointer", color: "#bbb",
      fontWeight: 700, fontSize: 21, justifyContent: "center", opacity: uploading ? 0.6 : 1
    }}>
      {uploading ? "업로드중..." : "+ 사진 추가"}
      <input
        type="file"
        accept="image/*,.heic,.heif,.webp,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.svg"
        style={{ display: "none" }}
        disabled={uploading}
        onChange={handleFileChange}
      />
    </label>
  );

  // 상세 모달 (좌우 슬라이드)
  const DetailModal = () => {
    if (detailIdx == null) return null;
    const allPhotos = photos;
    const photo = allPhotos[detailIdx];
    return (
      <div style={{
        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
        background: "rgba(15,20,30,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <button onClick={() => setDetailIdx(null)} style={{
          position: "fixed", top: 26, right: 32, fontSize: 36, color: "#fff", background: "none", border: 0, cursor: "pointer", zIndex: 10000
        }}>×</button>
        <button onClick={() => setDetailIdx(idx => Math.max(0, idx - 1))} disabled={detailIdx <= 0} style={{
          position: "absolute", left: 26, top: "50%", transform: "translateY(-50%)", fontSize: 38, color: "#fff", background: "none", border: 0, opacity: detailIdx <= 0 ? 0.3 : 1, cursor: "pointer"
        }}>←</button>
        <button onClick={() => setDetailIdx(idx => Math.min(photos.length - 1, idx + 1))} disabled={detailIdx >= photos.length - 1} style={{
          position: "absolute", right: 26, top: "50%", transform: "translateY(-50%)", fontSize: 38, color: "#fff", background: "none", border: 0, opacity: detailIdx >= photos.length - 1 ? 0.3 : 1, cursor: "pointer"
        }}>→</button>
        <div style={{ maxWidth: "92vw", maxHeight: "88vh", background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 40px #0006" }}>
          {photo?.imageUrl && /\.(heic|heif)$/i.test(photo.imageUrl) ? (
            <div style={{ width: "400px", height: "400px", color: "#888", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18 }}>
              미리보기 불가<br />HEIC 파일
            </div>
          ) : (
            <img
              src={photo?.imageUrl}
              alt=""
              style={{ width: "100%", maxHeight: "88vh", objectFit: "contain", display: "block", background: "#222" }}
              draggable={false}
            />
          )}
        </div>
      </div>
    );
  };

  // 사진 타일 (삭제만, 클릭시 상세)
  function PhotoTile({ photo, idx }) {
    if (!photo) return <div style={{ ...tileStyle, background: "transparent", boxShadow: "none" }} />;
    if (photo.addPhoto) return <AddPhotoTile />;
    if (photo.isPreview) return (
      <div style={tileStyle}>
        <img
          src={photo.imageUrl}
          alt=""
          style={{
            ...imgStyle, opacity: 0.6, filter: "blur(1.5px)"
          }}
          draggable={false}
        />
      </div>
    );
    // HEIC/HEIF 미리보기 안내
    if (photo.imageUrl && /\.(heic|heif)$/i.test(photo.imageUrl)) {
      return (
        <div style={tileStyle}>
          <div style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#aaa", fontWeight: 700, fontSize: 16, background: "#f7f7f7", textAlign: "center"
          }}>
            미리보기 불가<br />HEIC 파일
          </div>
          {editMode && (
            <button
              onClick={() => handleDelete(photo.id)}
              style={{
                position: "absolute", top: 7, right: 7, background: "#fff", borderRadius: "50%",
                border: "2px solid #f44", color: "#f44", width: 30, height: 30, fontWeight: 900, fontSize: 17,
                boxShadow: "0 1px 5px #ddd", cursor: "pointer", zIndex: 2
              }}
            >×</button>
          )}
        </div>
      );
    }
    return (
      <div style={tileStyle}>
        <img
          src={photo.imageUrl}
          alt=""
          style={{ ...imgStyle }}
          draggable={false}
          onClick={() => setDetailIdx(idx)}
          onError={e => {
            e.target.onerror = null;
            e.target.src = "/etc/img-not-found.png";
          }}
        />
        {editMode && (
          <button
            onClick={() => handleDelete(photo.id)}
            style={{
              position: "absolute", top: 7, right: 7, background: "#fff", borderRadius: "50%",
              border: "2px solid #f44", color: "#f44", width: 30, height: 30, fontWeight: 900, fontSize: 17,
              boxShadow: "0 1px 5px #ddd", cursor: "pointer", zIndex: 2
            }}
          >×</button>
        )}
      </div>
    );
  }

  // key 고유 보장
  return (
    <div>
      {/* 편집 토글 */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
        <button
          onClick={() => setEditMode(!editMode)}
          style={{
            background: editMode ? "#1a9ad6" : "#fff", color: editMode ? "#fff" : "#333",
            border: "1.5px solid #1a9ad6", borderRadius: 8, fontWeight: 700, fontSize: 16,
            padding: "6px 16px", cursor: "pointer"
          }}
        >
          {editMode ? "완료" : "편집"}
        </button>
      </div>
      {rows.map((row, rowIdx) => (
        <div key={`row-${rowIdx}`} style={{ display: "flex", gap: 12, marginBottom: 0 }}>
          {row.map((photo, colIdx) =>
            <PhotoTile key={`photo-${photo?.id || photo?.addPhoto || photo?.isPreview ? `${rowIdx}-${colIdx}` : `empty-${rowIdx}-${colIdx}`}`} photo={photo} idx={rowIdx * COLUMN_COUNT + colIdx} />
          )}
        </div>
      ))}
      {/* 상세 모달 */}
      <DetailModal />
    </div>
  );
}

export default SpotGallery;