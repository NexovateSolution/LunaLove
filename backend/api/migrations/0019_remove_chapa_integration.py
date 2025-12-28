# Generated migration to remove Chapa integration

from django.db import migrations, models
import uuid


def populate_transaction_refs(apps, schema_editor):
    """Populate transaction_ref from chapa_tx_ref for existing records"""
    CoinPurchase = apps.get_model('api', 'CoinPurchase')
    for purchase in CoinPurchase.objects.all():
        if hasattr(purchase, 'chapa_tx_ref') and purchase.chapa_tx_ref:
            purchase.transaction_ref = purchase.chapa_tx_ref
        else:
            # Generate unique ref for old records without chapa_tx_ref
            purchase.transaction_ref = f"legacy-{purchase.id}-{uuid.uuid4().hex[:8]}"
        purchase.save(update_fields=['transaction_ref'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0018_coinpurchase_chapa_ref_id'),
    ]

    operations = [
        # Remove ChapaSubAccount model entirely
        migrations.DeleteModel(
            name='ChapaSubAccount',
        ),
        
        # Add transaction_ref field first (without unique constraint)
        migrations.AddField(
            model_name='coinpurchase',
            name='transaction_ref',
            field=models.CharField(max_length=100, default='temp'),
            preserve_default=True,
        ),
        
        # Populate transaction_ref from chapa_tx_ref
        migrations.RunPython(populate_transaction_refs, migrations.RunPython.noop),
        
        # Now make it unique
        migrations.AlterField(
            model_name='coinpurchase',
            name='transaction_ref',
            field=models.CharField(max_length=100, unique=True),
        ),
        
        # Add payment_method field
        migrations.AddField(
            model_name='coinpurchase',
            name='payment_method',
            field=models.CharField(max_length=50, blank=True, null=True),
        ),
        
        # Remove Chapa-specific fields from CoinPurchase
        migrations.RemoveField(
            model_name='coinpurchase',
            name='chapa_tx_ref',
        ),
        migrations.RemoveField(
            model_name='coinpurchase',
            name='chapa_ref_id',
        ),
        migrations.RemoveField(
            model_name='coinpurchase',
            name='chapa_checkout_url',
        ),
    ]
