"""외국인 매도 거래대금과 외국인 공매도 거래대금(KOSPI/KOSDAQ) 일별 수집 → JSON 출력."""
import json, os, sys, traceback
from pykrx import stock

start, end = os.environ.get("START", "20260901"), os.environ.get("END", "20261120")
out = {}
for mkt in ("KOSPI", "KOSDAQ"):
    r = {"sell": None, "short": None, "err": []}
    try:
        df = stock.get_market_trading_value_by_date(start, end, mkt, on="매도")
        r["sell"] = {d.strftime("%Y%m%d"): {k: int(v) for k, v in row.items()} for d, row in df.iterrows()}
    except Exception:
        r["err"].append("sell: " + traceback.format_exc()[-600:])
    try:
        df = stock.get_shorting_investor_value_by_date(start, end, mkt)
        r["short"] = {d.strftime("%Y%m%d"): {k: int(v) for k, v in row.items()} for d, row in df.iterrows()}
    except Exception:
        r["err"].append("short: " + traceback.format_exc()[-600:])
    out[mkt] = r
json.dump(out, open("krx_short.json", "w"), ensure_ascii=False)
print("=====JSON-BEGIN")
print(json.dumps(out, ensure_ascii=False))
print("=====JSON-END")
