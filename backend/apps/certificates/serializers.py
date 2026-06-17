from rest_framework import serializers
from apps.certificates.models import CourseCertificate


class CourseCertificateSerializer(serializers.ModelSerializer):
    """Serializer cho CourseCertificate."""
    course_title = serializers.CharField(source="course.title", read_only=True)
    course_image = serializers.SerializerMethodField()
    student_name = serializers.CharField(source="student.get_full_name", read_only=True)
    course_id = serializers.IntegerField(source="course.id", read_only=True)

    class Meta:
        model = CourseCertificate
        fields = [
            "id",
            "certificate_code",
            "pdf_url",
            "image_url",
            "issued_at",
            "course_title",
            "course_image",
            "student_name",
            "course_id",
        ]

    def get_course_image(self, obj):
        if obj.course.thumbnail:
            return obj.course.thumbnail.url
        return None
