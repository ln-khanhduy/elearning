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
