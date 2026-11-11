# DIU Shomonnoy Backend (Express + MySQL)

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and fill in your MySQL details and a JWT_SECRET
3. Create tables: `mysql -u root -p < database/schema.sql`
4. Create the first admin: `npm run seed:admin`
5. `npm start`  -> http://localhost:5000

## Folders (each has Routes = frontend connect, Functions = logic, Database = MySQL queries)
- user/          signup, login, profile        /api/users
- admin/         admin login, profile          /api/admin
- note/          notes                         /api/notes
- questionBank/  question bank                 /api/question-bank
- faculty/       faculty info                  /api/faculty
- config/database.js  shared MySQL connection

## Access rules
- Public: list notes/questions/faculty, count a download
- Logged in: upload note/question, edit own profile
- Admin only: delete note/question, add/edit/delete faculty
