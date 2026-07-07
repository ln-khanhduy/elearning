"""RoleRepository - Quản lý truy vấn Role."""
from apps.users.models import Role


def get_all():
    """Lấy tất cả roles, sắp xếp theo id."""
    return Role.objects.all().order_by("id")


def get_by_id(role_id):
    """Lấy role theo ID, trả về None nếu không tìm thấy."""
    return Role.objects.filter(id=role_id).first()


def get_by_code(code):
    """Lấy role theo code, trả về None nếu không tìm thấy."""
    return Role.objects.filter(code=code).first()


def create(code, name):
    """Tạo role mới."""
    return Role.objects.create(code=code, name=name)


def update(role, code=None, name=None):
    """Cập nhật role."""
    if code is not None:
        role.code = code
    if name is not None:
        role.name = name
    role.save()
    return role


def delete(role_id):
    """Xóa role."""
    Role.objects.filter(id=role_id).delete()