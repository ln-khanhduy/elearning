"""
URL configuration for elearning project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    # Health check cho Render (ping giữ service thức)
    path('api/health/', include('apps.common.urls')),
    
    # Auth & Users
    path('api/auth/', include('apps.users.urls.auth_urls')),
    path("api/users/", include("apps.users.urls.user_urls")),
    path("api/instructors/", include("apps.users.urls.instructor_manager_urls")),
    
    # Courses
    path("api/courses/", include("apps.courses.urls")),
    path("api/lessons/", include("apps.lessons.urls")),
    path("api/enrollments/", include("apps.enrollments.urls")),
    path("api/learning/", include("apps.enrollments.urls")),
    
    # Quizzes & Reviews
    path("api/quizzes/", include("apps.quizzes.urls")),
    path("api/reviews/", include("apps.reviews.urls")),

    # Payments & Certificates
    path("api/payments/", include("apps.payments.urls")),
    path("api/certificates/", include("apps.certificates.urls")),

    # Admin & System (bao gồm automation trigger)
    path("api/admin/", include("apps.system.urls")),

    # Support & Notifications
    path("api/support/", include("apps.support.urls")),
    path("api/notifications/", include("apps.notifications.urls")),

    # Promotions & Cart
    path("api/promotions/", include("apps.promotions.urls")),
    path("api/cart/", include("apps.cart.urls")),

    # API Documentation (drf-spectacular)
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]
