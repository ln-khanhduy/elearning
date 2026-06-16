import React, { useState } from "react";
import LearningSidebar from "./LearningSidebar";
import LearningContent from "./LearningContent";
import LearningNavigation from "./LearningNavigation";

/**
 * LearningLayout - Layout chính cho learning page.
 * Gồm sidebar trái (danh sách bài học) và khu vực nội dung chính.
 */
function LearningLayout({
  chapters,
  currentLessonId,
  currentLesson,
  prevLesson,
  nextLesson,
  progress,
  onSelectLesson,
  onPrev,
  onNext,
  onMarkComplete,
  onSubmitQuiz,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  const isCompleted = currentLesson?.completed || false;

  return (
    <div className="learning-layout">
      {/* Mobile toggle button */}
      <button className="learning-toggle-btn d-lg-none" onClick={toggleSidebar}>
        <i className="bi bi-list"></i>
        <span>Danh sách bài học</span>
      </button>

      <LearningSidebar
        chapters={chapters}
        currentLessonId={currentLessonId}
        progress={progress}
        onSelectLesson={(id) => {
          onSelectLesson(id);
          closeSidebar();
        }}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      <main className="learning-main">
        <LearningContent lesson={currentLesson} onSubmitQuiz={onSubmitQuiz} />

        {currentLesson && (
          <LearningNavigation
            prevLesson={prevLesson}
            nextLesson={nextLesson}
            currentLesson={currentLesson}
            onPrev={onPrev}
            onNext={onNext}
            onMarkComplete={onMarkComplete}
            isCompleted={isCompleted}
          />
        )}
      </main>
    </div>
  );
}

export default LearningLayout;
