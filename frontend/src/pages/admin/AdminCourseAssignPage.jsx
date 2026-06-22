import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getAdminCourseDetail,
  assignInstructor,
  getAssignedInstructor,
} from "../../services/courseService";
import { getManagedInstructorsApi } from "../../api/instructorManagerAPI";

function AdminCourseAssignPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [instructors, setInstructors] = useState([]);
  const [filteredInstructors, setFilteredInstructors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [currentInstructor, setCurrentInstructor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [courseRes, instructorRes] = await Promise.all([
          getAdminCourseDetail(courseId),
          getManagedInstructorsApi({ page_size: 100 }),
        ]);
        setCourse(courseRes?.data || courseRes);
        const instructorList = instructorRes?.data?.results || instructorRes?.data || instructorRes || [];
        setInstructors(instructorList);
        setFilteredInstructors(instructorList);
      } catch (error) {
        toast.error("Không thể tải dữ liệu.");
        navigate("/admin/courses");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [courseId, navigate]);

  useEffect(() => {
    const loadAssigned = async () => {
      try {
        const res = await getAssignedInstructor(courseId);
        const data = res?.data || res;
        if (data?.assigned_instructor_id) {
          setCurrentInstructor({
            id: data.assigned_instructor_id,
            name: data.assigned_instructor_name,
            avatar: data.assigned_instructor_avatar,
          });
          setSelectedInstructorId(data.assigned_instructor_id.toString());
        }
      } catch {
        // No assigned instructor
      }
    };
    loadAssigned();
  }, [courseId]);

  // Filter instructors when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredInstructors(instructors);
      return;
    }
    const term = searchTerm.toLowerCase().trim();
    setFilteredInstructors(
      instructors.filter(
        (inst) =>
          (inst.get_full_name || inst.username || inst.email || "")
            .toLowerCase()
            .includes(term) ||
          (inst.email || "").toLowerCase().includes(term)
      )
    );
  }, [searchTerm, instructors]);

  const handleAssign = async () => {
    if (!selectedInstructorId) {
      toast.error("Vui lòng chọn giảng viên.");
      return;
    }
    setSaving(true);
    try {
      await assignInstructor(courseId, selectedInstructorId);
      toast.success("Phân công giảng viên thành công!");
      // Reload assigned instructor
      const res = await getAssignedInstructor(courseId);
      const data = res?.data || res;
      if (data?.assigned_instructor_id) {
        setCurrentInstructor({
          id: data.assigned_instructor_id,
          name: data.assigned_instructor_name,
          avatar: data.assigned_instructor_avatar,
        });
      }
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await assignInstructor(courseId, null);
      toast.success("Đã gỡ giảng viên khỏi khóa học.");
      setCurrentInstructor(null);
      setSelectedInstructorId("");
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    } finally {
      setRemoving(false);
    }
  };

  const handleQuickSelect = (instructorId) => {
    setSelectedInstructorId(instructorId.toString());
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
      <div className="admin-courses-header">
        <div>
          <h2>Phân công giảng viên</h2>
          <p className="text-muted">
            Khóa học: <strong>{course?.title}</strong>
          </p>
        </div>
        <button className="course-btn-outline" onClick={() => navigate("/admin/courses")}>
          <i className="bi bi-arrow-left me-1"></i> Quay lại danh sách
        </button>
      </div>

      {/* Current Instructor Card */}
      {currentInstructor && (
        <div className="course-form-card mt-4">
          <h4 className="course-form-section-title">
            <i className="bi bi-person-check me-2"></i>
            Giảng viên hiện tại
          </h4>
          <div className="d-flex align-items-center gap-3 mt-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: 56,
                height: 56,
                backgroundColor: "#e9ecef",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {currentInstructor.avatar ? (
                <img
                  src={currentInstructor.avatar}
                  alt={currentInstructor.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <i className="bi bi-person-fill" style={{ fontSize: 24, color: "#6c757d" }}></i>
              )}
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-1">{currentInstructor.name || "Chưa có tên"}</h5>
              <span className="badge bg-success">Đang phụ trách</span>
            </div>
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={handleRemove}
              disabled={removing}
            >
              {removing ? (
                <span className="spinner-border spinner-border-sm"></span>
              ) : (
                <><i className="bi bi-x-lg me-1"></i>Gỡ giảng viên</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Assign Instructor Card */}
      <div className="course-form-card mt-4">
        <h4 className="course-form-section-title">
          <i className="bi bi-person-plus me-2"></i>
          {currentInstructor ? "Thay đổi giảng viên" : "Chọn giảng viên phụ trách"}
        </h4>

        {/* Search */}
        <div className="course-form-group mt-3">
          <label className="course-form-label">Tìm kiếm giảng viên</label>
          <input
            type="text"
            className="course-form-input"
            placeholder="Nhập tên hoặc email giảng viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Instructor List */}
        <div className="mt-3">
          <label className="course-form-label">
            Danh sách giảng viên ({filteredInstructors.length})
          </label>
          <div
            style={{
              maxHeight: 320,
              overflowY: "auto",
              border: "1px solid #dee2e6",
              borderRadius: 8,
            }}
          >
            {filteredInstructors.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-search" style={{ fontSize: 24 }}></i>
                <p className="mt-2">Không tìm thấy giảng viên nào</p>
              </div>
            ) : (
              filteredInstructors.map((inst) => {
                const isSelected = selectedInstructorId === inst.id.toString();
                const isCurrent =
                  currentInstructor && currentInstructor.id === inst.id;
                return (
                  <div
                    key={inst.id}
                    className={`d-flex align-items-center gap-3 px-3 py-2 ${
                      isSelected ? "bg-primary bg-opacity-10" : ""
                    } ${isCurrent ? "bg-success bg-opacity-10" : ""}`}
                    style={{
                      cursor: "pointer",
                      borderBottom: "1px solid #f0f0f0",
                      transition: "background-color 0.15s",
                    }}
                    onClick={() => handleQuickSelect(inst.id)}
                    onMouseEnter={(e) => {
                      if (!isSelected && !isCurrent)
                        e.currentTarget.style.backgroundColor = "#f8f9fa";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected && !isCurrent)
                        e.currentTarget.style.backgroundColor = "";
                    }}
                  >
                    <div
                      className="form-check"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="radio"
                        className="form-check-input"
                        name="instructor"
                        checked={isSelected}
                        onChange={() => handleQuickSelect(inst.id)}
                      />
                    </div>
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: "#e9ecef",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {inst.avatar_url ? (
                        <img
                          src={inst.avatar_url}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <i
                          className="bi bi-person-fill"
                          style={{ fontSize: 18, color: "#6c757d" }}
                        ></i>
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-medium">
                        {inst.get_full_name || inst.username || inst.email}
                        {isCurrent && (
                          <span className="badge bg-success ms-2" style={{ fontSize: 11 }}>
                            Đang phụ trách
                          </span>
                        )}
                      </div>
                      <small className="text-muted">{inst.email}</small>
                    </div>
                    {isSelected && (
                      <i className="bi bi-check-circle-fill text-primary"></i>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="course-form-actions mt-4">
          <button className="course-btn-outline" onClick={() => navigate("/admin/courses")}>
            Hủy
          </button>
          <button
            className="course-btn-primary ms-auto"
            onClick={handleAssign}
            disabled={
              saving ||
              !selectedInstructorId ||
              (currentInstructor &&
                currentInstructor.id.toString() === selectedInstructorId)
            }
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Đang lưu...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-2"></i>
                {currentInstructor ? "Xác nhận thay đổi" : "Xác nhận phân công"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminCourseAssignPage;
