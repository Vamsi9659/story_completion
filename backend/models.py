from pydantic import BaseModel, EmailStr

# ---------- STUDENT ----------
class StudentSignup(BaseModel):
    name: str
    email: EmailStr
    password: str

class StudentLogin(BaseModel):
    email: EmailStr
    password: str


# ---------- TEACHER ----------
class TeacherSignup(BaseModel):
    name: str
    email: EmailStr
    password: str

class TeacherLogin(BaseModel):
    email: EmailStr
    password: str


# ---------- STORY ----------
class Story(BaseModel):
    student_name: str
    student_email:str
    content: str
