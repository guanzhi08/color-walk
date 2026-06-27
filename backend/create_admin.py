"""
Usage: python create_admin.py <username> <password>
Run once to create the first admin account.
"""
import sys
from app.database import SessionLocal, engine
from app.models import User  # noqa
from app.database import Base
from app.services.auth_service import hash_password

def main():
    if len(sys.argv) != 3:
        print("Usage: python create_admin.py <username> <password>")
        sys.exit(1)

    username, password = sys.argv[1], sys.argv[2]
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if db.query(User).filter(User.username == username).first():
            print(f"使用者 '{username}' 已存在")
            return
        admin = User(username=username, hashed_password=hash_password(password), is_admin=True)
        db.add(admin)
        db.commit()
        print(f"管理員 '{username}' 建立成功")
    finally:
        db.close()

if __name__ == "__main__":
    main()
