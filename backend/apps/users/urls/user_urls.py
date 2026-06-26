from django.urls import path

from apps.users.view.user_views import (
    UserListAPIView,
    UserDetailAPIView,
    CurrentUserAPIView,
    UpdateProfileAPIView,
    ChangeUserRoleAPIView,
    LockUserAPIView,
    UnlockUserAPIView,
    ChangePasswordAPIView,
    InstructorApplyAPIView,
    InstructorApplicationListAPIView,
    InstructorApplicationDetailAPIView,
    InstructorApplicationReviewAPIView,
    DownloadInstructorCVAPIView,
    PreviewInstructorCVAPIView,
    InstructorCertificateUploadAPIView,
    InstructorCertificateListAPIView,
    InstructorCertificateDeleteAPIView,
    DownloadInstructorCertificateAPIView,
    PreviewInstructorCertificateAPIView,
    LinkGoogleAPIView,
    MyInstructorCertificateUploadAPIView,
    MyInstructorCertificateListAPIView,
    MyInstructorCertificateDeleteAPIView,
)

urlpatterns = [
    path("", UserListAPIView.as_view(), name="user-list"),
    path("<uuid:user_id>/", UserDetailAPIView.as_view(), name="user-detail"),

    path("me/", CurrentUserAPIView.as_view(), name="current-user"),
    path("me/update/", UpdateProfileAPIView.as_view(), name="update-profile"),
    path("me/change-password/", ChangePasswordAPIView.as_view(), name="change-password"),

    path("link-google/", LinkGoogleAPIView.as_view(), name="link-google"),

    path("<uuid:user_id>/change-role/", ChangeUserRoleAPIView.as_view(), name="change-user-role"),
    path("<uuid:user_id>/lock/", LockUserAPIView.as_view(), name="lock-user"),
    path("<uuid:user_id>/unlock/", UnlockUserAPIView.as_view(), name="unlock-user"),

    path("instructors/apply/", InstructorApplyAPIView.as_view(), name="instructor-apply"),
    path("instructors/applications/",InstructorApplicationListAPIView.as_view(),name="instructor-application-list"),
    path("instructors/applications/<int:application_id>/",InstructorApplicationDetailAPIView.as_view(),name="instructor-application-detail"),
    path("instructors/applications/<int:application_id>/review/",InstructorApplicationReviewAPIView.as_view(),name="instructor-application-review"),
    path("instructors/applications/<int:application_id>/cv/",DownloadInstructorCVAPIView.as_view(),name="instructor-application-cv"),
    path("instructors/applications/<int:application_id>/certificates/",InstructorCertificateUploadAPIView.as_view(),name="instructor-certificate-upload"),
    path("instructors/applications/<int:application_id>/certificates/list/",InstructorCertificateListAPIView.as_view(),name="instructor-certificate-list"),
    path("instructors/applications/<int:application_id>/certificates/<int:certificate_id>/",InstructorCertificateDeleteAPIView.as_view(),name="instructor-certificate-delete"),
    path("instructors/applications/<int:application_id>/certificates/<int:certificate_id>/download/",DownloadInstructorCertificateAPIView.as_view(),name="instructor-certificate-download"),
    path("instructors/applications/<int:application_id>/certificates/<int:certificate_id>/preview/",PreviewInstructorCertificateAPIView.as_view(),name="instructor-certificate-preview"),
    path("instructors/applications/<int:application_id>/cv/preview/",PreviewInstructorCVAPIView.as_view(),name="instructor-cv-preview"),

    # API cho instructor đã đăng nhập quản lý chứng chỉ của mình
    path("instructors/certificates/", MyInstructorCertificateUploadAPIView.as_view(), name="my-instructor-certificate-upload"),
    path("instructors/certificates/list/", MyInstructorCertificateListAPIView.as_view(), name="my-instructor-certificate-list"),
    path("instructors/certificates/<int:certificate_id>/", MyInstructorCertificateDeleteAPIView.as_view(), name="my-instructor-certificate-delete"),
]
