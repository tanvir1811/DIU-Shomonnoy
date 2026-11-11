CREATE DATABASE IF NOT EXISTS diu_shomonnoy CHARACTER SET utf8mb4;
USE diu_shomonnoy;

CREATE TABLE IF NOT EXISTS users (
  student_id    VARCHAR(20)  PRIMARY KEY,
  Name          VARCHAR(100) NOT NULL,
  Email         VARCHAR(150) NOT NULL UNIQUE,
  Department    VARCHAR(120) NOT NULL,
  Phone_number  VARCHAR(20)  DEFAULT '',
  UserName      VARCHAR(50)  NOT NULL UNIQUE,
  Password_hash VARCHAR(255) NOT NULL,
  Profile_Pic   VARCHAR(255) DEFAULT '',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
  admin_id      INT AUTO_INCREMENT PRIMARY KEY,
  Name          VARCHAR(100) NOT NULL,
  Email         VARCHAR(150) NOT NULL UNIQUE,
  Department    VARCHAR(120) DEFAULT '',
  Phone_number  VARCHAR(20)  DEFAULT '',
  UserName      VARCHAR(50)  NOT NULL UNIQUE,
  Password_hash VARCHAR(255) NOT NULL,
  Profile_Pic   VARCHAR(255) DEFAULT '',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notes (
  Note_id          INT AUTO_INCREMENT PRIMARY KEY,
  Title            VARCHAR(200) NOT NULL,
  Course           VARCHAR(100) NOT NULL,
  Semester         VARCHAR(20)  NOT NULL,
  Year             VARCHAR(4)   NOT NULL,
  Description      TEXT,
  File_Path        VARCHAR(255) NOT NULL,
  Num_of_downloads INT DEFAULT 0,
  Uploaded_by      VARCHAR(20),
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS question_bank (
  QuestionBankId   INT AUTO_INCREMENT PRIMARY KEY,
  Title            VARCHAR(200) NOT NULL,
  ExamType         VARCHAR(30)  NOT NULL DEFAULT 'Midterm',
  Department       VARCHAR(120) NOT NULL,
  Semester         VARCHAR(20)  NOT NULL,
  Year             VARCHAR(4)   NOT NULL,
  Details          TEXT,
  File_Path        VARCHAR(255) NOT NULL,
  Answer_note_Path VARCHAR(255) DEFAULT '',
  Num_of_downloads INT DEFAULT 0,
  Uploaded_by      VARCHAR(20),
  posted_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS faculty (
  Faculty_listing_id INT AUTO_INCREMENT PRIMARY KEY,
  Name               VARCHAR(100) NOT NULL,
  Designation        VARCHAR(100) NOT NULL,
  Email              VARCHAR(150) NOT NULL,
  Department         VARCHAR(120) NOT NULL,
  Image              VARCHAR(500) DEFAULT '',
  Counseling_Hour    VARCHAR(100) DEFAULT ''
);
