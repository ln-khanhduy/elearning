import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  getCategoriesApi, createCategoryApi, updateCategoryApi, deleteCategoryApi,
} from "../../api/courseAPI";
import ConfirmModal from "../../components/common/ConfirmModal";

function AdminCategoryPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Category form
  const [catForm, setCatForm] = useState({ name: "" });
  const [editingCat, setEditingCat] = useState(null);
  const [catLoading, setCatLoading] = useState(false);

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const showConfirm = (title, message, onConfirm) => {
    setConfirmModal({ show: true, title, message, onConfirm });
  };

  const hideConfirm = () => {
    setConfirmModal((prev) => ({ ...prev, show: false }));
  };

  const loadCategories = async () => {
    try {
      const res = await getCategoriesApi();
      setCategories(res?.data || res || []);
    } catch {
      toast.error("Không thể tải danh mục.");
    }
  };

  useEffect(() => {
    setLoading(true);
    loadCategories().finally(() => setLoading(false));
  }, []);

  // ==================== CATEGORY ====================
  const handleAddCategory = async () => {
    if (!catForm.name.trim()) {
      toast.error("Tên danh mục không được để trống.");
      return;
    }
    setCatLoading(true);
    try {
      await createCategoryApi(catForm.name.trim());
      toast.success("Thêm danh mục thành công!");
      setCatForm({ name: "" });
      loadCategories();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    } finally {
      setCatLoading(false);
    }
  };

  const handleEditCategory = (cat) => {
    setEditingCat(cat.id);
    setCatForm({ name: cat.name });
  };

  const handleUpdateCategory = async () => {
    if (!catForm.name.trim()) {
      toast.error("Tên danh mục không được để trống.");
      return;
    }
    setCatLoading(true);
    try {
      await updateCategoryApi(editingCat, catForm.name.trim());
      toast.success("Cập nhật danh mục thành công!");
      setEditingCat(null);
      setCatForm({ name: "" });
      loadCategories();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    } finally {
      setCatLoading(false);
    }
  };

  const handleDeleteCategory = async (catId) => {
    showConfirm(
      "Xóa danh mục",
      "Xóa danh mục này? Các khóa học thuộc danh mục này sẽ mất danh mục.",
      async () => {
        try {
          await deleteCategoryApi(catId);
          toast.success("Xóa danh mục thành công!");
          loadCategories();
        } catch (error) {
          toast.error(error.message || "Có lỗi xảy ra.");
        }
      }
    );
  };

  const handleCancelCatEdit = () => {
    setEditingCat(null);
    setCatForm({ name: "" });
  };

  if (loading) {
    return (
      <div className="admin-courses-page">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-courses-page">
      <div className="courses-header">
        <div>
          <h2>Quản lý danh mục</h2>
          <p className="text-muted">Tạo, sửa, xóa danh mục cho khóa học.</p>
        </div>
      </div>

      <div className="course-form-card">
        <h5 className="fw-bold mb-3">
          {editingCat ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
        </h5>
        <div className="d-flex gap-2 mb-4">
          <input
            type="text"
            className="course-form-input"
            placeholder="Tên danh mục (VD: Lập trình)"
            value={catForm.name}
            onChange={(e) => setCatForm((prev) => ({ ...prev, name: e.target.value }))}
            maxLength={100}
          />
          {editingCat ? (
            <>
              <button className="course-btn-primary btn-sm" onClick={handleUpdateCategory} disabled={catLoading}>
                {catLoading ? "Đang lưu..." : "Cập nhật"}
              </button>
              <button className="course-btn-outline btn-sm" onClick={handleCancelCatEdit}>Hủy</button>
            </>
          ) : (
            <button className="course-btn-primary btn-sm" onClick={handleAddCategory} disabled={catLoading}>
              {catLoading ? "Đang thêm..." : "Thêm"}
            </button>
          )}
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <i className="bi bi-folder" style={{ fontSize: 32 }}></i>
            <p className="mt-2">Chưa có danh mục nào.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên danh mục</th>
                <th>Slug</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.id}</td>
                  <td>{cat.name}</td>
                  <td><code>{cat.slug}</code></td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEditCategory(cat)}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteCategory(cat.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        variant="danger"
        confirmLabel="Xác nhận"
        cancelLabel="Hủy"
        onConfirm={() => {
          confirmModal.onConfirm?.();
          hideConfirm();
        }}
        onCancel={hideConfirm}
      />
    </div>
  );
}

export default AdminCategoryPage;
