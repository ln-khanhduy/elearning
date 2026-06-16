import React from "react";
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
    goToLesson,
    goToPrev,
    goToNext,
    handleMarkComplete,
    handleSubmitQuiz,
  } = useLearningCourse(courseId, lessonId);


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

  const handleMarkCompleteWithToast = async () => {
    try {
      await handleMarkComplete();
      toast.success("Đã đánh dấu hoàn thành bài học!");

      // Tự động chuyển sang bài tiếp theo
      if (nextLesson) {
        goToNext();
      }
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
        onSelectLesson={goToLesson}
        onPrev={goToPrev}
        onNext={goToNext}
        onMarkComplete={handleMarkCompleteWithToast}
        onSubmitQuiz={handleSubmitQuiz}
      />
    </div>
  );
}

export default LearningPage;
