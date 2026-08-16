"""
ASGI config for elearning project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'elearning.settings')

django_asgi_app = get_asgi_application()

from apps.notifications.routing import websocket_urlpatterns  # noqa: E402
from apps.chat.routing import websocket_urlpatterns as chat_urlpatterns  # noqa: E402

all_ws_patterns = websocket_urlpatterns + chat_urlpatterns

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": URLRouter(all_ws_patterns),
})
