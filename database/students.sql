-- ============================================
-- INSERT STUDENTS INTO DIGITAL ATTENDANCE SYSTEM
-- ============================================

-- Delete existing students (optional - be careful!)
-- DELETE FROM users WHERE role = 'student' AND id > 3;

-- Insert all 52 students (default password: 123)
INSERT INTO users (username, password, email, full_name, role) VALUES
('kibruyisfa', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'kibruyisfa@student.com', 'Kibruyisfa Misganaw Mebrahu', 'student'),
('kirubel', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'kirubel@student.com', 'Kirubel Metaferia Negash', 'student'),
('lidia', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'lidia@student.com', 'Lidia Addisu Belete', 'student'),
('mahider', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'mahider@student.com', 'Mahider Aemero Mekonen', 'student'),
('mariyamawit', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'mariyamawit@student.com', 'Mariyamawit Alemseged G/ssilassie', 'student'),
('mathiyas', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'mathiyas@student.com', 'Mathiyas Gezahegn Shiferaw', 'student'),
('megdelawit', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'megdelawit@student.com', 'Megdelawit Abraham Digafe', 'student'),
('melat', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'melat@student.com', 'Melat Samson G/egziabher', 'student'),
('michaelb5', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'michaelb5@student.com', 'Michael zinabu Tikuye', 'student'),
('mihreteab', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'mihreteab@student.com', 'Mihreteab Desta Sewore', 'student'),
('mikiyas', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'mikiyas@student.com', 'Mikiyas Tsegaye Mandeffro', 'student'),
('mohammeda', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'mohammeda@student.com', 'Mohammed Abduljelil Abas', 'student'),
('mohammedab', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'mohammedab@student.com', 'Mohammed Abdullah Abdo', 'student'),
('munirat', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'munirat@student.com', 'Munira Tebarek Redilu', 'student'),
('muniray', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'muniray@student.com', 'Munira Yesuf Mohammed', 'student'),
('nahomf', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'nahomf@student.com', 'Nahom Fekadu Abate', 'student'),
('nahomh', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'nahomh@student.com', 'Nahom Hailu Admasu', 'student'),
('nahomm', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'nahomm@student.com', 'Nahom Mulugeta Gebeyehu', 'student'),
('nahomt', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'nahomt@student.com', 'Nahom Tadesse Haileevesus', 'student'),
('naomi', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'naomi@student.com', 'Naomi Zenebe Hailemariam', 'student'),
('natan', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'natan@student.com', 'Natan Feyisa Kebede', 'student'),
('natnael', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'natnael@student.com', 'Natnael Asnake Hailemariam', 'student'),
('nebiyat', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'nebiyat@student.com', 'Nebiyat Mesfin Tsegaye', 'student'),
('nebyu', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'nebyu@student.com', 'Nebyu Samuel Lakew', 'student'),
('newal', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'newal@student.com', 'Newal Elias Mohammed', 'student'),
('nobel', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'nobel@student.com', 'Nobel Alemayehu Mengesha', 'student'),
('noha', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'noha@student.com', 'Noha Dengia etea', 'student'),
('reda', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'reda@student.com', 'Reda Mohammed Ahmed', 'student'),
('roba', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'roba@student.com', 'Roba Molla Welkeba', 'student'),
('ruth', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'ruth@student.com', 'Ruth Getahun Melka', 'student'),
('samuelg', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'samuelg@student.com', 'Samuel Girma Kebenessa', 'student'),
('samuelw', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'samuelw@student.com', 'Samuel Wondimagegnehu Gebrehiwot', 'student'),
('semhal', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'semhal@student.com', 'Semhal Abebe Sebhat', 'student'),
('semiha', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'semiha@student.com', 'Semiha Kedir Jemal', 'student'),
('sofoniyas', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'sofoniyas@student.com', 'Sofoniyas Tewodros G/wold', 'student'),
('tewobesta', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'tewobesta@student.com', 'Tewobesta Alemayehu Gelagay', 'student'),
('wengelawit', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'wengelawit@student.com', 'Wengelawit Asres Alemnew', 'student'),
('yabetis', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'yabetis@student.com', 'Yabetis Gessese Kurabachew', 'student'),
('yabetse', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'yabetse@student.com', 'Yabetse Tesfaye Alemu', 'student'),
('yabetsega', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'yabetsega@student.com', 'Yabetsega Shimelis Kassa', 'student'),
('yanet', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'yanet@student.com', 'Yanet Belay Wodaje', 'student'),
('yaredh', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'yaredh@student.com', 'Yared Habtamu Agonafer', 'student'),
('yaredt', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'yaredt@student.com', 'Yared Tilahun Kidane', 'student'),
('yasir', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'yasir@student.com', 'Yasir Hamid Ali', 'student'),
('yeabkal', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'yeabkal@student.com', 'Yeabkal Wondwossen Girma', 'student'),
('yeabsira', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'yeabsira@student.com', 'Yeabsira Daniel Fikre', 'student'),
('yeabtsega', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'yeabtsega@student.com', 'Yeabtsega Samuel', 'student'),
('yeshake', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'yeshake@student.com', 'Yeshake Assefa Wolde', 'student'),
('yihune', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'yihune@student.com', 'Yihune Yeshaneh Sewnet', 'student'),
('yohannesg', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'yohannesg@student.com', 'yohannes gebru G/Hiwot', 'student'),
('yohannesh', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'yohannesh@student.com', 'Yohannes Habte Neda', 'student'),
('yoseph', '$2a$10$vXAmbOmtlmGKYbrRKcam/eoiQ6ku5Z4ZlWmmrI.Imy9O6Gw9nqThe', 'yoseph@student.com', 'Yoseph Fetene Lemma', 'student')
ON CONFLICT (username) DO UPDATE SET
    password = EXCLUDED.password,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = TRUE;

-- Verify the insert
SELECT COUNT(*) FROM users WHERE role = 'student';
