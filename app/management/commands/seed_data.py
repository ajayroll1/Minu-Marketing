from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from decimal import Decimal
from app.models import UserProfile, Category, Supplier, Product
from app.services import InventoryService

class Command(BaseCommand):
    help = 'Seeds initial users, roles, categories, suppliers, products and stock transactions.'

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding sample inventory data...")

        # 1. Users
        users_data = [
            ('admin', 'admin@example.com', 'Admin12345!', UserProfile.ROLE_ADMIN, True, True),
            ('manager', 'manager@example.com', 'Manager12345!', UserProfile.ROLE_MANAGER, True, False),
            ('operator', 'operator@example.com', 'Operator12345!', UserProfile.ROLE_OPERATOR, False, False),
            ('viewer', 'viewer@example.com', 'Viewer12345!', UserProfile.ROLE_VIEWER, False, False),
        ]

        created_users = {}
        for username, email, password, role, is_staff, is_superuser in users_data:
            user, created = User.objects.get_or_create(username=username, defaults={'email': email})
            user.set_password(password)
            user.is_staff = is_staff
            user.is_superuser = is_superuser
            user.save()

            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.role = role
            profile.save()
            created_users[username] = user
            self.stdout.write(f"  User verified: {username} ({role})")

        admin_user = created_users['admin']

        # 2. Categories
        categories_data = [
            ("Raw Materials", "Basic components and industrial minerals"),
            ("Electronics", "Integrated circuits, microcontrollers and assemblies"),
            ("Packaging", "Protective cartons, sealing films and crates"),
            ("Finished Goods", "Fully assembled commercial inventory"),
            ("Safety Gear", "Workplace protective equipment"),
        ]

        categories_map = {}
        for name, desc in categories_data:
            cat, _ = Category.objects.get_or_create(name=name, defaults={'description': desc})
            categories_map[name] = cat

        # 3. Suppliers
        suppliers_data = [
            ("Apex Global Logistics", "Sarah Jenkins", "sarah@apexlogistics.com", "+1-555-0199", "742 Evergreen Terrace"),
            ("Nordic Components AB", "Lars Lindholm", "lars@nordiccomp.se", "+46-8-123456", "Kungsgatan 14, Stockholm"),
            ("Pacific Industrial Hub", "Kenji Sato", "sato@pacificind.jp", "+81-3-987654", "Chiyoda-ku, Tokyo"),
            ("Solvent & Polymers Inc", "David Miller", "dmiller@solvents.com", "+1-555-0144", "Industrial Park Way, TX"),
        ]

        suppliers_map = {}
        for name, contact, email, phone, addr in suppliers_data:
            sup, _ = Supplier.objects.get_or_create(
                name=name,
                defaults={'contact_person': contact, 'email': email, 'phone': phone, 'address': addr}
            )
            suppliers_map[name] = sup

        # 4. Products & Stock
        products_data = [
            ("STM32 Microcontroller 32-bit", "ELEC-STM32-001", "High performance MCU with ARM Cortex-M4", "Electronics", "Nordic Components AB", "Units", Decimal("12.50"), Decimal("22.00"), 120, 30, 100),
            ("Lithium Polymer Cell 3.7V", "ELEC-BATT-3700", "Rechargeable 3700mAh battery cell", "Electronics", "Pacific Industrial Hub", "Units", Decimal("8.20"), Decimal("16.00"), 15, 25, 80),  # Low stock
            ("Thermal Dissipation Paste 50g", "RAW-THRM-050G", "High thermal conductivity ceramic compound", "Raw Materials", "Solvent & Polymers Inc", "Tubes", Decimal("3.40"), Decimal("7.50"), 0, 10, 50),     # Out of stock
            ("Corrugated Shipping Box XL", "PKG-BOX-XL01", "Heavy-duty double-wall packaging box", "Packaging", "Apex Global Logistics", "Units", Decimal("1.75"), Decimal("3.50"), 350, 50, 200),
            ("ESD Anti-Static Nitrile Gloves", "SFT-GLV-ESD-M", "Powder-free cleanroom antistatic gloves", "Safety Gear", "Apex Global Logistics", "Boxes", Decimal("6.00"), Decimal("12.00"), 45, 20, 60),
            ("Precision Multimeter Probe", "ELEC-PRB-009", "Gold plated ultra fine tip multimeter leads", "Electronics", "Nordic Components AB", "Pairs", Decimal("14.00"), Decimal("28.00"), 8, 15, 40),      # Low stock
            ("Industrial Heat Shrink 100m", "RAW-HSHR-100", "Flame retardant 2:1 polyolefin tubing", "Raw Materials", "Solvent & Polymers Inc", "Rolls", Decimal("22.00"), Decimal("45.00"), 65, 10, 30),
            ("Wireless Barcode Scanner Pro", "FIN-SCN-WIFI", "Rugged industrial 2D Bluetooth/WiFi scanner", "Finished Goods", "Pacific Industrial Hub", "Units", Decimal("85.00"), Decimal("160.00"), 24, 5, 20),
        ]

        for name, sku, desc, cat_name, sup_name, uom, cost, price, stock, min_lvl, reorder in products_data:
            product, created = Product.objects.get_or_create(
                sku=sku,
                defaults={
                    'name': name,
                    'description': desc,
                    'category': categories_map[cat_name],
                    'supplier': suppliers_map[sup_name],
                    'unit_of_measure': uom,
                    'cost_price': cost,
                    'selling_price': price,
                    'current_stock': 0,  # Initialize to 0, then transact
                    'min_stock_level': min_lvl,
                    'reorder_quantity': reorder,
                    'created_by': admin_user
                }
            )

            if created and stock > 0:
                # Transact stock-in using our official InventoryService to generate ledger records and evaluate alerts
                InventoryService.process_transaction(
                    product_id=product.id,
                    transaction_type='STOCK_IN',
                    quantity=stock,
                    unit_cost=cost,
                    reference_number=f"INIT-STOCK-{sku}",
                    reason="Initial warehouse intake inventory",
                    user=admin_user
                )
            elif created and stock == 0:
                # Trigger alert for out of stock
                InventoryService.evaluate_low_stock_alerts(product)

            self.stdout.write(f"  Product initialized: {name} [{sku}] - Stock: {product.current_stock}")

        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully!"))
