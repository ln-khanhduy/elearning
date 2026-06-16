from django.http import Http404
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from apps.common.permissions import HasRequiredPermission
from apps.system.services.admin_log_service import AdminLogService

from apps.users.services.user_service import UserService, InstructorService

from apps.users.serializers.user_serializer import (
    UserListSerializer, UserDetailSerializer, UpdateProfileSerializer,
    ChangeUserRoleSerializer, LockUnlockUserSerializer, ChangePasswordSerializer,
    InstructorApplySerializer, InstructorApplicationSerializer, InstructorReviewSerializer,
    InstructorCertificateSerializer, LinkGoogleSerializer,
)



class UserListAPIView(APIView):
    """
    GET /api/users/ - Lấy danh sách tất cả người dùng.
    Yêu cầu quyền: user.user.view
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "user.user.view"

    def get(self, request):
        users = UserService.get_all_users()
        serializer = UserListSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserDetailAPIView(APIView):
    """
    GET /api/users/{user_id}/ - Lấy thông tin chi tiết của một người dùng.
    Yêu cầu quyền: user.user.view
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "user.user.view"

    def get(self, request, user_id):
        user = UserService.get_user_by_id(user_id)
        serializer = UserDetailSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CurrentUserAPIView(APIView):
    """
    GET /api/users/me/ - Lấy thông tin của người dùng hiện tại (đang đăng nhập).
    Nếu user là instructor, trả về thêm thông tin ngân hàng.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role_code = user.role.code if user.role else None
        user_data = UserDetailSerializer(user).data

        # Nếu là instructor, thêm thông tin ngân hàng vào response
        if role_code == "INSTRUCTOR" and hasattr(user, 'instructor_profile'):
            profile = user.instructor_profile
            user_data["bank_name"] = profile.bank_name
            user_data["bank_account_number"] = profile.bank_account_number
            user_data["bank_account_name"] = profile.bank_account_name

        return Response(user_data, status=status.HTTP_200_OK)


class UpdateProfileAPIView(APIView):
    """
    PATCH /api/users/me/update/ - Cập nhật thông tin cá nhân (tên, số điện thoại, avatar, thông tin ngân hàng).
    - Chỉ instructor mới được cập nhật thông tin ngân hàng.
    - Student/user thường không thấy và không cập nhật được thông tin này.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        role_code = user.role.code if user.role else None

        # Kiểm tra: nếu có gửi bank fields nhưng không phải instructor -> từ chối
        bank_fields = {"bank_name", "bank_account_number", "bank_account_name"}
        has_bank_data = any(k in request.data for k in bank_fields)
        if has_bank_data and role_code != "INSTRUCTOR":
            return Response(
                {"detail": "Chỉ giảng viên mới có thể cập nhật thông tin thanh toán."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = UpdateProfileSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        UserService.update_profile(user, serializer.validated_data)

        # Lấy thông tin user response
        user_data = UserDetailSerializer(user).data

        # Nếu là instructor, thêm thông tin ngân hàng vào response
        if role_code == "INSTRUCTOR" and hasattr(user, 'instructor_profile'):
            profile = user.instructor_profile
            user_data["bank_name"] = profile.bank_name
            user_data["bank_account_number"] = profile.bank_account_number
            user_data["bank_account_name"] = profile.bank_account_name

        return Response({
            "detail": "Cập nhật thông tin cá nhân thành công.",
            "user": user_data
        }, status=status.HTTP_200_OK)


class ChangeUserRoleAPIView(APIView):
    """
    PATCH /api/users/{user_id}/change-role/ - Thay đổi vai trò (role) của người dùng.
    Yêu cầu quyền: admin.admin.change_role
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "admin.admin.change_role"

    def patch(self, request, user_id):
        serializer = ChangeUserRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = UserService.change_role(user_id, serializer.validated_data["role_id"])
        AdminLogService.log(
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


class LockUserAPIView(APIView):
    """
    PATCH /api/users/{user_id}/lock/ - Khóa tài khoản người dùng.
    Yêu cầu quyền: user.user.lock
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "user.user.lock"

    def patch(self, request, user_id):
        serializer = LockUnlockUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data.get("reason", "")
        user = UserService.lock_user(user_id, request.user, reason)
        AdminLogService.log(
            admin=request.user,
            action_type='USER_LOCK',
            detail=f"Admin {request.user.email} đã khóa tài khoản của user {user.email} (ID: {user.id}). Lý do: {reason or 'Không có lý do'}",
            target_id=str(user.id),
            target_type='User',
        )

        return Response({"detail": "Khóa tài khoản thành công."}, status=status.HTTP_200_OK)


class UnlockUserAPIView(APIView):
    """
    PATCH /api/users/{user_id}/unlock/ - Mở khóa tài khoản người dùng.
    Yêu cầu quyền: user.user.unlock
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "user.user.unlock"

    def patch(self, request, user_id):
        user = UserService.unlock_user(user_id, request.user)
        AdminLogService.log(
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
        UserService.change_password(
            request.user,
            serializer.validated_data["old_password"],
            serializer.validated_data["new_password"]
        )
        return Response({"detail": "Đổi mật khẩu thành công."}, status=status.HTTP_200_OK)


class InstructorApplyAPIView(APIView):
    """
    POST /api/users/instructors/apply/ - Gửi hồ sơ đăng ký trở thành giảng viên.
    Yêu cầu: bio, cv_file, contact_phone, thông tin ngân hàng và đồng ý điều khoản.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InstructorApplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = InstructorService.apply(request.user, serializer.validated_data)
        return Response({
            "detail": "Gửi hồ sơ đăng ký giảng viên thành công.",
            "application": InstructorApplicationSerializer(profile).data
        }, status=status.HTTP_201_CREATED)


class MyInstructorApplicationAPIView(APIView):
    """
    GET /api/users/instructors/my-application/ - Lấy hồ sơ đăng ký giảng viên của user hiện tại.
    Trả về null nếu chưa từng gửi hồ sơ.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        application = InstructorService.get_my_application(request.user)
        if not application:
            return Response({"application": None}, status=status.HTTP_200_OK)
        serializer = InstructorApplicationSerializer(application)
        return Response({"application": serializer.data}, status=status.HTTP_200_OK)


class InstructorApplicationListAPIView(APIView):
    """
    GET /api/users/instructors/applications/ - Lấy danh sách hồ sơ đăng ký giảng viên.
    Có thể lọc theo trạng thái: ?status=PENDING|APPROVED|REJECTED
    Yêu cầu quyền: user.instructor.view
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "user.instructor.view"

    def get(self, request):
        status_filter = request.query_params.get("status")
        applications = InstructorService.get_all_applications(status_filter)
        serializer = InstructorApplicationSerializer(applications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class InstructorApplicationDetailAPIView(APIView):
    """
    GET /api/users/instructors/applications/{application_id}/ - Lấy chi tiết một hồ sơ đăng ký.
    Yêu cầu quyền: user.instructor.view
    """
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "user.instructor.view"

    def get(self, request, application_id):
        application = InstructorService.get_application_detail(application_id)
        serializer = InstructorApplicationSerializer(application)
        return Response(serializer.data, status=status.HTTP_200_OK)


class InstructorApplicationReviewAPIView(APIView):
    """
    PATCH /api/users/instructors/applications/{application_id}/review/ - Duyệt hoặc từ chối hồ sơ.
    Body: { "status": "APPROVED"|"REJECTED", "rejection_reason": "..." (bắt buộc nếu từ chối) }
    Yêu cầu quyền động: user.instructor.approve (nếu duyệt) hoặc user.instructor.reject (nếu từ chối)
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, application_id):
        serializer = InstructorReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        review_status = serializer.validated_data["status"]
        required_perm = "user.instructor.approve" if review_status == "APPROVED" else "user.instructor.reject"

        # Kiểm tra quyền thủ công dựa trên hành động (duyệt hoặc từ chối)
        # Phải check permission TRƯỚC khi gọi Service để tránh bypass
        self.required_permission = required_perm
        perm_checker = HasRequiredPermission()
        if not perm_checker.has_permission(request, self):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Bạn không có quyền thực hiện hành động này.")

        application, detail = InstructorService.review_application(
            application_id,
            request.user,
            review_status,
            serializer.validated_data.get("rejection_reason")
        )

        action = 'INSTRUCTOR_APPROVE' if review_status == 'APPROVED' else 'INSTRUCTOR_REJECT'
        rejection_reason = serializer.validated_data.get("rejection_reason")
        AdminLogService.log(
            admin=request.user,
            action_type=action,
            detail=f"Admin {request.user.email} đã {detail.lower()} hồ sơ giảng viên của user {application.user.email} (ID: {application.user.id}){f'. Lý do: {rejection_reason}' if rejection_reason else ''}",
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
        user = InstructorService._authenticate_request(request)
        if not user:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            application = InstructorService.get_application_detail(application_id)
        except Http404:
            return Response({"detail": "Không tìm thấy hồ sơ đăng ký."}, status=status.HTTP_404_NOT_FOUND)

        # Kiểm tra quyền: admin (user.instructor.view) hoặc chủ sở hữu hồ sơ
        if not InstructorService.check_application_access(application, user):
            return Response({"detail": "Bạn không có quyền tải file CV này."}, status=status.HTTP_403_FORBIDDEN)

        if not application.cv_file:
            return Response({"detail": "Hồ sơ này không có file CV."}, status=status.HTTP_404_NOT_FOUND)

        try:
            return InstructorService.download_file_from_cloudinary(application.cv_file, f"CV_{application.id}.pdf")
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
            application = InstructorService.get_application_detail(application_id)
        except Http404:
            return Response({"detail": "Không tìm thấy hồ sơ đăng ký."}, status=status.HTTP_404_NOT_FOUND)

        # Kiểm tra quyền: admin hoặc chủ sở hữu
        if not InstructorService.check_application_access(application, request.user):
            return Response({"detail": "Bạn không có quyền tải chứng chỉ này."}, status=status.HTTP_403_FORBIDDEN)

        certificate = InstructorService.get_certificate_by_id(application, certificate_id)
        try:
            return InstructorService.download_file_from_cloudinary(certificate.file, f"ChungChi_{certificate.id}.pdf")
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
        user = InstructorService._authenticate_request(request)
        if not user:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            application = InstructorService.get_application_detail(application_id)
        except Http404:
            return Response({"detail": "Không tìm thấy hồ sơ đăng ký."}, status=status.HTTP_404_NOT_FOUND)

        # Kiểm tra quyền: admin hoặc chủ sở hữu
        if not InstructorService.check_application_access(application, user):
            return Response({"detail": "Bạn không có quyền xem chứng chỉ này."}, status=status.HTTP_403_FORBIDDEN)

        certificate = InstructorService.get_certificate_by_id(application, certificate_id)
        try:
            return InstructorService.preview_file_from_cloudinary(certificate.file, f"ChungChi_{certificate.id}.pdf")
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
        user = InstructorService._authenticate_request(request)
        if not user:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            application = InstructorService.get_application_detail(application_id)
        except Http404:
            return Response({"detail": "Không tìm thấy hồ sơ đăng ký."}, status=status.HTTP_404_NOT_FOUND)

        # Kiểm tra quyền: admin (user.instructor.view) hoặc chủ sở hữu hồ sơ
        if not InstructorService.check_application_access(application, user):
            return Response({"detail": "Bạn không có quyền xem CV này."}, status=status.HTTP_403_FORBIDDEN)

        if not application.cv_file:
            return Response({"detail": "Hồ sơ này không có file CV."}, status=status.HTTP_404_NOT_FOUND)

        try:
            return InstructorService.preview_file_from_cloudinary(application.cv_file, f"CV_{application.id}.pdf")
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
            application = InstructorService.get_application_detail(application_id)
        except Http404:
            return Response({"detail": "Không tìm thấy hồ sơ đăng ký."}, status=status.HTTP_404_NOT_FOUND)

        # Chỉ chủ sở hữu mới được upload chứng chỉ
        if application.user != request.user:
            return Response({"detail": "Bạn không có quyền upload chứng chỉ cho hồ sơ này."}, status=status.HTTP_403_FORBIDDEN)

        certificates, errors = InstructorService.process_upload_request(application, request)

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
            application = InstructorService.get_application_detail(application_id)
        except Http404:
            return Response({"detail": "Không tìm thấy hồ sơ đăng ký."}, status=status.HTTP_404_NOT_FOUND)

        # Kiểm tra quyền: admin hoặc chủ sở hữu
        if not InstructorService.check_application_access(application, request.user):
            return Response({"detail": "Bạn không có quyền xem chứng chỉ này."}, status=status.HTTP_403_FORBIDDEN)

        certificates = InstructorService.get_certificates(application)
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
        user = UserService.link_google_account(
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
            application = InstructorService.get_application_detail(application_id)
        except Http404:
            return Response({"detail": "Không tìm thấy hồ sơ đăng ký."}, status=status.HTTP_404_NOT_FOUND)

        if application.user != request.user:
            return Response({"detail": "Bạn không có quyền xóa chứng chỉ này."}, status=status.HTTP_403_FORBIDDEN)

        InstructorService.delete_certificate(application, certificate_id)
        return Response({"detail": "Xóa chứng chỉ thành công."}, status=status.HTTP_200_OK)
