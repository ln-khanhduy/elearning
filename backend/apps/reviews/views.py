from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from apps.common.base_api_view import BasePermissionAPIView
from apps.reviews.services import review_service
from apps.reviews.serializers.review_serializer import (
    ReviewSerializer, ReviewCreateSerializer, ReviewStatusSerializer,
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
