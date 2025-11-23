# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: 에러 로그
      - button "뒤로" [ref=e8] [cursor=pointer]
    - generic [ref=e9]:
      - generic [ref=e10]:
        - generic [ref=e11]:
          - paragraph [ref=e12]: 타임라인
          - heading "최근 오류 이벤트" [level=2] [ref=e13]
          - paragraph [ref=e14]: 페이지 1
        - generic [ref=e15]:
          - button "이전 100개" [disabled] [ref=e16]
          - button "다음 100개" [ref=e17] [cursor=pointer]
      - article [ref=e20]:
        - generic [ref=e21]:
          - paragraph [ref=e22]: 2025-11-21 02:10:00
          - paragraph [ref=e23]: /srv/core/api.php:140
        - paragraph [ref=e24]: "TypeError: undefined is not a function"
        - group [ref=e25]:
          - generic "스택 트레이스" [ref=e26] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=e32] [cursor=pointer]:
    - img [ref=e33]
  - alert [ref=e36]
```