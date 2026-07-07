from rest_framework.exceptions import NotFound
from apps.reviews.models import Review
from apps.reviews.models import Review as ReviewModel
def get_all():
    """Lấy tất cả review (trừ DELETED), kèm user và course."""
    return Review.objects.select_related("user", "course").exclude(status=ReviewModel.Status.DELETED).order_by("-created_at")
def get_by_id(review_id):
    """Lấy review theo ID, trả về 404 nếu không tìm thấy."""
    review = Review.objects.select_related("user", "course").filter(id=review_id).first()
    if not review:
        raise NotFound("Không tìm thấy đánh giá.")
    return review
def get_by_course(course_id):
    """Lấy danh sách review của một khóa học (chỉ PUBLISHED)."""
    return Review.objects.select_related("user").filter(
        course_id=course_id, status=ReviewModel.Status.PUBLISHED, parent__isnull=True
    ).order_by("-created_at")
def get_replies(review_id):
    """Lấy các phản hồi của một review."""
    return Review.objects.select_related("user").filter(parent_id=review_id, status=ReviewModel.Status.PUBLISHED).order_by("created_at")
def create(data):
    """Tạo review mới."""
    return Review.objects.create(**data)
def update_status(review_id, status):
    """Cập nhật trạng thái review (PUBLISHED/HIDDEN/DELETED)."""
    review = get_by_id(review_id)
    review.status = status
    review.save(update_fields=["status", "updated_at"])
    return review
def update_content(review_id, rating, content):
    """Cập nhật nội dung và rating của review (chỉ chủ sở hữu)."""
    review = get_by_id(review_id)
    review.rating = rating
    review.content = content
    from django.utils import timezone
    review.edited_at = timezone.now()
    review.save(update_fields=["rating", "content", "edited_at", "updated_at"])
    return review
def get_course_stats(course_id):
    """Lấy thống kê đánh giá của khóa học (avg rating, total count, phân phối sao)."""
    from django.db.models import Avg, Count
    stats = Review.objects.filter(
        course_id=course_id,
        status=ReviewModel.Status.PUBLISHED,
        parent__isnull=True,
        rating__isnull=False,
    ).aggregate(
        avg_rating=Avg("rating"),
        total_count=Count("id"),
    )
    # Rating distribution
    distribution = (
        Review.objects.filter(
            course_id=course_id,
            status=ReviewModel.Status.PUBLISHED,
            parent__isnull=True,
            rating__isnull=False,
        )
        .values("rating")
        .annotate(count=Count("id"))
        .order_by("rating")
    )
    dist_map = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for d in distribution:
        dist_map[d["rating"]] = d["count"]
    return {
        "avg_rating": round(float(stats["avg_rating"]), 1) if stats["avg_rating"] else 0,
        "total_count": stats["total_count"] or 0,
        "distribution": dist_map,
    }
def check_user_reviewed(user_id, course_id):
    """Kiểm tra user đã review khóa học chưa (trả về review nếu có)."""
    return Review.objects.filter(
        user_id=user_id,
        course_id=course_id,
        parent__isnull=True,
        status__in=[ReviewModel.Status.PUBLISHED, ReviewModel.Status.HIDDEN],
    ).first()