from django.db import models


class LeadInquiry(models.Model):
    class Statuses(models.TextChoices):
        NEW = 'NEW', 'Yangi (Новый)'
        CONTACTED = 'CONTACTED', "Bog'lanildi (Связались)"
        CONVERTED = 'CONVERTED', "Mijoz bo'ldi (Сделка)"
        REJECTED = 'REJECTED', 'Bekor qilindi (Отказ)'

    name = models.CharField(max_length=255, verbose_name="Ism / ФИО")
    company = models.CharField(max_length=255, blank=True, verbose_name="Kompaniya / Компания")
    phone = models.CharField(max_length=50, verbose_name="Telefon raqami / Номер телефона")
    message = models.TextField(blank=True, verbose_name="Xabar / Сообщение")
    source = models.CharField(max_length=100, default='landing_consultation', verbose_name="Manba / Источник")
    status = models.CharField(max_length=20, choices=Statuses.choices, default=Statuses.NEW, verbose_name="Holat / Статус")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan sana / Дата создания")

    class Meta:
        verbose_name = "Lid / Заявка на консультацию"
        verbose_name_plural = "Lidlar / Заявки на консультацию"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.phone}) - {self.get_status_display()}"
