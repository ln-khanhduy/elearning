import ChapterCard from "./ChapterCard";

export default function CurriculumTree({
  curriculum,
  onEditChapter,
  onDeleteChapter,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onAddQuiz,
  onEditQuiz,
  onDeleteQuiz,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
}) {
  if (curriculum.length === 0) {
    return (
      <div className="text-center py-4 text-muted">
        <i className="bi bi-collection" style={{ fontSize: 32 }}></i>
        <p className="mt-2">Chưa có chương nào. Thêm chương đầu tiên!</p>
      </div>
    );
  }

  return (
    <div className="curriculum-tree">
      {curriculum.map((chapter, cIdx) => (
        <ChapterCard
          key={chapter.id}
          chapter={chapter}
          index={cIdx}
          onEdit={onEditChapter}
          onDelete={onDeleteChapter}
          onAddLesson={onAddLesson}
          onEditLesson={onEditLesson}
          onDeleteLesson={onDeleteLesson}
          onAddQuiz={onAddQuiz}
          onEditQuiz={onEditQuiz}
          onDeleteQuiz={onDeleteQuiz}
          onAddQuestion={onAddQuestion}
          onEditQuestion={onEditQuestion}
          onDeleteQuestion={onDeleteQuestion}
        />
      ))}
    </div>
  );
}
