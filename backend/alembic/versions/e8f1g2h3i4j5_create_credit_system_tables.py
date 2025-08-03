"""create credit system tables

Revision ID: e8f1g2h3i4j5
Revises: 02601b01d8d2
Create Date: 2025-07-28 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'e8f1g2h3i4j5'
down_revision = '02601b01d8d2'
branch_labels = None
depends_on = None


def upgrade():
    """Create credit system tables."""
    
    # Create transaction type enum with proper error handling
    try:
        transaction_type_enum = postgresql.ENUM(
            'INITIAL_GRANT', 'DEDUCTION', 'REFUND',
            name='transactiontype',
            create_type=False
        )
        transaction_type_enum.create(op.get_bind(), checkfirst=True)
    except Exception as e:
        # If enum creation fails, it might already exist
        print(f"Enum creation warning (可能已存在): {e}")
        transaction_type_enum = postgresql.ENUM(
            'INITIAL_GRANT', 'DEDUCTION', 'REFUND',
            name='transactiontype'
        )
    
    # Create user_credits table with error handling
    try:
        op.create_table('user_credits',
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('balance', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('user_id')
        )
        print("✅ user_credits table created successfully")
    except Exception as e:
        print(f"⚠️ user_credits table creation warning (可能已存在): {e}")
    
    # Create credit_transactions table with error handling
    try:
        op.create_table('credit_transactions',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('type', transaction_type_enum, nullable=False),
            sa.Column('amount', sa.Integer(), nullable=False),
            sa.Column('description', sa.String(length=500), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        print("✅ credit_transactions table created successfully")
    except Exception as e:
        print(f"⚠️ credit_transactions table creation warning (可能已存在): {e}")
    
    # Create indexes with error handling
    try:
        op.create_index(op.f('ix_credit_transactions_id'), 'credit_transactions', ['id'], unique=False)
        op.create_index(op.f('ix_credit_transactions_user_id'), 'credit_transactions', ['user_id'], unique=False)
        print("✅ Indexes created successfully")
    except Exception as e:
        print(f"⚠️ Index creation warning (可能已存在): {e}")
    
    # Rename existing credits column to avoid conflicts with new relationship
    try:
        op.alter_column('users', 'credits', new_column_name='credits_balance')
        print("✅ Column renamed: credits -> credits_balance")
    except Exception as e:
        print(f"⚠️ Column rename warning (可能已完成): {e}")


def downgrade():
    """Drop credit system tables."""
    
    # Rename column back
    op.alter_column('users', 'credits_balance', new_column_name='credits')
    
    # Drop indexes
    op.drop_index(op.f('ix_credit_transactions_user_id'), table_name='credit_transactions')
    op.drop_index(op.f('ix_credit_transactions_id'), table_name='credit_transactions')
    
    # Drop tables
    op.drop_table('credit_transactions')
    op.drop_table('user_credits')
    
    # Drop enum type
    transaction_type_enum = postgresql.ENUM(
        'INITIAL_GRANT', 'DEDUCTION', 'REFUND',
        name='transactiontype'
    )
    transaction_type_enum.drop(op.get_bind(), checkfirst=True)