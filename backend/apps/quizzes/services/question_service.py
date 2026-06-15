from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.quizzes.repositories.quiz_repository import QuizRepository
from apps.quizzes.repositories.question_repository import QuestionRepository


class QuestionService:
    @staticmethod
    def check_course_owner(course, user):
        """Kiểm tra user có phải là chủ sở hữu khóa học không. SUPERADMIN luôn được phép."""
        if user.role and user.role.code == "SUPERADMIN":
            return
        if course.instructor_id != user.id:
            raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

    @staticmethod
    def get_questions_by_quiz(quiz_id):
        """Lấy danh sách câu hỏi của một quiz (ủy quyền cho Repository truy vấn)."""
        return QuestionRepository.get_by_quiz(quiz_id)

    @staticmethod
    def create_question(quiz_id, user, validated_data):
        """
        Tạo câu hỏi mới trong một quiz.
        - Kiểm tra quyền sở hữu khóa học
        - Kiểm tra points > 0
        - Nếu là MCQ: kiểm tra tối thiểu 2 option, tối thiểu 1 đáp án đúng
        - Nếu là FILL_BLANK: kiểm tra correct_text_answer không được để trống
        """
        quiz = QuizRepository.get_by_id(quiz_id)
        QuestionService.check_course_owner(quiz.lesson.section.course, user)

        points = validated_data.get("points")
        if points is not None and points <= 0:
            raise ValidationError({"points": "Điểm số phải lớn hơn 0."})

        question_type = validated_data.get("question_type")
        options_data = validated_data.pop("options", [])

        validated_data["quiz"] = quiz
        question = QuestionRepository.create(validated_data)

        if question_type == "MCQ":
            if len(options_data) < 2:
                raise ValidationError({"options": "Câu hỏi MCQ phải có tối thiểu 2 đáp án."})

            correct_count = sum(1 for opt in options_data if opt.get("is_correct"))
            if correct_count < 1:
                raise ValidationError({"options": "Câu hỏi MCQ phải có tối thiểu 1 đáp án đúng."})

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
        - Kiểm tra quyền sở hữu khóa học
        - Nếu là MCQ: cập nhật lại options (xóa cũ, tạo mới)
        """
        question = QuestionRepository.get_by_id(question_id)
        QuestionService.check_course_owner(question.quiz.lesson.section.course, user)

        options_data = validated_data.pop("options", None)

        for key, value in validated_data.items():
            setattr(question, key, value)

        question.save()

        # Nếu có options mới và là MCQ, cập nhật lại options
        if options_data is not None and question.question_type == "MCQ":
            if len(options_data) < 2:
                raise ValidationError({"options": "Câu hỏi MCQ phải có tối thiểu 2 đáp án."})

            correct_count = sum(1 for opt in options_data if opt.get("is_correct"))
            if correct_count < 1:
                raise ValidationError({"options": "Câu hỏi MCQ phải có tối thiểu 1 đáp án đúng."})

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
        - Kiểm tra quyền sở hữu khóa học trước khi xóa
        """
        question = QuestionRepository.get_by_id(question_id)
        QuestionService.check_course_owner(question.quiz.lesson.section.course, user)
        QuestionRepository.delete(question_id)
