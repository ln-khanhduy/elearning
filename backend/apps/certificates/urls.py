from django.urls import path
from apps.certificates.views import MyCertificatesAPIView

urlpatterns = [
    path("my-certificates/", MyCertificatesAPIView.as_view(), name="my-certificates"),
]
