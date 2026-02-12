-- Run this SQL command in Neon Console -> SQL Editor to create the admin user
-- ID: admin
-- PW: ezdesign123!

INSERT INTO "User" ("id", "username", "password", "createdAt")
VALUES ('admin-id', 'admin', '$2a$10$M3W6LwK1JaFkHJuKmWRwi.ymo5NVtn6AwlkO.lvRXjicQYqjZk0m6', NOW())
ON CONFLICT ("username") DO NOTHING;
