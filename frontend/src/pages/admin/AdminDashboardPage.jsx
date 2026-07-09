import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getDashboardDataApi } from "../../api/dashboardAPI";

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const data = await getDashboardDataApi(selectedYear);
        setDashboardData(data);
      } catch (err) {
        toast.error("Không thể tải dữ liệu dashboard: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [selectedYear]);

  const formatCurrency = (value) => {
    if (!value && value !== 0) return "0 đ";
    return new Intl.NumberFormat("vi-VN").format(value) + " đ";
  };

  const getStatusClass = (status) => {
    const m = {
      SUCCESS: "status-0",
      APPROVED: "status-0",
      PENDING: "status-2",
      REJECTED: "status-1",
      FAILED: "status-1",
    };
    return m[status] || "status-2";
  };

  const getStatusText = (status) => {
    const m = {
      SUCCESS: "Thành công",
      APPROVED: "Đã duyệt",
      PENDING: "Đang chờ",
      REJECTED: "Từ chối",
      FAILED: "Thất bại",
      USER_CREATED: "Tạo người dùng",
      COURSE_CREATED: "Tạo khóa học",
      INSTRUCTOR_APPLICATION: "Đăng ký giảng viên",
    };
    return m[status] || status;
  };

  const getStatIcon = (key) => {
    const m = {
      total_users: "bi-people-fill",
      total_admins: "bi-shield-fill-check",
      total_instructors: "bi-person-video3",
      total_students: "bi-mortarboard-fill",
      total_courses: "bi-book-fill",
      revenue_today: "bi-graph-up-arrow",
      revenue_week: "bi-calendar-week-fill",
      total_revenue: "bi-coin",
      pending_instructor: "bi-person-plus-fill",
      pending_requests: "bi-headset",
    };
    return m[key] || "bi-circle";
  };

  const getStatColor = (key) => {
    const m = {
      total_users: "#0f3d75",
      total_admins: "#dc3545",
      total_instructors: "#fd7e14",
      total_students: "#198754",
      total_courses: "#0d6efd",
      revenue_today: "#198754",
      revenue_week: "#0d6efd",
      total_revenue: "#f59e0b",
      pending_instructor: "#fd7e14",
      pending_requests: "#6f42c1",
    };
    return m[key] || "#6c757d";
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h2>TỔNG QUAN HỆ THỐNG</h2>
          <p>Dữ liệu hạ tầng và phân tích người dùng</p>
        </div>
        <div className="stats-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="stat-card stat-card--skeleton">
              <div className="skeleton-line skeleton-line--label"></div>
              <div className="skeleton-line skeleton-line--value"></div>
            </div>
          ))}
        </div>
        <div className="dashboard-main">
          <div className="chart-card" style={{ height: 300 }}>
            <div className="skeleton-chart"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="admin-dashboard">
        <div className="text-center py-5">Không có dữ liệu</div>
      </div>
    );
  }

  const {
    stats, users_by_month, users_by_role, revenue_by_year, activities,
    top_courses, recent_enrollments, courses_by_status,
    revenue_change, revenue_today, revenue_this_week,
    pending_instructor_applications,
  } = dashboardData;

  const maxBarHeight = Math.max(...users_by_month.map((item) => item.total), 1);

  const renderSkeleton = () => null;

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h2>TỔNG QUAN HỆ THỐNG</h2>
          <p>Dữ liệu hạ tầng và phân tích người dùng</p>
        </div>
        <div className="dashboard-header-right">
          {revenue_change !== null && revenue_change !== undefined && (
            <span className={`revenue-change ${revenue_change >= 0 ? "up" : "down"}`}>
              <i className={`bi ${revenue_change >= 0 ? "bi-arrow-up" : "bi-arrow-down"}`}></i>
              {Math.abs(revenue_change)}% so với tuần trước
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((item, index) => (
          <div
            className="stat-card"
            key={index}
            onClick={() => item.link && navigate(item.link)}
            style={{ cursor: item.link ? "pointer" : "default" }}
          >
            <div className="stat-card-icon" style={{ background: `${getStatColor(item.key)}15`, color: getStatColor(item.key) }}>
              <i className={`bi ${getStatIcon(item.key)}`}></i>
            </div>
            <div className="stat-card-info">
              <span className="stat-card-label">{item.label}</span>
              <strong className="stat-card-value">
                {item.key.includes("revenue") ? formatCurrency(item.value) : item.value?.toLocaleString()}
              </strong>
            </div>
          </div>
        ))}
      </div>

      {/* Top Courses & Role Distribution */}
      <div className="dashboard-main">
        {/* Users Chart */}
        <div className="chart-card users-chart">
          <div className="card-header">
            <div>
              <h3>Người dùng mới theo tháng</h3>
              <p>Theo dõi tốc độ tăng trưởng cộng đồng học tập.</p>
            </div>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
              {Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="bar-chart">
            {users_by_month.map((item) => (
              <div className="bar-item" key={item.month}>
                <span className="bar-value">{item.total}</span>
                <div
                  className={`bar ${item.month === new Date().getMonth() + 1 ? "active" : ""}`}
                  style={{ height: `${(item.total / maxBarHeight) * 150}px` }}
                ></div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Role Distribution */}
        <div className="role-card">
          <h3>Thống kê theo vai trò</h3>
          <div className="role-chart">
            {users_by_role.map((role, index) => (
              <div className="role-item" key={index}>
                <span className="role-name">{role.name} ({role.code})</span>
                <div className="role-bar-bg">
                  <div
                    className="role-bar-fill"
                    style={{
                      width: `${Math.min((role.total / Math.max(...users_by_role.map(r => r.total), 1)) * 100, 100)}%`,
                      background: index === 0 ? "#0f3d75" : index === 1 ? "#198754" : index === 2 ? "#fd7e14" : "#0d6efd"
                    }}
                  ></div>
                </div>
                <strong>{role.total}</strong>
              </div>
            ))}
          </div>

          {/* Courses by status */}
          {courses_by_status && courses_by_status.length > 0 && (
            <>
              <h3 className="mt-4">Khóa học theo trạng thái</h3>
              <div className="role-chart">
                {courses_by_status.map((item, index) => (
                  <div className="role-item" key={index}>
                    <span className="role-name">{item.status === "PUBLISHED" ? "Đã đăng" : item.status === "DRAFT" ? "Bản nháp" : item.status === "HIDDEN" ? "Đã ẩn" : item.status}</span>
                    <div className="role-bar-bg">
                      <div
                        className="role-bar-fill"
                        style={{
                          width: `${Math.min((item.total / Math.max(...courses_by_status.map(r => r.total), 1)) * 100, 100)}%`,
                          background: item.status === "PUBLISHED" ? "#198754" : item.status === "DRAFT" ? "#6c757d" : "#ffc107"
                        }}
                      ></div>
                    </div>
                    <strong>{item.total}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Revenue Chart */}
        <div className="chart-card revenue-card">
          <div className="card-header">
            <div>
              <h3>Doanh thu theo thời gian</h3>
              <p>Phân tích dòng tiền hệ thống theo các chu kỳ.</p>
            </div>
            <div className="revenue-mini-stats">
              <span className="mini-stat">
                <span className="mini-stat-label">Hôm nay</span>
                <strong>{formatCurrency(revenue_today)}</strong>
              </span>
              <span className="mini-stat">
                <span className="mini-stat-label">Tuần này</span>
                <strong>{formatCurrency(revenue_this_week)}</strong>
              </span>
            </div>
          </div>

          {revenue_by_year.length > 0 && (
            <div className="line-chart">
              <svg viewBox="0 0 500 180" preserveAspectRatio="none">
                {(() => {
                  const maxRevenue = Math.max(...revenue_by_year.map((r) => r.total), 1);
                  const points = revenue_by_year.map((r, i) => {
                    const x = 10 + (i / (revenue_by_year.length - 1 || 1)) * 480;
                    const y = 170 - (r.total / maxRevenue) * 150;
                    return `${x},${y}`;
                  });
                  const areaPoints = [...points, `490,170`, `10,170`];
                  return (
                    <>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0f3d75" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#0f3d75" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d={`M${areaPoints.join(" L")}`} fill="url(#revenueGradient)" />
                      <path d={`M${points.join(" L")}`} fill="none" stroke="#0f3d75" strokeWidth="3" strokeLinecap="round" />
                    </>
                  );
                })()}
              </svg>
              <div className="year-labels">
                {revenue_by_year.map((item) => (
                  <span key={item.year}>{item.year}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Courses */}
        <div className="chart-card top-courses-card">
          <div className="card-header">
            <div>
              <h3>Khóa học nổi bật</h3>
              <p>Top khóa học có nhiều học viên nhất.</p>
            </div>
            <button className="card-header-btn" onClick={() => navigate("/admin/courses")}>
              Xem tất cả <i className="bi bi-arrow-right"></i>
            </button>
          </div>
          {top_courses && top_courses.length > 0 ? (
            <div className="top-courses-list">
              {top_courses.map((course, index) => (
                <div className="top-course-item" key={course.id} onClick={() => navigate(`/admin/courses/${course.id}/edit`)}>
                  <div className="top-course-rank">{index + 1}</div>
                  <div className="top-course-info">
                    <strong>{course.title}</strong>
                    <span className="text-muted small">{course.instructor_name || "Chưa có giảng viên"}</span>
                  </div>
                  <div className="top-course-stats">
                    <span><i className="bi bi-people me-1"></i>{course.student_count}</span>
                    <span><i className="bi bi-currency-dollar me-1"></i>{formatCurrency(course.total_revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted p-3">Chưa có dữ liệu.</p>
          )}
        </div>

        {/* Recent Enrollments */}
        <div className="chart-card recent-enrollments-card">
          <div className="card-header">
            <div>
              <h3>Đăng ký gần đây</h3>
              <p>Học viên mới đăng ký khóa học.</p>
            </div>
          </div>
          {recent_enrollments && recent_enrollments.length > 0 ? (
            <div className="recent-enrollments-list">
              {recent_enrollments.map((e, index) => (
                <div className="recent-enrollment-item" key={e.id || index}>
                  <div className="recent-enrollment-avatar">
                    {(e.student_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="recent-enrollment-info">
                    <strong>{e.student_name}</strong>
                    <span className="text-muted small">{e.course_title}</span>
                  </div>
                  <span className="text-muted small">{new Date(e.enrolled_at).toLocaleDateString("vi-VN")}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted p-3">Chưa có đăng ký nào.</p>
          )}
        </div>
      </div>

      {/* Activity Log */}
      <div className="activity-card">
        <div className="activity-header">
          <h3>Hoạt động quản trị</h3>
          <button onClick={() => navigate("/super-admin/activity-logs")}>
            Xem tất cả nhật ký <i className="bi bi-arrow-right"></i>
          </button>
        </div>

        {activities.length > 0 ? (
          <div className="activity-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Loại sự kiện</th>
                  <th>Nguồn</th>
                  <th>Trạng thái</th>
                  <th>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((item, index) => (
                  <tr key={index}>
                    <td>{new Date(item.time).toLocaleString("vi-VN")}</td>
                    <td>{getStatusText(item.event)}</td>
                    <td>{item.source}</td>
                    <td><span className={`status ${getStatusClass(item.status)}`}>{getStatusText(item.status)}</span></td>
                    <td>{item.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted p-3">Chưa có hoạt động nào.</p>
        )}
      </div>
    </div>
  );
}

export default AdminDashboardPage;