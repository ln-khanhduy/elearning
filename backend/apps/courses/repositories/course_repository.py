from rest_framework.exceptions import NotFound
from apps.courses.models import Course

class CourseRepository:
    @staticmethod
    def get_all():
        return Course.objects.select_related("instructor", "category").all().order_by("-created_at")

    @staticmethod
    def get_by_id(course_id):
        course = Course.objects.select_related("instructor", "category").filter(id=course_id).first()
        if not course:
            raise NotFound("Không tìm thấy khóa học.")
        return course
    
    @staticmethod
    def get_pending_courses():
        return Course.objects.select_related("instructor", "category").filter(status="pending").order_by("-updated_at")

    @staticmethod
    def create(data):
        return Course.objects.create(**data)
    

    @staticmethod
    def search(keyword=None, status_value=None, category_id=None):
        listcourse = CourseRepository.get_all()

        if keyword:
            listcourse = listcourse.filter(title__icontains=keyword)

        if status_value:
            listcourse = listcourse.filter(status=status_value)

        if category_id:
            listcourse = listcourse.filter(category_id=category_id)
        return listcourse
    
    @staticmethod
    def exitst_by_id(course_id):
        return Course.objects.filter(id=course_id).exists()