from django.utils import timezone
from django.core.cache import cache

from apps.system.repositories import dashboard_repository
def get_monthly_data(queryset_result):
    """
    Chuyển đổi dữ liệu thống kê theo tháng từ queryset thành mảng 12 tháng.
    Điền giá trị 0 cho những tháng không có dữ liệu.
    """
    months = {i: 0 for i in range(1, 13)}

    for item in queryset_result:
        if item["month"]:
            months[item["month"].month] = item["total"]

    return [
        {
            "month": month,
            "label": f"T{month}",
            "total": total,
        }
        for month, total in months.items()
    ]
def get_total_revenue():
    """Lấy tổng doanh thu hệ thống (ủy quyền cho Repository truy vấn)."""
    return dashboard_repository.get_total_revenue()
def get_revenue_by_year():
    """
    Lấy doanh thu theo từng năm.
    Ủy quyền cho Repository - dữ liệu đã được xử lý sẵn (điền 0 cho năm không có dữ liệu).
    """
    return dashboard_repository.get_revenue_by_year()
def get_dashboard_data(year=None):
    """
    Tổng hợp tất cả dữ liệu thống kê cho dashboard admin.
    Cache 5 phút để giảm tải database.
    """
    if year is None:
        year = timezone.now().year

    cache_key = f"dashboard_data_{year}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    users_by_month = get_monthly_data(
        dashboard_repository.get_new_users_by_month(year)
    )

    users_by_role = list(dashboard_repository.get_users_by_role())
    courses_by_status = list(dashboard_repository.get_courses_by_status())

    recent_activities = []

    for user in dashboard_repository.get_recent_users():
        recent_activities.append({
            "time": user.date_joined,
            "event": "USER_CREATED",
            "source": "USER_MODULE",
            "status": "SUCCESS",
            "detail": f"Tài khoản {user.email} vừa được tạo.",
        })

    for course in dashboard_repository.get_recent_courses():
        recent_activities.append({
            "time": course.created_at,
            "event": "COURSE_CREATED",
            "source": "COURSE_MODULE",
            "status": "SUCCESS",
            "detail": f"Khóa học {course.title} vừa được tạo.",
        })

    for application in dashboard_repository.get_recent_instructor_applications():
        recent_activities.append({
            "time": application.created_at,
            "event": "INSTRUCTOR_APPLICATION",
            "source": "INSTRUCTOR_MODULE",
            "status": application.status,
            "detail": f"{application.user.email} đã gửi hồ sơ giảng viên.",
        })

    recent_activities = sorted(
        recent_activities,
        key=lambda item: item["time"],
        reverse=True
    )[:8]

    revenue_today = dashboard_repository.get_revenue_today()
    revenue_this_week = dashboard_repository.get_revenue_this_week()
    revenue_last_week = dashboard_repository.get_revenue_last_week()
    revenue_change = None
    if revenue_last_week > 0:
        revenue_change = round((revenue_this_week - revenue_last_week) / revenue_last_week * 100, 1)

    recent_enrollments = []
    for e in dashboard_repository.get_recent_enrollments():
        recent_enrollments.append({
            "id": e.id,
            "student_name": e.student.get_full_name() or e.student.email,
            "course_title": e.course.title,
            "enrolled_at": e.created_at,
        })

    top_courses = dashboard_repository.get_top_courses()

    result = {
        "stats": [
            {
                "key": "total_users",
                "label": "Tổng người dùng",
                "value": dashboard_repository.count_users(),
                "link": "/admin/users",
            },
            {
                "key": "total_admins",
                "label": "Tổng admin",
                "value": dashboard_repository.count_admins(),
                "link": "/admin/users",
            },
            {
                "key": "total_instructors",
                "label": "Tổng giảng viên",
                "value": dashboard_repository.count_instructors(),
                "link": "/admin/register-instructor",
            },
            {
                "key": "total_students",
                "label": "Tổng học viên",
                "value": dashboard_repository.count_students(),
                "link": "/admin/users",
            },
            {
                "key": "total_courses",
                "label": "Tổng khóa học",
                "value": dashboard_repository.count_courses(),
                "link": "/admin/courses",
            },
            {
                "key": "revenue_today",
                "label": "Doanh thu hôm nay",
                "value": revenue_today,
                "link": "/finance/revenue",
            },
            {
                "key": "revenue_week",
                "label": "Doanh thu tuần này",
                "value": revenue_this_week,
                "link": "/finance/revenue",
            },
            {
                "key": "total_revenue",
                "label": "Doanh thu hệ thống",
                "value": get_total_revenue(),
                "link": "/finance/revenue",
            },
            {
                "key": "pending_instructor",
                "label": "Giảng viên chờ duyệt",
                "value": dashboard_repository.count_pending_instructor_applications(),
                "link": "/admin/register-instructor",
            },
            {
                "key": "pending_requests",
                "label": "Yêu cầu hỗ trợ",
                "value": dashboard_repository.get_pending_requests_count(),
                "link": "/admin/requests",
            },
        ],
        "users_by_month": users_by_month,
        "users_by_role": users_by_role,
        "courses_by_status": courses_by_status,
        "pending_instructor_applications": dashboard_repository.count_pending_instructor_applications(),
        "revenue_by_year": get_revenue_by_year(),
        "revenue_change": revenue_change,
        "revenue_today": revenue_today,
        "revenue_this_week": revenue_this_week,
        "activities": recent_activities,
        "top_courses": top_courses,
        "recent_enrollments": recent_enrollments,
    }

    cache.set(cache_key, result, 300)  # 5 phút
    return result
