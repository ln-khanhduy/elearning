/**
 * Kiểm tra tính hợp lệ của dữ liệu form quiz.
 * Trả về object { valid, message }.
 */
export const validateQuizForm = (form) => {
  const title = String(form.title).trim();
  if (title.length < 5) {
    return { valid: false, message: "Tiêu đề phải từ 5 ký tự bao gồm khoảng cách." };
  }

  const minutes = Number(form.time_limit_minutes);
  if (minutes <= 0 || minutes > 120) {
    return { valid: false, message: "Thời gian làm bài tối đa là 120 phút." };
  }

  const score = Number(form.passing_score);
  if (score < 0 || score > 10) {
    return { valid: false, message: "Điểm tối đa phải từ 1 đến 10." };
  }

  const questionType = form.question_type;

  // Kiểm tra câu hỏi tự luận (ESSAY) phải có nội dung câu hỏi
  if (questionType === "ESSAY") {
    const prompt = String(form.prompt || "").trim();
    if (!prompt) {
      return { valid: false, message: "Vui lòng nhập nội dung câu hỏi tự luận." };
    }
  }

  // Kiểm tra câu hỏi điền khuyết (FILL_BLANK) phải có nội dung câu hỏi và đáp án
  if (questionType === "FILL_BLANK") {
    const prompt = String(form.prompt || "").trim();
    if (!prompt) {
      return { valid: false, message: "Vui lòng nhập nội dung câu hỏi điền khuyết." };
    }
    const correctAnswer = String(form.correct_text_answer || "").trim();
    if (!correctAnswer) {
      return { valid: false, message: "Vui lòng nhập đáp án đúng cho câu hỏi điền khuyết." };
    }
  }

  return { valid: true };
};

/**
 * Xây dựng payload để gửi lên server khi lưu quiz.
 */
export const buildQuizPayload = (form, quiz, sectionId) => ({
  ...form,
  id: quiz?.id,
  section_id: sectionId,
  lesson_id: quiz?.lesson_id || quiz?.lesson,
});

/**
 * Tách payload gửi lên API khỏi các field chỉ dùng cho UI.
 * - Map question_type -> quiz_type (tương thích backend)
 * - Tách prompt & correct_text_answer để tạo/update Question riêng
 * - Loại bỏ các field không gửi lên server
 * Trả về { payload, prompt, correctTextAnswer }.
 */
export const buildQuizApiPayload = (quizData) => {
  const payload = { ...quizData };

  // Map question_type to quiz_type for backend compatibility
  if (payload.question_type && !payload.quiz_type) {
    payload.quiz_type = payload.question_type;
  }

  // Tách prompt và correct_text_answer để tạo Question riêng (cho ESSAY/FILL_BLANK)
  const prompt = payload.prompt || "";
  const correctTextAnswer = payload.correct_text_answer || "";

  delete payload.question_type;
  delete payload.prompt;
  delete payload.correct_text_answer;
  delete payload.section_id;
  delete payload.lesson_id;
  delete payload.id;
  delete payload.questions_count;

  return { payload, prompt, correctTextAnswer };
};

/**
 * Xây dựng payload cho Question (dùng cho ESSAY/FILL_BLANK).
 */
export const buildQuestionPayload = (quizType, prompt, correctTextAnswer = "") => {
  const questionPayload = {
    prompt: prompt,
    points: 10,
    order: 1,
    question_type: quizType,
  };

  // FILL_BLANK cần có correct_text_answer
  if (quizType === "FILL_BLANK" && correctTextAnswer) {
    questionPayload.correct_text_answer = correctTextAnswer;
  }

  return questionPayload;
};
