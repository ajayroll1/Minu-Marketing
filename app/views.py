import csv
from io import StringIO
from decimal import Decimal
from datetime import timedelta
from django.db.models import Sum, F, Count, Q
from django.utils import timezone
from django.http import HttpResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator

from rest_framework import viewsets, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.authtoken.models import Token
from django_filters.rest_framework import DjangoFilterBackend

import random
from app.models import (
    Category, Supplier, Product, StockTransaction, 
    LowStockAlert, AuditLog, UserProfile, EmailOTP, UserOnboarding
)
from app.serializers import (
    CategorySerializer, SupplierSerializer, ProductSerializer,
    StockTransactionSerializer, StockTransactionCreateSerializer,
    LowStockAlertSerializer, AuditLogSerializer, UserSerializer,
    UserOnboardingSerializer
)
from app.permissions import RoleBasedPermission
from app.services import InventoryService
from django.core.mail import send_mail
from django.conf import settings

@method_decorator(ensure_csrf_cookie, name='dispatch')
class AuthSendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        purpose = request.data.get('purpose', 'SIGNUP')  # SIGNUP or RESET

        if not email:
            return Response({'error': 'Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if purpose == 'RESET':
            if not User.objects.filter(email=email).exists():
                return Response({'error': 'No account exists with this email address.'}, status=status.HTTP_404_NOT_FOUND)
        elif purpose == 'SIGNUP':
            if User.objects.filter(email=email).exists():
                return Response({'error': 'An account already exists with this email address.'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate 6-digit cryptographic OTP
        otp_code = str(random.randint(100000, 999999))
        EmailOTP.objects.create(email=email, otp_code=otp_code, purpose=purpose)

        # Dispatch via configured SMTP
        subject = f"Your Minu Marketing Verification Code: {otp_code}"
        message = f"""
Hello,

Your 6-digit verification code for Minu Marketing ({'New Profile Creation' if purpose == 'SIGNUP' else 'Password Reset'}) is:

    {otp_code}

This code will expire shortly. If you did not request this, please disregard this email.

Best regards,
Minu Marketing Security
"""
        try:
            send_mail(
                subject,
                message,
                getattr(settings, 'DEFAULT_FROM_EMAIL', 'Referly Notifications <ajaymahto2580@gmail.com>'),
                [email],
                fail_silently=False
            )
            return Response({
                'message': f"Agar aapka email '{email}' registered hai, toh verification OTP bhej diya gaya hai. Please check your inbox/spam folder."
            })
        except Exception as e:
            return Response({'error': f'Failed to send OTP via SMTP: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(ensure_csrf_cookie, name='dispatch')
class AuthSignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '').strip()
        first_name = request.data.get('first_name', '').strip()
        role = request.data.get('role', UserProfile.ROLE_OPERATOR)
        otp = request.data.get('otp', '').strip()

        if not username or not email or not password or not otp:
            return Response({'error': 'Username, email, password, and OTP code are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify OTP
        otp_record = EmailOTP.objects.filter(email=email, otp_code=otp, purpose=EmailOTP.PURPOSE_SIGNUP, is_verified=False).first()
        if not otp_record:
            return Response({'error': 'Invalid or expired OTP code for this email.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username__iexact=username).exists():
            return Response({'error': 'A user with this username already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email__iexact=email).exists():
            return Response({'error': 'A user with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        # Create user & profile
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name
        )
        if role in [UserProfile.ROLE_ADMIN, UserProfile.ROLE_MANAGER]:
            user.is_staff = True
            user.save()

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.role = role
        profile.save()

        # Mark OTP verified
        otp_record.is_verified = True
        otp_record.save()

        # Log in the user immediately
        login(request, user)
        token, _ = Token.objects.get_or_create(user=user)

        AuditLog.objects.create(
            user=user,
            action="USER_SELF_SIGNUP",
            target_entity="User",
            target_id=str(user.id),
            details={'username': user.username, 'role': role}
        )

        return Response({
            'message': 'Account created successfully.',
            'token': token.key,
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


@method_decorator(ensure_csrf_cookie, name='dispatch')
class AuthForgotPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp = request.data.get('otp', '').strip()
        new_password = request.data.get('new_password', '').strip()

        if not email or not otp or not new_password:
            return Response({'error': 'Email, OTP code, and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        otp_record = EmailOTP.objects.filter(email=email, otp_code=otp, purpose=EmailOTP.PURPOSE_RESET, is_verified=False).first()
        if not otp_record:
            return Response({'error': 'Invalid or expired OTP code for this email.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if not user:
            return Response({'error': 'User matching this email not found.'}, status=status.HTTP_404_NOT_FOUND)

        user.set_password(new_password)
        user.save()

        # Invalidate old auth token for security so stale sessions are terminated
        Token.objects.filter(user=user).delete()

        # Delete consumed OTP record
        otp_record.delete()

        AuditLog.objects.create(
            user=user,
            action="PASSWORD_RESET_VIA_OTP",
            target_entity="User",
            target_id=str(user.id),
            details={'email': email}
        )

        return Response({'message': 'Password has been successfully updated. You can now log in with your new password.'})


@method_decorator(ensure_csrf_cookie, name='dispatch')
class AuthLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username_or_email = (request.data.get('username') or '').strip()
        password = request.data.get('password')

        if not username_or_email or not password:
            return Response({'error': 'Please provide both username and password.'}, status=status.HTTP_400_BAD_REQUEST)

        # Allow login via username OR email
        user_obj = None
        if '@' in username_or_email:
            user_obj = User.objects.filter(email__iexact=username_or_email).first()
        if not user_obj:
            user_obj = User.objects.filter(username__iexact=username_or_email).first()

        target_username = user_obj.username if user_obj else username_or_email

        user = authenticate(request, username=target_username, password=password)
        if user is not None:
            if not user.is_active:
                return Response({'error': 'This account has been disabled.'}, status=status.HTTP_403_FORBIDDEN)
            login(request, user)
            profile, _ = UserProfile.objects.get_or_create(user=user)
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'message': 'Login successful.',
                'token': token.key,
                'user': UserSerializer(user).data
            })
        return Response({'error': 'Invalid username/email or password.'}, status=status.HTTP_401_UNAUTHORIZED)


class AuthLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({'message': 'Logged out successfully.'})


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        return Response(UserSerializer(request.user).data)

    def post(self, request):
        avatar = request.data.get('avatar', '')
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        profile.avatar = avatar
        profile.save()
        return Response(UserSerializer(request.user).data)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [RoleBasedPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [RoleBasedPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'contact_person', 'email', 'phone']
    ordering_fields = ['name', 'created_at']


@method_decorator(ensure_csrf_cookie, name='dispatch')
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category', 'supplier').all()
    serializer_class = ProductSerializer
    permission_classes = [RoleBasedPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'supplier', 'status']
    search_fields = ['name', 'sku', 'description']
    ordering_fields = ['name', 'sku', 'current_stock', 'cost_price', 'selling_price', 'created_at']

    def perform_create(self, serializer):
        product = serializer.save(created_by=self.request.user)
        AuditLog.objects.create(
            user=self.request.user,
            action="PRODUCT_CREATED",
            target_entity="Product",
            target_id=str(product.id),
            details={'sku': product.sku, 'name': product.name}
        )

    def perform_update(self, serializer):
        product = serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            action="PRODUCT_UPDATED",
            target_entity="Product",
            target_id=str(product.id),
            details={'sku': product.sku, 'name': product.name}
        )

    @action(detail=True, methods=['post'], url_path='archive')
    def archive(self, request, pk=None):
        product = self.get_object()
        product.status = Product.STATUS_ARCHIVED
        product.save()
        AuditLog.objects.create(
            user=request.user,
            action="PRODUCT_ARCHIVED",
            target_entity="Product",
            target_id=str(product.id),
            details={'sku': product.sku}
        )
        return Response({'message': f"Product {product.sku} has been archived successfully."})

    @action(detail=True, methods=['post'], url_path='restore')
    def restore(self, request, pk=None):
        product = self.get_object()
        product.status = Product.STATUS_ACTIVE
        product.save()
        AuditLog.objects.create(
            user=request.user,
            action="PRODUCT_RESTORED",
            target_entity="Product",
            target_id=str(product.id),
            details={'sku': product.sku}
        )
        return Response({'message': f"Product {product.sku} has been restored successfully."})

    @action(detail=True, methods=['post'], url_path='set-threshold')
    def set_threshold(self, request, pk=None):
        product = self.get_object()
        min_level = request.data.get('min_stock_level')
        if min_level is None or int(min_level) < 0:
            return Response({'error': 'Please provide a valid non-negative min_stock_level.'}, status=status.HTTP_400_BAD_REQUEST)
        product.min_stock_level = int(min_level)
        product.save()

        # Immediately re-evaluate alerts with the newly configured threshold
        InventoryService.evaluate_low_stock_alerts(product)

        AuditLog.objects.create(
            user=request.user,
            action="ALERT_THRESHOLD_CONFIGURED",
            target_entity="Product",
            target_id=str(product.id),
            details={'sku': product.sku, 'new_threshold': product.min_stock_level}
        )

        return Response({
            'message': f"Alert threshold for {product.name} ({product.sku}) updated to {product.min_stock_level} units.",
            'product': ProductSerializer(product).data
        })

    def destroy(self, request, *args, **kwargs):
        try:
            product = self.get_object()
            if product.status != Product.STATUS_ARCHIVED:
                return Response(
                    {'error': 'Only archived products can be permanently deleted. Please archive the product first.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            sku = product.sku
            name = product.name
            prod_id = str(product.id)

            # Clear transactions and alerts referencing this product to avoid ProtectedError
            StockTransaction.objects.filter(product=product).delete()
            LowStockAlert.objects.filter(product=product).delete()
            product.delete()

            AuditLog.objects.create(
                user=request.user,
                action="PRODUCT_DELETED",
                target_entity="Product",
                target_id=prod_id,
                details={'sku': sku, 'name': name}
            )

            return Response({'message': f"Archived product '{name}' ({sku}) has been permanently deleted."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': f"Failed to delete product: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)





class StockTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockTransaction.objects.select_related('product', 'performed_by').all()
    serializer_class = StockTransactionSerializer
    permission_classes = [RoleBasedPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['transaction_type', 'product']
    search_fields = ['product__name', 'product__sku', 'reference_number', 'reason']
    ordering_fields = ['created_at', 'quantity']

    def create(self, request):
        create_serializer = StockTransactionCreateSerializer(data=request.data)
        create_serializer.is_valid(raise_exception=True)

        data = create_serializer.validated_data
        ledger_entry = InventoryService.process_transaction(
            product_id=data['product_id'],
            transaction_type=data['transaction_type'],
            quantity=data['quantity'],
            unit_cost=data.get('unit_cost'),
            reference_number=data.get('reference_number', ''),
            reason=data.get('reason', ''),
            user=request.user
        )

        return Response(StockTransactionSerializer(ledger_entry).data, status=status.HTTP_201_CREATED)


class LowStockAlertViewSet(viewsets.ModelViewSet):
    queryset = LowStockAlert.objects.select_related('product', 'resolved_by').all()
    serializer_class = LowStockAlertSerializer
    permission_classes = [RoleBasedPermission]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'severity']
    ordering_fields = ['created_at', 'severity']

    @action(detail=True, methods=['post'], url_path='acknowledge')
    def acknowledge(self, request, pk=None):
        alert = self.get_object()
        alert.status = LowStockAlert.STATUS_ACKNOWLEDGED
        alert.save()
        return Response({'message': 'Alert acknowledged.', 'alert': LowStockAlertSerializer(alert).data})

    @action(detail=True, methods=['post'], url_path='resolve')
    def resolve(self, request, pk=None):
        alert = self.get_object()
        alert.status = LowStockAlert.STATUS_RESOLVED
        alert.resolved_by = request.user
        alert.resolved_at = timezone.now()
        alert.save()
        return Response({'message': 'Alert marked as resolved.', 'alert': LowStockAlertSerializer(alert).data})

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        updated = LowStockAlert.objects.filter(status=LowStockAlert.STATUS_ACTIVE).update(status=LowStockAlert.STATUS_ACKNOWLEDGED)
        return Response({'message': f"{updated} active alerts marked as read/acknowledged."})

    @action(detail=False, methods=['get'], url_path='download-pdf')
    def download_pdf(self, request):
        # Allow query parameter token auth for file downloads
        if not request.user or not request.user.is_authenticated:
            token_key = request.query_params.get('token')
            if token_key:
                token_obj = Token.objects.filter(key=token_key).select_related('user').first()
                if token_obj and token_obj.user.is_active:
                    request.user = token_obj.user

        if not request.user or not request.user.is_authenticated:
            return Response({'detail': 'Authentication credentials were not provided.'}, status=status.HTTP_401_UNAUTHORIZED)

        from app.pdf_generator import generate_inventory_alert_pdf
        alerts = LowStockAlert.objects.filter(status__in=[LowStockAlert.STATUS_ACTIVE, LowStockAlert.STATUS_ACKNOWLEDGED]).select_related('product')
        pdf_bytes = generate_inventory_alert_pdf(alerts_queryset=alerts)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="critical_inventory_alerts.pdf"'
        return response



class DashboardSummaryView(APIView):
    permission_classes = [RoleBasedPermission]

    def get(self, request):
        # Calculate real-time database-backed KPI statistics
        active_products = Product.objects.filter(status=Product.STATUS_ACTIVE)
        total_products_count = active_products.count()
        total_units = active_products.aggregate(total=Sum('current_stock'))['total'] or 0

        # Cost-basis inventory valuation: sum(current_stock * cost_price)
        total_valuation = active_products.aggregate(
            val=Sum(F('current_stock') * F('cost_price'))
        )['val'] or Decimal('0.00')

        # Stock alert counts
        low_stock_count = active_products.filter(
            current_stock__lte=F('min_stock_level'),
            current_stock__gt=0
        ).count()

        out_of_stock_count = active_products.filter(current_stock=0).count()

        # Recent activities
        recent_in = StockTransaction.objects.filter(transaction_type=StockTransaction.TYPE_IN).count()
        recent_out = StockTransaction.objects.filter(transaction_type=StockTransaction.TYPE_OUT).count()
        recent_adjustments = StockTransaction.objects.filter(
            transaction_type__in=[StockTransaction.TYPE_ADJUSTMENT, StockTransaction.TYPE_CORRECTION]
        ).count()

        # Category distribution
        categories = Category.objects.annotate(
            item_count=Count('products', filter=Q(products__status=Product.STATUS_ACTIVE)),
            stock_sum=Sum('products__current_stock', filter=Q(products__status=Product.STATUS_ACTIVE))
        ).values('name', 'item_count', 'stock_sum')

        # Real-time Movement Activity Trends (Past 7 Days)
        today = timezone.now().date()
        movement_trends = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            day_in = StockTransaction.objects.filter(
                transaction_type=StockTransaction.TYPE_IN,
                created_at__date=day
            ).aggregate(total=Sum('quantity'))['total'] or 0

            day_out = StockTransaction.objects.filter(
                transaction_type=StockTransaction.TYPE_OUT,
                created_at__date=day
            ).aggregate(total=Sum('quantity'))['total'] or 0

            movement_trends.append({
                'date': day.strftime('%b %d'),
                'stock_in': day_in,
                'stock_out': day_out,
            })

        # Recent transactions
        recent_txs = StockTransactionSerializer(
            StockTransaction.objects.select_related('product', 'performed_by').all()[:8],
            many=True
        ).data

        # Top critical low stock items
        critical_items = ProductSerializer(
            active_products.filter(current_stock__lte=F('min_stock_level')).order_by('current_stock')[:5],
            many=True
        ).data

        return Response({
            'kpis': {
                'total_products': total_products_count,
                'total_units_in_stock': total_units,
                'total_inventory_valuation': float(total_valuation),
                'low_stock_count': low_stock_count,
                'out_of_stock_count': out_of_stock_count,
                'recent_in_count': recent_in,
                'recent_out_count': recent_out,
                'recent_adjustments_count': recent_adjustments,
            },
            'categories_distribution': list(categories),
            'movement_trends': movement_trends,
            'recent_transactions': recent_txs,
            'critical_items': critical_items
        })


class ExportReportsView(APIView):
    permission_classes = [RoleBasedPermission]

    def get(self, request, report_type):
        """
        Secure export to CSV with formula injection prevention
        """
        # Allow query parameter token auth for file downloads
        if not request.user or not request.user.is_authenticated:
            token_key = request.query_params.get('token')
            if token_key:
                token_obj = Token.objects.filter(key=token_key).select_related('user').first()
                if token_obj and token_obj.user.is_active:
                    request.user = token_obj.user

        if not request.user or not request.user.is_authenticated:
            return Response({'detail': 'Authentication credentials were not provided.'}, status=status.HTTP_401_UNAUTHORIZED)

        response = HttpResponse(content_type='text/csv')
        writer = csv.writer(response)

        def sanitize(val):
            # Mitigate CSV Formula Injection: prefix with single-quote if starts with =, +, -, @
            s = str(val) if val is not None else ''
            if s and s[0] in ('=', '+', '-', '@', '\t', '\r'):
                return "'" + s
            return s

        if report_type == 'products':
            response['Content-Disposition'] = 'attachment; filename="inventory_products.csv"'
            writer.writerow(['SKU', 'Name', 'Category', 'Supplier', 'Current Stock', 'Min Level', 'Cost Price', 'Selling Price', 'Valuation', 'Status'])
            products = Product.objects.select_related('category', 'supplier').all()
            for p in products:
                writer.writerow([
                    sanitize(p.sku),
                    sanitize(p.name),
                    sanitize(p.category.name if p.category else 'N/A'),
                    sanitize(p.supplier.name if p.supplier else 'N/A'),
                    p.current_stock,
                    p.min_stock_level,
                    float(p.cost_price),
                    float(p.selling_price),
                    float(p.current_stock * p.cost_price),
                    sanitize(p.status)
                ])

        elif report_type == 'transactions':
            response['Content-Disposition'] = 'attachment; filename="stock_transactions_ledger.csv"'
            writer.writerow(['ID', 'Timestamp', 'SKU', 'Product Name', 'Type', 'Quantity', 'Stock Before', 'Stock After', 'Reference', 'Reason', 'User'])
            txs = StockTransaction.objects.select_related('product', 'performed_by').all()
            for t in txs:
                writer.writerow([
                    t.id,
                    t.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    sanitize(t.product.sku),
                    sanitize(t.product.name),
                    sanitize(t.transaction_type),
                    t.quantity,
                    t.before_stock,
                    t.after_stock,
                    sanitize(t.reference_number),
                    sanitize(t.reason),
                    sanitize(t.performed_by.username if t.performed_by else 'System')
                ])

        elif report_type == 'alerts':
            response['Content-Disposition'] = 'attachment; filename="low_stock_alerts.csv"'
            writer.writerow(['ID', 'Timestamp', 'SKU', 'Product Name', 'Severity', 'Status', 'Trigger Stock', 'Threshold', 'Notes'])
            alerts = LowStockAlert.objects.select_related('product').all()
            for a in alerts:
                writer.writerow([
                    a.id,
                    a.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    sanitize(a.product.sku),
                    sanitize(a.product.name),
                    sanitize(a.severity),
                    sanitize(a.status),
                    a.stock_at_trigger,
                    a.threshold,
                    sanitize(a.notes)
                ])
        else:
            return Response({'error': 'Unknown report type.'}, status=status.HTTP_400_BAD_REQUEST)

        return response


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related('user').all()
    serializer_class = AuditLogSerializer
    permission_classes = [RoleBasedPermission]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at']


@method_decorator(ensure_csrf_cookie, name='dispatch')
class UserViewSet(viewsets.ModelViewSet):
    """
    Employee & Staff Management ViewSet:
    - Lists all employees with full details
    - Assign / Update roles (ADMIN, MANAGER, OPERATOR, VIEWER)
    - Toggle activate / deactivate profile status
    - Restricted to ADMIN / Superuser
    """
    queryset = User.objects.select_related('profile').all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['date_joined', 'username', 'is_active']

    def check_admin_permission(self, request):
        if request.user.is_superuser:
            return True
        profile = getattr(request.user, 'profile', None)
        return profile and profile.role == UserProfile.ROLE_ADMIN

    def list(self, request, *args, **kwargs):
        if not self.check_admin_permission(request):
            return Response({'error': 'Only system administrators can access employee directory.'}, status=status.HTTP_403_FORBIDDEN)
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        if not self.check_admin_permission(request):
            return Response({'error': 'Only system administrators can view employee records.'}, status=status.HTTP_403_FORBIDDEN)
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        if not self.check_admin_permission(request):
            return Response({'error': 'Only system administrators can create employee accounts.'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        role = data.get('role', UserProfile.ROLE_OPERATOR).strip().upper()

        if not username or not password:
            return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username__iexact=username).exists():
            return Response({'error': f"Username '{username}' is already in use."}, status=status.HTTP_400_BAD_REQUEST)

        if email and User.objects.filter(email__iexact=email).exists():
            return Response({'error': f"Email '{email}' is already associated with an account."}, status=status.HTTP_400_BAD_REQUEST)

        valid_roles = [UserProfile.ROLE_ADMIN, UserProfile.ROLE_MANAGER, UserProfile.ROLE_OPERATOR, UserProfile.ROLE_VIEWER]
        if role not in valid_roles:
            return Response({'error': f"Invalid role. Must be one of: {', '.join(valid_roles)}"}, status=status.HTTP_400_BAD_REQUEST)

        is_staff = (role in [UserProfile.ROLE_ADMIN, UserProfile.ROLE_MANAGER])
        user_obj = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_staff=is_staff,
            is_active=True
        )

        profile, _ = UserProfile.objects.get_or_create(user=user_obj)
        profile.role = role
        profile.save()

        AuditLog.objects.create(
            user=request.user,
            action="USER_CREATED",
            target_entity="User",
            target_id=str(user_obj.id),
            details={'username': user_obj.username, 'email': user_obj.email, 'role': role}
        )

        return Response({
            'message': f"Employee '{user_obj.username}' successfully created with role {role}.",
            'user': UserSerializer(user_obj).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='toggle-active')
    def toggle_active(self, request, pk=None):
        if not self.check_admin_permission(request):
            return Response({'error': 'Only administrators can activate or deactivate employees.'}, status=status.HTTP_403_FORBIDDEN)

        user_obj = self.get_object()
        if user_obj.id == request.user.id:
            return Response({'error': 'You cannot deactivate your own account.'}, status=status.HTTP_400_BAD_REQUEST)

        # Toggle activation
        user_obj.is_active = not user_obj.is_active
        user_obj.save()

        status_text = 'ACTIVATED' if user_obj.is_active else 'DEACTIVATED'
        AuditLog.objects.create(
            user=request.user,
            action=f"USER_STATUS_{status_text}",
            target_entity="User",
            target_id=str(user_obj.id),
            details={'username': user_obj.username, 'is_active': user_obj.is_active}
        )

        return Response({
            'message': f"Employee '{user_obj.username}' {status_text.lower()} successfully.",
            'user': UserSerializer(user_obj).data
        })

    @action(detail=True, methods=['post'], url_path='update-role')
    def update_role(self, request, pk=None):
        if not self.check_admin_permission(request):
            return Response({'error': 'Only administrators can assign employee roles.'}, status=status.HTTP_403_FORBIDDEN)

        user_obj = self.get_object()
        if user_obj.id == request.user.id:
            return Response({'error': 'You cannot change your own administrator role.'}, status=status.HTTP_400_BAD_REQUEST)

        new_role = request.data.get('role', '').strip().upper()

        valid_roles = [UserProfile.ROLE_ADMIN, UserProfile.ROLE_MANAGER, UserProfile.ROLE_OPERATOR, UserProfile.ROLE_VIEWER]
        if new_role not in valid_roles:
            return Response({'error': f"Invalid role. Must be one of: {', '.join(valid_roles)}"}, status=status.HTTP_400_BAD_REQUEST)

        profile, _ = UserProfile.objects.get_or_create(user=user_obj)
        old_role = profile.role
        profile.role = new_role
        profile.save()

        # Update staff status if Admin/Manager
        user_obj.is_staff = (new_role in [UserProfile.ROLE_ADMIN, UserProfile.ROLE_MANAGER])
        user_obj.save()

        AuditLog.objects.create(
            user=request.user,
            action="USER_ROLE_UPDATED",
            target_entity="User",
            target_id=str(user_obj.id),
            details={'username': user_obj.username, 'old_role': old_role, 'new_role': new_role}
        )

        return Response({
            'message': f"Role for '{user_obj.username}' updated to {new_role}.",
            'user': UserSerializer(user_obj).data
        })

    def update(self, request, *args, **kwargs):
        if not self.check_admin_permission(request):
            return Response({'error': 'Only system administrators can edit employee accounts.'}, status=status.HTTP_403_FORBIDDEN)

        user_obj = self.get_object()
        data = request.data

        username = data.get('username', user_obj.username).strip()
        email = data.get('email', user_obj.email or '').strip().lower()
        first_name = data.get('first_name', user_obj.first_name).strip()
        last_name = data.get('last_name', user_obj.last_name).strip()
        role = data.get('role', None)
        password = data.get('password', '').strip()

        # Check username uniqueness if changed
        if username and username.lower() != user_obj.username.lower():
            if User.objects.filter(username__iexact=username).exclude(id=user_obj.id).exists():
                return Response({'error': f"Username '{username}' is already taken by another account."}, status=status.HTTP_400_BAD_REQUEST)
            user_obj.username = username

        # Check email uniqueness if changed
        if email and email.lower() != (user_obj.email or '').lower():
            if User.objects.filter(email__iexact=email).exclude(id=user_obj.id).exists():
                return Response({'error': f"Email '{email}' is already associated with another account."}, status=status.HTTP_400_BAD_REQUEST)
            user_obj.email = email

        user_obj.first_name = first_name
        user_obj.last_name = last_name

        # Optionally update password if provided
        if password:
            user_obj.set_password(password)

        profile, _ = UserProfile.objects.get_or_create(user=user_obj)

        # Update role if provided
        if role:
            role = role.strip().upper()
            valid_roles = [UserProfile.ROLE_ADMIN, UserProfile.ROLE_MANAGER, UserProfile.ROLE_OPERATOR, UserProfile.ROLE_VIEWER]
            if role not in valid_roles:
                return Response({'error': f"Invalid role. Must be one of: {', '.join(valid_roles)}"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Prevent demoting own admin account
            if user_obj.id == request.user.id and role != UserProfile.ROLE_ADMIN:
                return Response({'error': 'You cannot remove your own administrator status.'}, status=status.HTTP_400_BAD_REQUEST)

            profile.role = role
            profile.save()
            user_obj.is_staff = (role in [UserProfile.ROLE_ADMIN, UserProfile.ROLE_MANAGER])

        user_obj.save()

        AuditLog.objects.create(
            user=request.user,
            action="USER_DETAILS_UPDATED",
            target_entity="User",
            target_id=str(user_obj.id),
            details={'username': user_obj.username, 'email': user_obj.email, 'role': profile.role}
        )

        return Response({
            'message': f"Employee '{user_obj.username}' updated successfully.",
            'user': UserSerializer(user_obj).data
        })

    def destroy(self, request, *args, **kwargs):
        try:
            if not self.check_admin_permission(request):
                return Response({'error': 'Only system administrators can delete employee accounts.'}, status=status.HTTP_403_FORBIDDEN)

            user_obj = self.get_object()
            if user_obj.id == request.user.id:
                return Response({'error': 'You cannot delete your own account.'}, status=status.HTTP_400_BAD_REQUEST)

            if user_obj.is_active:
                return Response({'error': 'Only deactivated employees can be permanently deleted. Please deactivate this account first.'}, status=status.HTTP_400_BAD_REQUEST)

            username = user_obj.username
            user_id = str(user_obj.id)
            role = getattr(user_obj, 'profile', None).role if hasattr(user_obj, 'profile') else 'N/A'

            user_obj.delete()

            AuditLog.objects.create(
                user=request.user,
                action="USER_DELETED",
                target_entity="User",
                target_id=user_id,
                details={'username': username, 'role': role}
            )

            return Response({'message': f"Employee '{username}' has been permanently deleted."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': f"Failed to delete employee: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)




@method_decorator(ensure_csrf_cookie, name='dispatch')
class OnboardingViewSet(viewsets.ViewSet):
    """
    Persistent Onboarding & Interactive Tour API Gateway:
    - Dedicated per-user onboarding state isolation
    - Idempotent and safe to retry
    - Tracks welcome modal, tour progress, chapter completion, checklist items, skip, and replay
    """
    permission_classes = [IsAuthenticated]

    def _get_or_create_onboarding(self, user):
        onboarding, _ = UserOnboarding.objects.get_or_create(
            user=user,
            defaults={
                'version': '1.0',
                'tour_status': UserOnboarding.STATUS_NOT_STARTED,
                'completed_chapters': [],
                'completed_checklist_items': [],
            }
        )
        return onboarding

    @action(detail=False, methods=['get'], url_path='status')
    def get_status(self, request):
        onboarding = self._get_or_create_onboarding(request.user)
        return Response(UserOnboardingSerializer(onboarding).data)

    @action(detail=False, methods=['post'], url_path='start')
    def start_tour(self, request):
        onboarding = self._get_or_create_onboarding(request.user)
        onboarding.welcome_seen = True
        if onboarding.tour_status == UserOnboarding.STATUS_NOT_STARTED:
            onboarding.tour_status = UserOnboarding.STATUS_IN_PROGRESS
        onboarding.save()
        return Response(UserOnboardingSerializer(onboarding).data)

    @action(detail=False, methods=['post'], url_path='save-progress')
    def save_progress(self, request):
        onboarding = self._get_or_create_onboarding(request.user)
        chapter = request.data.get('chapter') or request.data.get('current_chapter') or onboarding.current_chapter
        step_index = request.data.get('step_index') if request.data.get('step_index') is not None else request.data.get('current_step_index')
        if step_index is None:
            step_index = onboarding.current_step_index

        onboarding.current_chapter = str(chapter)
        onboarding.current_step_index = int(step_index)
        if onboarding.tour_status == UserOnboarding.STATUS_NOT_STARTED:
            onboarding.tour_status = UserOnboarding.STATUS_IN_PROGRESS
        onboarding.save()
        return Response(UserOnboardingSerializer(onboarding).data)

    @action(detail=False, methods=['post'], url_path='complete-chapter')
    def complete_chapter(self, request):
        onboarding = self._get_or_create_onboarding(request.user)
        chapter = request.data.get('chapter')
        if chapter:
            completed = set(onboarding.completed_chapters or [])
            completed.add(str(chapter))
            onboarding.completed_chapters = list(completed)
            onboarding.save()
        return Response(UserOnboardingSerializer(onboarding).data)

    @action(detail=False, methods=['post'], url_path='complete-checklist-item')
    def complete_checklist_item(self, request):
        onboarding = self._get_or_create_onboarding(request.user)
        item_id = request.data.get('item_id')
        if item_id:
            items = set(onboarding.completed_checklist_items or [])
            items.add(str(item_id))
            onboarding.completed_checklist_items = list(items)
            onboarding.save()
        return Response(UserOnboardingSerializer(onboarding).data)

    @action(detail=False, methods=['post'], url_path='dismiss-checklist')
    def dismiss_checklist(self, request):
        onboarding = self._get_or_create_onboarding(request.user)
        onboarding.checklist_dismissed = True
        onboarding.save()
        return Response(UserOnboardingSerializer(onboarding).data)

    @action(detail=False, methods=['post'], url_path='skip')
    def skip_tour(self, request):
        onboarding = self._get_or_create_onboarding(request.user)
        onboarding.welcome_seen = True
        onboarding.tour_status = UserOnboarding.STATUS_SKIPPED
        onboarding.skipped_at = timezone.now()
        onboarding.save()

        AuditLog.objects.create(
            user=request.user,
            action="ONBOARDING_TOUR_SKIPPED",
            target_entity="UserOnboarding",
            target_id=str(onboarding.id),
            details={'username': request.user.username}
        )

        return Response(UserOnboardingSerializer(onboarding).data)

    @action(detail=False, methods=['post'], url_path='finish')
    def finish_tour(self, request):
        onboarding = self._get_or_create_onboarding(request.user)
        onboarding.welcome_seen = True
        onboarding.tour_status = UserOnboarding.STATUS_COMPLETED
        onboarding.completed_at = timezone.now()
        onboarding.save()

        AuditLog.objects.create(
            user=request.user,
            action="ONBOARDING_TOUR_COMPLETED",
            target_entity="UserOnboarding",
            target_id=str(onboarding.id),
            details={'username': request.user.username}
        )

        return Response(UserOnboardingSerializer(onboarding).data)

    @action(detail=False, methods=['post'], url_path='restart')
    def restart_tour(self, request):
        onboarding = self._get_or_create_onboarding(request.user)
        onboarding.welcome_seen = True
        onboarding.tour_status = UserOnboarding.STATUS_IN_PROGRESS
        onboarding.current_chapter = 'overview'
        onboarding.current_step_index = 0
        onboarding.save()
        return Response(UserOnboardingSerializer(onboarding).data)

