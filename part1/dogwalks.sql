DROP DATABASE IF EXISTS DogWalkService;
CREATE DATABASE DogWalkService;
USE DogWalkService;
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('owner', 'walker') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Dogs (
    dog_id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    size ENUM('small', 'medium', 'large') NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES Users(user_id)
);

CREATE TABLE WalkRequests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    dog_id INT NOT NULL,
    requested_time DATETIME NOT NULL,
    duration_minutes INT NOT NULL,
    location VARCHAR(255) NOT NULL,
    status ENUM('open', 'accepted', 'completed', 'cancelled') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dog_id) REFERENCES Dogs(dog_id)
);

CREATE TABLE WalkApplications (
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    walker_id INT NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id),
    FOREIGN KEY (walker_id) REFERENCES Users(user_id),
    CONSTRAINT unique_application UNIQUE (request_id, walker_id)
);

CREATE TABLE WalkRatings (
    rating_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    walker_id INT NOT NULL,
    owner_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comments TEXT,
    rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id),
    FOREIGN KEY (walker_id) REFERENCES Users(user_id),
    FOREIGN KEY (owner_id) REFERENCES Users(user_id),
    CONSTRAINT unique_rating_per_walk UNIQUE (request_id)
);

-- 插入五个用户
INSERT INTO Users (username, email, password_hash, role) VALUES
  ('alice123',  'alice@example.com',  'password123', 'owner'),
  ('bobwalker', 'bob@example.com',   'password123', 'walker'),
  ('carol123',  'carol@example.com', 'password123', 'owner'),
  ('daveowner', 'dave@example.com',  'password123', 'owner'),
  ('erinwalker','erin@example.com',  'password123', 'walker');

-- 插入五只狗，owner_id 来自 Users 表
INSERT INTO Dogs (owner_id, name, size) VALUES
  ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max',    'medium'),
  ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella',  'small'),
  ((SELECT user_id FROM Users WHERE username = 'daveowner'), 'Charlie','large'),
  ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Luna',   'small'),
  ((SELECT user_id FROM Users WHERE username = 'daveowner'), 'Rocky', 'medium');

-- 插入五个遛狗请求，dog_id 同时匹配狗的名字和主人的 user_id
INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
  ((SELECT dog_id FROM Dogs WHERE name = 'Max'    AND owner_id = (SELECT user_id FROM Users WHERE username = 'alice123')), '2025-06-10 08:00:00', 30, 'Parklands',       'open'),
  ((SELECT dog_id FROM Dogs WHERE name = 'Bella'  AND owner_id = (SELECT user_id FROM Users WHERE username = 'carol123')), '2025-06-10 09:30:00', 45, 'Beachside Ave',   'accepted'),
  ((SELECT dog_id FROM Dogs WHERE name = 'Charlie'AND owner_id = (SELECT user_id FROM Users WHERE username = 'daveowner')), '2025-06-11 10:00:00', 60, 'Dog Park Central','open'),
  ((SELECT dog_id FROM Dogs WHERE name = 'Luna'   AND owner_id = (SELECT user_id FROM Users WHERE username = 'alice123')), '2025-06-12 14:00:00', 30, 'City Park',       'open'),
  ((SELECT dog_id FROM Dogs WHERE name = 'Rocky'  AND owner_id = (SELECT user_id FROM Users WHERE username = 'daveowner')), '2025-06-13 07:30:00', 45, 'Riverside Trail', 'completed');