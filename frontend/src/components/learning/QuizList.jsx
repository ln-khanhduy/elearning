import React, { useState, useCallback, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { submitQuizApi } from "../../api/learningAPI";
import "../../style/learning/quiz-taking.css";

/**
 * Parse prompt để tìm các placeholder {{...}} và render input fields.
 * Trả về mảng các phần: text thường và placeholder.
 */
function parseFillBlankPrompt(prompt) {
  const parts = [];
  let lastIndex = 0;
  const regex = /\{\{(.+?)\}\}/g;
  let match;
  while ((match = regex.exec(prompt)) !== null) {
    // Text trước placeholder
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: prompt.slice(lastIndex, match.index) });
    }
    // Placeholder
    parts.push({ type: "blank", value: match[1], index: parts.length });
    lastIndex = regex.lastIndex;
  }
  // Text còn lại sau placeholder cuối cùng
  if (lastIndex < prompt.length) {
    parts.push({ type: "text", value: prompt.slice(lastIndex) });
  }
  return parts;
}

/**
 * QuizList - Hiển thị danh sách bài tập của bài học.
 * Click "Vào làm" để mở inline quiz trong cùng trang học tập.
 */
// Key lưu state trong sessionStorage
const STORAGE_PREFIX = "quiz_taking_";

function loadQuizState(courseId, lessonId) {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${courseId}_${lessonId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveQuizState(courseId, lessonId, state) {
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${courseId}_${lessonId}`, JSON.stringify(state));
  } catch {}
}

function clearQuizState(courseId, lessonId) {
  try {
    sessionStorage.removeItem(`${STORAGE_PREFIX}${courseId}_${lessonId}`);
  } catch {}
}

function QuizList({ quizzes, lessonId }) {
  const { courseId } = useParams();
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null); // seconds remaining
  const [quizStartedAt, setQuizStartedAt] = useState(null); // timestamp when quiz started
  const timerRef = useRef(null);
  const courseIdRef = useRef(courseId);
  courseIdRef.current = courseId;

  // Khôi phục state từ sessionStorage khi component mount
  useEffect(() => {
    if (!courseId) return;
    const lessonIdStr = lessonId != null ? String(lessonId) : "";
    const saved = loadQuizState(courseId, lessonIdStr);
    if (saved) {
      if (saved.activeQuizId) setActiveQuizId(saved.activeQuizId);
      if (saved.answers) setAnswers(saved.answers);
      if (saved.results) setResults(saved.results);
      if (saved.quizStartedAt) {
        setQuizStartedAt(saved.quizStartedAt);
        // Tính lại thời gian còn lại dựa vào thời gian bắt đầu
        const elapsed = (Date.now() - saved.quizStartedAt) / 1000;
        const total = saved.totalSeconds || 0;
        const remaining = Math.max(0, Math.round(total - elapsed));
        setTimeRemaining(remaining);
      }
    }
  }, []); // Chỉ chạy 1 lần khi mount

  // Lưu state vào sessionStorage bất cứ khi nào có thay đổi quan trọng
  useEffect(() => {
    if (!courseId || !activeQuizId) return;
    const lessonIdStr = lessonId != null ? String(lessonId) : "";
    saveQuizState(courseId, lessonIdStr, {
      activeQuizId,
      answers,
      results,
      quizStartedAt,
      totalSeconds: quizzes.find(q => q.id === activeQuizId)?.time_limit_minutes
        ? Number(quizzes.find(q => q.id === activeQuizId).time_limit_minutes) * 60
        : 0,
    });
  }, [activeQuizId, answers, results, quizStartedAt, courseId]);

  // Nộp bài dùng cho timer hết giờ: bỏ qua kiểm tra unanswered
  const forceSubmit = useCallback(async (quiz) => {
    setSubmitting(true);
    try {
      const formattedAnswers = quiz.questions.map((q) => {
        const ans = answers[q.id] || {};
        let answerText = ans.answer_text || null;
        if (q.question_type === "FILL_BLANK" && ans.blanks) {
          const parts = parseFillBlankPrompt(q.prompt);
          const blankParts = parts.filter((p) => p.type === "blank");
          answerText = blankParts.map((bp) => ans.blanks[bp.index] || "").join("|");
        }
        return {
          question_id: q.id,
          selected_option_id: ans.selected_option_id || null,
          answer_text: answerText,
        };
      });

      const res = await submitQuizApi(courseId, quiz.id, formattedAnswers);
      if (res?.success && res?.data) {
        setResults((prev) => ({ ...prev, [quiz.id]: res.data }));
        if (res.data.status === "SUBMITTED") {
          toast.success("Đã gửi bài tự luận thành công. Vui lòng chờ giảng viên chấm điểm.");
        } else {
          toast.success(
            res.data.passed
              ? "Chúc mừng! Bạn đã vượt qua bài kiểm tra."
              : "Bạn chưa đạt yêu cầu. Hãy thử lại!"
          );
        }
      }
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra khi nộp bài.");
    } finally {
      setSubmitting(false);
    }
  }, [answers, courseId]);

  const handleStartQuiz = (quizId) => {
    setActiveQuizId(quizId);

    // Kiểm tra xem đã có state cũ trong sessionStorage chưa (đã làm trước đó)
    const lessonIdStr = lessonId != null ? String(lessonId) : "";
    const saved = loadQuizState(courseId, lessonIdStr);

    // Nếu có saved state cho quiz này, khôi phục (resume) thay vì reset
    // Kiểm tra quizStartedAt để biết đã từng bắt đầu làm quiz này chưa
    const hasSavedSession = saved && saved.activeQuizId === quizId && saved.quizStartedAt;
    if (hasSavedSession) {
      if (saved.answers) setAnswers(saved.answers);
      if (saved.results) setResults(saved.results);
      setQuizStartedAt(saved.quizStartedAt);
      const elapsed = (Date.now() - saved.quizStartedAt) / 1000;
      const total = saved.totalSeconds || 0;
      const remaining = Math.max(0, Math.round(total - elapsed));
      setTimeRemaining(remaining);
      return;
    }

    // Không có saved state → khởi tạo mới
    setAnswers({});
    setResults({});
    setQuizStartedAt(Date.now());

    const quiz = quizzes.find(q => q.id === quizId);
    if (quiz?.latest_attempt) {
      const attempt = quiz.latest_attempt;
      setResults((prev) => ({
        ...prev,
        [quizId]: {
          score: attempt.score,
          max_score: attempt.max_score,
          passed: attempt.passed,
          status: attempt.status,
        },
      }));
    }

    // Khởi tạo timer nếu quiz có thời gian giới hạn
    if (quiz?.time_limit_minutes && Number(quiz.time_limit_minutes) > 0) {
      const totalSeconds = Number(quiz.time_limit_minutes) * 60;
      setTimeRemaining(totalSeconds);
    } else {
      setTimeRemaining(null);
    }
  };

  // Timer countdown - dùng ref để tránh stale closure
  const forceSubmitRef = useRef(forceSubmit);
  forceSubmitRef.current = forceSubmit;
  const quizzesRef = useRef(quizzes);
  quizzesRef.current = quizzes;
  const resultsRef = useRef(results);
  resultsRef.current = results;

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          // Lấy dữ liệu mới nhất qua ref
          const currentQuizzes = quizzesRef.current;
          const currentResults = resultsRef.current;
          const currentForceSubmit = forceSubmitRef.current;
          const activeQuiz = currentQuizzes.find(q => q.id === activeQuizId);
          if (activeQuiz && !currentResults[activeQuiz.id]) {
            toast.warning("Đã hết thời gian làm bài! Đang nộp bài...");
            currentForceSubmit(activeQuiz);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timeRemaining, activeQuizId]);

  // Format time: MM:SS
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleSelectOption = useCallback((questionId, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { selected_option_id: optionId } }));
  }, []);

  const handleTextAnswer = useCallback((questionId, text) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { answer_text: text } }));
  }, []);

  // Xử lý FILL_BLANK: lưu từng blank riêng, key là "blank_{questionId}_{blankIndex}"
  const handleFillBlankInput = useCallback((questionId, blankIndex, value) => {
    setAnswers((prev) => {
      const current = prev[questionId] || {};
      const blanks = current.blanks || {};
      return { ...prev, [questionId]: { ...current, blanks: { ...blanks, [blankIndex]: value } } };
    });
  }, []);

  const handleSubmit = useCallback(async (quiz) => {
    // Kiểm tra unanswered cho MCQ/ESSAY
    const unanswered = quiz.questions.filter((q) => {
      if (q.question_type === "FILL_BLANK") {
        const ans = answers[q.id];
        if (!ans || !ans.blanks) return true;
        const parts = parseFillBlankPrompt(q.prompt);
        const blankParts = parts.filter((p) => p.type === "blank");
        return blankParts.some((bp) => !ans.blanks[bp.index] || !ans.blanks[bp.index].trim());
      }
      return !answers[q.id];
    });
    if (unanswered.length > 0) {
      toast.warning(`Vui lòng trả lời tất cả câu hỏi (còn ${unanswered.length} câu).`);
      return;
    }

    setSubmitting(true);
    try {
      const formattedAnswers = quiz.questions.map((q) => {
        const ans = answers[q.id] || {};
        let answerText = ans.answer_text || null;
        // FILL_BLANK: combine các blank answers thành một string, phân cách bằng |
        if (q.question_type === "FILL_BLANK" && ans.blanks) {
          const parts = parseFillBlankPrompt(q.prompt);
          const blankParts = parts.filter((p) => p.type === "blank");
          answerText = blankParts.map((bp) => ans.blanks[bp.index] || "").join("|");
        }
        return {
          question_id: q.id,
          selected_option_id: ans.selected_option_id || null,
          answer_text: answerText,
        };
      });

      const res = await submitQuizApi(courseId, quiz.id, formattedAnswers);
      if (res?.success && res?.data) {
        setResults((prev) => ({ ...prev, [quiz.id]: res.data }));

        // ESSAY quiz: không hiển thị điểm ngay, chờ giảng viên chấm
        if (res.data.status === "SUBMITTED") {
          toast.success("Đã gửi bài tự luận thành công. Vui lòng chờ giảng viên chấm điểm.");
        } else {
          toast.success(
            res.data.passed
              ? "Chúc mừng! Bạn đã vượt qua bài kiểm tra."
              : "Bạn chưa đạt yêu cầu. Hãy thử lại!"
          );
        }
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
    setQuizStartedAt(Date.now());

    // Reset timer: khởi tạo lại thời gian
    const quiz = quizzes.find(q => q.id === quizId);
    if (quiz?.time_limit_minutes && Number(quiz.time_limit_minutes) > 0) {
      const totalSeconds = Number(quiz.time_limit_minutes) * 60;
      setTimeRemaining(totalSeconds);
    }

    // Xóa saved state để lần sau vào làm sẽ là session mới
    if (courseId) {
      const lessonIdStr = lessonId != null ? String(lessonId) : "";
      clearQuizState(courseId, lessonIdStr);
    }
  };

  const isEssayQuiz = (quiz) => {
    return quiz?.quiz_type === "ESSAY" || quiz?.questions?.some(q => q.question_type === "ESSAY");
  };

  const handleBack = () => {
    // Chỉ ẩn quiz view, không clear state để giữ nguyên đáp án và timer khi quay lại
    setActiveQuizId(null);  
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
                <div key={quiz.id} className="quiz-taking-view">
                  <div className="quiz-taking-header">
                    <button className="quiz-back-btn" onClick={handleBack}>
                      <i className="bi bi-arrow-left"></i> Quay lại danh sách
                    </button>
                    <h4>{quiz.title}</h4>
                    {quiz.description && <p className="quiz-taking-description">{quiz.description}</p>}
                    <div className="quiz-taking-meta">
                      {timeRemaining !== null ? (
                        <span className={`quiz-timer ${timeRemaining <= 60 ? "quiz-timer--warning" : ""}`}>
                          <i className="bi bi-hourglass-split"></i> {formatTime(timeRemaining)}
                        </span>
                      ) : (
                        <span><i className="bi bi-clock"></i> {quiz.time_limit_minutes || "Không giới hạn"} phút</span>
                      )}
                      {quiz.quiz_type === "MCQ" && <span><i className="bi bi-question-circle"></i> {quiz.questions?.length || 0} câu hỏi</span>}
                      <span><i className="bi bi-tag"></i> {quiz.quiz_type === "MCQ" ? "Trắc nghiệm" : quiz.quiz_type === "ESSAY" ? "Tự luận" : "Điền khuyết"}</span>
                    </div>
                  </div>

                  {/* Kết quả */}
                  {result && result.status === "SUBMITTED" && (
                    <div className="quiz-result quiz-result--submitted">
                      <div className="quiz-result-icon">
                        <i className="bi bi-send-check"></i>
                      </div>
                      <h3>Đã gửi bài</h3>
                      <p className="quiz-result-waiting">
                        Bài tự luận đã được gửi đến giảng viên để chấm điểm.
                        Vui lòng quay lại sau để xem kết quả.
                      </p>
                    </div>
                  )}

                  {/* Kết quả đã chấm (MCQ, FILL_BLANK, hoặc ESSAY đã được giảng viên chấm) */}
                  {result && result.status !== "SUBMITTED" && (
                    <div className={`quiz-result ${result.passed ? "quiz-result--passed" : "quiz-result--failed"}`}>
                      <div className="quiz-result-icon">
                        <i className={`bi ${result.passed ? "bi-check-circle-fill" : "bi-x-circle-fill"}`}></i>
                      </div>
                      <h3>{result.passed ? "Đạt yêu cầu" : "Chưa đạt"}</h3>
                      <div className="quiz-result-score">
                        <span className="quiz-result-score-value">{result.score}</span>
                        <span className="quiz-result-score-unit">điểm</span>
                      </div>
                      {!isEssayQuiz(quiz) && (
                        <button className="quiz-result-retry" onClick={() => handleRetry(quiz.id)}>
                          <i className="bi bi-arrow-counterclockwise"></i> Làm lại
                        </button>
                      )}
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
                            {question.question_type !== "FILL_BLANK" && (
                              <p className="quiz-question-prompt">{question.prompt}</p>
                            )}

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
                              <div className="quiz-question-fill-blank">
                                {(() => {
                                  const parts = parseFillBlankPrompt(question.prompt);
                                  const ans = answers[question.id] || {};
                                  const blanks = ans.blanks || {};
                                  return parts.map((part, pIdx) => {
                                    if (part.type === "text") {
                                      return <span key={pIdx} className="quiz-fill-text">{part.value}</span>;
                                    }
                                    return (
                                      <input
                                        key={pIdx}
                                        type="text"
                                        className="quiz-fill-input"
                                        placeholder="..."
                                        value={blanks[part.index] || ""}
                                        onChange={(e) => handleFillBlankInput(question.id, part.index, e.target.value)}
                                      />
                                    );
                                  });
                                })()}
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
            const isEssaySubmitted = attempt?.status === "SUBMITTED";
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
                      {attempt && attempt.status === "GRADED" && (
                        <span className={`quiz-list-item-score ${attempt.passed ? "text-success" : "text-danger"}`}>
                          <i className={`bi ${attempt.passed ? "bi-check-circle-fill" : "bi-x-circle-fill"}`}></i> {attempt.score} điểm
                        </span>
                      )}
                      {isEssaySubmitted && (
                        <span className="quiz-list-item-score text-muted">
                          <i className="bi bi-hourglass-split"></i> Đã nộp, chờ chấm
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button className="quiz-start-btn" onClick={() => handleStartQuiz(quiz.id)}>
                  {attempt && attempt.status === "GRADED" && !isEssayQuiz(quiz) ? "Làm lại" : (attempt && (attempt.status === "GRADED" || isEssaySubmitted)) ? "Xem lại" : "Vào làm"} <i className="bi bi-arrow-right"></i>
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