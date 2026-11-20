import requests, os
H={"User-Agent":"Mozilla/5.0","Referer":"https://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd?menuId=MDC0201020101"}
s=requests.Session()
for u in ["https://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd?menuId=MDC0201020101"]:
    r=s.get(u,headers=H,timeout=30); print("GET",u,r.status_code,len(r.text))
for bld,extra in [("dbms/MDC/STAT/standard/MDCSTAT02202",{"inqTpCd":"2","trdVolVal":"2","askBid":"1","mktId":"STK","etf":"EF","etn":"EN","elw":"EW","strtDd":"20261110","endDd":"20261119","detailView":"1"}),
                  ("dbms/MDC/STAT/srt/MDCSTAT30301",{"searchType":"1","mktId":"STK","inqCond":"STMFRTSCIFDRFS","strtDd":"20261110","endDd":"20261119"}),
                  ("dbms/MDC/STAT/srt/MDCSTAT30401",{"inqCondTpCd1":"2","inqCondTpCd2":"1","mktId":"STK","strtDd":"20261110","endDd":"20261119"})]:
    for host in ["https://data.krx.co.kr","http://data.krx.co.kr"]:
        try:
            r=s.post(host+"/comm/bldAttendant/getJsonData.cmd",data={"bld":bld,**extra},headers=H,timeout=30)
            print("POST",host,bld,r.status_code,repr(r.text[:400]))
        except Exception as e: print("ERR",host,bld,e)
