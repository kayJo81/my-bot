#!/usr/bin/env python3
"""SEC XBRL companyfacts에서 주요 재무 항목을 분기별 표로 출력합니다(공개 데이터, 읽기 전용).
사용법: python scripts/sec_facts.py CIK [태그,태그,...]
- 기간 항목(매출 등)은 약 3개월짜리 값만, 시점 항목(매출채권 등)은 분기말 값만 골라 최근 14개 분기를 보여 줍니다.
"""
import datetime as dt
import json
import sys
import urllib.request

DEFAULT = [
    "Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax", "CostOfRevenue", "GrossProfit",
    "OperatingIncomeLoss", "NetIncomeLoss", "NetCashProvidedByUsedInOperatingActivities",
    "PaymentsToAcquirePropertyPlantAndEquipment", "AccountsReceivableNetCurrent", "InventoryNet",
    "PrepaidExpenseAndOtherAssetsCurrent", "OtherAssetsNoncurrent", "ContractWithCustomerLiabilityCurrent",
    "ContractWithCustomerLiabilityNoncurrent", "AccruedLiabilitiesCurrent", "ShareBasedCompensation",
    "CashAndCashEquivalentsAtCarryingValue", "MarketableSecuritiesCurrent", "LongTermInvestments",
    "EquitySecuritiesFvNi", "EquitySecuritiesWithoutReadilyDeterminableFairValueAmount",
    "IncreaseDecreaseInAccountsReceivable", "IncreaseDecreaseInInventories",
    "GainLossOnInvestments", "OtherNonoperatingIncomeExpense", "NonoperatingIncomeExpense",
    "AllowanceForDoubtfulAccountsReceivableCurrent", "PurchaseObligation", "UnrecordedUnconditionalPurchaseObligationBalanceSheetAmount",
]


def days(a, b):
    return (dt.date.fromisoformat(b) - dt.date.fromisoformat(a)).days


def main():
    cik = sys.argv[1].zfill(10)
    tags = sys.argv[2].split(",") if len(sys.argv) > 2 and sys.argv[2] else DEFAULT
    req = urllib.request.Request(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json",
                                 headers={"User-Agent": "my-bot research bot@example.com"})
    d = json.load(urllib.request.urlopen(req, timeout=60))
    print("회사:", d.get("entityName"))
    facts = {**d["facts"].get("us-gaap", {}), **{"dei:" + k: v for k, v in d["facts"].get("dei", {}).items()}}
    for t in tags:
        raw = t.endswith("*")  # 태그 끝에 *를 붙이면 누적(반기·연간 등) 기간도 모두 출력
        t = t.rstrip("*")
        f = facts.get(t)
        if not f:
            print(f"\n## {t}: 없음")
            continue
        unit, vals = next(iter(f["units"].items()))
        rows = {}
        for v in vals:
            if v.get("form") not in ("10-Q", "10-K", "10-Q/A", "10-K/A"):
                continue
            if "start" in v:
                n = days(v["start"], v["end"])
                if not raw and not 80 <= n <= 100:
                    continue
            key = (v.get("start", ""), v["end"]) if raw else v["end"]
            # 같은 기간이면 가장 늦게 제출된 값(수정 반영)
            if key not in rows or v["filed"] > rows[key]["filed"]:
                rows[key] = v
        print(f"\n## {t} ({unit}) — {f.get('label','')}")
        for k in sorted(rows, key=lambda x: x if isinstance(x, str) else x[1] + x[0])[-14:]:
            v = rows[k]
            per = f"{v.get('start', '')}~{v['end']}" if raw else v["end"]
            print(f"{per} | {v['val']:>18,} | {v['form']} {v.get('fy')}{v.get('fp')} | 제출 {v['filed']}")


if __name__ == "__main__":
    main()
