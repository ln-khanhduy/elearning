from django.urls import path
from apps.promotions import views

urlpatterns = [
    # Admin coupon management
    path("coupons/", views.AdminCouponListAPIView.as_view(), name="admin-coupon-list"),
    path("coupons/create/", views.AdminCouponCreateAPIView.as_view(), name="admin-coupon-create"),
    path("coupons/<int:coupon_id>/", views.AdminCouponDetailAPIView.as_view(), name="admin-coupon-detail"),
    path("coupons/<int:coupon_id>/update/", views.AdminCouponUpdateAPIView.as_view(), name="admin-coupon-update"),
    path("coupons/<int:coupon_id>/delete/", views.AdminCouponDeleteAPIView.as_view(), name="admin-coupon-delete"),

    # Public coupon APIs
    path("coupons/validate/", views.CouponValidateAPIView.as_view(), name="coupon-validate"),
    path("coupons/apply/", views.CouponApplyAPIView.as_view(), name="coupon-apply"),
]