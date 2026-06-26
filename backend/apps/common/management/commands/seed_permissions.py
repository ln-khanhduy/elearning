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
    "course.course.create": "Tạo khóa học",
    "course.course.update": "Cập nhật khóa học",
    "course.course.delete": "Xóa khóa học",
    "course.course.publish": "Xuất bản/Ẩn khóa học",
    "course.course.hide": "Ẩn khóa học",
    "course.course.approve": "Duyệt khóa học",
    "course.course.feedback_instructor": "Gửi phản hồi cho instructor",
    "course.instructor.assign": "Phân công giảng viên",

    # Lesson
    "course.lesson.create": "Tạo bài học",
    "course.lesson.update": "Cập nhật bài học",
    "course.lesson.delete": "Xóa bài học",

    # Quiz
    "course.quiz.create": "Tạo quiz",
    "course.quiz.update": "Cập nhật quiz",
    "course.quiz.delete": "Xóa quiz",

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
    "course.review.create": "Tạo đánh giá",

    # Instructor
    "user.instructor.view": "Xem danh sách instructor",
    "user.instructor.lock": "Khóa tài khoản instructor",
    "user.instructor.support": "Hỗ trợ instructor",
    "user.instructor.approve": "Duyệt hồ sơ instructor",
    "user.instructor.reject": "Từ chối hồ sơ instructor",
    "user.instructor.sales_history": "Xem lịch sử bán hàng",
    "user.instructor.withdraw_request": "Yêu cầu rút tiền",

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
    "finance.finance.refund": "Duyệt yêu cầu hoàn tiền",

    # Student permissions
    "student.course.search": "Tìm kiếm khóa học",
    "student.course.preview": "Xem thử khóa học",
    "student.course.buy": "Mua khóa học",
    "student.payment.create": "Thanh toán",
    "student.learning.view": "Học bài",
    "student.assignment.submit": "Làm bài tập",
    "student.profile.manage": "Quản lý thông tin cá nhân",
    "student.my_course.view": "Xem khóa học đã mua",
    "student.wallet.deposit": "Yêu cầu hoàn tiền",

    # Instructor finance
    "instructor.wallet.view_balance": "Xem số dư ví",
}



ROLE_PERMISSIONS = {
    "SUPERADMIN": [
        "admin.admin.create",
        "admin.admin.assign_role",
        "admin.admin.change_role",
        "admin.admin.lock",
        "admin.admin.delete",
        "admin.admin.view",

        "admin.role.create",
        "admin.role.update",
        "admin.role.delete",
        "admin.role.view",
        "admin.role.view_permissions",
        "admin.role.assign_permission",
        "admin.role.revoke_permission",

        "admin.dashboard.view",

        "course.course.view",
        "course.course.create",
        "course.course.update",
        "course.course.delete",
        "course.course.publish",
        "course.course.hide",
        "course.course.feedback_instructor",
        "course.instructor.assign",

        "course.lesson.create",
        "course.lesson.update",
        "course.lesson.delete",

        "course.quiz.create",
        "course.quiz.update",
        "course.quiz.delete",

        "course.category.create",
        "course.category.update",
        "course.category.delete",
        "course.category.view",

        "course.comment.create",
        "course.comment.reply",
        "course.comment.hide",
        "course.comment.delete",

        "course.review.view",

        "user.instructor.view",
        "user.instructor.lock",
        "user.instructor.support",
        "user.instructor.approve",
        "user.instructor.reject",
        "user.instructor.sales_history",

        "user.user.view",
        "user.user.update",
        "user.user.lock",
        "user.user.unlock",
        "user.user.notify",
        "user.user.complaint_resolve",

        "finance.finance.revenue_view",
        "finance.finance.discount_config",
        "finance.finance.fee_config",

        "student.course.search",
        "student.course.preview",
        "student.course.buy",
        "student.payment.create",
        "student.learning.view",
        "student.assignment.submit",
        "student.profile.manage",
        "student.my_course.view",
    ],

    "COURSE_ADMIN": [

        "course.course.view",
        "course.course.create",
        "course.course.update",
        "course.course.publish",
        "course.course.hide",
        "course.course.delete",
        "course.course.feedback_instructor",
        "course.instructor.assign",

        "course.lesson.create",
        "course.lesson.update",
        "course.lesson.delete",

        "course.quiz.create",
        "course.quiz.update",
        "course.quiz.delete",

        "course.category.create",
        "course.category.update",
        "course.category.delete",
        "course.category.view",

        "course.comment.hide",
        "course.comment.delete",

        "course.review.view",
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
        "finance.finance.refund",
    ],


    "INSTRUCTOR": [
        "course.course.view",
        "course.course.create",
        "course.course.update",
        "course.course.delete",
        "course.course.hide",

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
                    self.style.WARNING(f"Role not found: {role_code}")
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
                self.style.SUCCESS(f"Permissions assigned to role: {role_code}")
            )