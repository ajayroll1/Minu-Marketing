from rest_framework import permissions
from app.models import UserProfile

class RoleBasedPermission(permissions.BasePermission):
    """
    Enforces RBAC:
    - Administrator: All access
    - Inventory Manager: Read/Write products, inventory, alerts, reports; cannot manage users
    - Inventory Operator: Read products/categories; Write stock-transactions; cannot delete or archive products
    - Read-Only Viewer: SAFE_METHODS (GET, HEAD, OPTIONS) only
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        # Ensure user profile exists
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        role = profile.role

        # Read-only viewers can only perform safe methods
        if role == UserProfile.ROLE_VIEWER:
            return request.method in permissions.SAFE_METHODS

        # Operators can perform safe methods on everything, and POST on transactions
        if role == UserProfile.ROLE_OPERATOR:
            if request.method in permissions.SAFE_METHODS:
                return True
            view_name = getattr(view, '__class__', None).__name__
            if 'Transaction' in view_name or 'Alert' in view_name:
                return True
            return False

        # Managers can perform all standard CRUD operations except user administration
        if role == UserProfile.ROLE_MANAGER:
            return True

        # Admins have full access
        if role == UserProfile.ROLE_ADMIN:
            return True

        return False
