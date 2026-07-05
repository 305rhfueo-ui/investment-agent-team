# 전략 스냅샷 v1 — Baseline

- **버전**: 1
- **생성일**: 2026-07-05
- **작성**: system (사이트 원문 기반)
- **근거**: RS Investment 사이트의 Perfect Storm + 응봉아재보소 전략을 그대로 이식

## 파라미터 (당시)

```json
{
  "screening": { "rs_rank_pct_min": 70, "div50_max": 30, "up_down_ratio_min": 0.80, "high_52w_pct_min": 80, "adr_min": 3.5 },
  "perfect_storm_entry": { "vol_x_min": 2.0, "cls_pos_min": 50 },
  "eungbong_pullback": { "div10_low": -3, "div10_high": 3 },
  "risk": { "risk_per_trade_pct": 2, "stop_loss_pct": 7 },
  "exit": { "tier1_gain_pct": 20, "tier1_sell_fraction": 0.3333, "trail_ma": "20D" }
}
```

## 이 버전의 가설

- RS 상위 30% + 정배열 + 거래량 폭발 = 강한 추세 초입
- 손실은 -7%로 짧게, 수익은 20일선 트레일링으로 길게

> 실제 성과는 매매일지에 기록되며, Morgan이 검토 후 v2를 제안합니다.
