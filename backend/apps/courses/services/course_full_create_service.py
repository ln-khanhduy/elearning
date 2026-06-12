import logging
from django.db import transaction
from django.utils.text import slugify
from apps.courses.models import Course, Category
from apps.lessons.models import Section, Lesson
from apps.quizzes.models import Quiz, Question, QuestionOption

logger = logging.getLogger(__name__)


class CourseFullCreateService:
    """
    Service tạo khóa học đầy đủ trong 1 request:
    - Tạo khóa học (course) kèm thumbnail
    - Tạo các chương (sections)
    - Tạo các bài học trong từng chương (lessons) kèm material
    - Tạo bài tập (quizzes) với câu hỏi (questions) và đáp án (options)
    
    File upload (thumbnail, material) được xử lý bởi Cloudinary storage
    (SmartMediaCloudinaryStorage) tự động khi save model.
    """

    @staticmethod
    def create_full_course(user, validated_data):
        # 1. Tách dữ liệu
        category_id = validated_data.pop("category")
        category = Category.objects.filter(id=category_id).first()

        sections_data = validated_data.pop("sections", [])
        thumbnail_file = validated_data.pop("thumbnail", None)

        # Tạo slug không trùng
        base_slug = slugify(validated_data["title"])
        if not base_slug:
            base_slug = "khoa-hoc"
        course_slug = base_slug
        counter = 1
        while Course.objects.filter(slug=course_slug).exists():
            course_slug = f"{base_slug}-{counter}"
            counter += 1

        course_data = {
            "instructor": user,
            "slug": course_slug,
            "status": "PENDING",
            "category": category,
        }
        course_data.update(validated_data)

        # Gán thumbnail (Cloudinary storage sẽ tự động upload khi course.save())
        if thumbnail_file:
            course_data["thumbnail"] = thumbnail_file

        # Tách file material ra khỏi sections_data để xử lý sau
        pending_uploads = []

        # Bước 1: Tạo course + sections + lessons + quizzes trong transaction
        with transaction.atomic():
            course = Course.objects.create(**course_data)

            for section_data in sections_data:
                lessons_data = section_data.pop("lessons", [])
                section = Section.objects.create(course=course, **section_data)

                for lesson_data in lessons_data:
                    quizzes_data = lesson_data.pop("quizzes", [])
                    lesson_slug = slugify(lesson_data["title"])

                    # Kiểm tra slug không trùng trong section
                    base_slug = lesson_slug
                    counter = 1
                    while Lesson.objects.filter(section=section, slug=lesson_slug).exists():
                        lesson_slug = f"{base_slug}-{counter}"
                        counter += 1

                    # Tách file material để xử lý sau (ngoài transaction)
                    material_file = lesson_data.pop("material_file", None)

                    lesson = Lesson.objects.create(
                        section=section,
                        slug=lesson_slug,
                        **lesson_data
                    )

                    # Lưu lại thông tin file cần upload
                    if material_file:
                        pending_uploads.append({
                            "lesson_id": lesson.id,
                            "material_file": material_file,
                        })

                    # 3. Tạo bài tập cho từng bài học
                    for quiz_data in quizzes_data:
                        questions_data = quiz_data.pop("questions", [])
                        quiz = Quiz.objects.create(lesson=lesson, **quiz_data)

                        for question_data in questions_data:
                            options_data = question_data.pop("options", [])
                            question = Question.objects.create(quiz=quiz, **question_data)

                            for option_data in options_data:
                                QuestionOption.objects.create(question=question, **option_data)

        # Bước 2: Gán file và save lesson (Cloudinary storage tự động upload) - ngoài transaction
        for upload in pending_uploads:
            lesson = Lesson.objects.get(id=upload["lesson_id"])

            if upload["material_file"]:
                lesson.material_file = upload["material_file"]
                lesson.save(update_fields=["material_file", "updated_at"])

        return course
