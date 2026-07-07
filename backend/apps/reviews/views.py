from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from apps.common.base_api_view import BasePermissionAPIView
from apps.common.response_helpers import success_response, error_response
from apps.reviews.services import review_service
from apps.reviews.serializers.review_serializer import (
    ReviewSerializer, ReviewCreateSerializer, ReviewUpdateSerializer, ReviewStatusSerializer,
)


class ReviewListAPIView(BasePermissionAPIView):
    """
    GET /api/reviews/ - Lấy danh sách tất cả đánh giá (cho admin).
    Yêu cầu quyền: course.review.view
    """
    required_permission = "course.review.view"

    def get(self, request):
        reviews = review_service.get_all_reviews()
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CourseReviewListAPIView(APIView):
    """
    GET /api/reviews/courses/{course_id}/ - Lấy danh sách đánh giá công khai của một khóa học.
    Không yêu cầu đăng nhập.
    """
    permission_classes = [AllowAny]

    def get(self, request, course_id):
        reviews = review_service.get_course_reviews(course_id)
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CourseReviewStatsAPIView(APIView):
    """
    GET /api/reviews/courses/{course_id}/stats/ - Lấy thống kê đánh giá khóa học.
    Không yêu cầu đăng nhập.
    """
    permission_classes = [AllowAny]

    def get(self, request, course_id):
        stats = review_service.get_course_review_stats(course_id)
        return success_response(stats)


class ReviewDetailAPIView(APIView):
    """
    GET /api/reviews/{review_id}/ - Lấy chi tiết một đánh giá kèm phản hồi.
    Không yêu cầu đăng nhập.
    """
    permission_classes = [AllowAny]

    def get(self, request, review_id):
        review, replies = review_service.get_review_detail(review_id)
        data = ReviewSerializer(review).data
        data["replies"] = ReviewSerializer(replies, many=True).data
        return Response(data, status=status.HTTP_200_OK)


class ReviewCreateAPIView(APIView):
    """
    POST /api/reviews/create/ - Tạo đánh giá / bình luận mới.
    Yêu cầu đăng nhập.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = review_service.create_review(request.user, serializer.validated_data)
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class ReviewUpdateAPIView(APIView):
    """
    PUT /api/reviews/{review_id}/update/ - Cập nhật nội dung đánh giá (chủ sở hữu).
    Yêu cầu đăng nhập.
    """
    permission_classes = [IsAuthenticated]

    def put(self, request, review_id):
        serializer = ReviewUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = review_service.update_review(review_id, request.user, serializer.validated_data)
        return success_response(ReviewSerializer(review).data, "Cập nhật đánh giá thành công.")


class ReviewDeleteAPIView(APIView):
    """
    DELETE /api/reviews/{review_id}/delete/ - Xóa đánh giá (chủ sở hữu).
    Yêu cầu đăng nhập.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, review_id):
        review_service.delete_review(review_id, request.user)
        return success_response(None, "Đã xóa đánh giá.")


class ReviewUpdateStatusAPIView(BasePermissionAPIView):
    """
    PATCH /api/reviews/{review_id}/update-status/ - Cập nhật trạng thái đánh giá (PUBLISHED/HIDDEN/DELETED).
    Yêu cầu quyền: course.comment.hide
    """
    required_permission = "course.comment.hide"

    def patch(self, request, review_id):
        serializer = ReviewStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = review_service.update_review_status(review_id, serializer.validated_data["status"])
        return Response(ReviewSerializer(review).data, status=status.HTTP_200_OK)