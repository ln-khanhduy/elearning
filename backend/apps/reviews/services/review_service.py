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
    """Tạo review mới."""
    course = course_repository.get_by_id(data["course_id"])
    review_data = {
        "course": course,
        "user": user,
        "rating": data["rating"],
        "content": data["content"],
    }
    if data.get("parent"):
        parent_review = review_repository.get_by_id(data["parent"])
        review_data["parent"] = parent_review
    return review_repository.create(review_data)


def update_review_status(review_id, status):
    """Cập nhật trạng thái review (PUBLISHED/HIDDEN/DELETED)."""
    return review_repository.update_status(review_id, status)