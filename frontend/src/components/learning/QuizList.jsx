import React, { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { submitQuizApi } from "../../api/learningAPI";

/**
 * QuizList - Hiển thị danh sách bài tập của bài học.
 * Click "Vào làm" để mở inline quiz trong cùng trang học tập.
 */
function QuizList({ quizzes }) {
  const { courseId } = useParams();
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState({});

  const handleStartQuiz = (quizId) => {
    setActiveQuizId(quizId);
    setAnswers({});
  };

  const handleSelectOption = useCallback((questionId, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { selected_option_id: optionId } }));
  }, []);

  const handleTextAnswer = useCallback((questionId, text) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { answer_text: text } }));
  }, []);

  const handleSubmit = useCallback(async (quiz) => {
    const unanswered = quiz.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      toast.warning(`Vui lòng trả lời tất cả câu hỏi (còn ${unanswered.length} câu).`);
      return;
    }

    setSubmitting(true);
    try {
      const formattedAnswers = quiz.questions.map((q) => {
        const ans = answers[q.id] || {};
        return {
          question_id: q.id,
          selected_option_id: ans.selected_option_id || null,
          answer_text: ans.answer_text || null,
        };
      });

      const res = await submitQuizApi(courseId, quiz.id, formattedAnswers);
      if (res?.success && res?.data) {
        setResults((prev) => ({ ...prev, [quiz.id]: res.data }));
        toast.success(
          res.data.passed
            ? "Chúc mừng! Bạn đã vượt qua bài kiểm tra."
            : "Bạn chưa đạt yêu cầu. Hãy thử lại!"
        );
      }
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra khi nộp bài.");
    } finally {
      setSubmitting(false);
    }
  }, [answers, courseId]);

  const handleRetry = (quizId) => {
    setResults((prev) => {
      const next = { ...prev };
      delete next[quizId];
      return next;
    });
    setAnswers({});
  };

  const handleBack = () => {
    setActiveQuizId(null);
    setAnswers({});
  };

  return (
    <div className="quiz-list-section">
      <div className="quiz-list-divider">
        <i className="bi bi-puzzle"></i>
        <span>Bài tập</span>
      </div>

      {quizzes.length === 0 ? (
        <p className="text-muted text-center py-3">Bài học chưa có bài tập.</p>
      ) : (
        <div className="quiz-list">
          {quizzes.map((quiz) => {
            const result = results[quiz.id];

            // Đang làm bài tập này
            if (activeQuizId === quiz.id) {
              return (
                <div key={quiz.id} className="quiz-taking-inline">
                  <div className="quiz-taking-inline-header">
                    <button className="quiz-back-btn" onClick={handleBack}>
                      <i className="bi bi-arrow-left"></i> Quay lại danh sách
                    </button>
                    <h4>{quiz.title}</h4>
                    {quiz.description && <p className="quiz-taking-description">{quiz.description}</p>}
                    <div className="quiz-taking-meta">
                      <span><i className="bi bi-clock"></i> {quiz.time_limit_minutes || "Không giới hạn"} phút</span>
                      {quiz.quiz_type === "MCQ" && <span><i className="bi bi-question-circle"></i> {quiz.questions?.length || 0} câu hỏi</span>}
                      <span><i className="bi bi-tag"></i> {quiz.quiz_type === "MCQ" ? "Trắc nghiệm" : quiz.quiz_type === "ESSAY" ? "Tự luận" : "Điền khuyết"}</span>
                    </div>
                  </div>

                  {/* Kết quả */}
                  {result && (
                    <div className={`quiz-result ${result.passed ? "quiz-result--passed" : "quiz-result--failed"}`}>
                      <div className="quiz-result-icon">
                        <i className={`bi ${result.passed ? "bi-check-circle-fill" : "bi-x-circle-fill"}`}></i>
                      </div>
                      <h3>{result.passed ? "Đạt yêu cầu" : "Chưa đạt"}</h3>
                      <div className="quiz-result-score">
                        <span className="quiz-result-score-value">{result.score}</span>
                        <span className="quiz-result-score-divider">/</span>
                        <span className="quiz-result-score-max">{result.max_score}</span>
                      </div>
                      <button className="quiz-result-retry" onClick={() => handleRetry(quiz.id)}>
                        <i className="bi bi-arrow-counterclockwise"></i> Làm lại
                      </button>
                    </div>
                  )}

                  {/* Câu hỏi */}
                  {!result && (
                    <>
                      <div className="quiz-taking-questions">
                        {quiz.questions?.map((question, index) => (
                          <div key={question.id} className="quiz-question">
                            <div className="quiz-question-header">
                              <span className="quiz-question-number">Câu {index + 1}</span>
                              <span className="quiz-question-points">{question.points} điểm</span>
                            </div>
                            <p className="quiz-question-prompt">{question.prompt}</p>

                            {question.question_type === "MCQ" && (
                              <div className="quiz-question-options">
                                {question.options?.map((option) => (
                                  <label key={option.id} className={`quiz-option ${answers[question.id]?.selected_option_id === option.id ? "quiz-option--selected" : ""}`}>
                                    <input type="radio" name={`q_${question.id}`} checked={answers[question.id]?.selected_option_id === option.id} onChange={() => handleSelectOption(question.id, option.id)} />
                                    <span className="quiz-option-text">{option.text}</span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {question.question_type === "FILL_BLANK" && (
                              <div className="quiz-question-input">
                                <input type="text" className="quiz-input" placeholder="Nhập câu trả lời..." value={answers[question.id]?.answer_text || ""} onChange={(e) => handleTextAnswer(question.id, e.target.value)} />
                              </div>
                            )}

                            {question.question_type === "ESSAY" && (
                              <div className="quiz-question-input">
                                <textarea className="quiz-textarea" rows={5} placeholder="Nhập câu trả lời..." value={answers[question.id]?.answer_text || ""} onChange={(e) => handleTextAnswer(question.id, e.target.value)} />
                                <small className="text-muted mt-2 d-block"><i className="bi bi-info-circle me-1"></i>Bài tự luận sẽ được gửi đến giảng viên để chấm điểm.</small>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="quiz-taking-actions">
                        <button className="quiz-submit-btn" onClick={() => handleSubmit(quiz)} disabled={submitting}>
                          {submitting ? (
                            <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Đang nộp...</>
                          ) : (
                            <><i className="bi bi-send"></i> Nộp bài</>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            }

            // Danh sách quiz
            const attempt = quiz.latest_attempt;
            return (
              <div key={quiz.id} className="quiz-list-item">
                <div className="quiz-list-item-info">
                  <div className="quiz-list-item-icon">
                    <i className={`bi ${quiz.quiz_type === "MCQ" ? "bi-check2-square" : quiz.quiz_type === "ESSAY" ? "bi-pencil-square" : "bi-input-cursor"}`}></i>
                  </div>
                  <div className="quiz-list-item-detail">
                    <strong className="quiz-list-item-title">{quiz.title}</strong>
                    <div className="quiz-list-item-meta">
                      {quiz.quiz_type === "MCQ" && <span><i className="bi bi-question-circle"></i> {quiz.questions?.length || 0} câu</span>}
                      <span><i className="bi bi-tag"></i> {quiz.quiz_type === "MCQ" ? "Trắc nghiệm" : quiz.quiz_type === "ESSAY" ? "Tự luận" : "Điền khuyết"}</span>
                      {attempt && (
                        <span className={`quiz-list-item-score ${attempt.passed ? "text-success" : "text-danger"}`}>
                          <i className="bi bi-check-circle-fill"></i> {attempt.score}/{attempt.max_score}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button className="quiz-start-btn" onClick={() => handleStartQuiz(quiz.id)}>
                  {attempt ? "Làm lại" : "Vào làm"} <i className="bi bi-arrow-right"></i>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default QuizList;
