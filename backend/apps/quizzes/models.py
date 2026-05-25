from django.db import models


class Quiz(models.Model):
    """
    Bài kiểm tra gắn với một bài học (Lesson).
    Một Lesson có thể có nhiều Quiz; học viên cần đạt passing_score để hoàn thành bài học.
    """
    QUIZ_STATUS_CHOICES = (
        ('ACTIVE', 'Active'),        # Bài tập đang mở công khai, học sinh làm bình thường
        ('IN_PROCESS', 'In Process'),  # Giảng viên đang sửa đề, hệ thống đợi học sinh làm xong để cập nhật
    )
    # Bài học chứa quiz này
    lesson = models.ForeignKey('lessons.Lesson', on_delete=models.CASCADE, related_name='quizzes')
    time_limit_minutes = models.PositiveIntegerField(null=True, blank=True)  # Thời gian làm bài (phút), NULL = không giới hạn
    title = models.CharField(max_length=255)              # Tên bài kiểm tra
    description = models.TextField(null=True, blank=True) # Hướng dẫn / mô tả cho học viên
    # Điểm tối thiểu để qua bài (VD: 7.0 / 10.0)
    passing_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    # True = học viên có thể làm bài; False = đang ẩn (giảng viên chưa mở)
    status = models.CharField(max_length=20, choices=QUIZ_STATUS_CHOICES, default='IN_PROCESS')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'quiz'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['lesson', 'status']),  # Lọc quiz theo bài học và trạng thái
        ]


class Question(models.Model):
    """
    Câu hỏi trong một Quiz.
    Hỗ trợ 4 dạng: trắc nghiệm, điền vào chỗ trống, trả lời ngắn, tự luận.
    """
    QUESTION_TYPES = (
        ('MCQ', 'Multiple choice'),      # Trắc nghiệm - có options, chọn đáp án đúng
        ('FILL_BLANK', 'Fill blank'),    # Điền vào chỗ trống - đối chiếu với correct_text_answer
        ('ESSAY', 'Essay'),              # Tự luận - giảng viên chấm qua Submission
    )

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    prompt = models.TextField()                           # Nội dung câu hỏi
    order = models.PositiveIntegerField(default=0)        # Thứ tự hiển thị trong bài (số nhỏ trước)
    points = models.DecimalField(max_digits=3, decimal_places=2, default=1)  # Điểm tối đa của câu hỏi
    # Đáp án dạng text (dùng cho FILL_BLANK, hệ thống so sánh tự động)
    correct_text_answer = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'quiz_question'
        ordering = ['order', 'id']
        indexes = [
            models.Index(fields=['quiz', 'order']),
        ]


class QuestionOption(models.Model):
    """
    Lựa chọn đáp án cho câu hỏi dạng MCQ.
    Mỗi câu hỏi có nhiều options; is_correct=True đánh dấu đáp án đúng.
    """
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    text = models.CharField(max_length=255)          # Nội dung lựa chọn
    is_correct = models.BooleanField(default=False)  # True = đây là đáp án đúng
    order = models.PositiveIntegerField(default=0)   # Thứ tự hiển thị (để xáo trộn khi cần)

    class Meta:
        db_table = 'quiz_option'
        ordering = ['order', 'id']
        indexes = [
            models.Index(fields=['question', 'order']),
        ]


class QuizAttempt(models.Model):
    """
    Thông tin một lần làm bài của học viên cho một Quiz.
    Học viên có thể làm nhiều lần (nhiều attempt cho cùng 1 quiz).
    score được tính khi status chuyển sang GRADED.
    """
    STATUS_CHOICES = (
        ('IN_PROGRESS', 'In progress'),  # Đang làm bài, chưa nộp
        ('SUBMITTED', 'Submitted'),      # Đã nộp, đang chờ chấm (hoặc chờ auto-grade)
        ('GRADED', 'Graded'),            # Đã có điểm
    )

    student = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='IN_PROGRESS')
    score = models.DecimalField(max_digits=3, decimal_places=2, default=0)  # Điểm sau khi chấm
    submitted_at = models.DateTimeField(null=True, blank=True)              # Thời điểm nộp bài
    graded_at = models.DateTimeField(null=True, blank=True)                 # Thời điểm có kết quả
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'quiz_attempt'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['student', 'quiz', 'created_at']),  # Lịch sử làm bài của học viên
        ]


class QuizAttemptAnswer(models.Model):
    """
    Câu trả lời của học viên cho từng câu hỏi trong một lần làm bài.
    Ràng buộc: mỗi (attempt, question) chỉ có đúng 1 câu trả lời.
    """
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='attempt_answers')
    # Lựa chọn học viên chọn (MCQ) - NULL nếu dạng text
    selected_option = models.ForeignKey(QuestionOption, on_delete=models.SET_NULL, null=True, blank=True)
    # Câu trả lời dạng text (FILL_BLANK / SHORT_ANSWER / ESSAY)
    answer_text = models.TextField(null=True, blank=True)
    # True = câu trả lời được chấm là đúng (auto hoặc giảng viên chấm)
    is_correct = models.BooleanField(default=False)
    # Điểm thực tế cho câu này ()
    score = models.DecimalField(max_digits=3, decimal_places=2, default=0)

    class Meta: 
        db_table = 'quiz_attempt_answer'
        constraints = [
            # Mỗi câu hỏi chỉ có 1 câu trả lời trong 1 lần làm bài
            models.UniqueConstraint(fields=['attempt', 'question'], name='unique_attempt_question_answer'),
        ]



class Submission(models.Model):
    """
    Bài nộp tự luận (Essay) của học viên, cần giảng viên chấm thủ công.
    Khác với QuizAttemptAnswer: Submission là bản ghi riêng để quản lý workflow chấm bài.
    """
    student = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='essay_submissions')
    lesson = models.ForeignKey('lessons.Lesson', on_delete=models.CASCADE, related_name='essay_submissions')
    # Quiz liên quan (có thể NULL nếu bài nộp không găn với quiz cụ thể)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, null=True, blank=True, related_name='essay_submissions')
    content = models.TextField()  # Nội dung bài làm tự luận của học viên
    status = models.CharField(max_length=15, choices=(('SUBMITTED', 'Submitted'), ('GRADED', 'Graded')), default='SUBMITTED')
    score = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)  # Điểm giảng viên chấm
    feedback = models.TextField(null=True, blank=True)   # Nhận xét / phản hồi của giảng viên
    graded_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='graded_submissions')  # Giảng viên chấm
    graded_at = models.DateTimeField(null=True, blank=True)   # Thời điểm chấm xong
    submitted_at = models.DateTimeField(auto_now_add=True)    # Thời điểm học viên nộp

    class Meta:
        db_table = 'quiz_submission'
        ordering = ['-submitted_at']
        indexes = [
            models.Index(fields=['status', 'submitted_at']),
        ]
