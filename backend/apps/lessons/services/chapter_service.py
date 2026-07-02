from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.courses.repositories import course_repository
from apps.courses.services import course_permission_service
from apps.lessons.repositories import chapter_repository


def get_chapters_by_course(course_id):
    return chapter_repository.get_by_course(course_id)


def create_chapter(course_id, user, validated_data):
    course = course_repository.get_by_id(course_id)

    if not course_permission_service.can_manage_course(course, user):
        raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

    order = validated_data.get("order")
    if order is None:
        order = chapter_repository.get_next_order(course_id)
        validated_data["order"] = order
    elif chapter_repository.exists_order(course_id, order):
        raise ValidationError({"order": "Thứ tự chương đã tồn tại trong khóa học này."})

    validated_data["course"] = course
    return chapter_repository.create(validated_data)


def update_chapter(chapter_id, user, validated_data):
    chapter = chapter_repository.get_by_id(chapter_id)

    if not course_permission_service.can_manage_course(chapter.course, user):
        raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

    new_order = validated_data.get("order")
    if new_order is not None and new_order != chapter.order:
        if chapter_repository.exists_order(chapter.course_id, new_order):
            raise ValidationError({"order": "Thứ tự chương đã tồn tại trong khóa học này."})

    for key, value in validated_data.items():
        setattr(chapter, key, value)

    chapter.save()
    return chapter


def delete_chapter(chapter_id, user):
    chapter = chapter_repository.get_by_id(chapter_id)

    if not course_permission_service.can_manage_course(chapter.course, user):
        raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

    chapter_repository.delete(chapter_id)


def reorder_chapter(course_id, user, chapter_data):
    course = course_repository.get_by_id(course_id)

    if not course_permission_service.can_manage_course(course, user):
        raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

    chapter_ids = [item.get("id") for item in chapter_data]
    orders = [item.get("order") for item in chapter_data]

    if len(orders) != len(set(orders)):
        raise ValidationError({"order": "Thứ tự chương không được trùng."})

    chapters = chapter_repository.get_by_course(course_id)
    chapter_map = {ch.id: ch for ch in chapters if ch.id in chapter_ids}

    if len(chapter_map) != len(chapter_ids):
        raise ValidationError("Danh sách chương không hợp lệ.")

    with transaction.atomic():
        for item in chapter_data:
            ch = chapter_map.get(item.get("id"))
            if not ch:
                raise ValidationError("Danh sách chương không hợp lệ.")
            ch.order = item.get("order")
            ch.save(update_fields=["order", "updated_at"])

    return chapter_repository.get_by_course(course_id)