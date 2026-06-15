export default function OptionEditor({ options, onAdd, onUpdate, onRemove }) {
  return (
    <div className="mt-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <strong className="small">Đáp án</strong>
        <button type="button" className="course-btn-sm course-btn-outline" onClick={onAdd}>
          <i className="bi bi-plus-lg me-1"></i>Thêm đáp án
        </button>
      </div>
      {options.map((opt, oIdx) => (
        <div key={oIdx} className="option-row d-flex align-items-center gap-2 mb-2">
          <input
            type="text" className="course-form-input flex-grow-1"
            value={opt.text}
            onChange={(e) => onUpdate(oIdx, "text", e.target.value)}
            placeholder={`Đáp án ${oIdx + 1}`}
          />
          <label className="d-flex align-items-center">
            <input
              type="radio"
              name={`correct-opt-${oIdx}`}
              checked={opt.is_correct}
              onChange={() => options.forEach((_, oi) => onUpdate(oi, "is_correct", oi === oIdx))}
            />
            <span className="ms-1 small">Đúng</span>
          </label>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onRemove(oIdx)}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      ))}
    </div>
  );
}
