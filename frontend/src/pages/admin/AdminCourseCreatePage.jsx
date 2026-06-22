import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getCategories, createAdminCourse } from "../../services/courseService";

function AdminCourseCreatePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: "", description: "", price: "", category: "",
    preview_video_url: "",
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res?.data || res || []))
      .catch(() => {});
  }, []);

  const upd = (obj, setter) => (e) => setter({ ...obj, [e.target.name]: e.target.value });

  const onThumbnail = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(f.type)) {
      toast.error("Chỉ chấp nhận JPG, PNG, WEBP."); return;
    }
    if (f.size > 5 * 1024 * 1024) { toast.error("Kích thước ảnh tối đa 5MB."); return; }
    setThumbnail(f);
    setPreview(URL.createObjectURL(f));
  };

  const validate = () => {
    const errs = {};
    if (!form.title?.trim() || form.title.trim().length < 5) errs.title = "Tiêu đề phải có ít nhất 5 ký tự.";
    if (!form.description?.trim() || form.description.trim().length < 20) errs.description = "Mô tả phải có ít nhất 20 ký tự.";
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) errs.price = "Giá phải là số dương.";
    if (!form.category) errs.category = "Vui lòng chọn danh mục.";
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { toast.error(Object.values(errs)[0]); return; }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("price", form.price);
      formData.append("category", form.category);
      if (form.preview_video_url?.trim()) {
        formData.append("preview_video_url", form.preview_video_url.trim());
      }
      if (thumbnail) {
        formData.append("thumbnail", thumbnail);
      }

      const res = await createAdminCourse(formData);
      const newCourseId = res?.data?.id || res?.id;
      if (newCourseId) {
        toast.success("Tạo khóa học thành công!");
        navigate(`/admin/courses/${newCourseId}/edit`);
      } else {
        toast.success("Tạo khóa học thành công!");
        navigate("/admin/courses");
      }
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra khi tạo khóa học.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="instructor-courses-page">
      <div className="container">
        <div className="page-header">
          <h2 className="page-title">Tạo khóa học mới</h2>
          <button className="course-btn-outline" onClick={() => navigate("/admin/courses")}>
            <i className="bi bi-arrow-left me-1"></i> Quay lại
          </button>
        </div>

        <div className="course-form-content">
          <div className="course-form-card mb-4">
            <h4 className="course-form-section-title">Thông tin cơ bản</h4>
            <div className="course-form-group">
              <label className="course-form-label">Tiêu đề <span className="text-danger">*</span></label>
              <input type="text" name="title" className="course-form-input" value={form.title} onChange={upd(form, setForm)} placeholder="VD: Lập trình Python từ cơ bản đến nâng cao" maxLength={50} />
            </div>
            <div className="course-form-group">
              <label className="course-form-label">Mô tả <span className="text-danger">*</span></label>
              <textarea name="description" className="course-form-textarea" value={form.description} onChange={upd(form, setForm)} rows={4} placeholder="Mô tả chi tiết về khóa học..." />
            </div>
            <div className="course-form-row">
              <div className="course-form-group">
                <label className="course-form-label">Giá (VNĐ) <span className="text-danger">*</span></label>
                <input type="number" name="price" className="course-form-input" value={form.price} onChange={upd(form, setForm)} placeholder="VD: 499000" min="0" />
              </div>
              <div className="course-form-group">
                <label className="course-form-label">Danh mục <span className="text-danger">*</span></label>
                <select name="category" className="course-form-input" value={form.category} onChange={upd(form, setForm)}>
                  <option value="">-- Chọn --</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
            </div>
            <div className="course-form-group">
              <label className="course-form-label">URL Video giới thiệu</label>
              <input type="url" name="preview_video_url" className="course-form-input" value={form.preview_video_url} onChange={upd(form, setForm)} placeholder="https://www.youtube.com/watch?v=..." />
            </div>
            <div className="course-form-group">
              <label className="course-form-label">Ảnh bìa</label>
              <div className="course-form-upload" onClick={() => document.getElementById("thumb-input").click()}>
                <input id="thumb-input" type="file" accept=".jpg,.jpeg,.png,.webp" className="d-none" onChange={onThumbnail} />
                {preview ? <img src={preview} alt="" className="course-form-upload-preview" /> : (
                  <div className="course-form-upload-placeholder"><i className="bi bi-cloud-upload"></i><span>Nhấp để tải ảnh bìa (tối đa 5MB)</span></div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="course-form-actions">
          <button className="course-btn-outline" onClick={() => navigate("/admin/courses")}>
            <i className="bi bi-chevron-left me-1"></i> Hủy
          </button>
          <button className="course-btn-primary ms-auto" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <><span className="spinner-border spinner-border-sm me-2"></span>Đang tạo...</>
            ) : (
              <><i className="bi bi-check-lg me-1"></i> Tạo khóa học</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminCourseCreatePage;
