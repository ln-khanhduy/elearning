from django.conf import settings
from django.db import models


class Quiz(models.Model):
    """
    Bài kiểm tra - thuộc về một bài học.
    Mỗi bài học có thể có nhiều quiz.
    """
    class Status(models.TextChoices):
        IN_PROCESS = 'IN_PROCESS', 'In Process'
        ACTIVE = 'ACTIVE', 'Active'

    lesson = models.ForeignKey('lessons.Lesson', on_delete=models.CASCADE, related_name='quizzes')
    title = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    time_limit_minutes = models.IntegerField(default=0)  # 0 = không giới hạn
    passing_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # Điểm đạt yêu cầu (VD: 5.0)
    # True = học viên có thể làm bài; False = đang ẩn (giảng viên chưa mở)
    is_active = models.BooleanField(default=False)
    # Loại bài tập: Trắc nghiệm, Tự luận, Điền khuyết
    quiz_type = models.CharField(max_length=20, choices=[('MCQ', 'Trắc nghiệm'), ('ESSAY', 'Tự luận'), ('FILL_BLANK', 'Điền khuyết')], default='MCQ')
    # Trạng thái quiz
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.IN_PROCESS)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'quiz'


class Question(models.Model):
    """
    Câu hỏi - thuộc về một quiz.
    """
    class Difficulty(models.TextChoices):
        EASY = 'EASY', 'Easy'
        MEDIUM = 'MEDIUM', 'Medium'
        HARD = 'HARD', 'Hard'

    class QuestionType(models.TextChoices):
        MCQ = 'MCQ', 'Multiple choice'
        FILL_BLANK = 'FILL_BLANK', 'Fill blank'
        ESSAY = 'ESSAY', 'Essay'

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    prompt = models.TextField()  # Nội dung câu hỏi
    difficulty = models.CharField(max_length=10, choices=Difficulty.choices, default=Difficulty.EASY)
    points = models.DecimalField(max_digits=5, decimal_places=2, default=10)  # Điểm tối đa
    order = models.IntegerField(default=0)  # Thứ tự câu hỏi trong quiz
    # Loại câu hỏi
    question_type = models.CharField(max_length=20, choices=QuestionType.choices, default=QuestionType.MCQ)
    # Đáp án đúng cho FILL_BLANK
    correct_text_answer = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'question'
        ordering = ['order', 'id']


class QuestionOption(models.Model):
    """
    Đáp án cho câu hỏi MCQ.
    Mỗi câu hỏi MCQ có nhiều đáp án, trong đó có 1 hoặc nhiều đáp án đúng.
    """
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    text = models.TextField()  # Nội dung đáp án
    is_correct = models.BooleanField(default=False)  # Đáp án đúng?
    order = models.IntegerField(default=0)  # Thứ tự hiển thị

    class Meta:
        db_table = 'question_option'
        ordering = ['order', 'id']


class QuizAttempt(models.Model):
    """
    Lần làm bài của học viên.
    Mỗi lần học viên nộp bài là một attempt.
    """
    class Status(models.TextChoices):
        IN_PROGRESS = 'IN_PROGRESS', 'In progress'
        SUBMITTED = 'SUBMITTED', 'Submitted'
        GRADED = 'GRADED', 'Graded'

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.IN_PROGRESS)
    score = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # Điểm sau khi chấm
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'quiz_attempt'


class QuizAttemptAnswer(models.Model):
    """
    Câu trả lời của học viên trong một lần làm bài.
    """
    class Status(models.TextChoices):
        SUBMITTED = 'SUBMITTED', 'Submitted'
        GRADED = 'GRADED', 'Graded'

    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='attempt_answers')
    selected_option = models.ForeignKey(QuestionOption, on_delete=models.SET_NULL, null=True, blank=True)
    answer_text = models.TextField(null=True, blank=True)  # Câu trả lời dạng text (FILL_BLANK, ESSAY)
    is_correct = models.BooleanField(default=False)
    score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.SUBMITTED)
    graded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'quiz_attempt_answer'
