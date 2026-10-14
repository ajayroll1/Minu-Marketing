from rest_framework import serializers
from django.contrib.auth.models import User
from app.models import (
    Category, Supplier, Product, StockTransaction, 
    LowStockAlert, UserProfile, AuditLog, UserOnboarding
)
from decimal import Decimal

class UserOnboardingSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = UserOnboarding
        fields = [
            'id', 'username', 'version', 'welcome_seen', 'tour_status',
            'current_chapter', 'current_step_index', 'completed_chapters',
            'completed_checklist_items', 'checklist_dismissed',
            'completed_at', 'skipped_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'username', 'created_at', 'updated_at']


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['role', 'avatar', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', read_only=True)
    avatar = serializers.CharField(source='profile.avatar', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'is_staff', 'is_superuser', 'role', 'avatar', 'date_joined', 'last_login']


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source='products.count', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'is_active', 'product_count', 'created_at', 'updated_at']


class SupplierSerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source='products.count', read_only=True)

    class Meta:
        model = Supplier
        fields = ['id', 'name', 'contact_person', 'email', 'phone', 'address', 'is_active', 'product_count', 'created_at', 'updated_at']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    is_out_of_stock = serializers.BooleanField(read_only=True)
    inventory_valuation = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'description', 'category', 'category_name',
            'supplier', 'supplier_name', 'unit_of_measure', 'cost_price',
            'selling_price', 'current_stock', 'min_stock_level', 'reorder_quantity',
            'status', 'is_low_stock', 'is_out_of_stock', 'inventory_valuation',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['current_stock', 'created_at', 'updated_at']

    def validate_sku(self, value):
        value = value.strip().upper()
        qs = Product.objects.filter(sku__iexact=value)
        if self.instance:
            qs = qs.exclude(id=self.instance.id)
        if qs.exists():
            raise serializers.ValidationError("A product with this SKU already exists.")
        return value


class StockTransactionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    performed_by_name = serializers.CharField(source='performed_by.username', read_only=True)

    class Meta:
        model = StockTransaction
        fields = [
            'id', 'product', 'product_name', 'product_sku', 'transaction_type',
            'quantity', 'before_stock', 'after_stock', 'unit_cost',
            'reference_number', 'reason', 'performed_by', 'performed_by_name',
            'created_at'
        ]
        read_only_fields = ['before_stock', 'after_stock', 'performed_by', 'created_at']


class StockTransactionCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    transaction_type = serializers.ChoiceField(choices=StockTransaction.TYPE_CHOICES)
    quantity = serializers.IntegerField()
    unit_cost = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, default=None)
    reference_number = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    reason = serializers.CharField(required=False, allow_blank=True, default='')


class LowStockAlertSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    current_stock = serializers.IntegerField(source='product.current_stock', read_only=True)
    resolved_by_name = serializers.CharField(source='resolved_by.username', read_only=True)

    class Meta:
        model = LowStockAlert
        fields = [
            'id', 'product', 'product_name', 'product_sku', 'current_stock',
            'severity', 'status', 'stock_at_trigger', 'threshold',
            'notes', 'resolved_by', 'resolved_by_name', 'resolved_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['stock_at_trigger', 'threshold', 'resolved_at', 'created_at', 'updated_at']


class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'username', 'action', 'target_entity', 'target_id', 'details', 'created_at']
