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


def _sqlite_physical_columns(engine: Engine, table: str) -> set[str]:
    """从 SQLite 真实数据库里读出该表的所有列名（区分大小写）。"""
    insp = inspect(engine)
    return {c["name"] for c in insp.get_columns(table)}


def patch_storage_configs_columns(engine: Engine) -> list[str]:
    """
    检查 storage_configs 表，给缺失列自动 ADD COLUMN。
    返回本次补上的列名列表。
    """
    table = "storage_configs"
    added: list[str] = []
    try:
        existing = _sqlite_physical_columns(engine, table)
    except Exception as e:
        logger.warning("patch_storage_configs_columns: 无法读取表 %s: %s", table, e)
        return added

    for col_name, col_type, default_sql in _STORAGE_CONFIGS_EXTRA_COLUMNS:
        if col_name in existing:
            continue
        stmt = f'ALTER TABLE {table} ADD COLUMN {col_name} {col_type} DEFAULT {default_sql}'
        try:
            with engine.begin() as conn:
                conn.execute(text(stmt))
            added.append(col_name)
            logger.info("patch_storage_configs_columns: ADD COLUMN %s.%s", table, col_name)
        except Exception as e:
            logger.error(
                "patch_storage_configs_columns: 添加列 %s.%s 失败: %s",
                table, col_name, e,
            )
    return added


def apply_schema_patches(engine: Engine) -> None:
    """
    在应用启动早期调用：给所有已存在的"老表"补齐模型中新增的可空/带默认值的列。

    注意：
    - 不会删除列、不会改类型
    - 不会破坏现有数据
    - 对已有 NULL 默认值的列补 DEFAULT 也不会回填历史行
    """
    try:
        added = patch_storage_configs_columns(engine)
        if added:
            logger.info("apply_schema_patches: 已补齐列 %s", added)
        else:
            logger.debug("apply_schema_patches: 无需补列")
    except Exception as e:
        # 补列失败不能阻塞应用启动
        logger.exception("apply_schema_patches 失败: %s", e)
