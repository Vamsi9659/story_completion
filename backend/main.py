
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import random

from database import students, teachers, stories

from models import (
    StudentSignup,
    StudentLogin,
    TeacherSignup,
    TeacherLogin,
    Story
)

from auth import hash_password, verify_password
from ml_analysis import classify_from_input, generate_summary

app = FastAPI()

# ------------------------------------------------
# CORS
# ------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------
# STORY PROMPTS
# ------------------------------------------------
STORY_PROMPTS = [
    "Ravi wakes up one morning feeling unusually quiet. As the day goes on…",
    "After receiving unexpected news, she sits alone and thinks about…",
    "A person is standing at a crossroads late at night. They choose to…",
    "When Meena reached school that day, she noticed something was different…",
    "It was raining heavily, and he stood near the window thinking…",
    "When the teacher called his name, his heart started beating fast…",
    "He failed the test and walked home slowly, thinking about what to do next…",
    "She felt left out during lunch break and sat alone thinking…",
    "That evening, she decided to write down her feelings in a notebook…",
    "He wanted to give up, but something made him stop and think again…",
]

# ------------------------------------------------
# GET STORY PROMPT
# ------------------------------------------------
@app.get("/story/prompt")
def get_story_prompt():
    return {
        "instruction": "Read the beginning of the story and complete it in your own words.",
        "prompt": random.choice(STORY_PROMPTS)
    }

# ------------------------------------------------
# STUDENT REGISTER
# ------------------------------------------------
@app.post("/student/register")
def student_register(data: StudentSignup):

    if students.find_one({"email": data.email}):
        raise HTTPException(
            status_code=400,
            detail="Student already exists"
        )

    students.insert_one({
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password)
    })

    return {
        "message": "Student registered successfully"
    }

# ------------------------------------------------
# STUDENT LOGIN
# ------------------------------------------------
@app.post("/student/login")
def student_login(data: StudentLogin):

    user = students.find_one({
        "email": data.email
    })

    if not user or not verify_password(
        data.password,
        user["password"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    return {
        "name": user["name"],
        "email": user["email"]
    }

# ------------------------------------------------
# TEACHER REGISTER
# ------------------------------------------------
@app.post("/teacher/register")
def teacher_register(data: TeacherSignup):

    if teachers.find_one({"email": data.email}):
        raise HTTPException(
            status_code=400,
            detail="Teacher already exists"
        )

    teachers.insert_one({
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password)
    })

    return {
        "message": "Teacher registered successfully"
    }

# ------------------------------------------------
# TEACHER LOGIN
# ------------------------------------------------
@app.post("/teacher/login")
def teacher_login(data: TeacherLogin):

    user = teachers.find_one({
        "email": data.email
    })

    if not user or not verify_password(
        data.password,
        user["password"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    return {
        "name": user["name"],
        "email": user["email"]
    }

# ------------------------------------------------
# SUBMIT STORY
# ------------------------------------------------
@app.post("/story/submit")
def submit_story(data: Story):

    student = students.find_one({
        "email": data.student_email
    })

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    emotional_tone, coping_style, hope_level, conflict_resolution = classify_from_input(
        data.content
    )

    summary = generate_summary(
        emotional_tone,
        coping_style,
        hope_level,
        conflict_resolution
    )

    report = {
        "student_name": data.student_name,
        "student_email": data.student_email,
        "story": data.content,
        "emotional_tone": emotional_tone,
        "coping_style": coping_style,
        "hope_level": hope_level,
        "conflict_resolution": conflict_resolution,
        "summary": summary
    }

    stories.insert_one(report)

    return {
        "message": "Story submitted successfully"
    }

# ------------------------------------------------
# TEACHER REPORTS
# ------------------------------------------------
@app.get("/teacher/reports/{teacher_email}")
def teacher_reports(teacher_email: str):

    teacher = teachers.find_one({
        "email": teacher_email
    })

    if not teacher:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    return list(
        stories.find({}, {"_id": 0})
    )

