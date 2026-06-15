export default function QuestionItem({ question, index, quizId, onEdit, onDelete }) {
  const typeLabel =
    question.question_type === "MCQ" ? "Trắc nghiệm" :
    question.question_type === "FILL_BLANK" ? "Điền khuyết" : "Tự luận";

  return (
    <div className="question-node mb-1 p-2 border rounded">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <small>
            <strong>Câu {index + 1}:</strong> {question.prompt?.substring(0, 80)}
            {question.prompt?.length > 80 ? "..." : ""}
          </small>
          <span className="badge bg-secondary ms-2">{typeLabel}</span>
          <span className="badge bg-primary ms-1">{question.points} điểm</span>
        </div>
        <div>
          <button className="btn btn-sm btn-outline-primary me-1" onClick={() => onEdit(question)}>
            <i className="bi bi-pencil"></i>
          </button>
          <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(question.id)}>
            <i className="bi bi-trash"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
