from decimal import Decimal
from apps.payments.utils.money import (
    gross_topup_price_etb,
    split_gift_value_inclusive_commission,
)


def test_gross_topup_with_gateway_and_vat():
    base, vat_amount, total = gross_topup_price_etb(
        target_net_etb=Decimal('100'), vat=Decimal('0.15'), gw_rate=Decimal('0.03'), gw_fixed=Decimal('2.00')
    )
    assert base == Decimal('100.00')
    assert vat_amount == Decimal('15.00')
    assert total == Decimal('120.62')  # (100+15+2)/0.97 = 120.6185 -> 120.62


def test_gross_topup_zero_gateway():
    base, vat_amount, total = gross_topup_price_etb(
        target_net_etb='100', vat='0.15', gw_rate='0', gw_fixed='0'
    )
    assert base == Decimal('100.00')
    assert vat_amount == Decimal('15.00')
    assert total == Decimal('115.00')


def test_split_gift_commission_basic():
    commission_gross, vat_on_commission, commission_net, creator_payout = split_gift_value_inclusive_commission(
        value_etb=Decimal('100'), commission_rate=Decimal('0.25'), vat=Decimal('0.15')
    )
    assert commission_gross == Decimal('25.00')
    assert vat_on_commission == Decimal('3.75')
    assert commission_net == Decimal('21.25')
    assert creator_payout == Decimal('75.00')


def test_split_gift_commission_rounding():
    commission_gross, vat_on_commission, commission_net, creator_payout = split_gift_value_inclusive_commission(
        value_etb='9.99', commission_rate='0.125', vat='0.15'
    )
    assert commission_gross == Decimal('1.25')  # 9.99 * 12.5% = 1.24875 -> 1.25
    assert vat_on_commission == Decimal('0.19')  # 1.25 * 0.15 = 0.1875 -> 0.19
    assert commission_net == Decimal('1.06')     # 1.25 - 0.19 = 1.06
    assert creator_payout == Decimal('8.74')     # 9.99 - 1.25 = 8.74
