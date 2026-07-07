"""RoleService - Quản lý nghiệp vụ Role."""
from rest_framework.exceptions import ValidationError
from apps.system.repositories import role_repository
from apps.users.models import RolePermission


def get_roles():
    """Lấy danh sách tất cả roles."""
    return role_repository.get_all()


def get_role_detail(role_id):
    """Lấy chi tiết một role."""
    role = role_repository.get_by_id(role_id)
    if not role:
        raise ValidationError({"detail": "Không tìm thấy role."})
    return role


def create_role(code, name):
    """Tạo role mới."""
    code = code.upper().strip()
    if not code or not name:
        raise ValidationError({"detail": "Vui lòng nhập mã role và tên role."})

    existing = role_repository.get_by_code(code)
    if existing:
        raise ValidationError({"detail": f"Mã role '{code}' đã tồn tại."})

    return role_repository.create(code=code, name=name.strip())


def update_role(role_id, code=None, name=None):
    """Cập nhật role."""
    role = role_repository.get_by_id(role_id)
    if not role:
        raise ValidationError({"detail": "Không tìm thấy role."})

    if code:
        code = code.upper().strip()
        existing = role_repository.get_by_code(code)
        if existing and existing.id != role.id:
            raise ValidationError({"detail": f"Mã role '{code}' đã tồn tại."})

    return role_repository.update(role, code=code, name=name.strip() if name else None)


def delete_role(role_id):
    """Xóa role."""
    role = role_repository.get_by_id(role_id)
    if not role:
        raise ValidationError({"detail": "Không tìm thấy role."})

    # Kiểm tra có user nào đang dùng role này không
    from apps.users.models import User
    if User.objects.filter(role=role).exists():
        raise ValidationError({"detail": f"Không thể xóa role '{role.name}' vì đang có người dùng sử dụng."})

    role_repository.delete(role_id)