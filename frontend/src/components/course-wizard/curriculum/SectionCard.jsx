import { memo, useState, useCallback, useEffect } from "react";

function SectionCard({
  section,
  index,
  selectedItem,
  onSelectLesson,
  onSelectQuiz,
  onEditSection,
  onDeleteSection,
  onAddLesson,
  onAddQuiz,
  onDeleteLesson,
  onDeleteQuiz,
  onDragStart,
  onDragOver,
  onDrop,
}) {
  const [expanded, setExpanded] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [openDropdownLessonId, setOpenDropdownLessonId] = useState(null);
  const lessons = section.lessons || [];
  const quizzes = section.quizzes || [];
  const totalItems = lessons.length + quizzes.length;

  // Close dropdown when clicking outside
  useEffect(() => {
    if (openDropdownLessonId === null) return;
    const handleClickOutside = (e) => {
      // Check if click is on a dropdown toggle button or inside a dropdown menu
      const isDropdownToggle = e.target.closest(".cw-add-quiz-btn");
      const isDropdownMenu = e.target.closest(".cw-quiz-dropdown-menu");
      if (!isDropdownToggle && !isDropdownMenu) {
        setOpenDropdownLessonId(null);
      }
    };
    // Use mousedown (fires before click) so stopPropagation on click events doesn't interfere
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdownLessonId]);

  const QUIZ_TYPES = [
    { key: "MCQ", label: "Trắc nghiệm", icon: "bi-list-ul" },
    { key: "ESSAY", label: "Tự luận", icon: "bi-pencil" },
    { key: "FILL_BLANK", label: "Điền khuyết", icon: "bi-input-cursor-text" },
  ];

  const handleAddQuizWithType = useCallback(
    (lessonId, sectionId, quizType) => {
      setOpenDropdownLessonId(null);
      onAddQuiz?.(lessonId, sectionId, quizType);
    },
    [onAddQuiz]
  );

  const handleStartEdit = useCallback((e) => {
    e.stopPropagation();
    setEditTitleValue(section.title || "");
    setEditingTitle(true);
  }, [section.title]);

  const handleSaveTitle = useCallback(() => {
    const trimmed = editTitleValue.trim();
    if (trimmed && trimmed !== (section.title || "")) {
      onEditSection?.(section.id, trimmed);
    }
    setEditingTitle(false);
  }, [editTitleValue, section.id, section.title, onEditSection]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      handleSaveTitle();
    } else if (e.key === "Escape") {
      setEditingTitle(false);
    }
  }, [handleSaveTitle]);

  const handleDragStart = useCallback(
    (e) => {
      e.dataTransfer.setData("text/plain", `section:${section.id}`);
      onDragStart?.(section.id);
    },
    [section.id, onDragStart]
  );

  const handleDropOnSection = useCallback(
    (e) => {
      e.preventDefault();
      onDrop?.(e, section.id);
    },
    [section.id, onDrop]
  );

  return (
    <div
      className="cw-section"
      draggable
      onDragStart={handleDragStart}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.(section.id);
      }}
      onDrop={handleDropOnSection}
    >
      {/* Section Header */}
      <div className="cw-section-header" onClick={() => setExpanded(!expanded)}>
        <span className="cw-section-drag-handle" onClick={(e) => e.stopPropagation()}>
          <i className="bi bi-grip-vertical"></i>
        </span>
        <span className={`cw-section-expand ${expanded ? "" : "collapsed"}`}>
          <i className="bi bi-chevron-down"></i>
        </span>
        <div className="cw-section-info">
          {editingTitle ? (
            <input
              type="text"
              className="cw-section-title-input"
              value={editTitleValue}
              onChange={(e) => setEditTitleValue(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleKeyDown}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="cw-section-title">
              {section.title || `Chương ${index + 1}`}
            </div>
          )}
          <div className="cw-section-meta">
            <span>{totalItems} bài học</span>
            {section.duration && <span>{section.duration} phút</span>}
          </div>
        </div>
        <div className="cw-section-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="cw-section-action-btn"
            title="Sửa chương"
            onClick={handleStartEdit}
          >
            <i className="bi bi-pencil"></i>
          </button>
          <button
            className="cw-section-action-btn danger"
            title="Xóa chương"
            onClick={() => onDeleteSection?.(section.id)}
          >
            <i className="bi bi-trash"></i>
          </button>
        </div>
      </div>

      {/* Section Body */}
      {expanded && (
        <div className="cw-section-body">
          {/* Lessons with nested quizzes */}
          {lessons.map((lesson, lIdx) => {
            const lessonQuizzes = lesson.quizzes || [];
            return (
              <div key={lesson.id} className="cw-lesson-group">
                {/* Lesson item */}
                <div
                  className={`cw-lesson-item ${
                    selectedItem?.type === "lesson" && selectedItem?.id === lesson.id
                      ? "selected"
                      : ""
                  }`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", `lesson:${lesson.id}:${section.id}`);
                  }}
                  onClick={() => onSelectLesson?.(lesson, section.id)}
                >
                  <span className="cw-lesson-drag-handle">
                    <i className="bi bi-grip-vertical"></i>
                  </span>
                  <div className={`cw-lesson-icon ${lesson.content_type === "VIDEO" ? "video" : "document"}`}>
                    <i className={`bi ${lesson.content_type === "VIDEO" ? "bi-play-circle" : "bi-file-text"}`}></i>
                  </div>
                  <div className="cw-lesson-info">
                    <div className="cw-lesson-name">{lesson.title || `Bài ${lIdx + 1}`}</div>
                    <div className="cw-lesson-type">
                      {lesson.content_type === "VIDEO" ? "Video" : "Tài liệu"}
                      {lessonQuizzes.length > 0 && ` • ${lessonQuizzes.length} bài tập`}
                    </div>
                  </div>
                  <div className="cw-lesson-actions">
                    <div className="cw-quiz-dropdown-wrapper">
                      <button
                        className="cw-add-quiz-btn"
                        title="Thêm bài tập"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownLessonId(
                            openDropdownLessonId === lesson.id ? null : lesson.id
                          );
                        }}
                      >
                        <i className="bi bi-patch-question"></i>
                        Bài tập
                        <i className={`bi bi-chevron-down cw-dropdown-arrow ${openDropdownLessonId === lesson.id ? "open" : ""}`}></i>
                      </button>
                      {openDropdownLessonId === lesson.id && (
                        <div className="cw-quiz-dropdown-menu">
                          {QUIZ_TYPES.map((qt) => (
                            <button
                              key={qt.key}
                              className="cw-quiz-dropdown-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddQuizWithType(lesson.id, section.id, qt.key);
                              }}
                            >
                              <i className={`bi ${qt.icon}`}></i>
                              {qt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      className="cw-section-action-btn danger"
                      title="Xóa bài học"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteLesson?.(lesson.id, section.id);
                      }}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                </div>

                {/* Nested quizzes under this lesson */}
                {lessonQuizzes.length > 0 && (
                  <div className="cw-quiz-list">
                    {lessonQuizzes.map((quiz, qIdx) => (
                      <div
                        key={quiz.id}
                        className={`cw-quiz-item ${
                          selectedItem?.type === "quiz" && selectedItem?.id === quiz.id
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => onSelectQuiz?.(quiz, section.id)}
                      >
                        <span className="cw-quiz-drag-handle">
                          <i className="bi bi-grip-vertical"></i>
                        </span>
                        <div className="cw-quiz-icon">
                          <i className="bi bi-patch-question"></i>
                        </div>
                        <div className="cw-quiz-info">
                          <div className="cw-quiz-name">{quiz.title || `Bài tập ${qIdx + 1}`}</div>
                          <div className="cw-quiz-type">
                            {quiz.quiz_type === "MCQ" ? `${quiz.question_count || quiz.questions_count || 0} câu hỏi` : QUIZ_TYPES.find(qt => qt.key === quiz.quiz_type)?.label || "Bài tập"}
                          </div>
                        </div>
                        <div className="cw-quiz-actions">
                          <button
                            className="cw-section-action-btn danger"
                            title="Xóa bài tập"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteQuiz?.(quiz.id, section.id);
                            }}
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add lesson button */}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              className="cw-add-item-btn cw-add-item-btn-sm"
              onClick={() => onAddLesson?.(section.id)}
            >
              <i className="bi bi-plus-lg"></i>
              Thêm bài học
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(SectionCard);
