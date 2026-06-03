from django.contrib.auth import get_user_model
User = get_user_model()

print("--- Password Debug ---")
for u in User.objects.all():
    # Check if password looks valid (starts with a known hasher prefix)
    pw = u.password
    is_valid_hash = pw.startswith("pbkdf2_sha256$") or pw.startswith("argon2") or pw.startswith("bcrypt")
    print(f"ID={u.id} | {u.email} | hash_ok={is_valid_hash} | hash_prefix={pw[:25]}... | usable={u.has_usable_password()}")
