import React from "react";
import VideoLesson from "./VideoLesson";
import DocumentLesson from "./DocumentLesson";
import QuizLesson from "./QuizLesson";

/**
 * LearningContent - Khu vực hiển thị nội dung bài học chính.
 * Tự động chọn component phù hợp dựa trên content_type.
 * Nếu bài học có quiz, hiển thị quiz bên dưới.
 */
function LearningContent({ lesson, onSubmitQuiz }) {
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

      {/* Render quizzes if any */}
      {lesson.quizzes?.length > 0 && (
        <div className="learning-content-quizzes">
          <div className="learning-content-quizzes-divider">
            <span>Bài kiểm tra</span>
          </div>
          {lesson.quizzes.map((quiz) => (
            <QuizLesson key={quiz.id} quiz={quiz} onSubmitQuiz={onSubmitQuiz} />
          ))}
        </div>
      )}
    </div>
  );
}

export default LearningContent;
