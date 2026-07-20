DELETE FROM `opponents`;
--> statement-breakpoint
INSERT INTO `opponents` (`id`, `name`, `logo_url`, `circular_frame`) VALUES
  ('incheon-sniper', '인천 스나이퍼', '/assets/sniper-logo.png', 1),
  ('seoul-haechis', '서울 해치스', '/assets/haechis-logo.png', 1),
  ('seoul-ares', '서울 아레스', '/assets/opponent-placeholder.png', 1),
  ('gyeryong-onekill-dragons', '계룡 원킬 드래곤즈', '/assets/opponent-placeholder.png', 1),
  ('gwangju-team-leopard', '광주 Team-Leopard', '/assets/opponent-placeholder.png', 1),
  ('jeju-blue-dolphins', '제주 블루돌핀스', '/assets/opponent-placeholder.png', 1),
  ('gangwon-blue-knights', '강원 블루나이츠', '/assets/opponent-placeholder.png', 1),
  ('jeonbuk-overflow', '전북 오버플로', '/assets/opponent-placeholder.png', 1);
