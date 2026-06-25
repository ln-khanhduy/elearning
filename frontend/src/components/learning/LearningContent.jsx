import React from "react";
import VideoLesson from "./VideoLesson";
import DocumentLesson from "./DocumentLesson";
import QuizList from "./QuizList";

/**
 * LearningContent - Khu vực hiển thị nội dung bài học chính.
 * Tự động chọn component phù hợp dựa trên content_type.
 * Bài tập (quiz) được hiển thị dưới dạng danh sách với nút "Vào làm"
 * chuyển đến trang làm bài riêng biệt.
 */
function LearningContent({ lesson }) {
  if (!lesson) {
    return (
      <div className="learning-content-empty">
        <i className="bi bi-book"></i>
        <h3>Chọn một bài học để bắt đầu</h3>
        <p>Chọn bài học từ sidebar bên trái để xem nội dung.</p>
      </div>
    );
  }

  return (
    <div className="learning-content">
      {/* Render content based on type */}
      {lesson.content_type === "VIDEO" && <VideoLesson lesson={lesson} />}
      {lesson.content_type === "DOCUMENT" && <DocumentLesson lesson={lesson} />}

      {/* Render quizzes as a list with "Vào làm" buttons */}
      {lesson.quizzes?.length > 0 && (
        <QuizList quizzes={lesson.quizzes} />
      )}
    </div>
  );
}

export default LearningContent;
