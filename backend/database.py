from pymongo import MongoClient

client = MongoClient("mongodb+srv://vamsilalam96_db_user:Vamsi4256@cluster0.qsinwlq.mongodb.net/?appName=Cluster0")
db = client.story_test

students = db.students
teachers = db.teachers
stories = db.stories
