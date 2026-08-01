import { useNavigate } from "react-router-dom";
import CourseStepper from "../../components/course-wizard/CourseStepper";
import StickyActionBar from "../../components/course-wizard/StickyActionBar";
import AutoSaveIndicator from "../../components/course-wizard/shared/AutoSaveIndicator";
import LoadingSkeleton from "../../components/course-wizard/shared/LoadingSkeleton";
import QuestionImportModal from "../../components/course-wizard/curriculum/QuestionImportModal";
import ConfirmModal from "../../components/common/ConfirmModal";

import StepCourseInformation from "../../components/course-wizard/steps/StepCourseInformation";
import StepCurriculumBuilder from "../../components/course-wizard/steps/StepCurriculumBuilder";
import StepPricing from "../../components/course-wizard/steps/StepPricing";
import StepReview from "../../components/course-wizard/steps/StepReview";
import StepPublish from "../../components/course-wizard/steps/StepPublish";

import { useCourseBuilder } from "../../hooks/course-builder/useCourseBuilder";

import "../../style/course-wizard.css";

function CourseBuilderPage({ mode = "create" }) {
  const navigate = useNavigate();
  const {
    isEdit,
    currentStep,
    loading,
    saving,
    publishing,
    lastSavedAt,
    course,
    categories,
    formData,
    thumbnailPreview,
    errors,
    curriculum,
    drawerOpen,
    drawerType,
    editingItem,
    editingSectionId,
    selectedItem,
    importQuizId,
    confirmModal,
    setImportQuizId,
    handleFieldChange,
    handleThumbnailChange,
    handleAddSection,
    handleEditSection,
    handleDeleteSection,
    handleAddLesson,
    handleSaveLesson,
    handleDeleteLesson,
    handleSelectLesson,
    handleCloseDrawer,
    handleImportQuestions,
    handleImportSuccess,
    handleSaveQuiz,
    handleAddQuiz,
    handleSelectQuiz,
    handleDeleteQuiz,
    handleNext,
    handlePrevious,
    handleGoToStep,
    handleCreateCourse,
    handlePublish,
    saveDraft,
  } = useCourseBuilder({ mode });

  if (loading) {
    return (
      <div className="cw-page">
        <LoadingSkeleton type="form" />
      </div>
    );
  }

  return (
    <div className="cw-page">
      {/* Header */}
      <div className="cw-header">
        <div className="cw-header-left">
          <button className="cw-header-back" onClick={() => navigate("/admin/courses")}>
            <i className="bi bi-arrow-left"></i>
            <span>Quay lại</span>
          </button>
          <h1 className="cw-header-title">
            {isEdit ? "Chỉnh sửa khóa học" : "Tạo khóa học mới"}
          </h1>
        </div>
        <div className="cw-header-right">
          {course?.status && (
            <span
              className={`cw-status-badge ${
                course.status === "PUBLISHED"
                  ? "cw-status-published"
                  : course.status === "HIDDEN"
                  ? "cw-status-hidden"
                  : "cw-status-draft"
              }`}
            >
              <i
                className={`bi ${
                  course.status === "PUBLISHED"
                    ? "bi-globe2"
                    : course.status === "HIDDEN"
                    ? "bi-eye-slash"
                    : "bi-pencil"
                }`}
              ></i>
              {course.status === "PUBLISHED"
                ? "Đã xuất bản"
                : course.status === "HIDDEN"
                ? "Ẩn"
                : "Nháp"}
            </span>
          )}
          <AutoSaveIndicator saving={saving} lastSavedAt={lastSavedAt} />
        </div>
      </div>

      {/* Stepper */}
      <CourseStepper currentStep={currentStep} onStepClick={handleGoToStep} />

      {/* Body */}
      <div className="cw-body">
        {currentStep === 1 && (
          <StepCourseInformation
            formData={formData}
            errors={errors}
            onFieldChange={handleFieldChange}
            onThumbnailChange={handleThumbnailChange}
            thumbnailPreview={thumbnailPreview}
            categories={categories}
          />
        )}

        {currentStep === 2 && (
          <StepCurriculumBuilder
            curriculum={curriculum}
            selectedItem={selectedItem}
            drawerOpen={drawerOpen}
            drawerType={drawerType}
            editingItem={editingItem}
            editingSectionId={editingSectionId}
            saving={saving}
            onSelectLesson={handleSelectLesson}
            onSelectQuiz={handleSelectQuiz}
            onCloseDrawer={handleCloseDrawer}
            onSaveLesson={handleSaveLesson}
            onSaveQuiz={handleSaveQuiz}
            onAddSection={handleAddSection}
            onEditSection={handleEditSection}
            onDeleteSection={handleDeleteSection}
            onAddLesson={handleAddLesson}
            onAddQuiz={handleAddQuiz}
            onDeleteLesson={handleDeleteLesson}
            onDeleteQuiz={handleDeleteQuiz}
            onImportQuestions={handleImportQuestions}
          />
        )}

        {currentStep === 3 && (
          <StepPricing
            formData={formData}
            errors={errors}
            onFieldChange={handleFieldChange}
          />
        )}

        {currentStep === 4 && (
          <StepReview
            formData={formData}
            thumbnailPreview={thumbnailPreview}
            curriculum={curriculum}
          />
        )}

        {currentStep === 5 && (
          <StepPublish
            formData={formData}
            thumbnailPreview={thumbnailPreview}
            curriculum={curriculum}
            course={course}
            onSaveDraft={saveDraft}
            onPublish={handlePublish}
            onGoToStep={handleGoToStep}
            saving={saving}
            publishing={publishing}
            isEdit={isEdit}
          />
        )}
      </div>

      {/* Action Bar */}
      {currentStep < 5 && (
        <StickyActionBar
          currentStep={currentStep}
          isFirstStep={currentStep === 1}
          isLastStep={currentStep === 5}
          onPrevious={handlePrevious}
          onNext={currentStep === 1 && !isEdit ? handleCreateCourse : handleNext}
          isEdit={isEdit}
          onSaveDraft={saveDraft}
          saving={saving}
          nextLabel={currentStep === 1 && !isEdit ? "Tạo khóa học" : "Tiếp theo"}
          hidePrevious={currentStep === 1}
        />
      )}

      {/* Import Modal */}
      {importQuizId && (
        <QuestionImportModal
          quizId={importQuizId}
          onClose={() => setImportQuizId(null)}
          onImportSuccess={async () => {
            await handleImportSuccess();
            setImportQuizId(null);
          }}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel || "Xác nhận"}
        cancelLabel="Hủy"
        variant={confirmModal.variant || "danger"}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel}
      />
    </div>
  );
}

export default CourseBuilderPage;