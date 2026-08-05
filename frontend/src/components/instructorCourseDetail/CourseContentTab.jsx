import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../api/apiClient";

function CourseContentTab({ courseId }) {
  const navigate = useNavigate();
  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get(`/api/courses/${courseId}/curriculum/preview/`);
        setCurriculum(res.data?.data || res.data || res);
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
      <p className="text-muted small mb-3">
        <i className="bi bi-info-circle me-1"></i>Click vào bài học để xem chi tiết.
      </p>
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
                      <li
                        key={lesson.id || lIndex}
                        className="lesson-item"
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/courses/${courseId}/learn`)}
                      >
                        <i className={`bi ${lesson.content_type === "VIDEO" ? "bi-play-circle-fill" : "bi-file-text-fill"} text-primary me-2`}></i>
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

export default CourseContentTab;