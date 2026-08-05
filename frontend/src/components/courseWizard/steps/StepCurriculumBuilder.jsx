import { memo } from "react";
import CurriculumSidebar from "../curriculum/CurriculumSidebar";
import LessonEditorPanel from "../curriculum/LessonEditorPanel";
import QuizEditorPanel from "../curriculum/QuizEditorPanel";

function StepCurriculumBuilder({
  curriculum,
  selectedItem,
  drawerOpen,
  drawerType,
  editingItem,
  editingSectionId,
  saving,
  onSelectLesson,
  onSelectQuiz,
  onCloseDrawer,
  onSaveLesson,
  onSaveQuiz,
  onAddSection,
  onEditSection,
  onDeleteSection,
  onAddLesson,
  onAddQuiz,
  onDeleteLesson,
  onDeleteQuiz,
  onImportQuestions,
}) {
  const hasSelection = drawerOpen && editingItem;

  return (
    <div className="cw-curriculum-layout">
      <CurriculumSidebar
        curriculum={curriculum}
        selectedItem={selectedItem}
        onSelectLesson={onSelectLesson}
        onSelectQuiz={onSelectQuiz}
        onEditSection={onEditSection}
        onDeleteSection={onDeleteSection}
        onAddSection={onAddSection}
        onAddLesson={onAddLesson}
        onAddQuiz={onAddQuiz}
        onDeleteLesson={onDeleteLesson}
        onDeleteQuiz={onDeleteQuiz}
      />

      {/* Right side - Editor Panel */}
      <div className="cw-editor-panel">
        {!hasSelection && (
          <div className="cw-empty-state">
            <div className="cw-empty-state-icon">
              <i className="bi bi-arrow-left-square"></i>
            </div>
            <div className="cw-empty-state-title">Chọn bài học để chỉnh sửa</div>
            <div className="cw-empty-state-desc">
              Nhấp vào một bài học hoặc bài tập bên trái để xem và chỉnh sửa chi tiết.
            </div>
          </div>
        )}

        {hasSelection && drawerType === "lesson" && (
          <LessonEditorPanel
            lesson={editingItem}
            sectionId={editingSectionId}
            onClose={onCloseDrawer}
            onSave={onSaveLesson}
            saving={saving}
          />
        )}

        {hasSelection && drawerType === "quiz" && (
          <QuizEditorPanel
            quiz={editingItem}
            sectionId={editingSectionId}
            onClose={onCloseDrawer}
            onSave={onSaveQuiz}
            saving={saving}
            onImportQuestions={onImportQuestions}
          />
        )}
      </div>
    </div>
  );
}

export default memo(StepCurriculumBuilder);
