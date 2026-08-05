from django.urls import path
from apps.support.views import (
    MyRequestListAPIView,
    RequestCreateAPIView,
    RequestProcessAPIView,
    AdminRequestListAPIView,
    FinanceRefundListAPIView,
    FinanceRefundProcessAPIView,
)

urlpatterns = [
    path("my-requests/", MyRequestListAPIView.as_view(), name="my-requests"),
    path("requests/create/", RequestCreateAPIView.as_view(), name="request-create"),
    path("requests/<uuid:request_id>/process/", RequestProcessAPIView.as_view(), name="request-process"),
    path("admin/requests/", AdminRequestListAPIView.as_view(), name="admin-request-list"),
    path("finance/refunds/", FinanceRefundListAPIView.as_view(), name="finance-refund-list"),
    path("finance/refunds/<uuid:request_id>/process/", FinanceRefundProcessAPIView.as_view(), name="finance-refund-process"),
]
