"""create credit system tables

Revision ID: e8f1g2h3i4j5
Revises: d3f4e5f6g7h8
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
    
    # Create transaction type enum
    transaction_type_enum = postgresql.ENUM(
        'INITIAL_GRANT', 'DEDUCTION', 'REFUND',
        name='transactiontype',
        create_type=False
    )
    transaction_type_enum.create(op.get_bind(), checkfirst=True)
    
    # Create user_credits table
    op.create_table('user_credits',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('balance', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('user_id')
    )
    
    # Create credit_transactions table
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
    
    # Create indexes
    op.create_index(op.f('ix_credit_transactions_id'), 'credit_transactions', ['id'], unique=False)
    op.create_index(op.f('ix_credit_transactions_user_id'), 'credit_transactions', ['user_id'], unique=False)
    
    # Rename existing credits column to avoid conflicts with new relationship
    op.alter_column('users', 'credits', new_column_name='credits_balance')


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