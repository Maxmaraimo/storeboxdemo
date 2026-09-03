from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Roles(models.TextChoices):
        MERCHANT = 'MERCHANT', 'Владелец магазина (Мерчант)'
        SUPERADMIN = 'SUPERADMIN', 'Суперадминистратор платформы'
        CUSTOMER = 'CUSTOMER', 'Покупатель'

    phone = models.CharField(
        max_length=30,
        blank=True,
        null=True,
        verbose_name="Номер телефона (+998)"
    )
    role = models.CharField(
        max_length=20,
        choices=Roles.choices,
        default=Roles.MERCHANT,
        verbose_name="Роль в системе"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата регистрации")

    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_merchant(self):
        return self.role == self.Roles.MERCHANT

    @property
    def is_platform_admin(self):
        return self.role == self.Roles.SUPERADMIN or self.is_superuser
