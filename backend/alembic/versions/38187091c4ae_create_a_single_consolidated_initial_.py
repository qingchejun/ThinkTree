"""Create a single, consolidated initial schema

Revision ID: 38187091c4ae
Revises: 
Create Date: 2025-08-03 23:30:04.267073

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '38187091c4ae'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### 关键修复：在创建所有表之前，先按正确的逆序安全地删除它们 ###
    # 这可以确保无论数据库处于何种状态（空的，或有残留的旧表），此脚本都能成功执行。
    
    # 1. 先删除所有子表
    op.drop_table('mindmaps', if_exists=True)
    op.drop_table('credit_transactions', if_exists=True)
    op.drop_table('invitation_codes', if_exists=True)
    op.drop_table('redemption_codes', if_exists=True)
    op.drop_table('user_credits', if_exists=True)
    op.drop_table('login_tokens', if_exists=True)
    
    # 2. 最后删除没有依赖的父表
    op.drop_table('users', if_exists=True)

    # ### 现在，按正确的顺序创建所有表 ###

    # 1. 创建没有依赖的父表 (users)
    op.create_table('users',
        sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column('email', sa.VARCHAR(length=255), nullable=False),
        sa.Column('password_hash', sa.VARCHAR(length=255), nullable=True),
        sa.Column('google_id', sa.VARCHAR(length=100), nullable=True),
        sa.Column('is_active', sa.BOOLEAN(), nullable=False),
        sa.Column('is_verified', sa.BOOLEAN(), nullable=False),
        sa.Column('is_superuser', sa.BOOLEAN(), nullable=False),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('display_name', sa.VARCHAR(length=100), nullable=True),
        sa.Column('avatar_url', sa.VARCHAR(length=500), nullable=True),
        sa.Column('invitation_quota', sa.INTEGER(), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_users'))
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_google_id'), 'users', ['google_id'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # 2. 创建没有外键依赖的表 (login_tokens)
    op.create_table('login_tokens',
        sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column('email', sa.VARCHAR(length=255), nullable=False),
        sa.Column('code_hash', sa.VARCHAR(length=255), nullable=False),
        sa.Column('magic_token', sa.VARCHAR(length=255), nullable=True),
        sa.Column('invitation_code', sa.VARCHAR(length=16), nullable=True),
        sa.Column('expires_at', postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('used_at', postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_login_tokens'))
    )
    op.create_index(op.f('ix_login_tokens_email'), 'login_tokens', ['email'], unique=False)
    op.create_index(op.f('ix_login_tokens_id'), 'login_tokens', ['id'], unique=False)
    op.create_index(op.f('ix_login_tokens_magic_token'), 'login_tokens', ['magic_token'], unique=True)

    # 3. 创建依赖 users 表的子表
    op.create_table('user_credits',
        sa.Column('user_id', sa.INTEGER(), nullable=False),
        sa.Column('balance', sa.INTEGER(), nullable=False),
        sa.Column('last_daily_reward_date', sa.DATE(), nullable=True),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_user_credits_user_id_users')),
        sa.PrimaryKeyConstraint('user_id', name=op.f('pk_user_credits'))
    )

    op.create_table('redemption_codes',
        sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column('code', sa.VARCHAR(length=50), nullable=False),
        sa.Column('credits_amount', sa.INTEGER(), nullable=False),
        sa.Column('status', postgresql.ENUM('ACTIVE', 'REDEEMED', 'EXPIRED', name='redemptioncodestatus'), nullable=False),
        sa.Column('expires_at', postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('redeemed_at', postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('redeemed_by_user_id', sa.INTEGER(), nullable=True),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['redeemed_by_user_id'], ['users.id'], name=op.f('fk_redemption_codes_redeemed_by_user_id_users')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_redemption_codes'))
    )
    op.create_index(op.f('ix_redemption_codes_code'), 'redemption_codes', ['code'], unique=True)
    op.create_index(op.f('ix_redemption_codes_id'), 'redemption_codes', ['id'], unique=False)
    op.create_index(op.f('ix_redemption_codes_redeemed_by_user_id'), 'redemption_codes', ['redeemed_by_user_id'], unique=False)

    op.create_table('mindmaps',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('title', sa.VARCHAR(length=200), nullable=False),
        sa.Column('content', sa.TEXT(), nullable=False),
        sa.Column('user_id', sa.INTEGER(), nullable=False),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('description', sa.VARCHAR(length=500), nullable=True),
        sa.Column('tags', sa.VARCHAR(length=200), nullable=True),
        sa.Column('is_public', sa.BOOLEAN(), nullable=False),
        sa.Column('share_token', sa.VARCHAR(length=64), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_mindmaps_user_id_users'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_mindmaps'))
    )
    op.create_index(op.f('ix_mindmaps_created_at'), 'mindmaps', ['created_at'], unique=False)
    op.create_index(op.f('ix_mindmaps_id'), 'mindmaps', ['id'], unique=True)
    op.create_index(op.f('ix_mindmaps_is_public'), 'mindmaps', ['is_public'], unique=False)
    op.create_index(op.f('ix_mindmaps_share_token'), 'mindmaps', ['share_token'], unique=True)
    op.create_index(op.f('ix_mindmaps_title'), 'mindmaps', ['title'], unique=False)
    op.create_index(op.f('ix_mindmaps_user_id'), 'mindmaps', ['user_id'], unique=False)

    op.create_table('invitation_codes',
        sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column('code', sa.VARCHAR(length=16), nullable=False),
        sa.Column('generated_by_user_id', sa.INTEGER(), nullable=False),
        sa.Column('is_used', sa.BOOLEAN(), nullable=False),
        sa.Column('used_by_user_id', sa.INTEGER(), nullable=True),
        sa.Column('description', sa.TEXT(), nullable=True),
        sa.Column('expires_at', postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('used_at', postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['generated_by_user_id'], ['users.id'], name=op.f('fk_invitation_codes_generated_by_user_id_users')),
        sa.ForeignKeyConstraint(['used_by_user_id'], ['users.id'], name=op.f('fk_invitation_codes_used_by_user_id_users')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_invitation_codes'))
    )
    op.create_index(op.f('ix_invitation_codes_code'), 'invitation_codes', ['code'], unique=True)
    op.create_index(op.f('ix_invitation_codes_id'), 'invitation_codes', ['id'], unique=False)
    
    op.create_table('credit_transactions',
        sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.INTEGER(), nullable=False),
        sa.Column('type', postgresql.ENUM('INITIAL_GRANT', 'MANUAL_GRANT', 'DEDUCTION', 'REFUND', 'DAILY_REWARD', name='transactiontype'), nullable=False),
        sa.Column('amount', sa.INTEGER(), nullable=False),
        sa.Column('description', sa.VARCHAR(length=500), nullable=False),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_credit_transactions_user_id_users')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_credit_transactions'))
    )
    op.create_index(op.f('ix_credit_transactions_id'), 'credit_transactions', ['id'], unique=False)
    op.create_index(op.f('ix_credit_transactions_user_id'), 'credit_transactions', ['user_id'], unique=False)
    
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - manually corrected ###
    # 删除表的顺序与创建时完全相反
    
    op.drop_index(op.f('ix_credit_transactions_user_id'), table_name='credit_transactions')
    op.drop_index(op.f('ix_credit_transactions_id'), table_name='credit_transactions')
    op.drop_table('credit_transactions')

    op.drop_index(op.f('ix_invitation_codes_id'), table_name='invitation_codes')
    op.drop_index(op.f('ix_invitation_codes_code'), table_name='invitation_codes')
    op.drop_table('invitation_codes')
    
    op.drop_index(op.f('ix_mindmaps_user_id'), table_name='mindmaps')
    op.drop_index(op.f('ix_mindmaps_title'), table_name='mindmaps')
    op.drop_index(op.f('ix_mindmaps_share_token'), table_name='mindmaps')
    op.drop_index(op.f('ix_mindmaps_is_public'), table_name='mindmaps')
    op.drop_index(op.f('ix_mindmaps_id'), table_name='mindmaps')
    op.drop_index(op.f('ix_mindmaps_created_at'), table_name='mindmaps')
    op.drop_table('mindmaps')
    
    op.drop_index(op.f('ix_redemption_codes_redeemed_by_user_id'), table_name='redemption_codes')
    op.drop_index(op.f('ix_redemption_codes_id'), table_name='redemption_codes')
    op.drop_index(op.f('ix_redemption_codes_code'), table_name='redemption_codes')
    op.drop_table('redemption_codes')
    
    op.drop_table('user_credits')
    
    op.drop_index(op.f('ix_login_tokens_magic_token'), table_name='login_tokens')
    op.drop_index(op.f('ix_login_tokens_id'), table_name='login_tokens')
    op.drop_index(op.f('ix_login_tokens_email'), table_name='login_tokens')
    op.drop_table('login_tokens')
    
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_google_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    # ### end Alembic commands ###