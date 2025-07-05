-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL
);

-- Insert some sample events
INSERT INTO events (name, date) VALUES 
('Team Meeting', DATE_ADD(CURDATE(), INTERVAL 1 DAY)),
('Project Deadline', DATE_ADD(CURDATE(), INTERVAL 7 DAY)),
('Company Event', DATE_ADD(CURDATE(), INTERVAL 14 DAY)); 