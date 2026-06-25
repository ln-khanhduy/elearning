import React, { useState, useCallback } from "react";
import { toast } from "react-toastify";

/**
 * QuizLesson - Hiển thị bài kiểm tra (quiz).
 * Hỗ trợ MCQ, FILL_BLANK, ESSAY.
 * Cho phép nộp bài và xem kết quả.
 */
function QuizLesson({ quiz, onSubmitQuiz }) {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Kiểm tra nếu quiz tự luận đã được nộp trước đó
  const isEssay = quiz?.quiz_type === "ESSAY" || quiz?.questions?.some(q => q.question_type === "ESSAY");
  const hasExistingAttempt = quiz?.latest_attempt?.status === "SUBMITTED" || quiz?.latest_attempt?.status === "GRADED";

  // Nếu là essay và đã có attempt trước đó, hiển thị kết quả luôn
  const initialResult = (isEssay && hasExistingAttempt && quiz?.latest_attempt) ? {
    score: quiz.latest_attempt.score,
    max_score: quiz.latest_attempt.max_score,
    passed: quiz.latest_attempt.passed,
    status: quiz.latest_attempt.status,
  } : null;

  const handleSelectOption = useCallback((questionId, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { selected_option_id: optionId } }));
  }, []);

  const handleTextAnswer = useCallback((questionId, text) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { answer_text: text } }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!onSubmitQuiz) return;

    // Kiểm tra đã trả lời hết câu hỏi chưa
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

      const res = await onSubmitQuiz(quiz.id, formattedAnswers);
      if (res) {
        setResult(res);
        toast.success(
          res.passed ? "Chúc mừng! Bạn đã vượt qua bài kiểm tra." : "Bạn chưa đạt yêu cầu. Hãy thử lại!"
        );
      }
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra khi nộp bài.");
    } finally {
      setSubmitting(false);
    }
  }, [answers, quiz, onSubmitQuiz]);

  if (!quiz) return null;

  // Nếu đã có kết quả (vừa nộp hoặc đã nộp trước đó), hiển thị kết quả
  const displayResult = result || initialResult;
  if (displayResult) {
    return (
      <div className="quiz-lesson">
        <div className="quiz-lesson-header">
          <h2 className="quiz-lesson-title">{quiz.title}</h2>
          {quiz.description && <p className="quiz-lesson-description">{quiz.description}</p>}
        </div>

        <div className={`quiz-result ${displayResult.passed ? "quiz-result--passed" : "quiz-result--failed"}`}>
          <div className="quiz-result-icon">
            <i className={`bi ${displayResult.passed ? "bi-check-circle-fill" : "bi-x-circle-fill"}`}></i>
          </div>
          <h3>{displayResult.passed ? "Đạt yêu cầu" : "Chưa đạt"}</h3>
          <div className="quiz-result-score">
            <span className="quiz-result-score-value">{displayResult.score}</span>
            <span className="quiz-result-score-divider">/</span>
            <span className="quiz-result-score-max">{displayResult.max_score}</span>
          </div>
          {displayResult.status === "SUBMITTED" && (
            <p className="text-muted" style={{ fontSize: 13, marginTop: 8 }}>
              <i className="bi bi-hourglass-split"></i> Đang chờ giảng viên chấm điểm
            </p>
          )}
          {!isEssay && (
            <button
              className="quiz-result-retry"
              onClick={() => {
                setResult(null);
                setAnswers({});
              }}
            >
              <i className="bi bi-arrow-counterclockwise"></i>
              Làm lại
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-lesson">
      <div className="quiz-lesson-header">
        <h2 className="quiz-lesson-title">{quiz.title}</h2>
        {quiz.description && <p className="quiz-lesson-description">{quiz.description}</p>}
        <div className="quiz-lesson-meta">
          <span>
            <i className="bi bi-clock"></i> {quiz.time_limit_minutes || "Không giới hạn"} phút
          </span>
          {quiz.quiz_type === "MCQ" && (
            <span>
              <i className="bi bi-question-circle"></i> {quiz.questions?.length || 0} câu hỏi
            </span>
          )}
        </div>
      </div>
      <div className="quiz-lesson-questions">
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
                  <label
                    key={option.id}
                    className={`quiz-option ${
                      answers[question.id]?.selected_option_id === option.id
                        ? "quiz-option--selected"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q_${question.id}`}
                      checked={answers[question.id]?.selected_option_id === option.id}
                      onChange={() => handleSelectOption(question.id, option.id)}
                    />
                    <span className="quiz-option-text">{option.text}</span>
                  </label>
                ))}
              </div>
            )}

            {question.question_type === "FILL_BLANK" && (
              <div className="quiz-question-input">
                <input
                  type="text"
                  className="quiz-input"
                  placeholder="Nhập câu trả lời..."
                  value={answers[question.id]?.answer_text || ""}
                  onChange={(e) => handleTextAnswer(question.id, e.target.value)}
                />
              </div>
            )}

            {question.question_type === "ESSAY" && (
              <div className="quiz-question-input">
                <textarea
                  className="quiz-textarea"
                  rows={4}
                  placeholder="Nhập câu trả lời..."
                  value={answers[question.id]?.answer_text || ""}
                  onChange={(e) => handleTextAnswer(question.id, e.target.value)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="quiz-lesson-actions">
        <button
          className="quiz-submit-btn"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Đang nộp...
            </>
          ) : (
            <>
              <i className="bi bi-send"></i>
              Nộp bài
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default QuizLesson;
