import React from "react";

/**
 * LearningProgress - Hiển thị thanh tiến độ học tập.
 * Hiển thị % hoàn thành và số bài đã học / tổng số.
 */
function LearningProgress({ progress }) {
  if (!progress) return null;

  const percent = progress.progress_percent || 0;
  const completed = progress.completed_lessons_count || 0;
  const total = progress.total_lessons_count || 0;

  return (
    <div className="learning-progress">
      <div className="learning-progress-header">
        <span className="learning-progress-label">Tiến độ khóa học</span>
        <span className="learning-progress-percent">{Math.round(percent)}%</span>
      </div>
      <div className="learning-progress-bar">
        <div
          className="learning-progress-bar-fill"
          style={{ width: `${Math.min(percent, 100)}%` }}
        ></div>
      </div>
      <span className="learning-progress-text">
        {completed}/{total} bài học
      </span>
    </div>
  );
}

export default LearningProgress;
