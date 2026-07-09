from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.reviews.repositories import review_repository
from apps.courses.repositories import course_repository


def get_all_reviews():
    """Lấy tất cả review (cho admin)."""
    return review_repository.get_all()


def get_course_reviews(course_id):
    """Lấy review công khai của một khóa học."""
    return review_repository.get_by_course(course_id)


def get_review_detail(review_id):
    """Lấy chi tiết một review kèm replies."""
    review = review_repository.get_by_id(review_id)
    replies = review_repository.get_replies(review_id)
    return review, replies


def create_review(user, data):
    """Tạo review mới. Kiểm tra duplicate + enrollment."""
    from apps.notifications import services as notif_service

    course = course_repository.get_by_id(data["course_id"])

    # Kiểm tra enrollment (chỉ học viên đã enroll mới được review)
    from apps.enrollments.models import Enrollment
    is_enrolled = Enrollment.objects.filter(
        student=user,
        course=course,
        status__in=[Enrollment.Status.ACTIVE, Enrollment.Status.COMPLETED],
    ).exists()
    if not is_enrolled:
        raise PermissionDenied("Bạn cần đăng ký khóa học trước khi đánh giá.")

    # Kiểm tra duplicate review (chỉ 1 review / khóa học)
    existing = review_repository.check_user_reviewed(user.id, course.id)
    if existing:
        raise ValidationError("Bạn đã đánh giá khóa học này rồi. Vui lòng chỉnh sửa đánh giá hiện tại.")

    review_data = {
        "course": course,
        "user": user,
    }

    # Nếu có parent (reply)
    if data.get("parent"):
        parent_review = review_repository.get_by_id(data["parent"])
        review_data["parent"] = parent_review
        review_data["content"] = data["content"]
    else:
        review_data["rating"] = data["rating"]
        review_data["content"] = data["content"]

    review_obj = review_repository.create(review_data)

    # Notify
    try:
        if data.get("parent"):
            # Reply to review -> notify the original reviewer
            parent_review = review_repository.get_by_id(data["parent"])
            instructor_name = user.get_full_name() or user.email
            notif_service.notify_review_replied(parent_review.user, instructor_name, course.title)
        else:
            # New review -> notify instructor
            if course.assigned_instructor:
                student_name = user.get_full_name() or user.email
                notif_service.notify_new_review(
                    course.assigned_instructor, student_name,
                    course.title, data.get("rating", 0), data.get("content", ""),
                )
    except Exception:
        pass

    return review_obj


def update_review(review_id, user, data):
    """Cập nhật nội dung review (chỉ chủ sở hữu)."""
    review = review_repository.get_by_id(review_id)

    if review.user_id != user.id:
        raise PermissionDenied("Bạn không có quyền sửa đánh giá này.")

    # Không cho sửa reply (parent không null)
    if review.parent_id is not None:
        raise ValidationError("Không thể sửa phản hồi.")

    rating = data.get("rating", review.rating)
    content = data.get("content", review.content)
    return review_repository.update_content(review_id, rating, content)


def delete_review(review_id, user):
    """Xóa review (soft delete) - chỉ chủ sở hữu."""
    review = review_repository.get_by_id(review_id)

    if review.user_id != user.id:
        raise PermissionDenied("Bạn không có quyền xóa đánh giá này.")

    return review_repository.update_status(review_id, "DELETED")


def update_review_status(review_id, status):
    """Cập nhật trạng thái review (PUBLISHED/HIDDEN/DELETED) - admin."""
    return review_repository.update_status(review_id, status)


def get_course_review_stats(course_id):
    return review_repository.get_course_stats(course_id)