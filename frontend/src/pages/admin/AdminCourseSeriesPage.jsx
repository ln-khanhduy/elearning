import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  getCourseSeriesApi,
  createCourseSeriesApi,
  createCourseVersionApi,
  publishAndHideCourseApi,
} from "../../api/seriesAPI";
import { getAdminCoursesApi } from "../../api/courseAPI";

const STATUS = { DRAFT: "Nháp", PUBLISHED: "Đã xuất bản", HIDDEN: "Ẩn" };

function AdminCourseSeriesPage() {
  const [seriesList, setSeriesList] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getCourseSeriesApi();
      const data = res?.data ?? res ?? [];
      setSeriesList(Array.isArray(data) ? data : []);
    } catch {
      setSeriesList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    getAdminCoursesApi({ page_size: 200 })
      .then((r) => {
        const d = r?.data ?? r ?? {};
        setAllCourses(Array.isArray(d.items) ? d.items : []);
      })
      .catch(() => {});
  }, []);

  const act = async (fn, okMsg) => {
    setBusy(true);
    try {
      await fn();
      toast.success(okMsg);
      load();
    } catch (e) {
      toast.error(e.message || "Lỗi");
    } finally {
      setBusy(null);
    }
  };

  const handleCreateSeries = () =>
    act(() => createCourseSeriesApi(newName.trim()), "Đã tạo series.");

  const handleCreateVersion = (seriesId) => {
    if (allCourses.length === 0) return toast.info("Chưa có khóa nguồn.");
    const options = allCourses.map((c) => `"${c.id}": "${c.title}" (${STATUS[c.status] || c.status})`).join("\n");
    const input = window.prompt(`Chọn course_id khóa nguồn để clone:\n${options}`);
    if (!input) return;
    const cid = Number(input);
    if (!cid) return toast.info("course_id không hợp lệ.");
    act(() => createCourseVersionApi(seriesId, cid), "Đã tạo phiên bản mới (DRAFT).");
  };

  const handlePublishAndHide = (courseId) =>
    act(() => publishAndHideCourseApi(courseId), "Đã publish và ẩn khóa cũ trong series.");

  return (
    <div className="p-4">
      <h4 className="mb-3"><i className="bi bi-collection me-2"></i>Quản lý phiên bản khóa học</h4>

      <div className="d-flex gap-2 mb-3" style={{ maxWidth: 480 }}>
        <input
          className="form-control form-control-sm"
          placeholder="Tên series (VD: ReactJS cơ bản)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="btn btn-primary btn-sm" onClick={handleCreateSeries} disabled={busy || !newName.trim()}>
          Tạo series
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
      ) : seriesList.length === 0 ? (
        <div className="text-center py-5 text-muted">Chưa có series nào.</div>
      ) : (
        seriesList.map((s) => (
          <div key={s.id} className="card mb-3">
            <div className="card-header d-flex justify-content-between align-items-center">
              <strong>{s.name}</strong>
              <button className="btn btn-sm btn-outline-primary" disabled={busy} onClick={() => handleCreateVersion(s.id)}>
                <i className="bi bi-plus-lg me-1"></i>Tạo phiên bản mới
              </button>
            </div>
            <div className="card-body">
              {s.items.length === 0 ? (
                <small className="text-muted">Chưa có khóa trong series.</small>
              ) : (
                <table className="table table-sm table-bordered align-middle mb-0">
                  <thead className="table-light">
                    <tr><th>Phiên bản</th><th>Khóa học</th><th>Trạng thái</th><th></th></tr>
                  </thead>
                  <tbody>
                    {s.items.map((it) => (
                      <tr key={it.id}>
                        <td>{it.version}</td>
                        <td>{it.course_title}</td>
                        <td>
                          <span className={`badge ${it.status === "PUBLISHED" ? "bg-success" : it.status === "HIDDEN" ? "bg-secondary" : "bg-warning text-dark"}`}>
                            {STATUS[it.status] || it.status}
                          </span>
                        </td>
                        <td className="text-end">
                          {it.status === "DRAFT" && (
                            <button className="btn btn-sm btn-success" disabled={busy} onClick={() => handlePublishAndHide(it.course_id)}>
                              Publish & ẩn khóa cũ
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default AdminCourseSeriesPage;