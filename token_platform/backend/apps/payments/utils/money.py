from decimal import Decimal, getcontext, ROUND_HALF_UP

getcontext().prec = 28
TWOPLACES = Decimal('0.01')


def _d(val) -> Decimal:
    if isinstance(val, Decimal):
        return val
    return Decimal(str(val))


def quantize_2(x: Decimal) -> Decimal:
    return x.quantize(TWOPLACES, rounding=ROUND_HALF_UP)


def gross_topup_price_etb(target_net_etb, vat, gw_rate, gw_fixed):
    """
    Compute how much the customer should pay (total) so that the platform nets
    `target_net_etb` before gateway fees, while collecting VAT on the base.

    Definitions:
    - base = target_net_etb (amount credited before VAT)
    - vat_amount = base * vat
    - subtotal = base + vat_amount
    - total = (subtotal + gw_fixed) / (1 - gw_rate)

    Returns (all Decimal, rounded to 2 dp): base, vat_amount, total
    """
    base = _d(target_net_etb)
    vat_rate = _d(vat)
    gw_r = _d(gw_rate)
    gw_f = _d(gw_fixed)

    vat_amount = base * vat_rate
    subtotal = base + vat_amount
    # Avoid division by zero if gw_rate == 1
    denom = Decimal('1') - gw_r
    if denom <= Decimal('0'):
        raise ValueError('gw_rate must be less than 1')
    total = (subtotal + gw_f) / denom

    return quantize_2(base), quantize_2(vat_amount), quantize_2(total)


def split_gift_value_inclusive_commission(value_etb, commission_rate, vat):
    """
    Split a gift value (customer paid amount) into platform commission and creator payout.

    Assumptions:
    - Commission is a percentage of the gift value.
    - VAT applies to the commission portion (output tax on commission revenue).

    Returns (Decimal, 2 dp):
      commission_gross, vat_on_commission, commission_net, creator_payout
    where:
      commission_gross = value * commission_rate
      vat_on_commission = commission_gross * vat
      commission_net = commission_gross - vat_on_commission
      creator_payout = value - commission_gross
    """
    value = _d(value_etb)
    cr = _d(commission_rate)
    vat_rate = _d(vat)

    commission_gross = value * cr
    vat_on_commission = commission_gross * vat_rate
    commission_net = commission_gross - vat_on_commission
    creator_payout = value - commission_gross

    return (
        quantize_2(commission_gross),
        quantize_2(vat_on_commission),
        quantize_2(commission_net),
        quantize_2(creator_payout),
    )
