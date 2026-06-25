import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getInstructorCourseDetail } from "../../services/courseService";

// ==================== TAB 1: NỘI DUNG KHÓA HỌC ====================
function CourseContentTab({ courseId }) {
  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { getCurriculum } = await import("../../services/curriculumService");
        const res = await getCurriculum(courseId);
        setCurriculum(res?.data || res);
      } catch (error) {
        toast.error("Không thể tải nội dung khóa học.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (!curriculum) {
    return <p className="text-muted">Không có nội dung.</p>;
  }

  return (
    <div className="course-content-tab">
      <h5 className="mb-3">Nội dung khóa học</h5>
      {curriculum.chapters && curriculum.chapters.length > 0 ? (
        <div className="curriculum-flat-list">
          {curriculum.chapters.map((chapter, chIndex) => (
            <div className="chapter-block" key={chapter.id || chIndex}>
              <div className="chapter-block-header">
                <i className="bi bi-folder2-open text-primary me-2"></i>
                <strong>Chương {chIndex + 1}:</strong>&nbsp;{chapter.title}
              </div>
              <div className="chapter-block-body">
                {chapter.lessons && chapter.lessons.length > 0 ? (
                  <ul className="lesson-list">
                    {chapter.lessons.map((lesson, lIndex) => (
                      <li key={lesson.id || lIndex} className="lesson-item">
                        <i className={`bi ${lesson.video_url ? "bi-play-circle-fill" : "bi-file-text-fill"} text-primary me-2`}></i>
                        <span className="lesson-title">{lesson.title}</span>
                        {lesson.quizzes && lesson.quizzes.length > 0 && (
                          <span className="badge bg-warning text-dark ms-auto">
                            <i className="bi bi-puzzle me-1"></i>{lesson.quizzes.length} bài tập
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted mb-0 ps-3">Chương chưa có bài học.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted">Khóa học chưa có nội dung.</p>
      )}
    </div>
  );
}

// ==================== TAB 2: TIẾN ĐỘ HỌC VIÊN ====================
function StudentProgressTab({ courseId }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { getInstructorCourseStudents } = await import("../../services/courseService");
        const res = await getInstructorCourseStudents(courseId);
        setStudents(res?.data || res || []);
      } catch (error) {
        toast.error("Không thể tải danh sách học viên.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-4">
        <i className="bi bi-people fs-1 text-muted"></i>
        <p className="mt-2 text-muted">Khóa học chưa có học viên nào.</p>
      </div>
    );
  }

  return (
    <div className="student-progress-tab">
      <h5 className="mb-3">Tiến độ học tập của học viên ({students.length})</h5>
      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>#</th>
              <th>Học viên</th>
              <th>Email</th>
              <th>Ngày đăng ký</th>
              <th>Tiến độ</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={student.id || index}>
                <td>{index + 1}</td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    {student.avatar ? (
                      <img src={student.avatar} alt="" className="rounded-circle" width="28" height="28" style={{ objectFit: "cover" }} />
                    ) : (
                      <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white" style={{ width: 28, height: 28, fontSize: 12 }}>
                        {(student.name || student.email || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span>{student.name || "N/A"}</span>
                  </div>
                </td>
                <td>{student.email || "N/A"}</td>
                <td>{student.enrolled_at ? new Date(student.enrolled_at).toLocaleDateString("vi-VN") : "N/A"}</td>
                <td>
                  {student.progress !== undefined ? (
                    <div className="d-flex align-items-center gap-2">
                      <div className="progress flex-grow-1" style={{ height: 8 }}>
                        <div
                          className="progress-bar"
                          style={{ width: `${student.progress}%`, backgroundColor: student.progress >= 80 ? "#198754" : student.progress >= 40 ? "#ffc107" : "#dc3545" }}
                        ></div>
                      </div>
                      <small className="fw-bold">{Math.round(student.progress)}%</small>
                    </div>
                  ) : (
                    <span className="text-muted">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== TAB 3: KẾT QUẢ BÀI KIỂM TRA ====================
function QuizResultsTab({ courseId }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await import("../../api/courseAPI").then(m => m.getInstructorCourseStudentsApi(courseId));
        // We'll use the students list and then fetch quiz results
        setResults([]);
      } catch (error) {
        toast.error("Không thể tải kết quả bài kiểm tra.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-results-tab">
      <h5 className="mb-3">Kết quả bài kiểm tra</h5>
      <p className="text-muted">Tính năng đang phát triển.</p>
    </div>
  );
}

// ==================== TAB 4: CHẤM ĐIỂM TỰ LUẬN ====================
function EssayGradingTab({ courseId }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradingData, setGradingData] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await import("../../api/courseAPI").then(m =>
          import("../../api/apiClient").then(a => a.default.get(`/api/courses/instructor/${courseId}/essay-submissions/`))
        );
        setSubmissions(res.data?.data || []);
      } catch (error) {
        // API chưa có, hiển thị UI mẫu
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  const handleScoreChange = (answerId, value) => {
    setGradingData(prev => ({ ...prev, [answerId]: value }));
  };

  const handleGrade = async (answerId) => {
    try {
      const score = gradingData[answerId];
      // Tìm submission để lấy max_score thực tế
      const submission = submissions.find(s => s.answer_id === answerId);
      const maxScore = submission?.max_score || 10;
      
      if (score === undefined || score === "" || score < 0 || score > maxScore) {
        toast.warning(`Vui lòng nhập điểm hợp lệ (0 đến ${maxScore}).`);
        return;
      }
      const apiClient = (await import("../../api/apiClient")).default;
      const res = await apiClient.post(`/api/courses/instructor/${courseId}/grade-essay/`, {
        answer_id: answerId,
        score: parseFloat(score),
      });
      // Kiểm tra response từ backend
      if (res.data?.success) {
        toast.success(res.data?.message || "Chấm điểm thành công!");
        setSubmissions(prev => prev.map(s =>
          s.answer_id === answerId ? { ...s, status: "GRADED", score: parseFloat(score) } : s
        ));
        // Xóa dữ liệu điểm đã nhập
        setGradingData(prev => {
          const newData = { ...prev };
          delete newData[answerId];
          return newData;
        });
      } else {
        toast.error(res.data?.message || "Không thể chấm điểm. Vui lòng thử lại.");
      }
    } catch (error) {
      // Hiển thị lỗi chi tiết từ backend nếu có
      const errorMessage = error.response?.data?.message || error.message || "Không thể chấm điểm. Vui lòng thử lại.";
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  const pendingSubmissions = submissions.filter(s => s.status === "SUBMITTED");
  const gradedSubmissions = submissions.filter(s => s.status === "GRADED");

  return (
    <div className="essay-grading-tab">
      <h5 className="mb-3">Chấm điểm câu hỏi tự luận (Essay)</h5>

      {pendingSubmissions.length > 0 && (
        <>
          <h6 className="text-warning mb-2">
            <i className="bi bi-exclamation-triangle me-1"></i>
            Chưa chấm ({pendingSubmissions.length})
          </h6>
          {pendingSubmissions.map((sub, idx) => (
            <div key={sub.answer_id || idx} className="card mb-3 border-warning">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <strong>{sub.student_name || "Học viên"}</strong>
                    <span className="text-muted ms-2 small">{sub.quiz_title || ""}</span>
                  </div>
                  <span className="badge bg-warning text-dark">Chờ chấm</span>
                </div>
                <p className="mb-1"><strong>Câu hỏi:</strong> {sub.question_prompt || ""}</p>
                <p className="mb-2"><strong>Câu trả lời:</strong></p>
                <div className="bg-light p-3 rounded mb-2" style={{ whiteSpace: "pre-wrap" }}>
                  {sub.answer_text || "Không có câu trả lời"}
                </div>
                <div className="d-flex align-items-center gap-2">
                  <label className="fw-bold">Điểm:</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    style={{ width: 100 }}
                    min="0"
                    max={sub.max_score || 10}
                    step="0.5"
                    value={gradingData[sub.answer_id] ?? ""}
                    onChange={(e) => handleScoreChange(sub.answer_id, e.target.value)}
                    placeholder={`0-${sub.max_score || 10}`}
                  />
                  <span className="text-muted small">/ {sub.max_score || 10}</span>
                  <button
                    className="course-action-btn btn-submit"
                    onClick={() => handleGrade(sub.answer_id)}
                  >
                    <i className="bi bi-check-lg me-1"></i>Chấm điểm
                  </button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {gradedSubmissions.length > 0 && (
        <>
          <h6 className="text-success mb-2 mt-4">
            <i className="bi bi-check-circle me-1"></i>
            Đã chấm ({gradedSubmissions.length})
          </h6>
          {gradedSubmissions.map((sub, idx) => (
            <div key={sub.answer_id || idx} className="card mb-3 border-success">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <strong>{sub.student_name || "Học viên"}</strong>
                    <span className="text-muted ms-2 small">{sub.quiz_title || ""}</span>
                  </div>
                  <span className="badge bg-success">Đã chấm: {sub.score}/{sub.max_score || 10}</span>
                </div>
                <p className="mb-1"><strong>Câu hỏi:</strong> {sub.question_prompt || ""}</p>
                <p className="mb-2"><strong>Câu trả lời:</strong></p>
                <div className="bg-light p-3 rounded" style={{ whiteSpace: "pre-wrap" }}>
                  {sub.answer_text || "Không có câu trả lời"}
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {submissions.length === 0 && (
        <div className="text-center py-4">
          <i className="bi bi-pencil-square fs-1 text-muted"></i>
          <p className="mt-2 text-muted">Chưa có bài tự luận nào cần chấm.</p>
        </div>
      )}
    </div>
  );
}

// ==================== TAB 5: GỬI THÔNG BÁO ====================
function SendNotificationTab({ courseId }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim()) {
      toast.warning("Vui lòng nhập tiêu đề thông báo.");
      return;
    }
    if (!body.trim()) {
      toast.warning("Vui lòng nhập nội dung thông báo.");
      return;
    }
    setSending(true);
    try {
      const apiClient = (await import("../../api/apiClient")).default;
      await apiClient.post(`/api/courses/instructor/${courseId}/send-notification/`, {
        title: title.trim(),
        body: body.trim(),
      });
      toast.success("Gửi thông báo thành công!");
      setTitle("");
      setBody("");
    } catch (error) {
      toast.error("Không thể gửi thông báo.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="send-notification-tab">
      <h5 className="mb-3">Gửi thông báo tới học viên</h5>
      <div className="card">
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label fw-bold">Tiêu đề</label>
            <input
              type="text"
              className="form-control"
              placeholder="VD: Thông báo lịch học tuần này"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold">Nội dung</label>
            <textarea
              className="form-control"
              rows="5"
              placeholder="Nhập nội dung thông báo..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            ></textarea>
          </div>
          <button
            className="course-action-btn btn-publish"
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                Đang gửi...
              </>
            ) : (
              <>
                <i className="bi bi-send me-1"></i>Gửi thông báo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== TAB 6: Q&A / THẢO LUẬN ====================
function QATab({ courseId }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});
  const [sendingReply, setSendingReply] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const apiClient = (await import("../../api/apiClient")).default;
        const res = await apiClient.get(`/api/courses/instructor/${courseId}/qa/`);
        setQuestions(res.data?.data || []);
      } catch (error) {
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  const handleReply = async (questionId) => {
    const reply = replyText[questionId];
    if (!reply || !reply.trim()) {
      toast.warning("Vui lòng nhập câu trả lời.");
      return;
    }
    setSendingReply(prev => ({ ...prev, [questionId]: true }));
    try {
      const apiClient = (await import("../../api/apiClient")).default;
      await apiClient.post(`/api/courses/instructor/${courseId}/qa/${questionId}/reply/`, {
        content: reply.trim(),
      });
      toast.success("Đã trả lời câu hỏi!");
      setReplyText(prev => ({ ...prev, [questionId]: "" }));
      // Refresh
      const res = await apiClient.get(`/api/courses/instructor/${courseId}/qa/`);
      setQuestions(res.data?.data || []);
    } catch (error) {
      toast.error("Không thể gửi câu trả lời.");
    } finally {
      setSendingReply(prev => ({ ...prev, [questionId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="qa-tab">
      <h5 className="mb-3">Hỏi & Đáp / Thảo luận</h5>

      {questions.length === 0 ? (
        <div className="text-center py-4">
          <i className="bi bi-chat-dots fs-1 text-muted"></i>
          <p className="mt-2 text-muted">Chưa có câu hỏi nào từ học viên.</p>
        </div>
      ) : (
        questions.map((q, idx) => (
          <div key={q.id || idx} className="card mb-3">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <strong>{q.student_name || "Học viên"}</strong>
                  <span className="text-muted ms-2 small">{q.created_at ? new Date(q.created_at).toLocaleDateString("vi-VN") : ""}</span>
                </div>
                {q.lesson_title && <span className="badge bg-info">{q.lesson_title}</span>}
              </div>
              <p className="mb-2">{q.content}</p>

              {q.replies && q.replies.length > 0 && (
                <div className="ms-4 mt-2 p-3 bg-light rounded">
                  {q.replies.map((r, rIdx) => (
                    <div key={r.id || rIdx} className="mb-2">
                      <strong className="text-primary">{r.instructor_name || "Giảng viên"}:</strong>
                      <p className="mb-0">{r.content}</p>
                      <small className="text-muted">{r.created_at ? new Date(r.created_at).toLocaleDateString("vi-VN") : ""}</small>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-2 d-flex gap-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Nhập câu trả lời..."
                  value={replyText[q.id] || ""}
                  onChange={(e) => setReplyText(prev => ({ ...prev, [q.id]: e.target.value }))}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleReply(q.id)}
                  disabled={sendingReply[q.id]}
                >
                  {sendingReply[q.id] ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    <i className="bi bi-send"></i>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ==================== TAB 7: BÁO CÁO HỌC TẬP ====================
function LearningReportTab({ courseId }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const apiClient = (await import("../../api/apiClient")).default;
        const res = await apiClient.get(`/api/courses/instructor/${courseId}/learning-report/`);
        setReport(res.data?.data || {});
      } catch (error) {
        setReport({});
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="learning-report-tab">
      <h5 className="mb-3">Báo cáo học tập của lớp</h5>
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card text-center p-3">
            <h3 className="text-primary mb-0">{report.total_students || 0}</h3>
            <small className="text-muted">Tổng học viên</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center p-3">
            <h3 className="text-success mb-0">{report.average_progress || 0}%</h3>
            <small className="text-muted">Tiến độ trung bình</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center p-3">
            <h3 className="text-warning mb-0">{report.completion_rate || 0}%</h3>
            <small className="text-muted">Tỷ lệ hoàn thành</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center p-3">
            <h3 className="text-info mb-0">{report.average_score || 0}</h3>
            <small className="text-muted">Điểm TB bài kiểm tra</small>
          </div>
        </div>
      </div>

      {report.recent_enrollments && report.recent_enrollments.length > 0 && (
        <>
          <h6 className="mb-2">Đăng ký gần đây</h6>
          <div className="table-responsive">
            <table className="table table-sm">
              <thead className="table-light">
                <tr>
                  <th>Học viên</th>
                  <th>Ngày đăng ký</th>
                  <th>Tiến độ</th>
                </tr>
              </thead>
              <tbody>
                {report.recent_enrollments.map((e, idx) => (
                  <tr key={e.id || idx}>
                    <td>{e.student_name || "N/A"}</td>
                    <td>{e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString("vi-VN") : "N/A"}</td>
                    <td>{e.progress !== undefined ? `${Math.round(e.progress)}%` : "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ==================== MAIN PAGE ====================
const TABS = [
  { key: "content", label: "Nội dung khóa học", icon: "bi-book" },
  { key: "progress", label: "Tiến độ học viên", icon: "bi-graph-up" },
  { key: "quiz-results", label: "Kết quả bài kiểm tra", icon: "bi-check2-square" },
  { key: "essay", label: "Chấm điểm tự luận", icon: "bi-pencil-square" },
  { key: "notification", label: "Gửi thông báo", icon: "bi-bell" },
  { key: "qa", label: "Hỏi & Đáp", icon: "bi-chat-dots" },
  { key: "report", label: "Báo cáo học tập", icon: "bi-bar-chart" },
];

function InstructorCourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("content");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getInstructorCourseDetail(courseId);
        setCourse(res?.data || res);
      } catch (error) {
        toast.error("Không thể tải thông tin khóa học.");
        navigate("/instructor/courses");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, navigate]);

  if (loading) {
    return (
      <div className="instructor-courses-page">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!course) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case "content":
        return <CourseContentTab courseId={courseId} />;
      case "progress":
        return <StudentProgressTab courseId={courseId} />;
      case "quiz-results":
        return <QuizResultsTab courseId={courseId} />;
      case "essay":
        return <EssayGradingTab courseId={courseId} />;
      case "notification":
        return <SendNotificationTab courseId={courseId} />;
      case "qa":
        return <QATab courseId={courseId} />;
      case "report":
        return <LearningReportTab courseId={courseId} />;
      default:
        return <CourseContentTab courseId={courseId} />;
    }
  };

  return (
    <div className="instructor-courses-page">
      {/* Header */}
      <div className="courses-header">
        <div>
          <h2>{course.title}</h2>
          <p className="text-muted">
            <span className={`badge bg-${course.status === "PUBLISHED" ? "success" : course.status === "DRAFT" ? "secondary" : "warning"} me-2`}>
              {course.status === "PUBLISHED" ? "Đã đăng" : course.status === "DRAFT" ? "Bản nháp" : "Đã ẩn"}
            </span>
            {course.category?.name && <span className="me-2"><i className="bi bi-folder me-1"></i>{course.category.name}</span>}
            {course.price !== undefined && <span><i className="bi bi-currency-dollar me-1"></i>{Number(course.price).toLocaleString("vi-VN")}đ</span>}
          </p>
        </div>
        <button className="course-btn-outline" onClick={() => navigate("/instructor/courses")}>
          <i className="bi bi-arrow-left me-1"></i> Quay lại
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <ul className="nav nav-tabs nav-tabs-instructor flex-wrap">
          {TABS.map((tab) => (
            <li className="nav-item" key={tab.key}>
              <button
                className={`nav-link ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <i className={`bi ${tab.icon} me-1`}></i>
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Tab Content */}
      <div className="tab-content-instructor">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default InstructorCourseDetailPage;
