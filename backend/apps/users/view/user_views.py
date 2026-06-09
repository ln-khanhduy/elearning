from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from apps.common.permissions import HasRequiredPermission
from apps.users.repositories.user_repository import UserRepository, InstructorRepository
from apps.users.services.user_service import UserService, InstructorService
from apps.users.serializers.user_serializer import (
    UserListSerializer, UserDetailSerializer, UpdateProfileSerializer,
    ChangeUserRoleSerializer, LockUnlockUserSerializer, ChangePasswordSerializer,
    InstructorApplySerializer, InstructorApplicationSerializer, InstructorReviewSerializer,
)


class UserListAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "user.user.view"

    def get(self, request):
        serializer = UserListSerializer(UserRepository.get_all_users(), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "user.user.view"

    def get(self, request, user_id):
        serializer = UserDetailSerializer(UserRepository.get_user_by_id(user_id))
        return Response(serializer.data, status=status.HTTP_200_OK)


class CurrentUserAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserDetailSerializer(request.user).data, status=status.HTTP_200_OK)


class UpdateProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = UpdateProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Cập nhật thông tin cá nhân thành công.", "user": UserDetailSerializer(request.user).data}, status=status.HTTP_200_OK)


class ChangeUserRoleAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "admin.admin.change_role"

    def patch(self, request, user_id):
        serializer = ChangeUserRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = UserService.change_role(user_id, serializer.validated_data["role_id"])
        return Response({"detail": "Đổi role user thành công.", "user": UserDetailSerializer(user).data}, status=status.HTTP_200_OK)


class LockUserAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "user.user.lock"

    def patch(self, request, user_id):
        serializer = LockUnlockUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        UserService.lock_user(user_id, request.user, serializer.validated_data.get("reason", ""))
        return Response({"detail": "Khóa tài khoản thành công."}, status=status.HTTP_200_OK)


class UnlockUserAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "user.user.unlock"

    def patch(self, request, user_id):
        UserService.unlock_user(user_id, request.user)
        return Response({"detail": "Mở khóa tài khoản thành công."}, status=status.HTTP_200_OK)


class ChangePasswordAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        UserService.change_password(request.user, serializer.validated_data["new_password"])
        return Response({"detail": "Đổi mật khẩu thành công."}, status=status.HTTP_200_OK)


class InstructorApplyAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InstructorApplySerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        profile = serializer.save(user=request.user, status="PENDING")
        return Response({"detail": "Gửi hồ sơ đăng ký giảng viên thành công.", "application": InstructorApplicationSerializer(profile).data}, status=status.HTTP_201_CREATED)


class InstructorApplicationListAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "user.instructor.view"

    def get(self, request):
        serializer = InstructorApplicationSerializer(InstructorRepository.get_all_applications(), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class InstructorApplicationDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredPermission]
    required_permission = "user.instructor.view"

    def get(self, request, application_id):
        serializer = InstructorApplicationSerializer(InstructorRepository.get_application_by_id(application_id))
        return Response(serializer.data, status=status.HTTP_200_OK)


class InstructorApplicationReviewAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredPermission]

    def get_required_permission(self, review_status):
        return "user.instructor.approve" if review_status == "APPROVED" else "user.instructor.reject"

    def patch(self, request, application_id):
        serializer = InstructorReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        review_status = serializer.validated_data["status"]
        self.required_permission = self.get_required_permission(review_status)

        application, detail = InstructorService.review_application(
            application_id,
            request.user,
            review_status,
            serializer.validated_data.get("rejection_reason")
        )
        return Response({"detail": detail, "application": InstructorApplicationSerializer(application).data}, status=status.HTTP_200_OK)
