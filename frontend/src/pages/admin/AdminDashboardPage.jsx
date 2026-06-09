import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getDashboardDataApi } from "../../api/dashboardAPI";
import "../../style/admin-dashboard.css";

function AdminDashboardPage() {
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
    const statusMap = {
      SUCCESS: "status-0",
      APPROVED: "status-0",
      PENDING: "status-2",
      REJECTED: "status-1",
      FAILED: "status-1",
    };
    return statusMap[status] || "status-2";
  };

  const getStatusText = (status) => {
    const statusMap = {
      SUCCESS: "Thành công",
      APPROVED: "Đã duyệt",
      PENDING: "Đang chờ",
      REJECTED: "Từ chối",
      FAILED: "Thất bại",
      USER_CREATED: "USER_CREATED",
      COURSE_CREATED: "COURSE_CREATED",
      INSTRUCTOR_APPLICATION: "INSTRUCTOR_APPLICATION",
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="text-center py-5">Đang tải dữ liệu...</div>
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

  const { stats, users_by_month, users_by_role, revenue_by_year, activities } = dashboardData;

  const maxBarHeight = Math.max(...users_by_month.map((item) => item.total), 1);

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>TỔNG QUAN HỆ THỐNG</h2>
        <p>Dữ liệu hạ tầng và phân tích người dùng .</p>
      </div>

      <div className="stats-grid">
        {stats.map((item, index) => (
          <div className="stat-card" key={index}>
            <span>{item.label}</span>
            <strong>{item.key === "total_revenue" ? formatCurrency(item.value) : item.value?.toLocaleString()}</strong>
          </div>
        ))}
      </div>

      <div className="dashboard-main">
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
                <div
                  className={`bar ${item.month === new Date().getMonth() + 1 ? "active" : ""}`}
                  style={{ height: `${(item.total / maxBarHeight) * 150}px` }}
                ></div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="role-card">
          <h3>Thống kê theo vai trò</h3>
          {users_by_role.map((role, index) => (
            <div className="role-item" key={index}>
              <span>{role.name} ({role.code})</span>
              <strong>{role.total}</strong>
            </div>
          ))}
        </div>

        <div className="chart-card revenue-card">
          <div className="card-header">
            <div>
              <h3>Doanh thu theo thời gian</h3>
              <p>Phân tích dòng tiền hệ thống theo các chu kỳ.</p>
            </div>
          </div>

          <div className="line-chart">
            <svg viewBox="0 0 500 180" preserveAspectRatio="none">
              {revenue_by_year.length > 0 && (() => {
                const maxRevenue = Math.max(...revenue_by_year.map((r) => r.total), 1);
                const points = revenue_by_year.map((r, i) => {
                  const x = 10 + (i / (revenue_by_year.length - 1 || 1)) * 480;
                  const y = 170 - (r.total / maxRevenue) * 150;
                  return `${x},${y}`;
                });
                return <path d={`M${points.join(" L")}`} fill="none" stroke="#214f86" strokeWidth="8" strokeLinecap="round" />;
              })()}
            </svg>
            <div className="year-labels">
              {revenue_by_year.map((item) => (
                <span key={item.year}>{item.year}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="permission-card">
          <h3>Phân quyền hệ thống</h3>
          <p>Điều chỉnh cấu trúc vai trò và quyền truy cập nhân sự.</p>
          <button>Cấu hình ngay →</button>
        </div>
      </div>

      <div className="activity-card">
        <div className="activity-header">
          <h3>Hoạt động quản trị</h3>
          <button>Xem tất cả nhật ký ↗</button>
        </div>

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
    </div>
  );
}

export default AdminDashboardPage;
