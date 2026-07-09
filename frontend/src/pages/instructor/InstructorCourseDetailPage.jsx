import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getInstructorCourseDetailApi } from "../../api/instructorCourseAPI";
import { TABS } from "../../components/instructor-course-detail/tabsConfig";
import CourseContentTab from "../../components/instructor-course-detail/CourseContentTab";
import StudentProgressTab from "../../components/instructor-course-detail/StudentProgressTab";
import QuizResultsTab from "../../components/instructor-course-detail/QuizResultsTab";
import EssayGradingTab from "../../components/instructor-course-detail/EssayGradingTab";
import SendNotificationTab from "../../components/instructor-course-detail/SendNotificationTab";
import QATab from "../../components/instructor-course-detail/QATab";
import LearningReportTab from "../../components/instructor-course-detail/LearningReportTab";

const TAB_COMPONENTS = {
  content: CourseContentTab,
  progress: StudentProgressTab,
  "quiz-results": QuizResultsTab,
  essay: EssayGradingTab,
  notification: SendNotificationTab,
  qa: QATab,
  report: LearningReportTab,
};

function InstructorCourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("content");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getInstructorCourseDetailApi(courseId);
        setCourse(res?.data || res);
      } catch (error) {
        toast.error("Không thể tải thông tin khóa học.");
        navigate("/instructor/courses");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, navigate]);

  if (loading) {
    return (
      <div className="instructor-courses-page">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!course) return null;

  const ActiveComponent = TAB_COMPONENTS[activeTab] || CourseContentTab;

  return (
    <div className="instructor-courses-page">
      <div className="courses-header">
        <div>
          <h2>{course.title}</h2>
          <p className="text-muted">
            <span className={`badge bg-${course.status === "PUBLISHED" ? "success" : course.status === "DRAFT" ? "secondary" : "warning"} me-2`}>
              {course.status === "PUBLISHED" ? "Đã đăng" : course.status === "DRAFT" ? "Bản nháp" : "Đã ẩn"}
            </span>
            {course.category?.name && <span className="me-2"><i className="bi bi-folder me-1"></i>{course.category.name}</span>}
            {course.price !== undefined && <span><i className="bi bi-currency-dollar me-1"></i>{Number(course.price).toLocaleString("vi-VN")}đ</span>}
          </p>
        </div>
        <button className="course-btn-outline" onClick={() => navigate("/instructor/courses")}>
          <i className="bi bi-arrow-left me-1"></i> Quay lại
        </button>
      </div>

      <div className="mb-4">
        <ul className="nav nav-tabs nav-tabs-instructor flex-wrap">
          {TABS.map((tab) => (
            <li className="nav-item" key={tab.key}>
              <button
                className={`nav-link ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <i className={`bi ${tab.icon} me-1`}></i>
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="tab-content-instructor">
        <ActiveComponent courseId={courseId} />
      </div>
    </div>
  );
}

export default InstructorCourseDetailPage;