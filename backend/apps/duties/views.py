from rest_framework import status
from rest_framework.views import APIView

from apps.common.base_api_view import BasePermissionAPIView
from apps.common.response_helpers import success_response, error_response
from apps.duties import services


class DutyScheduleListCreateAPIView(BasePermissionAPIView):
    """GET/POST /api/duty-schedules/ - Xem/tạo lịch trực (USER_MANAGER)."""
    required_permission = "instructor.duty.manage"

    def get(self, request):
        qs = services.list_schedules(
            request.user,
            instructor_id=request.GET.get("instructor_id"),
            date_from=request.GET.get("date_from"),
            date_to=request.GET.get("date_to"),
        )
        return success_response([_sched(s) for s in qs])

    def post(self, request):
        try:
            sched = services.create_schedule(
                request.user,
                instructor_id=request.data.get("instructor_id"),
                date=request.data.get("date"),
                shift=request.data.get("shift"),
                start_time=request.data.get("start_time"),
                end_time=request.data.get("end_time"),
                makeup_for_id=request.data.get("makeup_for_id"),
            )
        except Exception as e:
            return error_response(str(e), http_status=status.HTTP_400_BAD_REQUEST)
        return success_response(_sched(sched), "Đã sắp lịch trực.", status.HTTP_201_CREATED)


class DutyScheduleUpdateAPIView(BasePermissionAPIView):
    """PATCH /api/duty/duty-schedules/{id}/update/ - Cập nhật ca trực."""
    required_permission = "instructor.duty.manage"

    def patch(self, request, schedule_id):
        try:
            sched = services.update_schedule(request.user, schedule_id, request.data)
        except Exception as e:
            return error_response(str(e), http_status=status.HTTP_400_BAD_REQUEST)
        return success_response(_sched(sched), "Đã cập nhật ca trực.")


class DutyScheduleCancelAPIView(BasePermissionAPIView):
    """POST /api/duty-schedules/{id}/cancel/ - Hủy ca trực."""
    required_permission = "instructor.duty.manage"

    def post(self, request, schedule_id):
        try:
            sched = services.cancel_schedule(request.user, schedule_id)
        except Exception as e:
            return error_response(str(e), http_status=status.HTTP_400_BAD_REQUEST)
        return success_response(_sched(sched), "Đã xóa ca trực.")


class InstructorMyAttendanceAPIView(BasePermissionAPIView):
    """GET /api/instructor/attendance/ - Chấm công của giảng viên."""
    required_permission = "instructor.duty.view"

    def get(self, request):
        from apps.duties.models import InstructorAttendanceLog
        logs = InstructorAttendanceLog.objects.filter(instructor=request.user).order_by("-login_at")
        return success_response([_log(l) for l in logs])


class InstructorMySchedulesAPIView(BasePermissionAPIView):
    """GET /api/duty/instructor/my-schedules/ - Lịch trực của giảng viên đang đăng nhập."""
    required_permission = "instructor.duty.view"

    def get(self, request):
        qs = services.list_schedules(request.user, instructor_id=request.user.id)
        return success_response([_sched(s) for s in qs])


class DutyReplaceAPIView(BasePermissionAPIView):
    """POST /api/duty/duty-schedules/{id}/replace/ - Bù giờ (BR-1.9): đổi ca + ghi chú + báo học viên."""
    required_permission = "instructor.duty.manage"

    def post(self, request, schedule_id):
        date = request.data.get("date")
        shift = request.data.get("shift")
        if not date or not shift:
            return error_response("Thiếu ngày/ca mới.", http_status=status.HTTP_400_BAD_REQUEST)
        try:
            result = services.replace_schedule(request.user, schedule_id, date, shift)
        except Exception as e:
            return error_response(str(e), http_status=status.HTTP_400_BAD_REQUEST)
        return success_response({"old": _sched(result["old"]), "new": _sched(result["new"])}, "Đã sắp lịch bù.")


class InstructorMissingHoursAPIView(BasePermissionAPIView):
    """GET /api/duty/instructor/missing-hours/ - Danh sách ca thiếu giờ chưa bù (INSTRUCTOR_MANAGER)."""
    required_permission = "instructor.duty.manage"

    def get(self, request):
        instructor_id = request.GET.get("instructor_id")
        month = request.GET.get("month")  # YYYY-MM
        if not instructor_id:
            return error_response("Thiếu instructor_id.", http_status=status.HTTP_400_BAD_REQUEST)
        logs = services.list_instructor_missing_hours(instructor_id, month)
        return success_response([_log(l) for l in logs])


class DutyCheckInAPIView(BasePermissionAPIView):
    """POST /api/duty/duty-schedules/{id}/check-in/ - Bắt đầu ca (login) - bộ đếm 120p."""
    required_permission = "instructor.duty.view"

    def post(self, request, schedule_id):
        from apps.duties.models import DutySchedule
        sched = DutySchedule.objects.filter(id=schedule_id, instructor=request.user).first()
        if not sched:
            return error_response("Không tìm thấy ca trực của bạn.", http_status=status.HTTP_400_BAD_REQUEST)
        log = services.create_attendance(request.user, sched)
        return success_response(_log(log), "Đã bắt đầu ca trực (bộ đếm chạy).", status.HTTP_201_CREATED)


class DutyCheckOutAPIView(BasePermissionAPIView):
    """POST /api/duty/duty-schedules/{id}/check-out/ - Kết thúc ca (logout) - tính số phút + cảnh báo."""
    required_permission = "instructor.duty.view"

    def post(self, request, schedule_id):
        from apps.duties.models import DutySchedule
        sched = DutySchedule.objects.filter(id=schedule_id, instructor=request.user).first()
        if not sched:
            return error_response("Không tìm thấy ca trực của bạn.", http_status=status.HTTP_400_BAD_REQUEST)
        log = services.log_logout(request.user, sched)
        if not log:
            return error_response("Chưa check-in ca này.", http_status=status.HTTP_400_BAD_REQUEST)
        return success_response(_log(log), "Đã kết thúc ca trực.")


class AdminInstructorPaymentsAPIView(BasePermissionAPIView):
    """GET /api/admin/instructor-payments/ - Danh sách lương (SUPERADMIN/USER_MANAGER)."""
    required_permission = "instructor.payment.view"

    def get(self, request):
        from apps.duties.models import InstructorPayment
        qs = InstructorPayment.objects.select_related("instructor").order_by("-month")
        return success_response([_pay(p) for p in qs])


class InstructorMyPaymentsAPIView(BasePermissionAPIView):
    """GET /api/instructor/my-payments/ - Lương của giảng viên đang đăng nhập."""
    required_permission = "instructor.duty.view"

    def get(self, request):
        from apps.duties.models import InstructorPayment
        qs = InstructorPayment.objects.filter(instructor=request.user).order_by("-month")
        return success_response([_pay(p) for p in qs])


class InstructorMyPaymentColumnsAPIView(BasePermissionAPIView):
    """GET /api/instructor/my-payment-columns/ - Danh sách cột động cho giảng viên xem lương."""
    required_permission = "instructor.duty.view"

    def get(self, request):
        cols = services.list_payment_columns()
        return success_response([
            {"id": c.id, "name": c.name, "column_type": c.column_type}
            for c in cols
        ])


class ComputeAllPaymentsAPIView(BasePermissionAPIView):
    """POST /api/admin/instructor-payments/compute-all/ - Tổng hợp lương TẤT CẢ giảng viên 1 tháng."""
    required_permission = "instructor.payment.manage"

    def post(self, request):
        month = request.data.get("month")
        if not month:
            return error_response("Thiếu month (YYYY-MM).", http_status=status.HTTP_400_BAD_REQUEST)
        results = services.compute_all_payments(month)
        return success_response({"count": len(results), "results": results}, "Đã tổng hợp lương.")


class ComputePaymentAPIView(BasePermissionAPIView):
    """POST /api/admin/instructor-payments/compute/ - Tính lương tháng cho 1 giảng viên."""
    required_permission = "instructor.payment.manage"

    def post(self, request):
        instructor_id = request.data.get("instructor_id")
        month = request.data.get("month")
        if not instructor_id or not month:
            return error_response("Thiếu instructor_id hoặc month (YYYY-MM).", http_status=status.HTTP_400_BAD_REQUEST)
        try:
            payment = services.compute_monthly_payment(instructor_id, month)
        except Exception as e:
            return error_response(str(e), http_status=status.HTTP_400_BAD_REQUEST)
        return success_response(_pay(payment), "Đã tính lương tháng.")


class ApprovePaymentAPIView(BasePermissionAPIView):
    """POST /api/admin/instructor-payments/{id}/approve/ - Duyệt / hủy duyệt bảng lương."""
    required_permission = "instructor.payment.manage"

    def post(self, request, payment_id):
        approve = request.data.get("approve", True)
        try:
            payment = services.approve_payment(request.user, payment_id, approve)
        except Exception as e:
            return error_response(str(e), http_status=status.HTTP_400_BAD_REQUEST)
        return success_response(_pay(payment), "Đã cập nhật trạng thái duyệt.")


class PaymentColumnsAPIView(BasePermissionAPIView):
    """GET /api/admin/instructor-payments/columns/ - Danh sách cột động."""
    required_permission = "instructor.payment.manage"

    def get(self, request):
        from apps.duties.models import InstructorPaymentColumn
        cols = services.list_payment_columns()
        return success_response([
            {"id": c.id, "name": c.name, "column_type": c.column_type}
            for c in cols
        ])


class PaymentColumnCreateAPIView(BasePermissionAPIView):
    """POST /api/admin/instructor-payments/columns/ - Tạo cột động."""
    required_permission = "instructor.payment.manage"

    def post(self, request):
        name = request.data.get("name")
        column_type = request.data.get("column_type")
        try:
            col = services.create_payment_column(name, column_type)
        except Exception as e:
            return error_response(str(e), http_status=status.HTTP_400_BAD_REQUEST)
        return success_response({"id": col.id, "name": col.name, "column_type": col.column_type}, "Đã tạo cột.")


class PaymentColumnDeleteAPIView(BasePermissionAPIView):
    """DELETE /api/admin/instructor-payments/columns/{id}/ - Xóa cột động."""
    required_permission = "instructor.payment.manage"

    def delete(self, request, column_id):
        try:
            services.delete_payment_column(column_id)
        except Exception as e:
            return error_response(str(e), http_status=status.HTTP_400_BAD_REQUEST)
        return success_response({}, "Đã xóa cột.")


class PaymentColumnValueAPIView(BasePermissionAPIView):
    """POST /api/admin/instructor-payments/{id}/columns/{column_id}/ - Nhập giá trị cột động."""
    required_permission = "instructor.payment.manage"

    def post(self, request, payment_id, column_id):
        amount = request.data.get("amount")
        if amount is None:
            return error_response("Thiếu amount.", http_status=status.HTTP_400_BAD_REQUEST)
        try:
            payment = services.set_payment_column_value(request.user, payment_id, column_id, amount)
        except Exception as e:
            return error_response(str(e), http_status=status.HTTP_400_BAD_REQUEST)
        return success_response(_pay(payment), "Đã cập nhật giá trị cột.")


class MarkPaymentPaidAPIView(BasePermissionAPIView):
    """POST /api/admin/instructor-payments/{id}/paid/ - Đánh dấu đã chi trả."""
    required_permission = "instructor.payment.manage"

    def post(self, request, payment_id):
        try:
            payment = services.mark_payment_paid(request.user, payment_id)
        except Exception as e:
            return error_response(str(e), http_status=status.HTTP_400_BAD_REQUEST)
        return success_response(_pay(payment), "Đã đánh dấu chi trả.")


class ExportInstructorPaymentsExcelAPIView(BasePermissionAPIView):
    """GET /api/admin/instructor-payments/export/ - Xuất bảng lương ra file Excel.

    Query params:
    - month (bắt buộc, YYYY-MM): tháng + năm cần xuất.
    - instructor_id (tùy chọn): xuất bảng lương của 1 giảng viên duy nhất.
      Không truyền -> xuất tất cả giảng viên trong tháng đó.
    """
    required_permission = "instructor.payment.view"

    def get(self, request):
        from django.http import HttpResponse

        month = request.GET.get("month")
        instructor_id = request.GET.get("instructor_id") or None

        if not month:
            return error_response(
                "Thiếu tháng và năm. Vui lòng chọn tháng/năm trước khi xuất file.",
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            bio = services.export_payments_excel(month, instructor_id)
        except Exception as e:
            return error_response(str(e), http_status=status.HTTP_400_BAD_REQUEST)

        # Tạo tên file: bang-luong-YYYY-MM khi xuất tất cả,
        # bang-luong-{instructor}-YYYY-MM khi xuất 1 giảng viên
        filename = f"bang-luong-{month}"
        if instructor_id:
            from apps.duties.models import InstructorPayment
            p = InstructorPayment.objects.filter(
                month=month, instructor_id=instructor_id
            ).select_related("instructor").first()
            if p:
                name = p.instructor.get_full_name() or p.instructor.email
                filename = f"bang-luong-{name}-{month}"

        response = HttpResponse(
            bio.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}.xlsx"'
        return response


def _sched(s):
    return {
        "id": s.id, "instructor_id": s.instructor_id,
        "instructor_name": s.instructor.get_full_name() or s.instructor.email,
        "date": s.date, "shift": s.shift, "start_time": s.start_time,
        "duration_minutes": s.duration_minutes, "status": s.status,
        "schedule_type": s.schedule_type, "makeup_for_id": s.makeup_for_id,
    }


def _log(l):
    return {
        "id": l.id, "schedule_id": l.schedule_id, "login_at": l.login_at, "logout_at": l.logout_at,
        "counter_start": l.counter_start, "counter_end": l.counter_end,
        "counted_minutes": l.counted_minutes, "actual_minutes": l.actual_minutes,
        "missing_minutes": l.missing_minutes, "status": l.status,
    }


def _pay(p):
    return {
        "id": p.id, "instructor_id": p.instructor_id,
        "instructor_name": p.instructor.get_full_name() or p.instructor.email,
        "month": p.month, "status": p.status, "settlement_date": p.updated_at.date().isoformat() if p.updated_at else None,
        "regular_hours": float(p.regular_hours), "overtime_hours": float(p.overtime_hours),
        "total_hours": float(p.total_hours),
        "regular_amount": float(p.regular_amount), "overtime_amount": float(p.overtime_amount),
        "salary_amount": float(p.salary_amount),
        "net_amount": float(p.net_amount),
        "column_values": [
            {"column_id": v.column_id, "amount": float(v.amount)}
            for v in p.column_values.all()
        ],
    }
