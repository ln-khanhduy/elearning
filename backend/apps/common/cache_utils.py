"""
Các hàm tiện ích cache cho API.
Sử dụng Django cache framework (mặc định: LocMemCache, production: Redis).
"""
from django.core.cache import cache
from django.conf import settings
from functools import wraps


def cached(cache_key_prefix: str, timeout: int = 300):
    """
    Factory decorator: cache kết quả hàm với key dựa trên prefix + args.
    
    Cách dùng:
        @cached("courses:published", timeout=300)
        def get_published():
            return Course.objects.filter(...)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Tạo cache key từ prefix + tham số đầu tiên (thường là ID)
            key_parts = [cache_key_prefix]
            if args:
                key_parts.append(str(args[0]))
            cache_key = ":".join(key_parts)
            
            result = cache.get(cache_key)
            if result is not None:
                return result
            
            result = func(*args, **kwargs)
            cache.set(cache_key, result, timeout)
            return result
        return wrapper
    return decorator


def invalidate_cache(pattern: str):
    """
    Xoá cache keys theo pattern.
    Lưu ý: Với LocMemCache chỉ xoá được exact key; với Redis có thể dùng keys + delete.
    """
    cache.delete(pattern)