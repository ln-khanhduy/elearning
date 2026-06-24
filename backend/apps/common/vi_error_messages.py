"""
Custom Vietnamese error messages cho Django REST Framework.
Dùng để override các error messages mặc định của DRF sang tiếng Việt.
"""

VI_ERROR_MESSAGES = {
    # DecimalField errors
    "Ensure that there are no more than {max_digits} digits in total.": "Đảm bảo tổng số chữ số không vượt quá {max_digits}.",
    "Ensure that there are no more than {max_decimal_places} decimal places.": "Đảm bảo số chữ số thập phân không vượt quá {max_decimal_places}.",
    "Ensure that there are no more than {max_digits} digits before the decimal point.": "Đảm bảo số chữ số trước dấu thập phân không vượt quá {max_digits}.",
    "Ensure that there are no more than {max_digits - 1} digits before the decimal point.": "Đảm bảo số chữ số trước dấu thập phân không vượt quá {max_digits - 1}.",

    # CharField errors
    "This field may not be blank.": "Trường này không được để trống.",
    "This field may not be null.": "Trường này không được để null.",
    "This field is required.": "Trường này là bắt buộc.",
    "Ensure this field has at least {min_length} characters.": "Đảm bảo trường này có ít nhất {min_length} ký tự.",
    "Ensure this field has no more than {max_length} characters.": "Đảm bảo trường này không vượt quá {max_length} ký tự.",
    "Enter a valid URL.": "Vui lòng nhập URL hợp lệ.",
    "Enter a valid email address.": "Vui lòng nhập địa chỉ email hợp lệ.",

    # IntegerField errors
    "A valid integer is required.": "Vui lòng nhập số nguyên hợp lệ.",
    "Ensure this value is greater than or equal to {min_value}.": "Đảm bảo giá trị này lớn hơn hoặc bằng {min_value}.",
    "Ensure this value is less than or equal to {max_value}.": "Đảm bảo giá trị này nhỏ hơn hoặc bằng {max_value}.",

    # ChoiceField errors
    '"{input}" is not a valid choice.': '"{input}" không phải là lựa chọn hợp lệ.',

    # FileField errors
    "The submitted data was not a file. Check the encoding type on the form.": "Dữ liệu gửi lên không phải là file. Vui lòng kiểm tra kiểu mã hóa của form.",
    "No file was submitted.": "Không có file nào được gửi lên.",
    "The submitted file is empty.": "File gửi lên trống rỗng.",

    # General errors
    "Invalid data.": "Dữ liệu không hợp lệ.",
    "Method \"{method}\" not allowed.": "Phương thức \"{method}\" không được phép.",
    "Not found.": "Không tìm thấy.",
    "Authentication credentials were not provided.": "Không có thông tin xác thực.",
    "You do not have permission to perform this action.": "Bạn không có quyền thực hiện hành động này.",
}
