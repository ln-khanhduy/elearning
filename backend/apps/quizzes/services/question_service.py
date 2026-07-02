from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.quizzes.repositories import quiz_repository
from apps.quizzes.repositories import question_repository
from apps.courses.services.course_permission_service import can_manage_course


def get_questions_by_quiz(quiz_id):
    return question_repository.get_by_quiz(quiz_id)


def create_question(quiz_id, user, validated_data):
    quiz = quiz_repository.get_by_id(quiz_id)

    if not can_manage_course(quiz.lesson.chapter.course, user):
        raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

    question_type = validated_data.get("question_type")
    options_data = validated_data.pop("options", [])

    validated_data["quiz"] = quiz

    if question_type in ("MCQ", "FILL_BLANK"):
        existing_count = question_repository.get_question_count_by_quiz_and_type(quiz_id, question_type)
        total_questions = existing_count + 1
        points_per_question = round(10 / total_questions, 2) if total_questions > 0 else 1

        if existing_count > 0:
            from apps.quizzes.models import Question
            Question.objects.filter(quiz_id=quiz_id, question_type=question_type).update(points=points_per_question)

        validated_data["points"] = points_per_question
    else:
        if "points" not in validated_data or validated_data["points"] is None:
            validated_data["points"] = 1

    question = question_repository.create(validated_data)

    if question_type == "MCQ":
        if len(options_data) < 2:
            raise ValidationError({"options": "Câu hỏi trắc nghiệm phải có tối thiểu 2 đáp án."})

        correct_count = sum(1 for opt in options_data if opt.get("is_correct"))
        if correct_count < 1:
            raise ValidationError({"options": "Câu hỏi trắc nghiệm phải có tối thiểu 1 đáp án đúng."})

        for opt_data in options_data:
            opt_data["question"] = question
            question_repository.create_option(opt_data)

    elif question_type == "FILL_BLANK":
        correct_text = validated_data.get("correct_text_answer")
        if not correct_text:
            raise ValidationError({"correct_text_answer": "Câu hỏi điền khuyết phải có đáp án đúng."})

    return question_repository.get_by_id(question.id)


def update_question(question_id, user, validated_data):
    question = question_repository.get_by_id(question_id)

    if not can_manage_course(question.quiz.lesson.chapter.course, user):
        raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

    options_data = validated_data.pop("options", None)

    for key, value in validated_data.items():
        setattr(question, key, value)

    question.save()

    if options_data is not None and question.question_type == "MCQ":
        if len(options_data) < 2:
            raise ValidationError({"options": "Câu hỏi trắc nghiệm phải có tối thiểu 2 đáp án."})

        correct_count = sum(1 for opt in options_data if opt.get("is_correct"))
        if correct_count < 1:
            raise ValidationError({"options": "Câu hỏi trắc nghiệm phải có tối thiểu 1 đáp án đúng."})

        question_repository.delete_options_by_question(question_id)
        for opt_data in options_data:
            opt_data["question"] = question
            question_repository.create_option(opt_data)

    return question_repository.get_by_id(question_id)


def delete_question(question_id, user):
    question = question_repository.get_by_id(question_id)
    quiz_id = question.quiz_id

    if not can_manage_course(question.quiz.lesson.chapter.course, user):
        raise PermissionDenied("Bạn không có quyền thao tác với khóa học này.")

    question_type = question.question_type

    question_repository.delete(question_id)

    if question_type in ("MCQ", "FILL_BLANK"):
        remaining_count = question_repository.get_question_count_by_quiz_and_type(quiz_id, question_type)
        if remaining_count > 0:
            from apps.quizzes.models import Question
            points_per_question = round(10 / remaining_count, 2)
            Question.objects.filter(quiz_id=quiz_id, question_type=question_type).update(points=points_per_question)