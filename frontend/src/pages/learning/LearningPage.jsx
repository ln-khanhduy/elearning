import React, { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useLearningCourse } from "../../hooks/learning/useLearningCourse";
import LearningLayout from "../../components/learning/LearningLayout";
import "../../style/learning/learning-page.css";

/**
 * LearningPage - Trang học tập chính.
 * Container/page chính, sử dụng useLearningCourse hook để quản lý dữ liệu.
 * Sử dụng LearningLayout để render giao diện.
 */
function LearningPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  const {
    data,
    loading,
    error,
    refetch,
    currentLessonId,
    currentLesson,
    currentChapter,
    prevLesson,
    nextLesson,
    progress,
    courseCompleted,
    certificate,
    goToLesson,
    goToPrev,
    goToNext,
    handleMarkComplete,
    handleSubmitQuiz,
    handleCompleteCourse,
  } = useLearningCourse(courseId, lessonId);

  // Dùng ref để luôn có nextLesson mới nhất trong setTimeout
  const nextLessonRef = useRef(nextLesson);
  nextLessonRef.current = nextLesson;

  // Loading state
  if (loading) {
    return (
      <div className="learning-page">
        <div className="learning-page-loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p>Đang tải nội dung khóa học...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="learning-page">
        <div className="learning-page-error">
          <i className="bi bi-exclamation-triangle"></i>
          <h3>Không thể truy cập khóa học</h3>
          <p>{error}</p>
          <div className="learning-page-error-actions">
            <button className="btn btn-primary" onClick={refetch}>
              Thử lại
            </button>
            <button className="btn btn-outline-secondary" onClick={() => navigate(`/courses/${courseId}`)}>
              Quay lại chi tiết khóa học
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No data
  if (!data) {
    return (
      <div className="learning-page">
        <div className="learning-page-error">
          <i className="bi bi-search"></i>
          <h3>Không tìm thấy nội dung</h3>
          <p>Khóa học không tồn tại hoặc bạn chưa đăng ký khóa học này.</p>
          <button className="btn btn-primary" onClick={() => navigate("/my-courses")}>
            Quay lại khóa học của tôi
          </button>
        </div>
      </div>
    );
  }

  // Kiểm tra xem user có enrolled không
  const isEnrolled = data.enrollment_id != null;

  const handleCompleteCourseWithToast = async () => {
    try {
      const result = await handleCompleteCourse();
      if (result) {
        toast.success("Hoàn thành khóa học thành công! Chứng chỉ đã được cấp.");
      } else {
        toast.error("Không thể hoàn thành khóa học.");
      }
    } catch (err) {
      toast.error(err.message || "Không thể hoàn thành khóa học.");
    }
  };

  const handleMarkCompleteWithToast = async () => {
    try {
      // Gọi API mark complete + cập nhật local state
      const success = await handleMarkComplete();
      if (!success) {
        toast.error("Không thể đánh dấu hoàn thành.");
        return;
      }

      toast.success("Đã hoàn thành bài học! ");

      // Chờ một chút để user thấy badge "Đã hoàn thành" trước khi chuyển bài
      // Dùng ref để lấy nextLesson mới nhất (sau khi state đã cập nhật)
      setTimeout(() => {
        const next = nextLessonRef.current;
        if (next) {
          goToNext();
        }
      }, 1200);
    } catch (err) {
      toast.error(err.message || "Không thể đánh dấu hoàn thành.");
    }
  };

  return (
    <div className="learning-page">
      <LearningLayout
        chapters={data.chapters}
        currentLessonId={currentLessonId}
        currentLesson={currentLesson}
        prevLesson={prevLesson}
        nextLesson={nextLesson}
        progress={progress}
        courseCompleted={courseCompleted}
        certificate={certificate}
        isEnrolled={isEnrolled}
        onSelectLesson={goToLesson}
        onPrev={goToPrev}
        onNext={goToNext}
        onMarkComplete={handleMarkCompleteWithToast}
        onSubmitQuiz={handleSubmitQuiz}
        onCompleteCourse={handleCompleteCourseWithToast}
      />
    </div>
  );
}

export default LearningPage;
