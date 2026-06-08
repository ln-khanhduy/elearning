from django.core.management.base import BaseCommand
from apps.users.models import Role, RolePermission


PERMISSIONS = {
    # Admin / Role / Permission
    "admin.create": "Tạo admin",
    "admin.assign_role": "Gán role cho admin",
    "admin.change_role": "Thay đổi role admin",
    "admin.lock": "Khóa admin",
    "admin.delete": "Xóa admin",
    "admin.view": "Xem thông tin admin",

    "role.create": "Tạo role",
    "role.update": "Sửa role",
    "role.delete": "Xóa role",
    "role.view": "Xem danh sách role",
    "role.view_permissions": "Xem danh sách permission của role",
    "role.assign_permission": "Gán permission cho role",
    "role.revoke_permission": "Thu hồi permission của role",

    # Dashboard
    "dashboard.view": "Xem dashboard",

    # Course
    "course.view": "Xem danh sách khóa học",
    "course.create": "Tạo khóa học",
    "course.update": "Sửa khóa học",
    "course.delete": "Xóa khóa học",
    "course.hide": "Ẩn khóa học",
    "course.approve": "Duyệt khóa học",
    "course.feedback_instructor": "Gửi phản hồi cho instructor",

    # Category / Tag
    "category.create": "Tạo danh mục",
    "category.update": "Sửa danh mục",
    "category.delete": "Xóa danh mục",
    "category.view": "Xem danh mục",

    "tag.create": "Tạo tag",
    "tag.update": "Sửa tag",
    "tag.delete": "Xóa tag",
    "tag.view": "Xem tag",

    # Lesson / Quiz
    "lesson.create": "Tạo bài học",
    "lesson.update": "Sửa bài học",
    "lesson.delete": "Xóa bài học",

    "quiz.create": "Tạo bài kiểm tra",
    "quiz.update": "Sửa bài kiểm tra",
    "quiz.delete": "Xóa bài kiểm tra",

    # Comment / Review
    "comment.create": "Bình luận",
    "comment.reply": "Phản hồi bình luận",
    "comment.hide": "Ẩn bình luận",
    "comment.delete": "Xóa bình luận",

    "review.create": "Đánh giá khóa học",
    "review.view": "Xem đánh giá",

    # Instructor
    "instructor.view": "Xem danh sách instructor",
    "instructor.lock": "Khóa tài khoản instructor",
    "instructor.support": "Hỗ trợ instructor",
    "instructor.withdraw_request": "Gửi yêu cầu rút tiền",
    "instructor.sales_history": "Xem lịch sử bán hàng",

    # User
    "user.view": "Xem thông tin user",
    "user.update": "Cập nhật thông tin user",
    "user.lock": "Khóa tài khoản user",
    "user.unlock": "Mở khóa tài khoản user",
    "user.notify": "Gửi thông báo cho user",
    "user.complaint_resolve": "Giải quyết khiếu nại user",

    # Finance
    "finance.revenue_view": "Xem doanh thu",
    "finance.withdraw_approve": "Duyệt lệnh rút tiền",
    "finance.discount_config": "Cấu hình giảm giá",
    "finance.fee_config": "Cấu hình thu phí",
    "finance.report_export": "Xuất báo cáo tài chính",

    # Student
    "course.search": "Tìm kiếm khóa học",
    "course.preview": "Xem thử khóa học",
    "course.buy": "Mua khóa học",
    "wallet.deposit": "Nạp tiền vào ví",
    "payment.create": "Thanh toán",
    "learning.view": "Học bài",
    "assignment.submit": "Làm bài tập",
    "profile.manage": "Quản lý thông tin cá nhân",
    "my_course.view": "Xem khóa học đã mua",

    # Instructor finance / discount
    "wallet.view_balance": "Xem số dư ví",
    "course.discount_self": "Tự giảm giá khóa học",
}


ROLE_PERMISSIONS = {
    "SUPERADMIN": list(PERMISSIONS.keys()),

    "COURSE_ADMIN": [
        "course.view",
        "course.approve",
        "course.hide",
        "course.delete",
        "course.feedback_instructor",

        "category.create",
        "category.update",
        "category.delete",
        "category.view",

        "tag.create",
        "tag.update",
        "tag.delete",
        "tag.view",

        "comment.hide",
        "comment.delete",
    ],

    "INSTRUCTOR_MANAGER": [
        "instructor.view",
        "instructor.lock",
        "instructor.support",
    ],

    "USER_MANAGER": [
        "user.view",
        "user.update",
        "user.lock",
        "user.unlock",
        "user.notify",
        "user.complaint_resolve",
    ],

    "FINANCE_ADMIN": [
        "finance.revenue_view",
        "finance.withdraw_approve",
        "finance.discount_config",
        "finance.fee_config",
        "finance.report_export",
    ],

    "INSTRUCTOR": [
        "course.create",
        "course.update",
        "course.delete",
        "course.discount_self",

        "lesson.create",
        "lesson.update",
        "lesson.delete",

        "quiz.create",
        "quiz.update",
        "quiz.delete",

        "wallet.view_balance",
        "instructor.sales_history",
        "instructor.withdraw_request",

        "comment.reply",
    ],

    "STUDENT": [
        "course.search",
        "course.preview",
        "course.buy",

        "wallet.deposit",
        "payment.create",

        "learning.view",
        "assignment.submit",

        "review.create",
        "review.view",

        "comment.create",
        "comment.reply",

        "profile.manage",
        "my_course.view",
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