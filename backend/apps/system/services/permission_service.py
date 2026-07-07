"""PermissionService - Quản lý Permission và gán quyền cho Role."""
from rest_framework.exceptions import ValidationError
from apps.users.models import Role, RolePermission
from apps.common.management.commands.seed_permissions import PERMISSIONS


def get_all_permissions():
    """
    Lấy tất cả permissions từ registry (seed_permissions.py).
    Trả về list dict: [{ code, name, group }, ...]
    """
    result = []
    for code, name in PERMISSIONS.items():
        group = code.split(".")[0] if "." in code else "other"
        result.append({"code": code, "name": name, "group": group})
    return result


def get_permission_groups():
    """Lấy danh sách các nhóm permission (VD: admin, course, user, ...)."""
    groups = set()
    for code in PERMISSIONS:
        group = code.split(".")[0] if "." in code else "other"
        groups.add(group)
    return sorted(groups)


def get_permissions_by_group(group_name):
    """Lấy permissions theo nhóm."""
    result = []
    for code, name in PERMISSIONS.items():
        g = code.split(".")[0] if "." in code else "other"
        if g == group_name:
            result.append({"code": code, "name": name})
    return result


def get_role_permissions(role_id):
    """Lấy danh sách permissions hiện tại của một role."""
    role = Role.objects.filter(id=role_id).first()
    if not role:
        raise ValidationError({"detail": "Không tìm thấy role."})
    return role.permissions.all()


def assign_permission_to_role(role_id, permission_codes):
    """
    Gán permissions cho role.
    permission_codes: list các mã permission (VD: ["course.course.create", "user.user.view"])
    """
    role = Role.objects.filter(id=role_id).first()
    if not role:
        raise ValidationError({"detail": "Không tìm thấy role."})

    if not permission_codes:
        raise ValidationError({"detail": "Vui lòng chọn ít nhất một permission."})

    created = []
    for code in permission_codes:
        _, created_permission = RolePermission.objects.get_or_create(
            role=role,
            code=code,
            defaults={"name": PERMISSIONS.get(code, code)},
        )
        if created_permission:
            created.append(code)

    return created


def remove_permission_from_role(role_id, permission_code):
    """Gỡ một permission khỏi role."""
    role = Role.objects.filter(id=role_id).first()
    if not role:
        raise ValidationError({"detail": "Không tìm thấy role."})

    deleted, _ = RolePermission.objects.filter(role=role, code=permission_code).delete()
    return deleted > 0


def update_role_permissions(role_id, permission_codes):
    """
    Cập nhật toàn bộ permissions cho role.
    Xóa tất cả permissions cũ, chỉ giữ lại permissions trong danh sách mới.
    """
    role = Role.objects.filter(id=role_id).first()
    if not role:
        raise ValidationError({"detail": "Không tìm thấy role."})

    # Xóa tất cả permissions cũ
    RolePermission.objects.filter(role=role).delete()

    # Thêm permissions mới
    for code in permission_codes:
        RolePermission.objects.create(
            role=role,
            code=code,
            name=PERMISSIONS.get(code, code),
        )

    return permission_codes