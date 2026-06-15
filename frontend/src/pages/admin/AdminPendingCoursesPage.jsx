import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  getPendingCourses,
  approveCourse,
  rejectCourse,
} from "../../services/courseService";
import { getCurriculum } from "../../services/curriculumService";

// Helper: trích xuất YouTube Video ID từ URL
const getYoutubeEmbedUrl = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
};

function AdminPendingCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, courseId: null });
  const [rejectNote, setRejectNote] = useState("");
  const [reviewModal, setReviewModal] = useState({ open: false, course: null, curriculum: null, loading: false });
  const [confirmModal, setConfirmModal] = useState({ open: false, courseId: null });

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPendingCourses();
      setCourses(data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách khóa học chờ duyệt.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleApprove = async (courseId) => {
    try {
      setActionLoading(`approve-${courseId}`);
      await approveCourse(courseId);
      toast.success("Duyệt khóa học thành công!");
      setConfirmModal({ open: false, courseId: null });
      loadCourses();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectNote.trim()) {
      toast.error("Vui lòng nhập lý do từ chối.");
      return;
    }
    try {
      setActionLoading(`reject-${rejectModal.courseId}`);
      await rejectCourse(rejectModal.courseId, rejectNote.trim());
      toast.success("Đã từ chối khóa học.");
      setRejectModal({ open: false, courseId: null });
      setRejectNote("");
      loadCourses();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReview = async (course) => {
    setReviewModal({ open: true, course, curriculum: null, loading: true });
    try {
      const res = await getCurriculum(course.id);
      // res = { success: true, data: { id, title, chapters: [...] } }
      const curriculum = res?.data || res;
      setReviewModal(prev => ({ ...prev, curriculum, loading: false }));
    } catch (error) {
      toast.error("Không thể tải nội dung khóa học.");
      setReviewModal(prev => ({ ...prev, loading: false }));
    }
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
          <h2>Khóa học chờ duyệt</h2>
          <p className="text-muted">Duyệt hoặc từ chối các khóa học do giảng viên gửi lên.</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="admin-courses-empty">
          <i className="bi bi-check2-all"></i>
          <h4>Không có khóa học nào chờ duyệt</h4>
          <p>Tất cả khóa học đã được xử lý.</p>
        </div>
      ) : (
        <div className="admin-courses-table-wrapper">
          <table className="admin-courses-table">
            <thead>
              <tr>
                <th>Khóa học</th>
                <th>Giảng viên</th>
                <th>Giá</th>
                <th>Ngày gửi</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <div className="admin-course-info">
                      <div className="admin-course-thumb">
                        {course.thumbnail_url ? (
                          <img src={course.thumbnail_url} alt={course.title} />
                        ) : (
                          <div className="admin-course-thumb-placeholder">
                            <i className="bi bi-image"></i>
                          </div>
                        )}
                      </div>
                      <div>
                        <strong>{course.title}</strong>
                        <small className="d-block text-muted">
                          {course.description?.substring(0, 80)}...
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>{course.instructor_name}</td>
                  <td>{Number(course.price).toLocaleString("vi-VN")}đ</td>
                  <td>{new Date(course.created_at).toLocaleDateString("vi-VN")}</td>
                  <td>
                    <div className="admin-course-actions">
                      <button
                        className="admin-btn-view"
                        onClick={() => handleReview(course)}
                      >
                        <i className="bi bi-eye"></i> Xem
                      </button>
                      <button
                        className="admin-btn-approve"
                        onClick={() => setConfirmModal({ open: true, courseId: course.id })}
                        disabled={actionLoading === `approve-${course.id}`}
                      >
                        {actionLoading === `approve-${course.id}` ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                          <><i className="bi bi-check-lg"></i> Duyệt</>
                        )}
                      </button>
                      <button
                        className="admin-btn-reject"
                        onClick={() => setRejectModal({ open: true, courseId: course.id })}
                        disabled={actionLoading === `reject-${course.id}`}
                      >
                        <i className="bi bi-x-lg"></i> Từ chối
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.open && (
        <div className="admin-modal-overlay" onClick={() => setReviewModal({ open: false, course: null, curriculum: null, loading: false })}>
          <div className="admin-modal admin-review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h5>Xem chi tiết khóa học</h5>
              <button className="admin-modal-close" onClick={() => setReviewModal({ open: false, course: null, curriculum: null, loading: false })}>
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="admin-modal-body">
              {reviewModal.loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                  </div>
                  <p className="mt-2 text-muted">Đang tải nội dung khóa học...</p>
                </div>
              ) : reviewModal.curriculum ? (
                <div className="review-course-content">
                  {/* Course Info */}
                  <div className="review-section">
                    <h6 className="review-section-title">
                      <i className="bi bi-info-circle me-2"></i>Thông tin khóa học
                    </h6>
                    <div className="review-course-info">
                      <p><strong>Tên khóa học:</strong> {reviewModal.curriculum.title}</p>
                      <p><strong>Mô tả:</strong> {reviewModal.curriculum.description || "Không có mô tả"}</p>
                      <p><strong>Giá:</strong> {Number(reviewModal.curriculum.price || 0).toLocaleString("vi-VN")}đ</p>
                      {reviewModal.curriculum.preview_video_url && (() => {
                        const embedUrl = getYoutubeEmbedUrl(reviewModal.curriculum.preview_video_url);
                        return embedUrl ? (
                          <div className="review-video-wrapper">
                            <p><strong>Video giới thiệu:</strong></p>
                            <div className="review-video-container">
                              <iframe
                                src={embedUrl}
                                title="Video giới thiệu khóa học"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              ></iframe>
                            </div>
                          </div>
                        ) : (
                          <p>
                            <strong>Video giới thiệu:</strong>
                            <a href={reviewModal.curriculum.preview_video_url} target="_blank" rel="noopener noreferrer" className="ms-2">
                              Xem video <i className="bi bi-box-arrow-up-right"></i>
                            </a>
                          </p>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Chapters & Lessons */}
                  <div className="review-section">
                    <h6 className="review-section-title">
                      <i className="bi bi-list-ul me-2"></i>Chương trình học
                    </h6>
                    {(!reviewModal.curriculum.chapters || reviewModal.curriculum.chapters.length === 0) ? (
                      <p className="text-muted">Chưa có chương học nào.</p>
                    ) : (
                      <div className="review-chapters">
                        {reviewModal.curriculum.chapters.map((chapter, ci) => (
                          <div key={chapter.id || ci} className="review-chapter">
                            <div className="review-chapter-header">
                              <i className="bi bi-bookmark-fill me-2"></i>
                              <strong>Chương {chapter.order}: {chapter.title}</strong>
                            </div>
                            {chapter.description && (
                              <p className="review-chapter-desc text-muted">{chapter.description}</p>
                            )}
                            {chapter.lessons && chapter.lessons.length > 0 && (
                              <div className="review-lessons">
                                {chapter.lessons.map((lesson, li) => (
                                  <div key={lesson.id || li} className="review-lesson">
                                    <div className="review-lesson-header">
                                      <i className="bi bi-play-circle me-2"></i>
                                      <span>Bài {lesson.order}: {lesson.title}</span>
                                      <span className={`review-badge ${lesson.content_type === 'VIDEO' ? 'badge-video' : 'badge-document'}`}>
                                        {lesson.content_type === 'VIDEO' ? 'Video' : 'Tài liệu'}
                                      </span>
                                      {lesson.is_free && <span className="review-badge badge-free">Miễn phí</span>}
                                    </div>
                                    {lesson.content_type === 'VIDEO' && lesson.video_url && (() => {
                                      const embedUrl = getYoutubeEmbedUrl(lesson.video_url);
                                      return embedUrl ? (
                                        <div className="review-video-container review-lesson-video">
                                          <iframe
                                            src={embedUrl}
                                            title={lesson.title}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                          ></iframe>
                                        </div>
                                      ) : (
                                        <p className="review-lesson-desc">
                                          <a href={lesson.video_url} target="_blank" rel="noopener noreferrer">
                                            Xem video <i className="bi bi-box-arrow-up-right"></i>
                                          </a>
                                        </p>
                                      );
                                    })()}
                                    {lesson.description && (
                                      <p className="review-lesson-desc text-muted">{lesson.description}</p>
                                    )}
                                    {lesson.quizzes && lesson.quizzes.length > 0 && (
                                      <div className="review-quizzes">
                                        {lesson.quizzes.map((quiz, qi) => (
                                          <div key={quiz.id || qi} className="review-quiz">
                                            <div className="review-quiz-header">
                                              <i className="bi bi-puzzle me-2"></i>
                                              <span>Quiz: {quiz.title}</span>
                                              {quiz.time_limit_minutes && (
                                                <span className="review-badge badge-time">{quiz.time_limit_minutes} phút</span>
                                              )}
                                              <span className="review-badge badge-pass">Điểm đạt: {quiz.passing_score || 0}</span>
                                            </div>
                                            {quiz.questions && quiz.questions.length > 0 && (
                                              <div className="review-questions">
                                                {quiz.questions.map((question, qi2) => (
                                                  <div key={question.id || qi2} className="review-question">
                                                    <div className="review-question-header">
                                                      <i className="bi bi-question-circle me-2"></i>
                                                      <span>Câu {question.order || qi2 + 1}: {question.prompt}</span>
                                                      <span className="review-badge badge-point">{question.points || 1} điểm</span>
                                                    </div>
                                                    {question.options && question.options.length > 0 && (
                                                      <div className="review-options">
                                                        {question.options.map((opt, oi) => (
                                                          <div key={oi} className={`review-option ${opt.is_correct ? 'option-correct' : ''}`}>
                                                            <span className="option-key">{String.fromCharCode(65 + oi)}.</span>
                                                            <span>{opt.text || opt.content || opt.label || `Lựa chọn ${oi + 1}`}</span>
                                                            {opt.is_correct && <i className="bi bi-check-circle-fill ms-1 text-success"></i>}
                                                          </div>
                                                        ))}
                                                      </div>
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted text-center py-3">Không thể tải nội dung khóa học.</p>
              )}
            </div>
            <div className="admin-modal-footer">
              <button className="course-btn-outline" onClick={() => setReviewModal({ open: false, course: null, curriculum: null, loading: false })}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Approve Modal */}
      {confirmModal.open && (
        <div className="admin-modal-overlay" onClick={() => setConfirmModal({ open: false, courseId: null })}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h5>Xác nhận duyệt khóa học</h5>
              <button className="admin-modal-close" onClick={() => setConfirmModal({ open: false, courseId: null })}>
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="admin-modal-body">
              <p>Bạn có chắc chắn muốn duyệt khóa học này?</p>
            </div>
            <div className="admin-modal-footer">
              <button className="course-btn-outline" onClick={() => setConfirmModal({ open: false, courseId: null })}>
                Hủy
              </button>
              <button className="admin-btn-approve" onClick={() => handleApprove(confirmModal.courseId)}>
                Xác nhận duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="admin-modal-overlay" onClick={() => setRejectModal({ open: false, courseId: null })}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h5>Từ chối khóa học</h5>
              <button className="admin-modal-close" onClick={() => setRejectModal({ open: false, courseId: null })}>
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="course-form-group">
                <label className="course-form-label">
                  Lý do từ chối <span className="text-danger">*</span>
                </label>
                <textarea
                  className="course-form-textarea"
                  rows={4}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Nhập lý do từ chối khóa học..."
                  maxLength={500}
                />
                <small className="text-muted">{rejectNote.length}/500</small>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="course-btn-outline" onClick={() => setRejectModal({ open: false, courseId: null })}>
                Hủy
              </button>
              <button className="admin-btn-reject" onClick={handleReject} disabled={!rejectNote.trim()}>
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPendingCoursesPage;