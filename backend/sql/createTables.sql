-- Building Table
CREATE TABLE IF NOT EXISTS building (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  description TEXT
);

-- Room Table
CREATE TABLE IF NOT EXISTS room (
  id INT AUTO_INCREMENT PRIMARY KEY,
  building_id INT NOT NULL,
  floor INT,
  room_nr VARCHAR(20),
  capacity INT,
  description TEXT,
  CONSTRAINT fk_building
    FOREIGN KEY (building_id)
    REFERENCES building(id)
    ON DELETE CASCADE
);

-- Teacher Table
CREATE TABLE IF NOT EXISTS teacher (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  email VARCHAR(100) UNIQUE
);

-- Timetable Table
CREATE TABLE IF NOT EXISTS timetable (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT NOT NULL,
  teacher_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  description TEXT,
  CONSTRAINT fk_room
    FOREIGN KEY (room_id)
    REFERENCES room(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_teacher
    FOREIGN KEY (teacher_id)
    REFERENCES teacher(id)
    ON DELETE CASCADE
);

-- Indexe
CREATE INDEX idx_timetable_room ON timetable (room_id);
CREATE INDEX idx_timetable_start_time ON timetable (start_time);
CREATE INDEX idx_timetable_end_time ON timetable (end_time);
CREATE INDEX idx_timetable_room_time ON timetable (room_id, start_time, end_time);


DELIMITER $$

CREATE TRIGGER trg_prevent_overlap
BEFORE INSERT ON timetable
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1
    FROM timetable
    WHERE room_id = NEW.room_id
      AND NOT (NEW.end_time <= start_time OR NEW.start_time >= end_time)
  ) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Room is already booked in this time range';
  END IF;
END$$

DELIMITER ;
