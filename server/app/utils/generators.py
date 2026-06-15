import random
import string
from datetime import datetime


def generate_order_no() -> str:
    now = datetime.utcnow()
    random_part = "".join(random.choices(string.digits, k=6))
    return f"LL{now.year}{now.month:02d}{now.day:02d}{random_part}"


def generate_payment_no() -> str:
    now = datetime.utcnow()
    random_part = "".join(random.choices(string.digits, k=4))
    return f"PAY{now.year}{now.month:02d}{now.day:02d}{now.hour:02d}{now.minute:02d}{now.second:02d}{random_part}"


def generate_voucher_no() -> str:
    return f"VCH{int(datetime.utcnow().timestamp() * 1000)}"
