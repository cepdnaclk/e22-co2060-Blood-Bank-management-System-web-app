from django.contrib.auth import get_user_model
User = get_user_model()

broken_ids = [1, 2, 6, 8]
for u in User.objects.filter(id__in=broken_ids):
    u.set_password("Dulaj@16376")
    u.save()
    print(f"Fixed user ID={u.id} ({u.email}) - password now properly hashed")

print("Done! All broken accounts fixed.")
