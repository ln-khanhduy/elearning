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
