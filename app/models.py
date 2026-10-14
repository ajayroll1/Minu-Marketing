from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from decimal import Decimal

class UserProfile(models.Model):
    ROLE_ADMIN = 'ADMIN'
    ROLE_MANAGER = 'MANAGER'
    ROLE_OPERATOR = 'OPERATOR'
    ROLE_VIEWER = 'VIEWER'

    ROLE_CHOICES = [
        (ROLE_ADMIN, 'Administrator'),
        (ROLE_MANAGER, 'Inventory Manager'),
        (ROLE_OPERATOR, 'Inventory Operator'),
        (ROLE_VIEWER, 'Read-Only Viewer'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_OPERATOR)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"


class EmailOTP(models.Model):
    PURPOSE_SIGNUP = 'SIGNUP'
    PURPOSE_RESET = 'RESET'

    PURPOSE_CHOICES = [
        (PURPOSE_SIGNUP, 'Signup Verification'),
        (PURPOSE_RESET, 'Password Reset'),
    ]

    email = models.EmailField(db_index=True)
    otp_code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"OTP for {self.email} ({self.purpose}): {self.otp_code}"



class Category(models.Model):
    name = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Supplier(models.Model):
    name = models.CharField(max_length=150)
    contact_person = models.CharField(max_length=100, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=40, blank=True, default='')
    address = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    STATUS_ACTIVE = 'ACTIVE'
    STATUS_ARCHIVED = 'ARCHIVED'

    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_ARCHIVED, 'Archived'),
    ]

    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=80, unique=True, db_index=True)
    description = models.TextField(blank=True, default='')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    unit_of_measure = models.CharField(max_length=30, default='Units')
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), validators=[MinValueValidator(Decimal('0.00'))])
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), validators=[MinValueValidator(Decimal('0.00'))])
    current_stock = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    min_stock_level = models.IntegerField(default=10, validators=[MinValueValidator(0)])
    reorder_quantity = models.IntegerField(default=50, validators=[MinValueValidator(0)])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_products')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sku']),
            models.Index(fields=['status']),
            models.Index(fields=['current_stock']),
        ]

    def __str__(self):
        return f"{self.name} ({self.sku})"

    @property
    def is_low_stock(self):
        return self.current_stock <= self.min_stock_level and self.current_stock > 0

    @property
    def is_out_of_stock(self):
        return self.current_stock == 0

    @property
    def inventory_valuation(self):
        return self.current_stock * self.cost_price


class StockTransaction(models.Model):
    TYPE_IN = 'STOCK_IN'
    TYPE_OUT = 'STOCK_OUT'
    TYPE_ADJUSTMENT = 'ADJUSTMENT'
    TYPE_CORRECTION = 'CORRECTION'
    TYPE_REVERSAL = 'REVERSAL'

    TYPE_CHOICES = [
        (TYPE_IN, 'Stock In (Purchase/Inbound)'),
        (TYPE_OUT, 'Stock Out (Sale/Dispatched)'),
        (TYPE_ADJUSTMENT, 'Inventory Adjustment (Audit/Variance)'),
        (TYPE_CORRECTION, 'Approved Correction'),
        (TYPE_REVERSAL, 'Transaction Reversal'),
    ]

    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    quantity = models.IntegerField()  # absolute amount moved, or delta for adjustment
    before_stock = models.IntegerField()
    after_stock = models.IntegerField()
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    reference_number = models.CharField(max_length=100, blank=True, default='')
    reason = models.TextField(blank=True, default='')
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='stock_transactions')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['transaction_type']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.transaction_type} - {self.product.sku}: {self.quantity} (Stock: {self.before_stock} -> {self.after_stock})"


class LowStockAlert(models.Model):
    SEVERITY_LOW = 'LOW_STOCK'
    SEVERITY_OUT = 'OUT_OF_STOCK'

    SEVERITY_CHOICES = [
        (SEVERITY_LOW, 'Low Stock Warning'),
        (SEVERITY_OUT, 'Out of Stock Critical'),
    ]

    STATUS_ACTIVE = 'ACTIVE'
    STATUS_ACKNOWLEDGED = 'ACKNOWLEDGED'
    STATUS_RESOLVED = 'RESOLVED'

    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_ACKNOWLEDGED, 'Acknowledged'),
        (STATUS_RESOLVED, 'Resolved'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='alerts')
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    stock_at_trigger = models.IntegerField()
    threshold = models.IntegerField()
    notes = models.TextField(blank=True, default='')
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_alerts')
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['severity']),
        ]

    def __str__(self):
        return f"Alert: {self.product.name} ({self.severity}) - {self.status}"


class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=100)
    target_entity = models.CharField(max_length=100)
    target_id = models.CharField(max_length=100, blank=True, default='')
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action} on {self.target_entity}:{self.target_id} by {self.user}"


class UserOnboarding(models.Model):
    """
    Tracks interactive onboarding tour state, checklist completion,
    and progress persistence per user across sessions.
    """
    STATUS_NOT_STARTED = 'NOT_STARTED'
    STATUS_IN_PROGRESS = 'IN_PROGRESS'
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_SKIPPED = 'SKIPPED'

    STATUS_CHOICES = [
        (STATUS_NOT_STARTED, 'Not Started'),
        (STATUS_IN_PROGRESS, 'In Progress'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_SKIPPED, 'Skipped'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='onboarding')
    version = models.CharField(max_length=20, default='1.0')
    welcome_seen = models.BooleanField(default=False)
    tour_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_NOT_STARTED)
    current_chapter = models.CharField(max_length=50, default='overview')
    current_step_index = models.PositiveIntegerField(default=0)
    completed_chapters = models.JSONField(default=list, blank=True)
    completed_checklist_items = models.JSONField(default=list, blank=True)
    checklist_dismissed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    skipped_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Onboarding: {self.user.username} ({self.tour_status})"

