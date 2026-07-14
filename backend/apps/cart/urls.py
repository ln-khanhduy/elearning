from django.urls import path
from apps.cart import views

urlpatterns = [
    path("", views.CartDetailAPIView.as_view(), name="cart-detail"),
    path("add/<int:course_id>/", views.CartAddItemAPIView.as_view(), name="cart-add"),
    path("remove/<int:course_id>/", views.CartRemoveItemAPIView.as_view(), name="cart-remove"),
    path("clear/", views.CartClearAPIView.as_view(), name="cart-clear"),
]