"""Quan ly GOI TRUY CAP khoa hoc (CourseAccessPlan)."""
from decimal import Decimal

from rest_framework.exceptions import PermissionDenied, ValidationError, NotFound

from apps.courses.models import CourseAccessPlan
from apps.courses.repositories import course_repository
from apps.courses.services.course_permission_service import can_manage_course


def list_plans(course_id):
    course = course_repository.get_by_id(course_id)
    return CourseAccessPlan.objects.filter(course=course).order_by("duration_days", "created_at")


def get_plan(course_id, plan_id):
    plan = CourseAccessPlan.objects.filter(id=plan_id, course_id=course_id).first()
    if not plan:
        raise NotFound("Không tìm thấy gói truy cập.")
    return plan


def create_plan(user, course_id, data):
    course = course_repository.get_by_id(course_id)
    if not can_manage_course(course, user):
        raise PermissionDenied("Bạn không có quyền quản lý gói truy cập.")

    name = (data.get("name") or "").strip()
    duration = data.get("duration_days")
    price = data.get("price")

    _validate_fields(course, name, duration, price, None)

    return CourseAccessPlan.objects.create(
        course=course,
        name=name,
        duration_days=int(duration),
        price=Decimal(str(price)),
    )


def update_plan(user, course_id, plan_id, data):
    course = course_repository.get_by_id(course_id)
    if not can_manage_course(course, user):
        raise PermissionDenied("Bạn không có quyền quản lý gói truy cập.")

    plan = get_plan(course_id, plan_id)

    name = (data.get("name") or plan.name).strip()
    duration = data.get("duration_days", plan.duration_days)
    price = data.get("price", plan.price)

    _validate_fields(course, name, duration, price, plan.id)

    plan.name = name
    plan.duration_days = int(duration)
    plan.price = Decimal(str(price))
    plan.save()
    return plan


def delete_plan(user, course_id, plan_id):
    course = course_repository.get_by_id(course_id)
    if not can_manage_course(course, user):
        raise PermissionDenied("Bạn không có quyền quản lý gói truy cập.")

    plan = get_plan(course_id, plan_id)

    if course.status == "PUBLISHED":
        raise ValidationError("Khóa học đã công khai. Không thể xóa.")

    has_usage = (
        plan.enrollments.exists() or plan.payment_transactions.exists() or plan.cart_items.exists()
    )
    if has_usage:
        raise ValidationError("Gói đã được sử dụng. Không thể xóa.")

    plan.delete()
    return True


def _validate_fields(course, name, duration, price, exclude_id):
    if not name:
        raise ValidationError({"name": "Tên gói không được để trống."})
    if len(name) > 100:
        raise ValidationError({"name": "Tên gói không được dài quá 100 ký tự."})

    dup = CourseAccessPlan.objects.filter(course=course, name=name)
    if exclude_id:
        dup = dup.exclude(id=exclude_id)
    if dup.exists():
        raise ValidationError({"name": "Khóa học này đã có gói trùng tên."})

    try:
        d = int(duration)
    except (TypeError, ValueError):
        raise ValidationError({"duration_days": "Thời gian truy cập phải là số nguyên."})
    if d <= 0:
        raise ValidationError({"duration_days": "Thời gian truy cập phải lớn hơn 0."})

    try:
        p = Decimal(str(price))
    except Exception:
        raise ValidationError({"price": "Giá gói không hợp lệ."})
    if p < 50000:
        raise ValidationError({"price": "Giá gói không được thấp hơn 50.000 VND."})

    return True
