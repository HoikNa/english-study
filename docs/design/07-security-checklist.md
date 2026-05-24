# 07. Security Checklist
> 보안 및 개인정보 체크리스트 24항목

---

## 통신 보안

| 상태 | 항목 | 구현 방법 |
|---|---|---|
| ☐ | HTTPS 강제 | API Gateway + CloudFront 자동. Expo 앱은 ATS(iOS) / Network Security Config(Android) 기본 적용 |
| ☐ | CORS 화이트리스트 | FastAPI CORSMiddleware에 Expo 앱 스킴(exp://, speakreadymy://)만 허용. localhost는 개발 환경만 |
| ☐ | API Gateway 스로틀링 | 초당 10 req/user, 일 1000 req/user. AI 엔드포인트는 초당 3 req로 별도 제한 |
| ☐ | TLS 1.2 이상 강제 | API Gateway 기본 정책. TLS 1.0/1.1 비활성화 확인 |

---

## 인증 보안

| 상태 | 항목 | 구현 방법 |
|---|---|---|
| ☐ | JWT Access 토큰 만료 시간 | 24시간. 필요 시 1시간으로 단축 검토 |
| ☐ | JWT Refresh 토큰 만료 시간 | 30일. 재발급 시 기존 토큰 무효화 |
| ☐ | JWT 서명 키 관리 | AWS Secrets Manager에 256bit 랜덤 키 저장. 환경변수 코드 하드코딩 금지 |
| ☐ | 비밀번호 해시 | bcrypt (work factor 12). Supabase Auth 기본 제공 |
| ☐ | 토큰 탈취 대응 | 리프레시 토큰 1회 사용 후 교체 (Rotation). 의심 사용 감지 시 전체 세션 무효화 |

---

## 데이터 보안 & 개인정보

| 상태 | 항목 | 구현 방법 |
|---|---|---|
| ☐ | 음성 데이터 즉시 삭제 | Lambda에서 Azure STT 처리 완료 즉시 임시 파일 삭제. S3/스토리지 저장 없음 |
| ☐ | 개인 학습 데이터 최소 수집 | users 테이블에 이메일 + 레벨 + 목표만 저장. 이름/연락처 수집 없음 |
| ☐ | Supabase RLS 정책 | 모든 테이블에 `user_id = auth.uid()` 행 수준 보안 정책 적용 |
| ☐ | 민감 데이터 로그 제거 | CloudWatch 로그에 audio_bytes, gpt_feedback 내용 출력 금지. 점수/ID만 로깅 |
| ☐ | TTS 캐시 접근 제어 | Supabase Storage 버킷 private 설정. 서명된 URL(1시간 만료)로 접근 |
| ☐ | SQL Injection 방어 | SQLModel ORM 사용으로 자동 방어. raw query 사용 금지 |
| ☐ | XSS 방어 | React Native는 DOM 없음. GPT 응답 텍스트는 dangerouslySetInnerHTML 사용 금지 |

---

## AI API 보안

| 상태 | 항목 | 구현 방법 |
|---|---|---|
| ☐ | AI API 키 서버 전용 | Azure/OpenAI API 키는 Lambda 환경변수(Secrets Manager)에만 저장. Expo 앱 노출 금지 |
| ☐ | Prompt Injection 방어 | GPT 시스템 프롬프트에 사용자 입력이 지시어로 해석되지 않도록 구분자 사용 |
| ☐ | 월 예산 상한 설정 | OpenAI / Azure 대시보드에서 월 $30 소프트 리미트 설정. cost_guard.py 이중 방어 |
| ☐ | GPT 응답 길이 제한 | max_tokens: 300 고정. 과도한 응답으로 인한 비용 급증 방지 |

---

## 역검토 완료 기준

- [ ] 위 체크리스트 24개 항목 전체 구현 완료
- [ ] Supabase RLS 정책 실제 쿼리로 검증 (타 user_id로 조회 시 빈 결과 반환 확인)
- [ ] 음성 파일 처리 후 Lambda /tmp 디렉토리 삭제 로그 확인
- [ ] GPT Prompt Injection 테스트 케이스 3개 이상 실행

---

> ✅ 역검토 완료 선언: 위 항목 전체 확인 후 이 줄에 **보안 역검토 완료 — [날짜]** 기록.
