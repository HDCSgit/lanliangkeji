"""
订单通知邮件服务 —— 用 QQ 邮箱 SMTP 发邮件给系统管理员。

发件方：QQ 邮箱 + 授权码（不是登录密码，在 QQ 邮箱网页端"设置 → 账户 → POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务"生成）
收件方：系统管理员邮箱（在 .env 的 ADMIN_NOTIFY_EMAIL 配置）

为什么用标准库 smtplib 而不引入 aiosmtplib：
1. 项目已经引入了 redis/requests/cryptography 等同步库，再加异步 SMTP 收益小
2. 邮件发送失败不应该阻塞支付主流程 —— 用 BackgroundTasks 或 try/except 包住即可
3. QQ 邮箱 SMTP 协议本身是同步的，标准库最稳定
"""
from __future__ import annotations

import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.policy import EmailPolicy
from typing import Optional

from app.core.config import settings


def _build_order_paid_email(
    order_no: str,
    receiver_name: str,
    receiver_phone: str,
    receiver_address: str,
    payment_method: Optional[str] = None,
    amount: Optional[float] = None,
) -> MIMEMultipart:
    """
    构造订单付款通知邮件。

    内容包含三个关键信息:
    - 订单号
    - 收件人(姓名 + 手机号)
    - 收件地址
    """
    subject = f"[新订单] {order_no} 已支付 — 请尽快安排发货"

    # 纯文本版本(降级)
    plain_lines = [
        f"订单号:{order_no}",
        f"收件人:{receiver_name}",
        f"收件人手机号:{receiver_phone}",
        f"收件地址:{receiver_address}",
    ]
    if payment_method:
        plain_lines.append(f"支付方式:{payment_method}")
    if amount is not None:
        plain_lines.append(f"订单金额:¥{amount:.2f}")
    plain_lines.append("")
    plain_lines.append("请登录后台查看详情并安排发货。")
    plain_text = "\n".join(plain_lines)

    # HTML 版本(更好看)
    html = f"""
    <div style="font-family: -apple-system, 'Segoe UI', 'PingFang SC', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
      <div style="background: linear-gradient(135deg, #0c4a6e 0%, #0891b2 100%); padding: 20px 24px; border-radius: 12px 12px 0 0;">
        <h2 style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 600;">新订单付款成功通知</h2>
      </div>
      <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">订单 <strong style="color: #0c4a6e;">{order_no}</strong> 已完成支付,请尽快安排发货。</p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600; width: 110px;">订单号</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; color: #0c4a6e; font-weight: 600;">{order_no}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600;">收件人</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">{receiver_name}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600;">手机号</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">{receiver_phone}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600;">收件地址</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">{receiver_address}</td>
          </tr>
          {f'''<tr>
            <td style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600;">支付方式</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">{payment_method}</td>
          </tr>''' if payment_method else ""}
          {f'''<tr>
            <td style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600;">订单金额</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; color: #dc2626; font-weight: 600;">¥{amount:.2f}</td>
          </tr>''' if amount is not None else ""}
        </table>

        <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 13px;">登录后台 → 订单管理 → 查看详情并安排发货。</p>
      </div>
      <p style="margin: 12px 0 0 0; color: #9ca3af; font-size: 12px; text-align: center;">
        本邮件由系统自动发出,请勿直接回复。
      </p>
    </div>
    """

    msg = MIMEMultipart("alternative", policy=EmailPolicy(utf8=True, max_line_length=None))
    msg["Subject"] = subject
    msg.attach(MIMEText(plain_text, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))
    return msg


def send_order_paid_notification(
    order_no: str,
    receiver_name: str,
    receiver_phone: str,
    receiver_address: str,
    payment_method: Optional[str] = None,
    amount: Optional[float] = None,
) -> bool:
    """
    发送订单付款通知邮件给系统管理员。

    返回 True = 发送成功,False = 发送失败/未配置。
    失败时不抛出异常 —— 邮件只是辅助通知,不应阻塞支付主流程。
    """
    # 1. 检查配置
    smtp_host = settings.SMTP_HOST
    smtp_port = settings.SMTP_PORT
    smtp_user = settings.SMTP_USER
    smtp_password = settings.SMTP_PASSWORD
    sender = settings.SMTP_SENDER or smtp_user
    recipient = settings.ADMIN_NOTIFY_EMAIL

    if not all([smtp_host, smtp_port, smtp_user, smtp_password, sender, recipient]):
        # 配置不全 → 静默跳过(开发环境常见情况)
        print(
            f"[email_service] SMTP 配缺失,跳过订单 {order_no} 的邮件通知。"
            f"需要在 .env 配置 SMTP_HOST/SMTP_USER/SMTP_PASSWORD/ADMIN_NOTIFY_EMAIL"
        )
        return False

    # 2. 构造邮件
    msg = _build_order_paid_email(
        order_no=order_no,
        receiver_name=receiver_name,
        receiver_phone=receiver_phone,
        receiver_address=receiver_address,
        payment_method=payment_method,
        amount=amount,
    )
    msg["From"] = sender
    msg["To"] = recipient

    # 3. 发送(QQ 邮箱用 SSL 465;其他用 STARTTLS 587)
    #    ⚠️ 必须用 send_message() 而不是 sendmail()!
    #    sendmail() 内部硬编码 msg.encode('ascii'),遇到中文 header 必崩
    #    send_message() 会识别 utf-8 policy,正确处理中文/emoji
    try:
        if smtp_port == 465:
            # SSL 直连
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context, timeout=10) as server:
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
        else:
            # STARTTLS(587 等)
            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.starttls(context=ssl.create_default_context())
                server.login(smtp_user, smtp_password)
                server.send_message(msg)

        print(f"[email_service] 订单 {order_no} 通知邮件已发送至 {recipient}")
        return True
    except Exception as e:
        # 邮件失败不影响支付流程
        print(f"[email_service] 订单 {order_no} 通知邮件发送失败: {e}")
        return False