"""메일 분류 규칙(지메일·네이버 공통). 순서대로 먼저 맞는 규칙 하나만 적용합니다.

광고 표시((광고)/[광고]) 메일만 휴지통, 나머지는 폴더(라벨)로 옮깁니다.
"""
import re

AD = re.compile(r"^\s*[\(\[]\s*광고\s*[\)\]]")

# 받은편지함에 남겨 둘 것: 봇이 보내는 브리핑·보고서, GitHub 알림
KEEP_SUBJECT = re.compile(r"시장 동향|이슈체크|\[보고서\]|\[고객용\]|briefing", re.I)
KEEP_FROM = ("github.com",)

FOREIGN_NEWS = ("bloomberg", "reuters", "wsj.com", "dowjones", "ft.com", "cnbc", "nytimes", "economist",
                "barrons", "axios", "seekingalpha", "digitimes", "nikkei", "scmp", "theinformation",
                "marketwatch", "investing.com", "washingtonpost", "theverge", "techcrunch", "semianalysis")
BILL = re.compile(r"청구서|명세서|고지서|납부|영수증|이용대금|결제\s*(내역|완료|안내)|요금\s*안내|invoice|receipt|statement|billing", re.I)
SHOP_WORD = re.compile(r"주문|배송|출고|발송|구매\s*확정|쿠폰|적립|장바구니|세일|특가|할인|타임딜", re.I)
SHOP_FROM = ("coupang", "11st", "gmarket", "auction.co.kr", "ssg.com", "lotteon", "musinsa", "kurly", "aliexpress",
             "amazon", "lfmall", "lfcorp", "galleria", "29cm", "wconcept", "oliveyoung", "temu", "tmon", "wemakeprice",
             "hmall", "gsshop", "cjonstyle", "ohou", "zigzag", "ably", "kream")
NEWSLETTER_FROM = ("substack", "stibee", "maily", "beehiiv", "mailchimp", "newsletter", "page.stibee")
NEWSLETTER_WORD = re.compile(r"뉴스레터|newsletter|weekly|위클리", re.I)


def classify(subject: str, sender_email: str, sender_name: str) -> str | None:
    """'trash', '외신', '청구서함', '쇼핑레터함', '뉴스레터함' 중 하나, 해당 없으면 None."""
    s = subject or ""
    e = (sender_email or "").lower()
    n = sender_name or ""
    if KEEP_SUBJECT.search(s) or any(k in e for k in KEEP_FROM):
        return None
    if AD.search(s):
        return "trash"
    if any(k in e for k in FOREIGN_NEWS):
        return "외신"
    if BILL.search(s):
        return "청구서함"
    if any(k in e for k in SHOP_FROM) or SHOP_WORD.search(s):
        return "쇼핑레터함"
    if any(k in e for k in NEWSLETTER_FROM) or NEWSLETTER_WORD.search(s) or NEWSLETTER_WORD.search(n):
        return "뉴스레터함"
    return None
