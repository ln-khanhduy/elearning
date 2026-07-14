import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getMyCoursesApi } from "../../api/enrollmentAPI";

function MyLearningPage() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMyCoursesApi();
        const data = res?.data || res || [];
        setEnrollments(data);
      } catch {
        toast.error("Không thể tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Lấy các khóa học đang học (có progress > 0 và < 100)
  const inProgress = enrollments
    .filter((e) => {
      const pct = Number(e.progress_percent || 0);
      return pct > 0 && pct < 100;
    })
    .sort((a, b) => new Date(b.updated_at || b.enrolled_at) - new Date(a.updated_at || a.enrolled_at));

  // Khóa học chưa bắt đầu
  const notStarted = enrollments.filter((e) => Number(e.progress_percent || 0) === 0);

  // Khóa học đã hoàn thành
  const completed = enrollments.filter((e) => Number(e.progress_percent || 0) >= 100);

  if (loading) {
    return (
      <div className="my-learning-page py-4">
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        </div>
      </div>
    );
  }

  const getProgressColor = (pct) => {
    if (pct >= 80) return "#198754";
    if (pct >= 40) return "#ffc107";
    return "#dc3545";
  };

  return (
    <div className="my-learning-page py-4">
      <div className="container">
        <h2 className="mb-4">Trung tâm học tập</h2>

        {/* Stats cards */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm text-center p-3">
              <div className="fs-3 fw-bold text-primary">{enrollments.length}</div>
              <small className="text-muted">Khóa học</small>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm text-center p-3">
              <div className="fs-3 fw-bold text-warning">{inProgress.length}</div>
              <small className="text-muted">Đang học</small>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm text-center p-3">
              <div className="fs-3 fw-bold text-success">{completed.length}</div>
              <small className="text-muted">Đã hoàn thành</small>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm text-center p-3">
              <div className="fs-3 fw-bold text-info">{notStarted.length}</div>
              <small className="text-muted">Chưa bắt đầu</small>
            </div>
          </div>
        </div>

        {/* Continue Learning */}
        {inProgress.length > 0 && (
          <div className="mb-4">
            <h5 className="mb-3">
              <i className="bi bi-play-circle text-primary me-2"></i>Tiếp tục học
            </h5>
            <div className="row g-3">
              {inProgress.slice(0, 4).map((enr) => {
                const pct = Math.round(Number(enr.progress_percent || 0));
                return (
                  <div key={enr.id} className="col-12 col-md-6">
                    <div
                      className="card border-0 shadow-sm course-continue-card"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        const lessonId = enr.last_completed_lesson?.id;
                        const url = lessonId
                          ? `/courses/${enr.course}/learn/${lessonId}`
                          : `/courses/${enr.course}/learn`;
                        navigate(url);
                      }}
                    >
                      <div className="row g-0">
                        <div className="col-4">
                          {enr.course_thumbnail ? (
                            <img
                              src={enr.course_thumbnail}
                              alt={enr.course_title}
                              className="w-100 h-100"
                              style={{ objectFit: "cover", borderRadius: "8px 0 0 8px" }}
                            />
                          ) : (
                            <div
                              className="w-100 h-100 d-flex align-items-center justify-content-center bg-light"
                              style={{ borderRadius: "8px 0 0 8px", minHeight: 120 }}
                            >
                              <i className="bi bi-play-circle fs-1 text-muted"></i>
                            </div>
                          )}
                        </div>
                        <div className="col-8">
                          <div className="card-body py-2 px-3">
                            <h6 className="mb-1 text-truncate">{enr.course_title}</h6>
                            <small className="text-muted d-block mb-2">
                              {enr.completed_lessons_count || 0}/{enr.total_lessons_count || 0} bài học
                            </small>
                            <div className="progress" style={{ height: 6 }}>
                              <div
                                className="progress-bar"
                                role="progressbar"
                                style={{ width: `${pct}%`, backgroundColor: getProgressColor(pct) }}
                              ></div>
                            </div>
                            <small className="fw-bold mt-1 d-block" style={{ color: getProgressColor(pct) }}>
                              {pct}%
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {inProgress.length > 4 && (
              <div className="text-center mt-2">
                <button className="btn btn-link" onClick={() => navigate("/my-courses")}>
                  Xem tất cả ({inProgress.length} khóa học)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Not started */}
        {notStarted.length > 0 && (
          <div className="mb-4">
            <h5 className="mb-3">
              <i className="bi bi-box-arrow-in-right text-info me-2"></i>Khóa học chưa bắt đầu
            </h5>
            <div className="row g-3">
              {notStarted.slice(0, 4).map((enr) => (
                <div key={enr.id} className="col-12 col-md-6">
                  <div
                    className="card border-0 shadow-sm course-continue-card"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/courses/${enr.course}/learn`)}
                  >
                    <div className="row g-0">
                      <div className="col-4">
                        {enr.course_thumbnail ? (
                          <img
                            src={enr.course_thumbnail}
                            alt={enr.course_title}
                            className="w-100 h-100"
                            style={{ objectFit: "cover", borderRadius: "8px 0 0 8px" }}
                          />
                        ) : (
                          <div
                            className="w-100 h-100 d-flex align-items-center justify-content-center bg-light"
                            style={{ borderRadius: "8px 0 0 8px", minHeight: 120 }}
                          >
                            <i className="bi bi-book fs-1 text-muted"></i>
                          </div>
                        )}
                      </div>
                      <div className="col-8">
                        <div className="card-body py-2 px-3">
                          <h6 className="mb-1 text-truncate">{enr.course_title}</h6>
                          <small className="text-muted d-block mb-2">{enr.instructor_name}</small>
                          <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/courses/${enr.course}/learn`); }}>
                            <i className="bi bi-play-fill me-1"></i>Bắt đầu học
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {enrollments.length === 0 && (
          <div className="text-center py-5">
            <i className="bi bi-journal-bookmark" style={{ fontSize: 48, color: "#ddd" }}></i>
            <h5 className="mt-3">Bạn chưa đăng ký khóa học nào</h5>
            <p className="text-muted">Khám phá các khóa học và bắt đầu học ngay hôm nay.</p>
            <button className="btn btn-primary" onClick={() => navigate("/courses")}>
              Khám phá khóa học
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyLearningPage;