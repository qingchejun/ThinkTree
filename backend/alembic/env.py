from logging.config import fileConfig
import os
import sys
from dotenv import load_dotenv

# 优先加载 .env.local，然后是 .env
load_dotenv(dotenv_path='.env.local')
load_dotenv(dotenv_path='.env')

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# 添加应用路径到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# 导入应用模型
from app.core.database import Base

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# 从环境变量中获取 DATABASE_URL
database_url = os.environ.get("DATABASE_URL")
if not database_url:
    raise ValueError("DATABASE_URL 环境变量未设置")

# 修复 Render 提供的 URL 格式，以兼容 Alembic
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

# 将我们从环境变量中获取的 URL 设置为 Alembic 的配置
config.set_main_option('sqlalchemy.url', database_url)

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
