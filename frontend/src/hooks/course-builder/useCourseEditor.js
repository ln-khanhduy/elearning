import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCourseDetail,
  updateCourse,
  getCategories,
} from "../../services/courseService";

export default function useCourseEditor(courseId) {
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: "", description: "", price: "", category: "",
    preview_video_url: "",
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const loadCourse = useCallback(async () => {
    if (!courseId) {
      setLoading(false);
      return;
    }
    try {
      const res = await getCourseDetail(courseId);
      const data = res?.data || res;
      setCourse(data);
      setFormData({
        title: data.title || "",
        description: data.description || "",
        price: data.price || "",
        category: data.category?.id ?? data.category ?? "",
        preview_video_url: data.preview_video_url || "",
      });
      setThumbnailPreview(data.thumbnail_url || "");
    } catch {
      toast.error("Không thể tải thông tin khóa học.");
      navigate("/instructor/courses");
    } finally {
      setLoading(false);
    }
  }, [courseId, navigate]);

  useEffect(() => {
    loadCourse();
    const fetchMeta = async () => {
      try {
        const cats = await getCategories();
        setCategories(cats?.data || cats || []);
      } catch {
        // ignore
      }
    };
    fetchMeta();
  }, [loadCourse]);

  const validateCourse = () => {
    const errs = {};
    if (!formData.title?.trim()) errs.title = "Tiêu đề không được để trống.";
    if (!formData.description?.trim()) errs.description = "Mô tả không được để trống.";
    if (!formData.price || isNaN(formData.price) || Number(formData.price) < 0)
      errs.price = "Giá phải là số >= 0.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCourseChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Chỉ chấp nhận file ảnh JPG, PNG, WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh bìa tối đa 5MB.");
      return;
    }
    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!validateCourse()) return;
    setSaving(true);
    try {
      const form = new FormData();
      form.append("title", formData.title.trim());
      form.append("description", formData.description.trim());
      form.append("price", formData.price);
      if (formData.category) form.append("category", formData.category);
      if (formData.preview_video_url) form.append("preview_video_url", formData.preview_video_url.trim());
      if (thumbnail) form.append("thumbnail", thumbnail);
      const result = await updateCourse(courseId, form);
      const updatedData = result?.data || result;
      if (updatedData) {
        setCourse(updatedData);
        setFormData({
          title: updatedData.title || "",
          description: updatedData.description || "",
          price: updatedData.price || "",
          category: updatedData.category?.id ?? updatedData.category ?? "",
          preview_video_url: updatedData.preview_video_url || "",
        });
        setThumbnailPreview(updatedData.thumbnail_url || "");
        setThumbnail(null);
      } else {
        // Fallback: reload from server if response has no data
        loadCourse();
      }
      toast.success(result?.message || "Cập nhật khóa học thành công!");
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    } finally {
      setSaving(false);
    }
  };

  return {
    course,
    categories,
    formData,
    thumbnail,
    thumbnailPreview,
    loading,
    saving,
    errors,
    handleCourseChange,
    handleThumbnailChange,
    handleSaveCourse,
    refetch: loadCourse,
  };
}
