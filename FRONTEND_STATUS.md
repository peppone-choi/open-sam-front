# FRONTEND_STATUS

## 현재 상태 요약
- 📄 Next.js 페이지: 78개
- 🎨 React 컴포넌트: 51개
- ⚠️ **PHP 원본 대비 포팅 상태**
  - PHP 페이지: 902개
  - Vue 컴포넌트: 84개
  - CSS 파일: 26개

---

## 1. PHP 페이지 매핑

### j_* 페이지 (56개)

- j_create_admin - 상태: 미확인
- j_install_status - 상태: 미확인
- j_setup_db - 상태: 미확인
- j_update_js_css_path - 상태: 미확인
- j_adjust_icon - 상태: 미확인
- j_autoreset - 상태: 미확인
- j_basic_info - 상태: 미확인
- j_board_article_add - 상태: 미확인
- j_board_comment_add - 상태: 미확인
- j_board_get_articles - 상태: 미확인
- j_diplomacy_destroy_letter - 상태: 미확인
- j_diplomacy_get_letter - 상태: 미확인
- j_diplomacy_respond_letter - 상태: 미확인
- j_diplomacy_rollback_letter - 상태: 미확인
- j_diplomacy_send_letter - 상태: 미확인
- j_export_simulator_object - 상태: 미확인
- j_general_log_old - 상태: 미확인
- j_general_set_permission - 상태: 미확인
- j_get_basic_general_list - 상태: 미확인
- j_get_city_list - 상태: 미확인
- ... 외 36개

### a_* 페이지 (8개)

- a_bestGeneral - 상태: 미확인
- a_emperior - 상태: 미확인
- a_emperior_detail - 상태: 미확인
- a_genList - 상태: 미확인
- a_hallOfFame - 상태: 미확인
- a_kingdomList - 상태: 미확인
- a_npcList - 상태: 미확인
- a_traffic - 상태: 미확인

### b_* 페이지 (9개)

- b_betting - 상태: 미확인
- b_currentCity - 상태: 미확인
- b_genList - 상태: 미확인
- b_myBossInfo - 상태: 미확인
- b_myCityInfo - 상태: 미확인
- b_myGenInfo - 상태: 미확인
- b_myKingdomInfo - 상태: 미확인
- b_myPage - 상태: 미확인
- b_tournament - 상태: 미확인

### c_* 페이지 (1개)

- c_tournament - 상태: 미확인

### t_* 페이지 (1개)

- t_diplomacy - 상태: 미확인

### v_* 페이지 (16개)

- v_auction - 상태: 미확인
- v_battleCenter - 상태: 미확인
- v_board - 상태: 미확인
- v_cachedMap - 상태: 미확인
- v_chiefCenter - 상태: 미확인
- v_globalDiplomacy - 상태: 미확인
- v_history - 상태: 미확인
- v_inheritPoint - 상태: 미확인
- v_join - 상태: 미확인
- v_nationBetting - 상태: 미확인
- v_nationGeneral - 상태: 미확인
- v_nationStratFinan - 상태: 미확인
- v_NPCControl - 상태: 미확인
- v_processing - 상태: 미확인
- v_troop - 상태: 미확인
- v_vote - 상태: 미확인

## 2. Vue vs React 컴포넌트
- PHP Vue: 84개
- TypeScript React: 51개
- 매핑 작업 필요

## 3. 주요 문제점

### 확인된 문제
- ✅ 도시 클릭 → 도시 정보 페이지 (방금 수정)
- ⚠️ 거병 커맨드 UI 없음
- ⚠️ 기본 커맨드 대부분 미작동

### P0 (즉시) 🔴
1. 기본 커맨드 UI 추가
   - 거병
   - 이동
   - 징병/모병
2. API 에러 처리 개선
3. 로딩/에러 상태 표시

### P1 (이번 주) 🟡
1. Vue → React 마이그레이션
2. 명령 패널 완성
3. 메시지 시스템

### P2 (다음 주) 🟢
1. 전체 페이지 포팅
2. UI/UX 개선
