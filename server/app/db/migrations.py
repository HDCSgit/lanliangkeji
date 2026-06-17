"""
轻量级数据库 schema 补齐工具。

当 alembic 没有迁移文件、Base.metadata.create_all 又不会给老表加列时，
用本模块在应用启动时检查并补上缺失列。

不删列、不删表、不破坏现有数据；只对缺失列做 ADD COLUMN（带默认值的可空列）。
"""
from __future__ import annotations

import logging
from typing import Iterable, Tuple

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

from app.db.base import Base

logger = logging.getLogger(__name__)


# 显式列定义：(列名, SQL 类型, 默认 SQL 片段)
# 这里集中维护需要补的列（与 models.py 保持一致）。
# 当模型新增列时，记得在这里登记。
_STORAGE_CONFIGS_EXTRA_COLUMNS: Tuple[Tuple[str, str, str], ...] = (
    ("express_provider", "VARCHAR(20)", "'sf_express' NOT NULL"),
    ("sf_partner_id", "VARCHAR(100)", "NULL"),
    ("sf_checkword", "VARCHAR(100)", "NULL"),
    ("sf_env", "VARCHAR(20)", "'production'"),
    ("kuaidi100_key", "VARCHAR(100)", "NULL"),
    ("kdniao_id", "VARCHAR(100)", "NULL"),
    ("kdniao_key", "VARCHAR(100)", "NULL"),
)


# Products 表新增列（与 models.Product 保持一致）
# - cover_images: 封面图数组(JSON)
# - detail_images: 详情图数组(JSON)
# - enable_carousel: 是否启用封面轮播
# - shipping_enabled: 是否收取运费
# - shipping_initial_fee: 初始运费(第一件收多少)
# - shipping_per_unit_count: 每多少件算一个加价单位
# - shipping_per_unit_fee: 每个加价单位加多少运费
_PRODUCTS_EXTRA_COLUMNS: Tuple[Tuple[str, str, str], ...] = (
    ("cover_images", "JSON", "'[]'"),
    ("detail_images", "JSON", "'[]'"),
    ("enable_carousel", "BOOLEAN", "0"),
    ("shipping_enabled", "BOOLEAN", "0"),
    ("shipping_initial_fee", "FLOAT", "0"),
    ("shipping_per_unit_count", "INTEGER", "1"),
    ("shipping_per_unit_fee", "FLOAT", "0"),
)


def _sqlite_physical_columns(engine: Engine, table: str) -> set[str]:
    """从 SQLite 真实数据库里读出该表的所有列名（区分大小写）。"""
    insp = inspect(engine)
    return {c["name"] for c in insp.get_columns(table)}


def _patch_columns(engine: Engine, table: str, columns: Tuple[Tuple[str, str, str], ...]) -> list[str]:
    """通用补列逻辑：检查表里是否有每个列，没有就 ADD COLUMN。"""
    added: list[str] = []
    try:
        existing = _sqlite_physical_columns(engine, table)
    except Exception as e:
        logger.warning("_patch_columns(%s): 无法读取表结构: %s", table, e)
        return added

    for col_name, col_type, default_sql in columns:
        if col_name in existing:
            continue
        stmt = f'ALTER TABLE {table} ADD COLUMN {col_name} {col_type} DEFAULT {default_sql}'
        try:
            with engine.begin() as conn:
                conn.execute(text(stmt))
            added.append(col_name)
            logger.info("_patch_columns(%s): ADD COLUMN %s", table, col_name)
        except Exception as e:
            logger.error(
                "_patch_columns(%s): 添加列 %s 失败: %s",
                table, col_name, e,
            )
    return added


def patch_storage_configs_columns(engine: Engine) -> list[str]:
    """
    检查 storage_configs 表，给缺失列自动 ADD COLUMN。
    返回本次补上的列名列表。
    """
    return _patch_columns(engine, "storage_configs", _STORAGE_CONFIGS_EXTRA_COLUMNS)


def patch_products_columns(engine: Engine) -> list[str]:
    """
    检查 products 表，给缺失列自动 ADD COLUMN。
    返回本次补上的列名列表。
    """
    return _patch_columns(engine, "products", _PRODUCTS_EXTRA_COLUMNS)


def apply_schema_patches(engine: Engine) -> None:
    """
    在应用启动早期调用：给所有已存在的"老表"补齐模型中新增的可空/带默认值的列。

    注意：
    - 不会删除列、不会改类型
    - 不会破坏现有数据
    - 对已有 NULL 默认值的列补 DEFAULT 也不会回填历史行
    """
    try:
        added_storage = patch_storage_configs_columns(engine)
        added_products = patch_products_columns(engine)
        all_added = added_storage + added_products
        if all_added:
            logger.info("apply_schema_patches: 已补齐列 %s", all_added)
        else:
            logger.debug("apply_schema_patches: 无需补列")
    except Exception as e:
        # 补列失败不能阻塞应用启动
        logger.exception("apply_schema_patches 失败: %s", e)
