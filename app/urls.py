from django.urls import path, include
from rest_framework.routers import DefaultRouter
from app.views import (
    AuthLoginView, AuthLogoutView, CurrentUserView,
    AuthSendOTPView, AuthSignupView, AuthForgotPasswordResetView,
    CategoryViewSet, SupplierViewSet, ProductViewSet,
    StockTransactionViewSet, LowStockAlertViewSet,
    DashboardSummaryView, ExportReportsView, AuditLogViewSet, UserViewSet
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'suppliers', SupplierViewSet, basename='supplier')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'stock-transactions', StockTransactionViewSet, basename='stock-transaction')
router.register(r'alerts', LowStockAlertViewSet, basename='alert')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    # Auth Endpoints
    path('auth/login/', AuthLoginView.as_view(), name='auth-login'),
    path('auth/logout/', AuthLogoutView.as_view(), name='auth-logout'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),
    path('auth/send-otp/', AuthSendOTPView.as_view(), name='auth-send-otp'),
    path('auth/signup/', AuthSignupView.as_view(), name='auth-signup'),
    path('auth/reset-password/', AuthForgotPasswordResetView.as_view(), name='auth-reset-password'),


    # Analytics and Dashboard
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),

    # Reports
    path('reports/export/<str:report_type>/', ExportReportsView.as_view(), name='reports-export'),

    # Viewsets
    path('', include(router.urls)),
]
