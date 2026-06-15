import os
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import UploadFile
from qiniu import Auth, BucketManager, put_data, CdnManager
from app.models.models import StorageConfig


class QiniuService:
    """七牛云存储服务。"""

    def __init__(self, config: StorageConfig):
        self.access_key = config.qiniu_access_key or ""
        self.secret_key = config.qiniu_secret_key or ""
        self.bucket = config.qiniu_bucket or ""
        self.domain = (config.qiniu_domain or "").rstrip("/")
        self.region = config.qiniu_region or "z0"

        if not all([self.access_key, self.secret_key, self.bucket]):
            raise ValueError("七牛云配置不完整：缺少 access_key/secret_key/bucket")

        self.q = Auth(self.access_key, self.secret_key)
        self.bucket_manager = BucketManager(self.q)
        self.cdn_manager = CdnManager(self.q)

    def get_upload_token(self, key: str = "", expires: int = 3600) -> str:
        """获取上传凭证。"""
        return self.q.upload_token(self.bucket, key, expires)

    def upload_file(self, file: UploadFile, subdir: str = "") -> str:
        """上传文件到七牛云。"""
        ext = Path(file.filename or "").suffix.lower()
        if ext not in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
            ext = ".png"

        filename = f"{uuid.uuid4().hex}{ext}"
        key = f"{subdir}/{filename}" if subdir else filename

        # 读取文件内容
        file.file.seek(0)
        data = file.file.read()

        token = self.get_upload_token(key)
        ret, info = put_data(token, key, data)

        if info.status_code != 200:
            raise Exception(f"七牛云上传失败: {info.status_code} - {info.text_body}")

        # 返回相对路径（前端会根据配置拼接完整 URL）
        return f"/{key}"

    def delete_file(self, key: str) -> bool:
        """删除七牛云文件。"""
        # key 去掉开头的 /
        key = key.lstrip("/")
        ret, info = self.bucket_manager.delete(self.bucket, key)
        return info.status_code == 200 or info.status_code == 612  # 612 = file not found

    def list_buckets(self) -> List[str]:
        """获取 bucket 列表（用于测试连接）。"""
        buckets, info = self.bucket_manager.buckets()
        if info.status_code != 200:
            raise Exception(f"获取 bucket 列表失败: {info.status_code}")
        return buckets

    def refresh_cdn(self, urls: List[str]) -> dict:
        """刷新 CDN 缓存。"""
        if not urls:
            return {}
        ret, info = self.cdn_manager.refresh_urls(urls)
        return {"ret": ret, "status": info.status_code}

    def get_full_url(self, path: str) -> str:
        """获取完整 URL。"""
        if not path:
            return path
        if path.startswith("http://") or path.startswith("https://"):
            return path
        path = path.lstrip("/")
        return f"{self.domain}/{path}"
