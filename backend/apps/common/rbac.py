def user_has_permission(user, permission_code):
    #kiểm tra user có permission_code không
    if not user or not user.is_authenticated:
        return False
    role = getattr(user, 'role', None)
    if not role:
        return False
    return role.permissions.filter(code=permission_code).exists()