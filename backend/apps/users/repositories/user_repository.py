from django.core.paginator import Paginator, EmptyPage
from django.db.models import Q
from django.utils import timezone
from django.shortcuts import get_object_or_404
from apps.users.models import User, Role


def get_all_users():
    return User.objects.select_related("role").all().order_by("-date_joined")


def get_user_by_id(user_id):
    return get_object_or_404(User.objects.select_related("role"), id=user_id)


def get_user_by_email(email):
    return User.objects.filter(email__iexact=email).first()


def create_user(email, password, first_name='', last_name='', role=None, phone=''):
    return User.objects.create_user(
        username=email, email=email, password=password,
        first_name=first_name, last_name=last_name, role=role, phone=phone,
    )


def get_role_by_id(role_id):
    return get_object_or_404(Role, id=role_id)


def get_role_by_code(code):
    return get_object_or_404(Role, code=code)


def get_user_by_google_email(google_email):
    return User.objects.filter(google_email=google_email.lower()).first()


def link_google_account(user, google_email):
    user.google_email = google_email
    user.save(update_fields=["google_email"])
    return user


def update_last_login(user):
    user.last_login = timezone.now()
    user.save(update_fields=["last_login"])


def get_managed_users(search=None, role=None, status=None, page=1, page_size=10):
    qs = User.objects.select_related("role").filter(role__code__in=["STUDENT", "INSTRUCTOR"])
    if role and role.upper() in ["STUDENT", "INSTRUCTOR"]:
        qs = qs.filter(role__code=role.upper())
    if search:
        qs = qs.filter(Q(first_name__icontains=search) | Q(last_name__icontains=search) | Q(email__icontains=search))
    if status == "active":
        qs = qs.filter(is_active=True)
    elif status == "locked":
        qs = qs.filter(is_active=False)
    qs = qs.order_by("-date_joined")
    paginator = Paginator(qs, page_size)
    total = paginator.count
    total_pages = paginator.num_pages
    try:
        page_obj = paginator.page(page)
    except EmptyPage:
        page_obj = paginator.page(paginator.num_pages)
    return {"results": list(page_obj.object_list), "total": total, "page": page, "page_size": page_size, "total_pages": total_pages}