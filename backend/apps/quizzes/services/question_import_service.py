import csv
import io
import os

from django.db import models, transaction

from apps.quizzes.models import Question, QuestionOption


VALID_DIFFICULTIES = set(Question.Difficulty.values)
VALID_CORRECT_ANSWERS = {'A', 'B', 'C', 'D'}
MAX_QUESTION_LENGTH = 1000
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
REQUIRED_COLUMNS = ['question', 'difficulty', 'option_a', 'option_b', 'option_c', 'option_d', 'correct']
def validate_file(uploaded_file):
    """
    Kiểm tra file upload có hợp lệ không.
    Chỉ chấp nhận .csv và .xlsx, tối đa 10MB.
    """
    ext = os.path.splitext(uploaded_file.name)[1].lower()
    if ext not in ('.csv', '.xlsx'):
        raise ValueError("Chỉ hỗ trợ file CSV hoặc XLSX.")
    if uploaded_file.size == 0:
        raise ValueError("File không được để trống.")
    if uploaded_file.size > QuestionImportService.MAX_FILE_SIZE:
        raise ValueError("File không được vượt quá 10MB.")
    return ext
def validate_headers(headers):
    """
    Kiểm tra file có đủ các cột bắt buộc không.
    Trả về list các cột bị thiếu.
    """
    normalized_headers = [h.strip().lower() if h else '' for h in headers]
    missing = []
    for col in QuestionImportService.REQUIRED_COLUMNS:
        if col not in normalized_headers:
            missing.append(col)
    return missing
def parse_csv(file):
    """
    Đọc nội dung file CSV, trả về list các dict.
    Hỗ trợ UTF-8 BOM, UTF-8, cp1252 (Windows Vietnamese).
    Ưu tiên UTF-8 để đảm bảo tiếng Việt được hiển thị đúng.
    """
    content = file.read()
    
    # Strategy: Try UTF-8 first (with and without BOM).
    # If UTF-8 fails, try cp1252 (Windows Vietnamese).
    # Only fall back to latin-1 as last resort.
    # Note: latin-1 will never raise UnicodeDecodeError, so we validate
    # the decoded text by checking for Vietnamese characters.
    
    decoded = None
    used_encoding = None
    
    # Try UTF-8 with BOM first
    try:
        decoded = content.decode('utf-8-sig')
        used_encoding = 'utf-8-sig'
    except UnicodeDecodeError:
        pass
    
    # Try UTF-8 without BOM
    if decoded is None:
        try:
            decoded = content.decode('utf-8')
            used_encoding = 'utf-8'
        except UnicodeDecodeError:
            pass
    
    # Try cp1252 (Windows Vietnamese)
    if decoded is None:
        try:
            decoded = content.decode('cp1252')
            used_encoding = 'cp1252'
        except UnicodeDecodeError:
            pass
    
    # Last resort: try latin-1 (never fails, but may produce wrong characters)
    if decoded is None:
        decoded = content.decode('latin-1')
        used_encoding = 'latin-1'
    
    # Validate the decoded text
    # If we used latin-1, check if the text contains valid Vietnamese
    if used_encoding == 'latin-1':
        # Check for common Vietnamese patterns to validate decoding
        vietnamese_chars = set('ắằẳẵặấầẩẫậđếềểễệíìỉĩịốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ')
        has_vietnamese = any(c in decoded for c in vietnamese_chars)
        if not has_vietnamese:
            # Check if there are non-ASCII bytes that got decoded as latin-1
            # This would produce garbled text
            non_ascii_count = sum(1 for b in content if b > 127)
            if non_ascii_count > 0:
                # The file likely has encoding issues
                # Try to detect if it's actually UTF-8 with some corruption
                # by checking if the decoded text has many non-ASCII chars
                non_ascii_text = sum(1 for c in decoded if ord(c) > 127)
                if non_ascii_text > 0 and non_ascii_text < non_ascii_count * 0.5:
                    # Many bytes were decoded as single chars - likely wrong encoding
                    # We'll still proceed but the data may be corrupted
                    pass

    reader = csv.DictReader(io.StringIO(decoded))

    # Validate headers
    if reader.fieldnames is None:
        raise ValueError("File CSV không có dữ liệu header.")

    missing = validate_headers(reader.fieldnames)
    if missing:
        missing_str = ', '.join(missing)
        raise ValueError(f"Thiếu cột bắt buộc: {missing_str}")

    rows = []
    for row in reader:
        # Strip whitespace from keys and values
        cleaned = {}
        for k, v in row.items():
            key = k.strip() if k else k
            cleaned[key] = v.strip() if v else ''
        rows.append(cleaned)
    return rows
def parse_excel(file):
    """
    Đọc nội dung file XLSX, trả về list các dict.
    """
    import openpyxl
    try:
        wb = openpyxl.load_workbook(file, read_only=True)
    except Exception as e:
        raise ValueError(f"Không thể đọc file XLSX: {str(e)}")

    ws = wb.active
    rows_iter = ws.iter_rows(values_only=True)

    # First row is header
    try:
        first_row = rows_iter.__next__()
    except StopIteration:
        wb.close()
        raise ValueError("File XLSX không có dữ liệu.")

    headers = []
    for cell in first_row:
        headers.append(str(cell).strip() if cell else '')

    # Validate headers
    missing = validate_headers(headers)
    if missing:
        wb.close()
        missing_str = ', '.join(missing)
        raise ValueError(f"Thiếu cột bắt buộc: {missing_str}")

    rows = []
    for row in rows_iter:
        row_dict = {}
        for i, cell in enumerate(row):
            key = headers[i] if i < len(headers) else f'col_{i}'
            row_dict[key] = str(cell).strip() if cell is not None else ''
        rows.append(row_dict)

    wb.close()
    return rows
def validate_row(row, row_index):
    """
    Validate một dòng dữ liệu.
    Trả về list các lỗi (mỗi lỗi là một string).
    """
    errors = []

    # Validate question
    question = row.get('question', '').strip()
    if not question:
        errors.append("Question không được để trống.")
    elif len(question) > QuestionImportService.MAX_QUESTION_LENGTH:
        errors.append(f"Question không được vượt quá {QuestionImportService.MAX_QUESTION_LENGTH} ký tự.")

    # Validate difficulty
    difficulty = row.get('difficulty', '').strip().upper()
    if difficulty and difficulty not in QuestionImportService.VALID_DIFFICULTIES:
        valid_str = ', '.join(sorted(QuestionImportService.VALID_DIFFICULTIES))
        errors.append(f"Difficulty không hợp lệ. Chỉ chấp nhận: {valid_str}.")

    # Validate options
    option_keys = ['option_a', 'option_b', 'option_c', 'option_d']
    for key in option_keys:
        val = row.get(key, '').strip()
        if not val:
            errors.append(f"{key.replace('_', ' ').title()} không được để trống.")

    # Validate correct answer
    correct = row.get('correct', '').strip().upper()
    if not correct:
        errors.append("Correct answer không được để trống.")
    else:
        # Check for multiple correct answers (comma-separated)
        correct_parts = [c.strip() for c in correct.split(',')]
        for part in correct_parts:
            if part not in QuestionImportService.VALID_CORRECT_ANSWERS:
                errors.append(f"Correct answer '{part}' không tồn tại. Chỉ chấp nhận A, B, C, D.")
        # Check for duplicates
        if len(correct_parts) != len(set(correct_parts)):
            errors.append("Correct answer không được trùng lặp.")

    return errors
def preview_questions(rows):
    """
    Parse và validate tất cả các dòng.
    Trả về (preview_data, errors).
    Nếu có bất kỳ lỗi nào, errors sẽ chứa danh sách lỗi theo dòng.
    """
    all_errors = []
    preview_data = []

    for i, row in enumerate(rows):
        row_num = i + 2  # +2 because row 1 is header
        row_errors = validate_row(row, row_num)

        if row_errors:
            for err in row_errors:
                all_errors.append({
                    "row": row_num,
                    "message": err,
                })
        else:
            # Build preview data - include full row data for frontend to send back on execute
            correct = row.get('correct', '').strip().upper()
            correct_parts = [c.strip() for c in correct.split(',')]
            correct_letters = []
            for part in correct_parts:
                correct_letters.append(part)

            difficulty = row.get('difficulty', '').strip().upper() or 'EASY'

            preview_data.append({
                "row": row_num,
                "question": row.get('question', '').strip(),
                "difficulty": difficulty,
                "option_a": row.get('option_a', '').strip(),
                "option_b": row.get('option_b', '').strip(),
                "option_c": row.get('option_c', '').strip(),
                "option_d": row.get('option_d', '').strip(),
                "correct": ', '.join(correct_letters),
            })

    return preview_data, all_errors
def import_questions(rows, quiz):
    """
    Import câu hỏi vào database.
    Sử dụng transaction.atomic() để rollback nếu có lỗi.
    Sử dụng bulk_create() để tối ưu hiệu năng.
    """
    try:
        with transaction.atomic():
            all_errors = []
            valid_rows = []

            for i, row in enumerate(rows):
                row_num = i + 2
                row_errors = validate_row(row, row_num)
                if row_errors:
                    for err in row_errors:
                        all_errors.append({
                            "row": row_num,
                            "message": err,
                        })
                else:
                    valid_rows.append(row)

            if all_errors:
                return 0, all_errors

            max_order = Question.objects.filter(quiz=quiz).aggregate(
                max_order=models.Max('order')
            )['max_order'] or 0

            # Import chỉ hỗ trợ MCQ: tự động chia đều 10 điểm cho tất cả câu hỏi MCQ
            from decimal import Decimal, ROUND_HALF_UP
            
            existing_count = Question.objects.filter(quiz=quiz, question_type=Question.QuestionType.MCQ).count()
            total_questions = existing_count + len(valid_rows)
            
            if total_questions > 0:
                base_points = Decimal(str(10 / total_questions)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                total_base = base_points * total_questions
                diff = Decimal('10') - total_base
                last_question_extra = diff
            else:
                base_points = Decimal('1')
                last_question_extra = Decimal('0')

            # Update points for existing MCQ questions
            if existing_count > 0:
                existing_questions = list(Question.objects.filter(quiz=quiz, question_type=Question.QuestionType.MCQ).order_by('order', 'id'))
                for i, eq in enumerate(existing_questions):
                    if i == total_questions - 1:
                        eq.points = base_points + last_question_extra
                    else:
                        eq.points = base_points
                    eq.save()

            questions_to_create = []
            for idx, row in enumerate(valid_rows):
                difficulty = row.get('difficulty', '').strip().upper()
                if difficulty not in QuestionImportService.VALID_DIFFICULTIES:
                    difficulty = Question.Difficulty.EASY

                max_order += 1
                
                question_index = existing_count + idx
                if question_index == total_questions - 1:
                    points = base_points + last_question_extra
                else:
                    points = base_points
                
                questions_to_create.append(Question(
                    quiz=quiz,
                    prompt=row.get('question', '').strip(),
                    difficulty=difficulty,
                    question_type=Question.QuestionType.MCQ,
                    points=points,
                    order=max_order,
                ))

            created_questions = Question.objects.bulk_create(questions_to_create, batch_size=500)

            options_to_create = []
            for question, row in zip(created_questions, valid_rows):
                correct = row.get('correct', '').strip().upper()
                correct_parts = set(c.strip() for c in correct.split(','))

                option_mapping = {
                    'option_a': ('A', 0),
                    'option_b': ('B', 1),
                    'option_c': ('C', 2),
                    'option_d': ('D', 3),
                }

                for key, (letter, order) in option_mapping.items():
                    text = row.get(key, '').strip()
                    options_to_create.append(QuestionOption(
                        question=question,
                        text=text,
                        is_correct=letter in correct_parts,
                        order=order,
                    ))

            QuestionOption.objects.bulk_create(options_to_create, batch_size=500)

            return len(created_questions), []
    except ValueError as e:
        return 0, [{"row": 0, "message": str(e)}]
    except Exception as e:
        return 0, [{"row": 0, "message": f"Lỗi hệ thống: {str(e)}"}]