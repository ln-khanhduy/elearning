from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.quizzes.repositories.quiz_repository import QuizRepository
from apps.quizzes.repositories.question_repository import QuestionRepository
from apps.courses.services.course_permission_service import CoursePermissionService


class QuestionService:
    @staticmethod
    def get_questions_by_quiz(quiz_id):
        """Lấy danh sách câu hỏi của một quiz (ủy quyền cho Repository truy vấn)."""
        return QuestionRepository.get_by_quiz(quiz_id)

    @staticmethod
    def create_question(quiz_id, user, validated_data):
        """
        Tạo câu hỏi mới trong một quiz.
        - Kiểm tra quyền quản lý khóa học (chỉ COURSE_ADMIN/SUPERADMIN)
        - Kiểm tra points > 0
        - Nếu là MCQ: kiểm tra tối thiểu 2 option, tối thiểu 1 đáp án đúng
        - Nếu là FILL_BLANK: kiểm tra correct_text_answer không được để trống
        """
        quiz = QuizRepository.get_by_id(quiz_id)

        if not CoursePermissionService.can_manage_course(quiz.lesson.chapter.course, user):
            raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

        # Auto-calculate points: tổng 10 điểm chia đều cho tất cả câu hỏi
        existing_count = QuestionRepository.get_question_count_by_quiz(quiz_id)
        total_questions = existing_count + 1
        points_per_question = round(10 / total_questions, 2) if total_questions > 0 else 1

        # Update points for existing questions
        if existing_count > 0:
            from apps.quizzes.models import Question
            Question.objects.filter(quiz_id=quiz_id).update(points=points_per_question)

        validated_data["points"] = points_per_question

        question_type = validated_data.get("question_type")
        options_data = validated_data.pop("options", [])

        validated_data["quiz"] = quiz
        question = QuestionRepository.create(validated_data)

        if question_type == "MCQ":
            if len(options_data) < 2:
                raise ValidationError({"options": "Câu hỏi trắc nghiệm phải có tối thiểu 2 đáp án."})

            correct_count = sum(1 for opt in options_data if opt.get("is_correct"))
            if correct_count < 1:
                raise ValidationError({"options": "Câu hỏi trắc nghiệm phải có tối thiểu 1 đáp án đúng."})

            for opt_data in options_data:
                opt_data["question"] = question
                QuestionRepository.create_option(opt_data)

        elif question_type == "FILL_BLANK":
            correct_text = validated_data.get("correct_text_answer")
            if not correct_text:
                raise ValidationError({"correct_text_answer": "Câu hỏi điền khuyết phải có đáp án đúng."})

        # ESSAY: không cần thêm gì

        return QuestionRepository.get_by_id(question.id)

    @staticmethod
    def update_question(question_id, user, validated_data):
        """
        Cập nhật câu hỏi.
        - Kiểm tra quyền quản lý khóa học (chỉ COURSE_ADMIN/SUPERADMIN)
        - Nếu là MCQ: cập nhật lại options (xóa cũ, tạo mới)
        """
        question = QuestionRepository.get_by_id(question_id)

        if not CoursePermissionService.can_manage_course(question.quiz.lesson.chapter.course, user):
            raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

        options_data = validated_data.pop("options", None)

        for key, value in validated_data.items():
            setattr(question, key, value)

        question.save()

        # Nếu có options mới và là MCQ, cập nhật lại options
        if options_data is not None and question.question_type == "MCQ":
            if len(options_data) < 2:
                raise ValidationError({"options": "Câu hỏi trắc nghiệm phải có tối thiểu 2 đáp án."})

            correct_count = sum(1 for opt in options_data if opt.get("is_correct"))
            if correct_count < 1:
                raise ValidationError({"options": "Câu hỏi trắc nghiệm phải có tối thiểu 1 đáp án đúng."})

            # Xóa options cũ, tạo options mới
            QuestionRepository.delete_options_by_question(question_id)
            for opt_data in options_data:
                opt_data["question"] = question
                QuestionRepository.create_option(opt_data)

        return QuestionRepository.get_by_id(question_id)

    @staticmethod
    def delete_question(question_id, user):
        """
        Xóa câu hỏi.
        - Kiểm tra quyền quản lý khóa học trước khi xóa (chỉ COURSE_ADMIN/SUPERADMIN)
        - Sau khi xóa, tự động chia lại 10 điểm cho các câu hỏi còn lại
        """
        question = QuestionRepository.get_by_id(question_id)
        quiz_id = question.quiz_id

        if not CoursePermissionService.can_manage_course(question.quiz.lesson.chapter.course, user):
            raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

        QuestionRepository.delete(question_id)

        # Recalculate points for remaining questions
        remaining_count = QuestionRepository.get_question_count_by_quiz(quiz_id)
        if remaining_count > 0:
            from apps.quizzes.models import Question
            points_per_question = round(10 / remaining_count, 2)
            Question.objects.filter(quiz_id=quiz_id).update(points=points_per_question)
