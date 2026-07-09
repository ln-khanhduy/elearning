import os
from django.http import Http404
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny


from apps.common.base_api_view import BasePermissionAPIView
from apps.system.services import admin_log_service

from apps.users.services import user_service
from apps.notifications import services as notif_service

from apps.users.serializers.user_serializer import (
    UserListSerializer, UserDetailSerializer, UpdateProfileSerializer,
    ChangeUserRoleSerializer, LockUnlockUserSerializer, ChangePasswordSerializer,
    InstructorApplySerializer, InstructorApplicationSerializer, InstructorReviewSerializer,
    InstructorCertificateSerializer, LinkGoogleSerializer,
)



class UserListAPIView(BasePermissionAPIView):
    """
    GET /api/users/ - Lấy danh sách tất cả người dùng.
    Yêu cầu quyền: user.user.view
    """
    required_permission = "user.user.view"

    def get(self, request):
        users = user_service.get_all_users()
        serializer = UserListSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserDetailAPIView(BasePermissionAPIView):
    """
    GET /api/users/{user_id}/ - Lấy thông tin chi tiết của một người dùng.
    Yêu cầu quyền: user.user.view
    """
    required_permission = "user.user.view"

    def get(self, request, user_id):
        user = user_service.get_user_by_id(user_id)
        serializer = UserDetailSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CurrentUserAPIView(APIView):
    """
    GET /api/users/me/ - Lấy thông tin của người dùng hiện tại (đang đăng nhập).
    Nếu user là instructor, trả về thêm thông tin ngân hàng và hồ sơ giảng viên.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role_code = user.role.code if user.role else None
        user_data = UserDetailSerializer(user).data

        # Nếu là instructor, thêm thông tin ngân hàng và hồ sơ giảng viên vào response
        if role_code == "INSTRUCTOR" and hasattr(user, 'instructor_profile'):
            profile = user.instructor_profile
            user_data["bank_name"] = profile.bank_name
            user_data["bank_account_number"] = profile.bank_account_number
            user_data["bank_account_name"] = profile.bank_account_name
            user_data["bio"] = profile.bio
            user_data["portfolio_link"] = profile.portfolio_link
            user_data["cv_file"] = profile.cv_file.url if profile.cv_file else None
            # Lấy danh sách chứng chỉ
            certificates = profile.certificates.all()
            from apps.users.serializers.user_serializer import InstructorCertificateSerializer
            user_data["certificates"] = InstructorCertificateSerializer(certificates, many=True).data

        return Response(user_data, status=status.HTTP_200_OK)


class UpdateProfileAPIView(APIView):
    """
    PATCH /api/users/me/update/ - Cập nhật thông tin cá nhân (tên, số điện thoại, avatar, thông tin ngân hàng, hồ sơ giảng viên).
    - Chỉ instructor mới được cập nhật thông tin ngân hàng và hồ sơ giảng viên (bio, portfolio_link, cv_file).
    - Student/user thường không thấy và không cập nhật được thông tin này.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        role_code = user.role.code if user.role else None

        # Các trường chỉ dành cho instructor
        instructor_only_fields = {"bank_name", "bank_account_number", "bank_account_name", "bio", "portfolio_link", "cv_file"}
        has_instructor_data = any(k in request.data for k in instructor_only_fields)
        if has_instructor_data and role_code != "INSTRUCTOR":
            return Response(
                {"detail": "Chỉ giảng viên mới có thể cập nhật thông tin này."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = UpdateProfileSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user_service.update_profile(user, serializer.validated_data)

        # Lấy thông tin user response
        user_data = UserDetailSerializer(user).data

        # Nếu là instructor, thêm thông tin ngân hàng và hồ sơ giảng viên vào response
        if role_code == "INSTRUCTOR" and hasattr(user, 'instructor_profile'):
            profile = user.instructor_profile
            user_data["bank_name"] = profile.bank_name
            user_data["bank_account_number"] = profile.bank_account_number
            user_data["bank_account_name"] = profile.bank_account_name
            user_data["bio"] = profile.bio
            user_data["portfolio_link"] = profile.portfolio_link
            user_data["cv_file"] = profile.cv_file.url if profile.cv_file else None
            certificates = profile.certificates.all()
            user_data["certificates"] = InstructorCertificateSerializer(certificates, many=True).data

        return Response({
            "detail": "Cập nhật thông tin cá nhân thành công.",
            "user": user_data
        }, status=status.HTTP_200_OK)


class ChangeUserRoleAPIView(BasePermissionAPIView):
    """
    PATCH /api/users/{user_id}/change-role/ - Thay đổi vai trò (role) của người dùng.
    Yêu cầu quyền: admin.admin.change_role
    """
    required_permission = "admin.admin.change_role"

    def patch(self, request, user_id):
        serializer = ChangeUserRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = user_service.change_role(user_id, serializer.validated_data["role_id"])
        admin_log_service.log(
            admin=request.user,
            action_type='USER_CHANGE_ROLE',
            detail=f"Admin {request.user.email} đã đổi role của user {user.email} (ID: {user.id}) thành role ID {serializer.validated_data['role_id']}",
            target_id=str(user.id),
            target_type='User',
        )

        return Response({
            "detail": "Đổi role user thành công.",
            "user": UserDetailSerializer(user).data
        }, status=status.HTTP_200_OK)


class LockUserAPIView(BasePermissionAPIView):
    """
    PATCH /api/users/{user_id}/lock/ - Khóa tài khoản người dùng.
    Yêu cầu quyền: user.user.lock
    """
    required_permission = "user.user.lock"

    def patch(self, request, user_id):
        serializer = LockUnlockUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data.get("reason", "")
        user = user_service.lock_user(user_id, request.user, reason)
        admin_log_service.log(
            admin=request.user,
            action_type='USER_LOCK',
            detail=f"Admin {request.user.email} đã khóa tài khoản của user {user.email} (ID: {user.id}). Lý do: {reason or 'Không có lý do'}",
            target_id=str(user.id),
            target_type='User',
        )

        try:
            notif_service.notify_account_locked(user, reason, request.user.email)
        except Exception:
            pass
        return Response({"detail": "Khóa tài khoản thành công."}, status=status.HTTP_200_OK)


class UnlockUserAPIView(BasePermissionAPIView):
    """
    PATCH /api/users/{user_id}/unlock/ - Mở khóa tài khoản người dùng.
    Yêu cầu quyền: user.user.unlock
    """
    required_permission = "user.user.unlock"

    def patch(self, request, user_id):
        user = user_service.unlock_user(user_id, request.user)
        admin_log_service.log(
            admin=request.user,
            action_type='USER_UNLOCK',
            detail=f"Admin {request.user.email} đã mở khóa tài khoản của user {user.email} (ID: {user.id})",
            target_id=str(user.id),
            target_type='User',
        )

        return Response({"detail": "Mở khóa tài khoản thành công."}, status=status.HTTP_200_OK)


class ChangePasswordAPIView(APIView):
    """
    PATCH /api/users/me/change-password/ - Đổi mật khẩu cho người dùng hiện tại.
    Yêu cầu mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu mới.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_service.change_password(
            request.user,
            serializer.validated_data["old_password"],
            serializer.validated_data["new_password"]
        )
        return Response({"detail": "Đổi mật khẩu thành công."}, status=status.HTTP_200_OK)


class InstructorApplyAPIView(APIView):
    """
    POST /api/users/instructors/apply/ - Gửi hồ sơ đăng ký trở thành giảng viên (public, không cần đăng nhập).
    Yêu cầu: name, email, bio, cv_file, contact_phone, thông tin ngân hàng và đồng ý điều khoản.
    Có thể kèm chứng chỉ (tùy chọn) qua field 'certificates' (multiple files).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = InstructorApplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data
        certificates = validated_data.pop('certificates', [])

        profile = user_service.apply(validated_data)

        # Xử lý upload chứng chỉ nếu có
        if certificates:
            for cert_file in certificates:
                # Dùng tên file làm title mặc định
                title = os.path.splitext(cert_file.name)[0]
                user_service.add_certificate(profile, title, cert_file)

        return Response({
            "detail": "Gửi hồ sơ đăng ký giảng viên thành công. Thông tin tài khoản sẽ được gửi qua email sau khi được duyệt.",
            "application": InstructorApplicationSerializer(profile).data
        }, status=status.HTTP_201_CREATED)


class InstructorApplicationListAPIView(BasePermissionAPIView):
    """
    GET /api/users/instructors/applications/ - Lấy danh sách hồ sơ đăng ký giảng viên.
    Có thể lọc theo trạng thái: ?status=PENDING|APPROVED|REJECTED
    Yêu cầu quyền: user.instructor.view
    """
    required_permission = "user.instructor.view"

    def get(self, request):
        status_filter = request.query_params.get("status")
        applications = user_service.get_all_applications(status_filter)
        serializer = InstructorApplicationSerializer(applications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class InstructorApplicationDetailAPIView(BasePermissionAPIView):
    """
    GET /api/users/instructors/applications/{application_id}/ - Lấy chi tiết một hồ sơ đăng ký.
    Yêu cầu quyền: user.instructor.view
    """
    required_permission = "user.instructor.view"

    def get(self, request, application_id):
        application = user_service.get_application_detail(application_id)
        serializer = InstructorApplicationSerializer(application)
        return Response(serializer.data, status=status.HTTP_200_OK)


class InstructorApplicationReviewAPIView(BasePermissionAPIView):
    """
    PATCH /api/users/instructors/applications/{application_id}/review/ - Duyệt hoặc từ chối hồ sơ.
    Body: { "status": "APPROVED"|"REJECTED", "rejection_reason": "..." (bắt buộc nếu từ chối) }
    Yêu cầu quyền động: user.instructor.approve (nếu duyệt) hoặc user.instructor.reject (nếu từ chối)
    """

    def get_required_permission(self, request):
        """Xác định quyền dựa trên hành động trong body request."""
        status_value = request.data.get("status")
        if status_value == "APPROVED":
            return "user.instructor.approve"
        elif status_value == "REJECTED":
            return "user.instructor.reject"
        return None

    def initial(self, request, *args, **kwargs):
        """Override initial để set required_permission động trước khi permission check."""
        self.required_permission = self.get_required_permission(request)
        super().initial(request, *args, **kwargs)

    def patch(self, request, application_id):
        serializer = InstructorReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        review_status = serializer.validated_data["status"]

        application, detail = user_service.review_application(
            application_id,
            request.user,
            review_status,
            serializer.validated_data.get("rejection_reason")
        )

        action = 'INSTRUCTOR_APPROVE' if review_status == 'APPROVED' else 'INSTRUCTOR_REJECT'
        rejection_reason = serializer.validated_data.get("rejection_reason")

        # Log với email từ profile (vì application.user có thể null trước khi duyệt)
        user_email = application.email
        user_id = application.user.id if application.user else None
        admin_log_service.log(
            admin=request.user,
            action_type=action,
            detail=f"Admin {request.user.email} đã {detail.lower()} hồ sơ giảng viên của {user_email} (ID: {application.id}){f'. Lý do: {rejection_reason}' if rejection_reason else ''}",
            target_id=str(application.id),
            target_type='InstructorProfile',
        )

        return Response({
            "detail": detail,
            "application": InstructorApplicationSerializer(application).data
        }, status=status.HTTP_200_OK)


class DownloadInstructorCVAPIView(APIView):
    """
    GET /api/users/instructors/applications/{application_id}/cv/ - Tải file CV của hồ sơ đăng ký.
    Trả về file CV dưới dạng download (Content-Disposition: attachment).
    Hỗ trợ xác thực qua: Authorization header (từ SPA) hoặc refresh token cookie (khi mở tab mới).
    Yêu cầu quyền: user.instructor.view hoặc chủ sở hữu hồ sơ.
    """
    permission_classes = []  # Tự xử lý xác thực + quyền trong get()

    def get(self, request, application_id):
        # Xác thực user
        user = user_service._authenticate_request(request)
        if not user:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            application = user_service.get_application_detail(application_id)
        except Http404:
            return Response({"detail": "Không tìm thấy hồ sơ đăng ký."}, status=status.HTTP_404_NOT_FOUND)

        # Kiểm tra quyền: admin (user.instructor.view) hoặc chủ sở hữu hồ sơ
        if not user_service.check_application_access(application, user):
            return Response({"detail": "Bạn không có quyền tải file CV này."}, status=status.HTTP_403_FORBIDDEN)

        if not application.cv_file:
            return Response({"detail": "Hồ sơ này không có file CV."}, status=status.HTTP_404_NOT_FOUND)

        try:
            return user_service.download_file_from_cloudinary(application.cv_file, f"CV_{application.id}.pdf")
        except Http404:
            return Response({"detail": "File CV không tồn tại trên hệ thống."}, status=status.HTTP_404_NOT_FOUND)


class DownloadInstructorCertificateAPIView(APIView):
    """
    GET /api/users/instructors/applications/{application_id}/certificates/{certificate_id}/download/ - Tải chứng chỉ về.
    Yêu cầu quyền: user.instructor.view hoặc chủ sở hữu hồ sơ.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, application_id, certificate_id):
        try:
            application = user_service.get_application_detail(application_id)
        except Http404:
            return Response({"detail": "Không tìm thấy hồ sơ đăng ký."}, status=status.HTTP_404_NOT_FOUND)

        # Kiểm tra quyền: admin hoặc chủ sở hữu
        if not user_service.check_application_access(application, request.user):
            return Response({"detail": "Bạn không có quyền tải chứng chỉ này."}, status=status.HTTP_403_FORBIDDEN)

        certificate = user_service.get_certificate_by_id(application, certificate_id)
        try:
            return user_service.download_file_from_cloudinary(certificate.file, f"ChungChi_{certificate.id}.pdf")
        except Http404:
            return Response({"detail": "File chứng chỉ không tồn tại trên hệ thống."}, status=status.HTTP_404_NOT_FOUND)


class PreviewInstructorCertificateAPIView(APIView):
    """
    GET /api/users/instructors/applications/{application_id}/certificates/{certificate_id}/preview/ - Xem trước chứng chỉ.
    Trả về file với Content-Disposition: inline để trình duyệt hiển thị trực tiếp.
    Hỗ trợ xác thực qua: Authorization header (từ SPA) hoặc refresh token cookie (khi mở tab mới).
    """
    permission_classes = []  # Tự xử lý xác thực + quyền trong get()

    def get(self, request, application_id, certificate_id):
        # Xác thực user
        user = user_service._authenticate_request(request)
        if not user:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            application = user_service.get_application_detail(application_id)
        except Http404:
            return Response({"detail": "Không tìm thấy hồ sơ đăng ký."}, status=status.HTTP_404_NOT_FOUND)

        # Kiểm tra quyền: admin hoặc chủ sở hữu
        if not user_service.check_application_access(application, user):
            return Response({"detail": "Bạn không có quyền xem chứng chỉ này."}, status=status.HTTP_403_FORBIDDEN)

        certificate = user_service.get_certificate_by_id(application, certificate_id)
        try:
            return user_service.preview_file_from_cloudinary(certificate.file, f"ChungChi_{certificate.id}.pdf")
        except Http404:
            return Response({"detail": "File chứng chỉ không tồn tại trên hệ thống."}, status=status.HTTP_404_NOT_FOUND)


class PreviewInstructorCVAPIView(APIView):
    """
    GET /api/users/instructors/applications/{application_id}/cv/preview/ - Xem trước CV.
    Trả về file với Content-Disposition: inline để trình duyệt hiển thị trực tiếp.
    Hỗ trợ xác thực qua: Authorization header (từ SPA) hoặc refresh token cookie (khi mở tab mới).
    """
    permission_classes = []  # Tự xử lý xác thực + quyền trong get()

    def get(self, request, application_id):
        # Xác thực user
        user = user_service._authenticate_request(request)
        if not user:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            application = user_service.get_application_detail(application_id)
        except Http404:
            return Response({"detail": "Không tìm thấy hồ sơ đăng ký."}, status=status.HTTP_404_NOT_FOUND)

        # Kiểm tra quyền: admin (user.instructor.view) hoặc chủ sở hữu hồ sơ
        if not user_service.check_application_access(application, user):
            return Response({"detail": "Bạn không có quyền xem CV này."}, status=status.HTTP_403_FORBIDDEN)

        if not application.cv_file:
            return Response({"detail": "Hồ sơ này không có file CV."}, status=status.HTTP_404_NOT_FOUND)

        try:
            return user_service.preview_file_from_cloudinary(application.cv_file, f"CV_{application.id}.pdf")
        except Http404:
            return Response({"detail": "File CV không tồn tại trên hệ thống."}, status=status.HTTP_404_NOT_FOUND)


class InstructorCertificateUploadAPIView(APIView):
    """
    POST /api/users/instructors/applications/{application_id}/certificates/ - Upload chứng chỉ cho hồ sơ.
    Body: multipart/form-data { title: string, file: File }
    Có thể upload nhiều chứng chỉ cùng lúc bằng cách gửi nhiều cặp title + file.
    Hỗ trợ:
      - Một cặp: title="Tên", file=@file.pdf
      - Nhiều cặp: titles[]="Tên1", files[]=@file1.pdf, titles[]="Tên2", files[]=@file2.pdf
    Chỉ chủ sở hữu hồ sơ mới được upload.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, application_id):
        try:
            application = user_service.get_application_detail(application_id)
        except Http404:
            return Response({"detail": "Không tìm thấy hồ sơ đăng ký."}, status=status.HTTP_404_NOT_FOUND)

        # Chỉ chủ sở hữu mới được upload chứng chỉ (kiểm tra bằng email)
        if request.user.email != application.email:
            return Response({"detail": "Bạn không có quyền upload chứng chỉ cho hồ sơ này."}, status=status.HTTP_403_FORBIDDEN)

        certificates, errors = user_service.process_upload_request(application, request)

        if not certificates:
            return Response({"detail": "Không thể tải lên chứng chỉ nào.", "errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        serializer = InstructorCertificateSerializer(certificates, many=True)
        result = {"certificates": serializer.data, "detail": f"Đã tải lên {len(certificates)} chứng chỉ thành công."}
        if errors:
            result["errors"] = errors
        return Response(result, status=status.HTTP_201_CREATED)


class InstructorCertificateListAPIView(APIView):
    """
    GET /api/users/instructors/applications/{application_id}/certificates/ - Lấy danh sách chứng chỉ.
    Yêu cầu quyền: user.instructor.view hoặc chủ sở hữu hồ sơ.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, application_id):
        try:
            application = user_service.get_application_detail(application_id)
        except Http404:
            return Response({"detail": "Không tìm thấy hồ sơ đăng ký."}, status=status.HTTP_404_NOT_FOUND)

        # Kiểm tra quyền: admin hoặc chủ sở hữu
        if not user_service.check_application_access(application, request.user):
            return Response({"detail": "Bạn không có quyền xem chứng chỉ này."}, status=status.HTTP_403_FORBIDDEN)

        certificates = user_service.get_certificates(application)
        serializer = InstructorCertificateSerializer(certificates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LinkGoogleAPIView(APIView):
    """
    POST /api/users/link-google/ - Liên kết Google Account với user hiện tại.
    Body: { "id_token": "google_id_token" }
    Yêu cầu: user phải đăng nhập.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LinkGoogleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = user_service.link_google_account(
            request.user,
            serializer.validated_data["id_token"]
        )
        return Response({
            "detail": "Liên kết Google Account thành công.",
            "user": UserDetailSerializer(user).data
        }, status=status.HTTP_200_OK)


class InstructorCertificateDeleteAPIView(APIView):
    """
    DELETE /api/users/instructors/applications/{application_id}/certificates/{certificate_id}/ - Xóa chứng chỉ.
    Chỉ chủ sở hữu hồ sơ mới được xóa.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, application_id, certificate_id):
        try:
            application = user_service.get_application_detail(application_id)
        except Http404:
            return Response({"detail": "Không tìm thấy hồ sơ đăng ký."}, status=status.HTTP_404_NOT_FOUND)

        # Kiểm tra chủ sở hữu bằng email
        if request.user.email != application.email:
            return Response({"detail": "Bạn không có quyền xóa chứng chỉ này."}, status=status.HTTP_403_FORBIDDEN)

        user_service.delete_certificate(application, certificate_id)
        return Response({"detail": "Xóa chứng chỉ thành công."}, status=status.HTTP_200_OK)


class MyInstructorCertificateUploadAPIView(APIView):
    """
    POST /api/users/instructors/certificates/ - Upload chứng chỉ cho instructor đang đăng nhập.
    Body: multipart/form-data { title: string, file: File }
    Chỉ instructor mới được upload.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        role_code = user.role.code if user.role else None

        if role_code != "INSTRUCTOR":
            return Response({"detail": "Chỉ giảng viên mới có thể upload chứng chỉ."}, status=status.HTTP_403_FORBIDDEN)

        if not hasattr(user, 'instructor_profile'):
            return Response({"detail": "Không tìm thấy hồ sơ giảng viên."}, status=status.HTTP_404_NOT_FOUND)

        profile = user.instructor_profile
        certificates, errors = user_service.process_upload_request(profile, request)

        if not certificates:
            return Response({"detail": "Không thể tải lên chứng chỉ nào.", "errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        serializer = InstructorCertificateSerializer(certificates, many=True)
        result = {"certificates": serializer.data, "detail": f"Đã tải lên {len(certificates)} chứng chỉ thành công."}
        if errors:
            result["errors"] = errors
        return Response(result, status=status.HTTP_201_CREATED)


class MyInstructorCertificateListAPIView(APIView):
    """
    GET /api/users/instructors/certificates/ - Lấy danh sách chứng chỉ của instructor đang đăng nhập.
    Chỉ instructor mới có thể xem.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role_code = user.role.code if user.role else None

        if role_code != "INSTRUCTOR":
            return Response({"detail": "Chỉ giảng viên mới có thể xem chứng chỉ."}, status=status.HTTP_403_FORBIDDEN)

        if not hasattr(user, 'instructor_profile'):
            return Response({"detail": "Không tìm thấy hồ sơ giảng viên."}, status=status.HTTP_404_NOT_FOUND)

        profile = user.instructor_profile
        certificates = user_service.get_certificates(profile)
        serializer = InstructorCertificateSerializer(certificates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MyInstructorCertificateDeleteAPIView(APIView):
    """
    DELETE /api/users/instructors/certificates/{certificate_id}/ - Xóa chứng chỉ của instructor đang đăng nhập.
    Chỉ instructor mới có thể xóa chứng chỉ của mình.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, certificate_id):
        user = request.user
        role_code = user.role.code if user.role else None

        if role_code != "INSTRUCTOR":
            return Response({"detail": "Chỉ giảng viên mới có thể xóa chứng chỉ."}, status=status.HTTP_403_FORBIDDEN)

        if not hasattr(user, 'instructor_profile'):
            return Response({"detail": "Không tìm thấy hồ sơ giảng viên."}, status=status.HTTP_404_NOT_FOUND)

        profile = user.instructor_profile
        user_service.delete_certificate(profile, certificate_id)
        return Response({"detail": "Xóa chứng chỉ thành công."}, status=status.HTTP_200_OK)
