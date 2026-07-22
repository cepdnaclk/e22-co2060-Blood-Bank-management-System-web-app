"""
Daily management command to check blood inventory for expiring / expired units.

Usage:
    python manage.py check_blood_expiry

Schedule via cron (run at 6 AM daily):
    0 6 * * * cd /path/to/main && python manage.py check_blood_expiry
"""

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db.models import Q
from django.utils import timezone

from apps.blood.bloodinventor.models.bloodinventor import BloodInventory
from apps.blood.bloodinventor.models.expiryAlert import ExpiryAlert


class Command(BaseCommand):
    help = "Check blood inventory for expiring and expired units, create alerts"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print what would happen without making changes",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        today = timezone.localdate()
        warning_date = today + timedelta(days=7)
        critical_date = today + timedelta(days=3)

        self.stdout.write(self.style.NOTICE(f"Running expiry check for {today}"))

        # ─── Step 1: Auto-mark expired units ──────────────────────
        expired_qs = BloodInventory.objects.filter(
            expiry_date__lt=today,
            status="available",
        )
        expired_count = expired_qs.count()

        if not dry_run:
            expired_qs.update(status="expired")
        self.stdout.write(
            self.style.WARNING(f"  Expired units marked: {expired_count}")
        )

        # ─── Step 2: Create alerts for expiring units ─────────────
        # Get available units expiring within 7 days (that haven't been alerted yet)
        expiring_qs = BloodInventory.objects.filter(
            status="available",
            expiry_date__gte=today,
            expiry_date__lte=warning_date,
            expiry_alert_sent=False,
        ).select_related("hospital")

        alerts_created = 0
        for unit in expiring_qs:
            if not unit.hospital:
                continue

            days_left = (unit.expiry_date - today).days

            if days_left <= 3:
                alert_type = "expiring_critical"
            else:
                alert_type = "expiring_soon"

            if not dry_run:
                ExpiryAlert.objects.create(
                    inventory=unit,
                    alert_type=alert_type,
                    hospital=unit.hospital,
                    blood_type=unit.blood_type,
                    units_affected=unit.quantity,
                    days_until_expiry=days_left,
                )
                unit.expiry_alert_sent = True
                unit.save(update_fields=["expiry_alert_sent"])

            alerts_created += 1

        self.stdout.write(
            self.style.SUCCESS(f"  Expiry alerts created: {alerts_created}")
        )

        # ─── Step 3: Create expired alerts for just-expired units ─
        just_expired = BloodInventory.objects.filter(
            status="expired",
            expiry_date__gte=today - timedelta(days=1),
            expiry_date__lt=today,
        ).exclude(
            expiry_alerts__alert_type="expired",
        ).select_related("hospital")

        expired_alerts = 0
        for unit in just_expired:
            if not unit.hospital:
                continue

            if not dry_run:
                ExpiryAlert.objects.create(
                    inventory=unit,
                    alert_type="expired",
                    hospital=unit.hospital,
                    blood_type=unit.blood_type,
                    units_affected=unit.quantity,
                    days_until_expiry=0,
                )
            expired_alerts += 1

        self.stdout.write(
            self.style.SUCCESS(f"  Expired alerts created: {expired_alerts}")
        )

        # ─── Summary ─────────────────────────────────────────────
        total_available = BloodInventory.objects.filter(status="available").count()
        total_expiring = BloodInventory.objects.filter(
            status="available",
            expiry_date__lte=warning_date,
            expiry_date__gte=today,
        ).count()

        self.stdout.write(
            self.style.SUCCESS(
                f"\n  Summary: {total_available} available units, "
                f"{total_expiring} expiring within 7 days, "
                f"{expired_count} just expired"
            )
        )

        if dry_run:
            self.stdout.write(
                self.style.WARNING("  DRY RUN — no changes were made")
            )
