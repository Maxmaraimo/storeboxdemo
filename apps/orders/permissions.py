from apps.orders.models import StoreRole, RolePermission, StoreStaff, MODULE_CHOICES


ALL_MODULE_KEYS = [m[0] for m in MODULE_CHOICES]


def ensure_default_roles_for_store(store):
    """
    Initializes default roles (Admin, Menejer, Kassir) with full/appropriate permissions.
    """
    # 1. Admin Role (full permissions on everything)
    admin_role, created = StoreRole.objects.get_or_create(
        store=store,
        name='Admin',
        defaults={
            'description': 'Barcha huquqlarga ega to\'liq boshqaruvchi',
            'is_system': True,
            'is_active': True,
        }
    )
    for mod in ALL_MODULE_KEYS:
        RolePermission.objects.update_or_create(
            role=admin_role,
            module=mod,
            defaults={'can_view': True, 'can_edit': True, 'can_delete': True}
        )

    # 2. Menejer Role
    manager_role, created = StoreRole.objects.get_or_create(
        store=store,
        name='Menejer',
        defaults={
            'description': 'Buyurtmalar, tovarlar va mijozlarni boshqaruvchi',
            'is_system': False,
            'is_active': True,
        }
    )
    manager_view = {'dashboard', 'orders', 'customers', 'chats', 'categories', 'products', 'discounts', 'ikpu', 'warehouse', 'broadcast', 'promocodes', 'analytics', 'banners'}
    manager_edit = {'orders', 'customers', 'chats', 'categories', 'products', 'discounts', 'warehouse', 'promocodes', 'banners'}
    for mod in ALL_MODULE_KEYS:
        RolePermission.objects.get_or_create(
            role=manager_role,
            module=mod,
            defaults={
                'can_view': mod in manager_view,
                'can_edit': mod in manager_edit,
                'can_delete': False,
            }
        )

    # 3. Kassir Role
    cashier_role, created = StoreRole.objects.get_or_create(
        store=store,
        name='Kassir',
        defaults={
            'description': 'Kassa va buyurtmalarni qabul qilish',
            'is_system': False,
            'is_active': True,
        }
    )
    cashier_view = {'orders', 'categories', 'products', 'warehouse'}
    cashier_edit = {'orders'}
    for mod in ALL_MODULE_KEYS:
        RolePermission.objects.get_or_create(
            role=cashier_role,
            module=mod,
            defaults={
                'can_view': mod in cashier_view,
                'can_edit': mod in cashier_edit,
                'can_delete': False,
            }
        )

    return [admin_role, manager_role, cashier_role]


def get_user_permissions(user, store):
    """
    Returns a dict of {module: {'view': bool, 'edit': bool, 'delete': bool}}
    and flags `is_owner`, `is_courier`.
    """
    result = {
        'is_owner': False,
        'is_courier': False,
        'role_name': '',
        'modules': {mod: {'view': True, 'edit': True, 'delete': True} for mod in ALL_MODULE_KEYS}
    }

    if not user or not user.is_authenticated or not store:
        # Deny all
        result['modules'] = {mod: {'view': False, 'edit': False, 'delete': False} for mod in ALL_MODULE_KEYS}
        return result

    # Store owner or Superuser -> Full access
    if user.is_superuser or store.owner_id == user.id:
        result['is_owner'] = True
        result['role_name'] = 'Egasi (Owner)'
        return result

    # Check staff member
    staff = StoreStaff.objects.filter(user=user, store=store, is_active=True).select_related('store_role').first()
    if not staff:
        result['modules'] = {mod: {'view': False, 'edit': False, 'delete': False} for mod in ALL_MODULE_KEYS}
        return result

    if staff.is_courier:
        result['is_courier'] = True
        result['role_name'] = 'Kuryer'
        # Couriers only access courier panel
        result['modules'] = {mod: {'view': False, 'edit': False, 'delete': False} for mod in ALL_MODULE_KEYS}
        return result

    # Regular staff with store_role
    if staff.store_role:
        result['role_name'] = staff.store_role.name
        perms = RolePermission.objects.filter(role=staff.store_role)
        perms_map = {p.module: {'view': p.can_view, 'edit': p.can_edit, 'delete': p.can_delete} for p in perms}
        for mod in ALL_MODULE_KEYS:
            result['modules'][mod] = perms_map.get(mod, {'view': False, 'edit': False, 'delete': False})
        return result

    # Fallback for staff without assigned role
    result['role_name'] = staff.role
    if staff.role == StoreStaff.Roles.ADMIN:
        return result
    else:
        # Default restricted
        default_v = {'dashboard', 'orders', 'customers', 'categories', 'products'}
        result['modules'] = {
            mod: {'view': mod in default_v, 'edit': mod in {'orders', 'customers'}, 'delete': False}
            for mod in ALL_MODULE_KEYS
        }
        return result


def has_staff_permission(user, store, module, action='view'):
    """
    Checks if `user` has `action` ('view', 'edit', 'delete') on `module` in `store`.
    """
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser or (store and store.owner_id == user.id):
        return True
    perms = get_user_permissions(user, store)
    mod_perm = perms['modules'].get(module, {})
    return bool(mod_perm.get(action, False))
