from django.core.management.base import BaseCommand
from apps.users.models import Role, RolePermission


PERMISSIONS = {
    # Admin
    "admin.admin.create": "Tạo admin",
    "admin.admin.assign_role": "Gán role cho admin",
    "admin.admin.change_role": "Thay đổi role admin",
    "admin.admin.lock": "Khóa admin",
    "admin.admin.delete": "Xóa admin",
    "admin.admin.view": "Xem thông tin admin",

    # Role
    "admin.role.create": "Tạo role",
    "admin.role.update": "Sửa role",
    "admin.role.delete": "Xóa role",
    "admin.role.view": "Xem danh sách role",
    "admin.role.view_permissions": "Xem danh sách permission của role",
    "admin.role.assign_permission": "Gán permission cho role",
    "admin.role.revoke_permission": "Thu hồi permission của role",

    # Dashboard
    "admin.dashboard.view": "Xem dashboard",

    # Course
    "course.course.view": "Xem danh sách khóa học",
    "course.course.delete": "Xóa khóa học",
    "course.course.hide": "Ẩn khóa học",
    "course.course.approve": "Duyệt khóa học",
    "course.course.feedback_instructor": "Gửi phản hồi cho instructor",

    # Category
    "course.category.create": "Tạo danh mục",
    "course.category.update": "Sửa danh mục",
    "course.category.delete": "Xóa danh mục",
    "course.category.view": "Xem danh mục",

    # Comment
    "course.comment.create": "Bình luận",
    "course.comment.reply": "Phản hồi bình luận",
    "course.comment.hide": "Ẩn bình luận",
    "course.comment.delete": "Xóa bình luận",

    # Review
    "course.review.view": "Xem đánh giá",

    # Instructor
    "user.instructor.view": "Xem danh sách instructor",
    "user.instructor.lock": "Khóa tài khoản instructor",
    "user.instructor.support": "Hỗ trợ instructor",
    "user.instructor.approve": "Duyệt hồ sơ instructor",
    "user.instructor.reject": "Từ chối hồ sơ instructor",
    "user.instructor.withdraw_request": "Gửi yêu cầu rút tiền",
    "user.instructor.sales_history": "Xem lịch sử bán hàng",

    # User
    "user.user.view": "Xem thông tin user",
    "user.user.update": "Cập nhật thông tin user",
    "user.user.lock": "Khóa tài khoản user",
    "user.user.unlock": "Mở khóa tài khoản user",
    "user.user.notify": "Gửi thông báo cho user",
    "user.user.complaint_resolve": "Giải quyết khiếu nại user",

    # Finance
    "finance.finance.revenue_view": "Xem doanh thu",
    "finance.finance.withdraw_approve": "Duyệt lệnh rút tiền",
    "finance.finance.discount_config": "Cấu hình giảm giá",
    "finance.finance.fee_config": "Cấu hình thu phí",
    "finance.finance.report_export": "Xuất báo cáo tài chính",

    # Student permissions
    "student.course.search": "Tìm kiếm khóa học",
    "student.course.preview": "Xem thử khóa học",
    "student.course.buy": "Mua khóa học",
    "student.payment.create": "Thanh toán",
    "student.learning.view": "Học bài",
    "student.assignment.submit": "Làm bài tập",
    "student.profile.manage": "Quản lý thông tin cá nhân",
    "student.my_course.view": "Xem khóa học đã mua",

    # Instructor finance
    "instructor.wallet.view_balance": "Xem số dư ví",
    "instructor.course.discount_self": "Tự giảm giá khóa học",
}


ROLE_PERMISSIONS = {
    "SUPERADMIN": list(PERMISSIONS.keys()),

    "COURSE_ADMIN": [
        "course.course.view",
        "course.course.approve",
        "course.course.hide",
        "course.course.delete",
        "course.course.feedback_instructor",

        "course.category.create",
        "course.category.update",
        "course.category.delete",
        "course.category.view",

        "course.comment.hide",
        "course.comment.delete",
    ],

    "INSTRUCTOR_MANAGER": [
        "user.instructor.view",
        "user.instructor.lock",
        "user.instructor.support",
        "user.instructor.approve",
        "user.instructor.reject",
    ],

    "USER_MANAGER": [
        "user.user.view",
        "user.user.update",
        "user.user.lock",
        "user.user.unlock",
        "user.user.notify",
        "user.user.complaint_resolve",
    ],

    "FINANCE_ADMIN": [
        "finance.finance.revenue_view",
        "finance.finance.withdraw_approve",
        "finance.finance.discount_config",
        "finance.finance.fee_config",
        "finance.finance.report_export",
    ],

    "INSTRUCTOR": [
        "course.course.create",
        "course.course.update",
        "course.course.delete",
        "course.course.hide",
        "instructor.course.discount_self",

        "course.lesson.create",
        "course.lesson.update",
        "course.lesson.delete",

        "course.quiz.create",
        "course.quiz.update",
        "course.quiz.delete",

        "instructor.wallet.view_balance",
        "user.instructor.sales_history",
        "user.instructor.withdraw_request",

        "course.comment.reply",
    ],

    "STUDENT": [
        "student.course.search",
        "student.course.preview",
        "student.course.buy",

        "student.wallet.deposit",
        "student.payment.create",

        "student.learning.view",
        "student.assignment.submit",

        "course.review.create",
        "course.review.view",

        "course.comment.create",
        "course.comment.reply",

        "student.profile.manage",
        "student.my_course.view",
    ],
}


class Command(BaseCommand):
    help = "Seed permissions for roles"

    def handle(self, *args, **kwargs):
        for role_code, permission_codes in ROLE_PERMISSIONS.items():
            role = Role.objects.filter(code=role_code).first()

            if not role:
                self.stdout.write(
                    self.style.WARNING(f"Không tìm thấy role: {role_code}")
                )
                continue

            RolePermission.objects.filter(role=role).delete()

            for permission_code in permission_codes:
                RolePermission.objects.create(
                    role=role,
                    code=permission_code,
                    name=PERMISSIONS.get(permission_code, permission_code)
                )

            self.stdout.write(
                self.style.SUCCESS(f"Đã gán quyền cho role: {role_code}")
            )