import gradio as gr
import speech_recognition as sr
import edge_tts
import asyncio
import tempfile
import ollama

# استيراد كلاسك من الملف الأول
from full2 import UltimateCareerAgent

# ==========================================
# 1. إعدادات النظام (State Variables)
# ==========================================
# المتغيرات اللي رح نحفظ فيها النتائج عشان نمررها للمقابلة
GLOBAL_DATA = {
    "persona": "",
    "jobs_list": [],  # رح نخزن فيها لستة الوظائف كاملة
    "selected_job": None
}

class InterviewManager:
    def __init__(self):
        self.question_count = 0
        self.max_questions = 3
        self.history = []

    def setup_interview(self, persona, job_title, company):
        self.question_count = 0
        self.history = [
            {
                "role": "system",
                "content": f"""You are a Senior Technical Recruiter called Ahmad at {company} interviewing a candidate for the {job_title} position.
                The candidate's detailed technical profile: 
                {persona}
                
                RULES:
                1. Start by welcoming the candidate, introduce yourself and the company briefly, then ask the candidate to introduce themselves.
                2. Ask ONLY ONE short question at a time. Wait for the candidate's response.
                3. Ask highly targeted technical questions based on their profile.
                4. You will ask a total of 3 questions.
                5. Do NOT output any final reports until the system tells you the interview is over."""
            }
        ]

manager = InterviewManager()

# ==========================================
# 2. تحويل النص إلى صوت (TTS)
# ==========================================
async def text_to_speech(text):
    voice = "en-US-ChristopherNeural" # صوت مايكروسوفت احترافي
    communicate = edge_tts.Communicate(text, voice)
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
    await communicate.save(temp_file.name)
    return temp_file.name

# ==========================================
# 3. دوال الربط مع كودك الأول
# ==========================================
def analyze_cv_and_get_jobs(pdf_file):
    # حط الـ Tokens تبعتك هون (ويفضل تحطهم بملف .env للسرية)
    GITHUB_TOKEN = "YOUR_GITHUB_TOKEN"
    SERP_API_KEY = "YOUR_SERP_API_KEY"
    
    agent = UltimateCareerAgent(
        github_token=GITHUB_TOKEN,
        serp_api_key=SERP_API_KEY,
        model="llama3.1"
    )
    
    # تشغيل التحليل
    result = agent.run(pdf_file.name)
    
    # تخزين النتائج بالمتغيرات العالمية
    GLOBAL_DATA["persona"] = result["persona"]
    GLOBAL_DATA["jobs_list"] = result["jobs"]
    
    # تجهيز قائمة الوظائف للـ Dropdown
    job_titles = [f"{job['title']} at {job['company']}" for job in result["jobs"]]
    
    # تنسيق النتائج عشان نعرضها لليوزر
    persona_display = result["persona"]
    jobs_display = "\n\n".join([f"📌 {job['title']} @ {job['company']}\n{job['analysis']}" for job in result["jobs"]])
    
    # إرجاع الداتا للواجهة: (تحديث النص تبع البيرسونا، تحديث نص الوظائف، وتحديث خيارات القائمة المنسدلة)
    return persona_display, jobs_display, gr.update(choices=job_titles, interactive=True)

# ==========================================
# 4. بدء المقابلة والتفاعل
# ==========================================
async def start_interview_process(selected_job_string):
    if not selected_job_string:
        return "Please select a job first!", None

    # البحث عن الوظيفة المختارة من القائمة
    selected_job = next((job for job in GLOBAL_DATA["jobs_list"] if f"{job['title']} at {job['company']}" == selected_job_string), None)
    
    if not selected_job:
        return "Error loading job details.", None

    GLOBAL_DATA["selected_job"] = selected_job

    # تجهيز المقابلة بالداتا الديناميكية اللي اجت من الـ CV
    manager.setup_interview(
        persona=GLOBAL_DATA["persona"], 
        job_title=selected_job["title"], 
        company=selected_job["company"]
    )
    
    # طلب الرد الأول من الموديل (الترحيب)
    response = ollama.chat(model="llama3.1", messages=manager.history)
    ai_response = response['message']['content']
    manager.history.append({"role": "assistant", "content": ai_response})
    
    audio_path = await text_to_speech(ai_response)
    return f"**Interviewer:** {ai_response}", audio_path

async def process_voice_answer(audio_filepath):
    if not audio_filepath:
        return "Please record your answer.", None

    # تحويل صوت اليوزر لنص
    recognizer = sr.Recognizer()
    try:
        with sr.AudioFile(audio_filepath) as source:
            audio_data = recognizer.record(source)
            user_text = recognizer.recognize_google(audio_data)
    except Exception as e:
        return f"Could not understand audio. Try again.", None

    manager.history.append({"role": "user", "content": user_text})
    
    # فحص انتهاء المقابلة
    if manager.question_count >= manager.max_questions:
        manager.history.append({
            "role": "system", 
            "content": """The interview is now over. You are a strict but fair Senior Technical Recruiter. Generate a comprehensive and structured final evaluation report based ONLY on the candidate's answers. 
        
        You MUST strictly use the following Markdown format:

        ### 🎯 Final Verdict (Eligibility)
        [State clearly: Highly Recommended, Recommended with Conditions, or Not Recommended. Add 1 sentence justification.]

        ### 📈 Hiring Probability Score
        [Calculate a realistic score like 85%]

        ### 💪 Key Strengths
        * [Point 1: Focus on technical skills demonstrated]
        * [Point 2: Focus on practical experience]
        * [Point 3: Focus on problem-solving]

        ### ⚠️ Weaknesses & Areas for Improvement
        * [Point 1: Missing technical knowledge]
        * [Point 2: Vague answers or lack of depth]

        ### 🗣️ Communication & Confidence Level
        [Evaluate how clear, structured, and confident their audio answers were]

        ### 🗺️ Recommended Action Plan (Roadmap)
        * [Actionable step 1 to improve their chances]
        * [Actionable step 2]
        """})
        response = ollama.chat(model="llama3.1", messages=manager.history)
        final_report = response['message']['content']
        
        goodbye_msg = "Thank you for your time. The interview is now complete. You can read your final evaluation report on the screen."
        audio_path = await text_to_speech(goodbye_msg)
        
        return f"**User:** {user_text}\n\n**[INTERVIEW COMPLETE - FINAL REPORT]**\n\n{final_report}", audio_path

    # إذا لسه في أسئلة
    response = ollama.chat(model="llama3.1", messages=manager.history)
    ai_response = response['message']['content']
    
    manager.history.append({"role": "assistant", "content": ai_response})
    manager.question_count += 1

    audio_path = await text_to_speech(ai_response)
    return f"**User:** {user_text}\n\n**Interviewer:** {ai_response}", audio_path


# ==========================================
# 5. واجهة المستخدم (Gradio UI)
# ==========================================
with gr.Blocks(theme=gr.themes.Monochrome()) as demo:
    gr.Markdown("# 🚀 Ultimate AI Career Agent & Auto-Interviewer")
    
    with gr.Tabs():
        # التاب الأول: رفع الـ CV والتحليل
        with gr.TabItem("1. CV Analysis & Job Matching"):
            with gr.Row():
                cv_input = gr.File(label="Upload your PDF CV")
                analyze_btn = gr.Button("Analyze CV & Find Jobs", variant="primary")
            
            with gr.Row():
                persona_output = gr.Textbox(label="Generated Technical Persona", lines=10)
                jobs_output = gr.Textbox(label="Job Analysis & Match", lines=10)
                
        # التاب الثاني: المقابلة
        with gr.TabItem("2. Virtual Interview"):
            gr.Markdown("### Select a job from the matched list to start your interview")
            with gr.Row():
                # القائمة المنسدلة للوظائف
                job_selector = gr.Dropdown(label="Select Target Job", choices=[], interactive=False)
                start_interview_btn = gr.Button("Start Interview", variant="primary")
            
            with gr.Row():
                with gr.Column(scale=2):
                    chatbot_display = gr.Textbox(label="Interview Transcript", lines=15, interactive=False)
                with gr.Column(scale=1):
                    audio_output = gr.Audio(label="Interviewer Voice", autoplay=True)
                    audio_input = gr.Audio(label="Your Turn (Record & Stop)", type="filepath", sources=["microphone"])
                    submit_answer_btn = gr.Button("Submit Audio Answer", variant="secondary")

    # ربط الأزرار بالدوال
    analyze_btn.click(
        fn=analyze_cv_and_get_jobs,
        inputs=[cv_input],
        outputs=[persona_output, jobs_output, job_selector] # تحديث الداتا والـ Dropdown
    )
    
    start_interview_btn.click(
        fn=start_interview_process,
        inputs=[job_selector],
        outputs=[chatbot_display, audio_output]
    )
    
    submit_answer_btn.click(
        fn=process_voice_answer,
        inputs=[audio_input],
        outputs=[chatbot_display, audio_output]
    )

if __name__ == "__main__":
    demo.launch()