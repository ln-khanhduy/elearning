import { memo } from "react";
import SectionCard from "./SectionCard";

/**
 * CurriculumSidebar - Sidebar quản lý nội dung khóa học (course wizard)
 * Hiển thị: danh sách chương, bài học, quiz + nút thêm chương
 */
function CurriculumSidebar({ curriculum, selectedItem, onSelectLesson, onSelectQuiz, onEditSection,
  onDeleteSection, onAddSection, onAddLesson, onAddQuiz, onDeleteLesson, onDeleteQuiz }) {
  // Đếm tổng số bài học + quiz từ tất cả chương
  const totalLessons = curriculum.reduce((sum, s) => sum + (s.lessons?.length || 0) + (s.quizzes?.length || 0), 0);

  return (
    <div className="cw-curriculum-sidebar">
      <div className="cw-curriculum-header">
        <div>
          <h3>Nội dung khóa học</h3>
          <div className="cw-curriculum-stats">
            <span>{curriculum.length} chương</span>
            <span>{totalLessons} bài học</span>
          </div>
        </div>
        <button className="cw-btn cw-btn-primary cw-btn-sm" onClick={onAddSection}>
          <i className="bi bi-plus-lg"></i> Thêm chương
        </button>
      </div>

      <div className="cw-curriculum-scroll">
        {curriculum.length === 0 ? (
          <div className="cw-empty-state">
            <div className="cw-empty-state-icon"><i className="bi bi-collection"></i></div>
            <div className="cw-empty-state-title">Chưa có nội dung</div>
            <div className="cw-empty-state-desc">Thêm chương đầu tiên để bắt đầu xây dựng khóa học của bạn.</div>
            <button className="cw-btn cw-btn-primary" onClick={onAddSection}>
              <i className="bi bi-plus-lg"></i> Thêm chương đầu tiên
            </button>
          </div>
        ) : (
          curriculum.map((section, idx) => (
            <SectionCard key={section.id} section={section} index={idx} selectedItem={selectedItem}
              onSelectLesson={onSelectLesson} onSelectQuiz={onSelectQuiz} onEditSection={onEditSection}
              onDeleteSection={onDeleteSection} onAddLesson={onAddLesson} onAddQuiz={onAddQuiz}
              onDeleteLesson={onDeleteLesson} onDeleteQuiz={onDeleteQuiz} />
          ))
        )}
      </div>
    </div>
  );
}

export default memo(CurriculumSidebar);
