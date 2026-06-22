from rest_framework.exceptions import NotFound
from apps.reviews.models import Review
from apps.reviews.models import Review as ReviewModel


class ReviewRepository:
    """Repository quản lý truy vấn Review."""

    @staticmethod
    def get_all():
        """Lấy tất cả review (trừ DELETED), kèm user và course."""
        return Review.objects.select_related("user", "course").exclude(status=ReviewModel.Status.DELETED).order_by("-created_at")

    @staticmethod
    def get_by_id(review_id):
        """Lấy review theo ID, trả về 404 nếu không tìm thấy."""
        review = Review.objects.select_related("user", "course").filter(id=review_id).first()
        if not review:
            raise NotFound("Không tìm thấy đánh giá.")
        return review

    @staticmethod
    def get_by_course(course_id):
        """Lấy danh sách review của một khóa học (chỉ PUBLISHED)."""
        return Review.objects.select_related("user").filter(
            course_id=course_id, status=ReviewModel.Status.PUBLISHED, parent__isnull=True
        ).order_by("-created_at")

    @staticmethod
    def get_replies(review_id):
        """Lấy các phản hồi của một review."""
        return Review.objects.select_related("user").filter(parent_id=review_id, status=ReviewModel.Status.PUBLISHED).order_by("created_at")

    @staticmethod
    def create(data):
        """Tạo review mới."""
        return Review.objects.create(**data)

    @staticmethod
    def update_status(review_id, status):
        """Cập nhật trạng thái review (PUBLISHED/HIDDEN/DELETED)."""
        review = ReviewRepository.get_by_id(review_id)
        review.status = status
        review.save(update_fields=["status", "updated_at"])
        return review
