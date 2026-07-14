from django.db import transaction
from django.utils.text import slugify
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.lessons.models import Lesson
from apps.lessons.repositories import lesson_repository
from apps.lessons.repositories import chapter_repository
from apps.courses.services import course_permission_service


def _generate_unique_slug(chapter_id, title, exclude_lesson_id=None):
    base_slug = slugify(title) or "lesson"
    slug = base_slug
    counter = 2

    queryset = Lesson.objects.filter(chapter_id=chapter_id, slug=slug)
    if exclude_lesson_id:
        queryset = queryset.exclude(id=exclude_lesson_id)

    while queryset.exists():
        slug = f"{base_slug}-{counter}"
        counter += 1
        queryset = Lesson.objects.filter(chapter_id=chapter_id, slug=slug)
        if exclude_lesson_id:
            queryset = queryset.exclude(id=exclude_lesson_id)

    return slug


def get_lessons_by_chapter(chapter_id):
    return lesson_repository.get_by_chapter(chapter_id)


def get_lesson_detail(lesson_id):
    return lesson_repository.get_by_id(lesson_id)


def create_lesson(chapter_id, user, data):
    chapter = chapter_repository.get_by_id(chapter_id)

    if not course_permission_service.can_manage_course(chapter.course, user):
        raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

    order = data.get("order")
    if order is None:
        last = lesson_repository.get_by_chapter(chapter_id).order_by("-order").first()
        data["order"] = (last.order + 1) if last else 1
    elif lesson_repository.exists_order(chapter_id, order):
        raise ValidationError({"order": "Thứ tự bài học đã tồn tại trong chương này."})

    slug = _generate_unique_slug(chapter_id, data["title"])

    data["chapter_id"] = chapter_id
    data["slug"] = slug
    return lesson_repository.create(data)


def update_lesson(lesson_id, user, data):
    lesson = lesson_repository.get_by_id(lesson_id)

    if not course_permission_service.can_manage_course(lesson.chapter.course, user):
        raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

    # Xử lý các trường integer bị gửi dưới dạng chuỗi rỗng từ FormData
    cleaned_data = {}
    for key, value in data.items():
        if key in ("order",) and (value == "" or value is None):
            continue  # Bỏ qua order rỗng
        cleaned_data[key] = value

    new_order = cleaned_data.get("order")
    if new_order is not None and new_order != lesson.order and lesson_repository.exists_order(lesson.chapter_id, new_order):
        raise ValidationError({"order": "Thứ tự bài học đã tồn tại trong chương này."})

    if "title" in cleaned_data:
        slug = _generate_unique_slug(
            lesson.chapter_id, cleaned_data["title"], exclude_lesson_id=lesson_id
        )
        lesson.slug = slug

    for key, value in cleaned_data.items():
        setattr(lesson, key, value)

    lesson.save()
    return lesson


def delete_lesson(lesson_id, user):
    lesson = lesson_repository.get_by_id(lesson_id)

    if not course_permission_service.can_manage_course(lesson.chapter.course, user):
        raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

    lesson_repository.delete(lesson_id)


def reorder_lessons(chapter_id, user, lessons_data):
    chapter = chapter_repository.get_by_id(chapter_id)

    if not course_permission_service.can_manage_course(chapter.course, user):
        raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

    ids = [item["id"] for item in lessons_data]
    orders = [item["order"] for item in lessons_data]

    if len(ids) != len(set(ids)):
        raise ValidationError({"id": "Danh sách bài học bị trùng id."})
    if len(orders) != len(set(orders)):
        raise ValidationError({"order": "Thứ tự bài học không được trùng."})

    lessons = lesson_repository.get_by_chapter(chapter_id)
    lesson_map = {lesson.id: lesson for lesson in lessons if lesson.id in ids}

    if len(lesson_map) != len(ids):
        raise ValidationError("Danh sách bài học không hợp lệ.")

    with transaction.atomic():
        for item in lessons_data:
            lesson = lesson_map[item["id"]]
            lesson.order = item["order"]
            lesson.save(update_fields=["order", "updated_at"])

    return lesson_repository.get_by_chapter(chapter_id)