-- ══════════════════════════════════════════════════════════════
-- V3__questions.sql  — Flyway migration #3: seed question bank
-- ══════════════════════════════════════════════════════════════

-- General Aptitude exam questions (exam_id = 'GENERAL')
INSERT INTO questions (exam_id, content, option_a, option_b, option_c, option_d, correct_ans, difficulty, marks) VALUES

('GENERAL',
 'A train travels at 60 km/h for 2 hours and then at 80 km/h for 3 hours. What is the average speed for the entire journey?',
 '68 km/h', '72 km/h', '70 km/h', '75 km/h', 'B', 'MEDIUM', 2),

('GENERAL',
 'If ROSE is coded as 6821 and CHAIR is coded as 73456, what is the code for SEARCH?',
 '214673', '246173', '214637', '214763', 'A', 'HARD', 3),

('GENERAL',
 'A man is 24 years older than his son. In two years, his age will be twice the age of his son. What is the present age of his son?',
 '20 years', '22 years', '24 years', '18 years', 'B', 'EASY', 1),

('GENERAL',
 'Which number should come next in the series: 2, 6, 12, 20, 30, ?',
 '40', '42', '44', '46', 'B', 'MEDIUM', 2),

('GENERAL',
 'In a class of 60 students, the ratio of boys to girls is 2:1. How many girls are in the class?',
 '15', '20', '25', '30', 'B', 'EASY', 1),

('GENERAL',
 'A can do a piece of work in 10 days and B can do it in 15 days. In how many days will both together complete the work?',
 '5 days', '6 days', '8 days', '12 days', 'B', 'MEDIUM', 2),

('GENERAL',
 'What is the next term in the series: 1, 4, 9, 16, 25, ?',
 '30', '35', '36', '49', 'C', 'EASY', 1),

-- CSE Final exam questions (exam_id = 'CSE-2024-FINAL')
('CSE-2024-FINAL',
 'Which data structure uses LIFO (Last In First Out) principle?',
 'Queue', 'Stack', 'Tree', 'Graph', 'B', 'EASY', 1),

('CSE-2024-FINAL',
 'What is the time complexity of binary search?',
 'O(n)', 'O(n^2)', 'O(log n)', 'O(n log n)', 'C', 'MEDIUM', 2),

('CSE-2024-FINAL',
 'Which of the following is NOT a feature of Object-Oriented Programming?',
 'Encapsulation', 'Polymorphism', 'Compilation', 'Inheritance', 'C', 'EASY', 1),

('CSE-2024-FINAL',
 'In SQL, which clause is used to filter groups created by GROUP BY?',
 'WHERE', 'HAVING', 'FILTER', 'SELECT', 'B', 'MEDIUM', 2),

('CSE-2024-FINAL',
 'Which HTTP method is idempotent but NOT safe?',
 'GET', 'DELETE', 'POST', 'HEAD', 'B', 'HARD', 3);
