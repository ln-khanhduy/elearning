from apps.reviews.repositories.review_repository import ReviewRepository
from apps.courses.repositories.course_repository import CourseRepository


class ReviewService:
    """Service quản lý đánh giá / bình luận khóa học."""

    @staticmethod
    def get_all_reviews():
        """Lấy tất cả review (cho admin)."""
        return ReviewRepository.get_all()

    @staticmethod
    def get_course_reviews(course_id):
        """Lấy review công khai của một khóa học."""
        return ReviewRepository.get_by_course(course_id)

    @staticmethod
    def get_review_detail(review_id):
        """Lấy chi tiết một review kèm replies."""
        review = ReviewRepository.get_by_id(review_id)
        replies = ReviewRepository.get_replies(review_id)
        return review, replies

    @staticmethod
    def create_review(user, data):
        """Tạo review mới."""
        course = CourseRepository.get_by_id(data["course_id"])
        review_data = {
            "course": course,
            "user": user,
            "rating": data["rating"],
            "content": data["content"],
        }
        if data.get("parent"):
            parent_review = ReviewRepository.get_by_id(data["parent"])
            review_data["parent"] = parent_review
        return ReviewRepository.create(review_data)

    @staticmethod
    def update_review_status(review_id, status):
        """Cập nhật trạng thái review (PUBLISHED/HIDDEN/DELETED)."""
        return ReviewRepository.update_status(review_id, status)
