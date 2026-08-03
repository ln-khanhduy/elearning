from django.core.management.base import BaseCommand
from apps.users.models import Role, RolePermission


PERMISSIONS = {
    # ADMIN HỆ THỐNG 
    "admin.admin.create": "Tạo admin",
    "admin.admin.assign_role": "Gán role cho admin",
    "admin.admin.change_role": "Thay đổi role admin",
    "admin.admin.lock": "Khóa admin",
    "admin.admin.delete": "Xóa admin",
    "admin.admin.view": "Xem thông tin admin",

    # ROLE & PERMISSION 
    "admin.role.view": "Xem danh sách role",
    "admin.role.view_permissions": "Xem danh sách permission của role",
    "admin.role.manage": "Quản lý role (tạo/sửa/xóa/gán/thu hồi)",

    # DASHBOARD 
    "admin.dashboard.view": "Xem dashboard",

    # KHOÁ HỌC (COURSE) 
    "course.course.manage": "Quản lý khóa học (tạo/sửa/xóa)",
    "course.course.publish": "Xuất bản khóa học",
    "course.course.hide": "Ẩn khóa học",
    "course.course.feedback_instructor": "Gửi phản hồi cho instructor",
    "course.instructor.assign": "Phân công giảng viên",

    # BÀI HỌC (LESSON) 
    "course.lesson.manage": "Quản lý bài học",

    # QUIZ 
    "course.quiz.manage": "Quản lý quiz",

    # DANH MỤC (CATEGORY) 
    "course.category.manage": "Quản lý danh mục",

    # GIẢNG VIÊN (INSTRUCTOR) 
    "user.instructor.view": "Xem danh sách instructor",
    "user.instructor.manage": "Quản lý tài khoản instructor",
    "user.instructor.withdraw_request": "Yêu cầu rút tiền",

    # NGƯỜI DÙNG (USER) 
    "user.user.view": "Xem thông tin user",
    "user.user.manage": "Quản lý tài khoản user",

    # TÀI CHÍNH (FINANCE) 
    "finance.finance.revenue_view": "Xem doanh thu",
    "finance.finance.payout": "Thanh toán cho giảng viên",
    "finance.finance.withdraw_approve": "Duyệt lệnh rút tiền",
    "finance.finance.discount_config": "Cấu hình giảm giá",
    "finance.finance.fee_config": "Cấu hình thu phí",
    "finance.finance.report_export": "Xuất báo cáo tài chính",
    "finance.finance.refund": "Duyệt yêu cầu hoàn tiền",
    "finance.coupon.view": "Xem mã giảm giá",
    "finance.coupon.manage": "Quản lý mã giảm giá",

    # HỌC VIÊN (STUDENT) 
    "student.course.buy": "Mua khóa học",
    "student.my_course.view": "Xem khóa học đã mua",
    "student.wallet.deposit": "Yêu cầu hoàn tiền",
    "student.wishlist.view": "Xem danh sách yêu thích",
    "student.wishlist.manage": "Quản lý danh sách yêu thích (thêm/xóa)",
    "student.cart.view": "Xem giỏ hàng",
    "student.cart.manage": "Quản lý giỏ hàng (thêm/xóa)",

    # GIẢNG VIÊN - TÀI CHÍNH 
    "instructor.wallet.view_balance": "Xem số dư ví",

    # GIẢNG VIÊN - KHOÁ HỌC 
    "instructor.course.view_own": "Xem khóa học giảng dạy",
    "instructor.course.teaching": "Giảng dạy (chấm điểm, trả lời câu hỏi,...)",

    # HỖ TRỢ (SUPPORT) 
    "support.request.create": "Gửi yêu cầu hỗ trợ",
    "support.request.process": "Xử lý yêu cầu hỗ trợ",
}

# PERMISSION DEPENDENCIES 
# Các quyền phụ thuộc: khi cấp một quyền, role phải có các quyền trong danh sách
# tương ứng thì mới hoạt động đúng chức năng.
PERMISSION_DEPS = {
    #  ROLE & PERMISSION 
    "admin.role.manage": ["admin.role.view", "admin.role.view_permissions"],

    #  QUIZ nằm trong Lesson → cấp quiz cần kèm quyền lesson 
    "course.quiz.manage": ["course.lesson.manage"],

    #  HỌC VIÊN — muốn quản lý thì cần kèm quyền xem 
    "student.cart.manage": ["student.cart.view"],
    "student.wishlist.manage": ["student.wishlist.view"],
    # Mua khóa cần kèm quyền giỏ hàng (thêm vào giỏ rồi thanh toán)
    "student.course.buy": ["student.cart.view", "student.cart.manage"],
    # Yêu cầu hoàn tiền cần kèm quyền xem khóa học đã mua
    "student.wallet.deposit": ["student.my_course.view"],

    #  GIẢNG VIÊN — giảng dạy cần kèm quyền xem khóa học giảng dạy 
    "instructor.course.teaching": ["instructor.course.view_own"],

    #  HỖ TRỢ — người xử lý yêu cầu cũng có thể tạo yêu cầu 
    "support.request.process": ["support.request.create"],

    #  GIẢNG VIÊN (INSTRUCTOR) — thao tác cần kèm xem 
    "user.instructor.manage": ["user.instructor.view"],

    #  NGƯỜI DÙNG (USER) — thao tác cần kèm xem 
    "user.user.manage": ["user.user.view"],

    #  TÀI CHÍNH (FINANCE) — thao tác cần kèm xem doanh thu 
    "finance.finance.payout": ["finance.finance.revenue_view"],
    "finance.finance.withdraw_approve": ["finance.finance.revenue_view"],
    "finance.finance.discount_config": ["finance.finance.revenue_view"],
    "finance.finance.fee_config": ["finance.finance.revenue_view"],
    "finance.finance.report_export": ["finance.finance.revenue_view"],
    "finance.finance.refund": ["finance.finance.revenue_view"],

    #  MÃ GIẢM GIÁ (COUPON) 
    "finance.coupon.manage": ["finance.coupon.view"],
}

ROLE_PERMISSIONS = {
    "SUPERADMIN": [
        "admin.admin.create",
        "admin.admin.assign_role",
        "admin.admin.change_role",
        "admin.admin.lock",
        "admin.admin.delete",
        "admin.admin.view",

        "admin.role.view",
        "admin.role.view_permissions",
        "admin.role.manage",

        "admin.dashboard.view",

        "course.course.manage",
        "course.course.publish",
        "course.course.hide",
        "course.course.feedback_instructor",
        "course.instructor.assign",

        "course.lesson.manage",
        "course.quiz.manage",

        "course.category.manage",

        "user.instructor.view",
        "user.instructor.manage",
        "user.instructor.withdraw_request",

        "user.user.view",
        "user.user.manage",

        "finance.finance.revenue_view",
        "finance.finance.payout",
        "finance.finance.withdraw_approve",
        "finance.finance.discount_config",
        "finance.finance.fee_config",
        "finance.finance.report_export",
        "finance.finance.refund",
        "finance.coupon.view",
        "finance.coupon.manage",

        "student.course.buy",
        "student.my_course.view",
        "student.wallet.deposit",
        "student.wishlist.view",
        "student.wishlist.manage",
        "student.cart.view",
        "student.cart.manage",
        "instructor.wallet.view_balance",
        "instructor.course.view_own",
        "instructor.course.teaching",
        "support.request.create",
        "support.request.process",
    ],

    "COURSE_ADMIN": [
        "support.request.create",
        "support.request.process",
        "course.course.manage",
        "course.course.publish",
        "course.course.hide",
        "course.course.feedback_instructor",
        "course.instructor.assign",

        "course.lesson.manage",
        "course.quiz.manage",

        "course.category.manage",
    ],

    "INSTRUCTOR_MANAGER": [
        "user.instructor.view",
        "user.instructor.manage",
        "support.request.create",
        "support.request.process",
    ],

    "USER_MANAGER": [
        "user.user.view",
        "user.user.manage",
        "support.request.create",
        "support.request.process",
    ],

    "FINANCE_ADMIN": [
        "support.request.create",
        "support.request.process",
        "finance.finance.revenue_view",
        "finance.finance.payout",
        "finance.finance.withdraw_approve",
        "finance.finance.discount_config",
        "finance.finance.fee_config",
        "finance.finance.report_export",
        "finance.finance.refund",
        "finance.coupon.view",
        "finance.coupon.manage",
    ],

    "INSTRUCTOR": [
        "instructor.course.view_own",
        "instructor.course.teaching",
        "instructor.wallet.view_balance",
        "user.instructor.withdraw_request",
        "student.my_course.view",
        "student.wallet.deposit",
        "support.request.create",
    ],

    "STUDENT": [
        "student.course.buy",
        "student.my_course.view",
        "student.wallet.deposit",
        "student.wishlist.view",
        "student.wishlist.manage",
        "student.cart.view",
        "student.cart.manage",
        "support.request.create",
    ],
}


class Command(BaseCommand):
    help = "Seed permissions cho các role"

    def handle(self, *args, **kwargs):
        for role_code, permission_codes in ROLE_PERMISSIONS.items():
            role = Role.objects.filter(code=role_code).first()

            if not role:
                self.stdout.write(
                    self.style.WARNING(f"Không tìm thấy role: {role_code}")
                )
                continue

            RolePermission.objects.filter(role=role).delete()

            # Tự động bổ sung các permission phụ thuộc khi seed
            resolved = set(permission_codes)
            for code in list(permission_codes):
                deps = PERMISSION_DEPS.get(code, [])
                resolved.update(deps)

            for permission_code in sorted(resolved):
                RolePermission.objects.create(
                    role=role,
                    code=permission_code,
                    name=PERMISSIONS.get(permission_code, permission_code)
                )

            self.stdout.write(
                self.style.SUCCESS(f"Permisson đã được gán vào vai trò: {role_code}")
            )