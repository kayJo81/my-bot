#!/usr/bin/env python3
"""BLS 고용(CES, 계절조정, 천 명) 업종별 월간 증감을 받아 표로 출력합니다(읽기 전용).
사용법: python scripts/fetch_bls.py   → 표준출력 + bls_jobs.json
"""
import json
import urllib.request

SERIES = {
    "CES0000000001": "전체 비농업",
    "CES2000000001": "건설 전체",
    "CES2023620001": "비주거 건물 건설",
    "CES2023700001": "중장비·토목(송전선 등)",
    "CES2023800201": "비주거 전문공사(전기·배관 등)",
    "CES2023821001": "전기공사업",
    "CES4422000001": "유틸리티",
    "CES3133440001": "반도체·전자부품 제조",
    "CES3133500001": "전기장비 제조",
    "CES5000000001": "정보 업종 전체",
    "CES5051800001": "데이터센터·호스팅(518)",
    "CES6054150001": "컴퓨터 시스템 설계",
    "CES6000000001": "전문·사업서비스",
    "CES6562000001": "의료",
    "CES7000000001": "여가·숙박",
    "CES4300000001": "운송·창고",
    "CES9000000001": "정부",
}


def main():
    body = json.dumps({"seriesid": list(SERIES), "startyear": "2025", "endyear": "2026"}).encode()
    req = urllib.request.Request("https://api.bls.gov/publicAPI/v1/timeseries/data/", data=body,
                                 headers={"Content-Type": "application/json"})
    r = json.load(urllib.request.urlopen(req, timeout=60))
    print("status:", r.get("status"), r.get("message"))
    out = {}
    for s in r["Results"]["series"]:
        rows = sorted((d["year"] + "-" + d["period"][1:], float(d["value"]), d.get("footnotes"))
                      for d in s["data"] if d["period"].startswith("M") and d["period"] != "M13")
        out[s["seriesID"]] = rows
    json.dump(out, open("bls_jobs.json", "w"), ensure_ascii=False)
    months = sorted({m for v in out.values() for m, *_ in v})[-8:]
    print("\n월간 증감(천 명). 마지막 두 달은 잠정치")
    print(f"{'업종':28}" + "".join(f"{m[2:]:>8}" for m in months[1:]) + f"{'6개월합':>9}{'수준':>10}")
    for sid, name in SERIES.items():
        v = dict((m, x) for m, x, _ in out.get(sid, []))
        if not v:
            print(f"{name:28} 데이터 없음 ({sid})")
            continue
        ch = [(v[b] - v[a]) if a in v and b in v else None for a, b in zip(months, months[1:])]
        six = [c for c in ch[-6:] if c is not None]
        last = v.get(months[-1]) or v[max(v)]
        print(f"{name:28}" + "".join(f"{c:>8.1f}" if c is not None else f"{'-':>8}" for c in ch)
              + f"{sum(six):>9.1f}{last:>10.1f}")
    # 12개월 변화
    print("\n12개월 변화(천 명, 최신월 기준)")
    for sid, name in SERIES.items():
        rows = out.get(sid, [])
        if len(rows) >= 13:
            print(f"{name:28} {rows[-1][0]} {rows[-1][1] - rows[-13][1]:+8.1f}  ({100*(rows[-1][1]/rows[-13][1]-1):+.1f}%)")


if __name__ == "__main__":
    main()
