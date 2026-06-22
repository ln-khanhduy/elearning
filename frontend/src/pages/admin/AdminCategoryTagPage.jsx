import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  getCategoriesApi, createCategoryApi, updateCategoryApi, deleteCategoryApi,
  getTagsApi, createTagApi, updateTagApi, deleteTagApi,
} from "../../api/courseAPI";
import ConfirmModal from "../../components/common/ConfirmModal";

function AdminCategoryTagPage() {
  const [activeTab, setActiveTab] = useState("categories");
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  // Category form
  const [catForm, setCatForm] = useState({ name: "" });
  const [editingCat, setEditingCat] = useState(null);
  const [catLoading, setCatLoading] = useState(false);

  // Tag form
  const [tagForm, setTagForm] = useState({ name: "" });
  const [editingTag, setEditingTag] = useState(null);
  const [tagLoading, setTagLoading] = useState(false);

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
      const data = await getCategoriesApi();
      setCategories(data);
    } catch {
      toast.error("Không thể tải danh mục.");
    }
  };

  const loadTags = async () => {
    try {
      const data = await getTagsApi();
      setTags(data);
    } catch {
      toast.error("Không thể tải tag.");
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadCategories(), loadTags()]).finally(() => setLoading(false));
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

  // ==================== TAG ====================
  const handleAddTag = async () => {
    if (!tagForm.name.trim()) {
      toast.error("Tên tag không được để trống.");
      return;
    }
    setTagLoading(true);
    try {
      await createTagApi(tagForm.name.trim());
      toast.success("Thêm tag thành công!");
      setTagForm({ name: "" });
      loadTags();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    } finally {
      setTagLoading(false);
    }
  };

  const handleEditTag = (tag) => {
    setEditingTag(tag.id);
    setTagForm({ name: tag.name });
  };

  const handleUpdateTag = async () => {
    if (!tagForm.name.trim()) {
      toast.error("Tên tag không được để trống.");
      return;
    }
    setTagLoading(true);
    try {
      await updateTagApi(editingTag, tagForm.name.trim());
      toast.success("Cập nhật tag thành công!");
      setEditingTag(null);
      setTagForm({ name: "" });
      loadTags();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    } finally {
      setTagLoading(false);
    }
  };

  const handleDeleteTag = async (tagId) => {
    showConfirm(
      "Xóa tag",
      "Xóa tag này?",
      async () => {
        try {
          await deleteTagApi(tagId);
          toast.success("Xóa tag thành công!");
          loadTags();
        } catch (error) {
          toast.error(error.message || "Có lỗi xảy ra.");
        }
      }
    );
  };

  const handleCancelTagEdit = () => {
    setEditingTag(null);
    setTagForm({ name: "" });
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
          <h2>Quản lý danh mục & Tag</h2>
          <p className="text-muted">Tạo, sửa, xóa danh mục và tag cho khóa học.</p>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "categories" ? "active" : ""}`}
            onClick={() => setActiveTab("categories")}
          >
            <i className="bi bi-folder me-1"></i> Danh mục
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "tags" ? "active" : ""}`}
            onClick={() => setActiveTab("tags")}
          >
            <i className="bi bi-tag me-1"></i> Tag
          </button>
        </li>
      </ul>

      {/* Categories Tab */}
      {activeTab === "categories" && (
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
      )}

      {/* Tags Tab */}
      {activeTab === "tags" && (
        <div className="course-form-card">
          <h5 className="fw-bold mb-3">
            {editingTag ? "Chỉnh sửa tag" : "Thêm tag mới"}
          </h5>
          <div className="d-flex gap-2 mb-4">
            <input
              type="text"
              className="course-form-input"
              placeholder="Tên tag (VD: python)"
              value={tagForm.name}
              onChange={(e) => setTagForm((prev) => ({ ...prev, name: e.target.value }))}
              maxLength={50}
            />
            {editingTag ? (
              <>
                <button className="course-btn-primary btn-sm" onClick={handleUpdateTag} disabled={tagLoading}>
                  {tagLoading ? "Đang lưu..." : "Cập nhật"}
                </button>
                <button className="course-btn-outline btn-sm" onClick={handleCancelTagEdit}>Hủy</button>
              </>
            ) : (
              <button className="course-btn-primary btn-sm" onClick={handleAddTag} disabled={tagLoading}>
                {tagLoading ? "Đang thêm..." : "Thêm"}
              </button>
            )}
          </div>

          {tags.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-tag" style={{ fontSize: 32 }}></i>
              <p className="mt-2">Chưa có tag nào.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên tag</th>
                  <th>Slug</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => (
                  <tr key={tag.id}>
                    <td>{tag.id}</td>
                    <td><span className="badge bg-secondary">{tag.name}</span></td>
                    <td><code>{tag.slug}</code></td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEditTag(tag)}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteTag(tag.id)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

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

export default AdminCategoryTagPage;
