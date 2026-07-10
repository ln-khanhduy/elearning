from django.shortcuts import get_object_or_404
from apps.users.models import InstructorProfile, InstructorCertificate


def get_all_applications(status_filter=None):
    qs = InstructorProfile.objects.select_related("user", "user__role", "reviewed_by").all().order_by("-applied_at")
    if status_filter:
        qs = qs.filter(status=status_filter.upper())
    return qs


def get_application_by_id(application_id):
    return get_object_or_404(InstructorProfile.objects.select_related("user", "user__role", "reviewed_by"), id=application_id)


def get_application_by_email(email):
    try:
        return InstructorProfile.objects.select_related("user", "user__role", "reviewed_by").get(email=email)
    except InstructorProfile.DoesNotExist:
        return None


def create_application(validated_data):
    return InstructorProfile.objects.create(user=None, status=InstructorProfile.Status.PENDING, **validated_data)


def create_certificate(application, title, file):
    return InstructorCertificate.objects.create(profile=application, title=title, file=file)


def get_certificates_by_application(application):
    return InstructorCertificate.objects.filter(profile=application).order_by("-uploaded_at")


def get_certificate_by_id(application, certificate_id):
    return get_object_or_404(InstructorCertificate, id=certificate_id, profile=application)


def delete_certificate(application, certificate_id):
    certificate = get_certificate_by_id(application, certificate_id)
    certificate.delete()
