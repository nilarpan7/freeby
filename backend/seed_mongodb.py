"""
Seed MongoDB with sample data for Kramic.sh
Run this script to populate the database with test data
"""
import asyncio
from datetime import datetime, timedelta
import uuid

from database.mongodb import connect_to_mongodb, close_mongodb_connection
from database.mongodb_models import (
    User, Task, TaskSubmission, KarmaEvent,
    UserRole, Domain, TaskStatus, Difficulty
)

async def seed_database():
    """Seed the database with sample data"""
    
    print("🌱 Seeding MongoDB database...")
    
    # Connect to MongoDB
    await connect_to_mongodb()
    
    # Clear existing data (optional - comment out if you want to keep existing data)
    print("Clearing existing data...")
    await User.delete_all()
    await Task.delete_all()
    await TaskSubmission.delete_all()
    await KarmaEvent.delete_all()
    
    # Create sample students
    print("Creating sample students...")
    students = []
    
    student1 = User(
        id=f"student-{uuid.uuid4()}",
        email="alice@example.com",
        name="Alice Johnson",
        role=UserRole.STUDENT,
        domain=Domain.FRONTEND,
        skills=["React", "TypeScript", "Tailwind CSS", "Next.js"],
        bio="Frontend developer passionate about creating beautiful UIs",
        github_url="https://github.com/alicejohnson",
        avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
        karma_score=75,
        tasks_completed=8,
        profile_completed=True
    )
    await student1.insert()
    students.append(student1)
    
    student2 = User(
        id=f"student-{uuid.uuid4()}",
        email="bob@example.com",
        name="Bob Smith",
        role=UserRole.STUDENT,
        domain=Domain.BACKEND,
        skills=["Python", "FastAPI", "MongoDB", "Docker"],
        bio="Backend engineer who loves building scalable APIs",
        github_url="https://github.com/bobsmith",
        avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
        karma_score=45,
        tasks_completed=5,
        profile_completed=True
    )
    await student2.insert()
    students.append(student2)
    
    student3 = User(
        id=f"student-{uuid.uuid4()}",
        email="carol@example.com",
        name="Carol Davis",
        role=UserRole.STUDENT,
        domain=Domain.FULLSTACK,
        skills=["React", "Node.js", "PostgreSQL", "AWS"],
        bio="Full-stack developer with cloud expertise",
        github_url="https://github.com/caroldavis",
        avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=Carol",
        karma_score=120,
        tasks_completed=15,
        profile_completed=True
    )
    await student3.insert()
    students.append(student3)
    
    student4 = User(
        id=f"student-{uuid.uuid4()}",
        email="david@example.com",
        name="David Lee",
        role=UserRole.STUDENT,
        domain=Domain.DATA,
        skills=["Python", "Pandas", "Machine Learning", "SQL"],
        bio="Data scientist exploring AI and ML",
        github_url="https://github.com/davidlee",
        avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=David",
        karma_score=30,
        tasks_completed=3,
        profile_completed=True
    )
    await student4.insert()
    students.append(student4)
    
    # Create sample clients
    print("Creating sample clients...")
    clients = []
    
    client1 = User(
        id=f"client-{uuid.uuid4()}",
        email="startup@example.com",
        name="Sarah Chen",
        role=UserRole.CLIENT,
        company="TechStart Inc",
        domain=Domain.FRONTEND,
        skills=[],
        bio="CTO at TechStart, building the future of work",
        avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        tasks_posted=6,
        profile_completed=True
    )
    await client1.insert()
    clients.append(client1)
    
    client2 = User(
        id=f"client-{uuid.uuid4()}",
        email="agency@example.com",
        name="Mike Wilson",
        role=UserRole.CLIENT,
        company="Digital Agency Co",
        domain=Domain.DESIGN,
        skills=[],
        bio="Creative director looking for talented developers",
        avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
        tasks_posted=4,
        profile_completed=True
    )
    await client2.insert()
    clients.append(client2)
    
    # Create sample tasks
    print("Creating sample tasks...")
    tasks = []
    
    task1 = Task(
        id=f"task-{uuid.uuid4()}",
        title="Build Landing Page for SaaS Product",
        description="Create a modern, responsive landing page using Next.js and Tailwind CSS. Must include hero section, features, pricing, and contact form. Design will be provided in Figma.",
        stack=["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"],
        difficulty=Difficulty.EASY,
        time_estimate_min=180,
        min_karma=0,
        reward_amount=150.0,
        reward_karma=15,
        figma_url="https://figma.com/file/sample-design",
        client_id=client1.id,
        status=TaskStatus.OPEN,
        match_score=92
    )
    await task1.insert()
    tasks.append(task1)
    
    task2 = Task(
        id=f"task-{uuid.uuid4()}",
        title="REST API for E-commerce Platform",
        description="Build a RESTful API with user authentication, product management, cart functionality, and order processing. Use FastAPI and MongoDB.",
        stack=["Python", "FastAPI", "MongoDB", "JWT"],
        difficulty=Difficulty.MEDIUM,
        time_estimate_min=480,
        min_karma=30,
        reward_amount=400.0,
        reward_karma=35,
        client_id=client1.id,
        status=TaskStatus.OPEN,
        match_score=88
    )
    await task2.insert()
    tasks.append(task2)
    
    task3 = Task(
        id=f"task-{uuid.uuid4()}",
        title="Mobile App UI Components",
        description="Create reusable React Native components for a fitness tracking app. Includes charts, progress bars, and animated cards.",
        stack=["React Native", "TypeScript", "Expo", "React Native Reanimated"],
        difficulty=Difficulty.MEDIUM,
        time_estimate_min=360,
        min_karma=50,
        reward_amount=350.0,
        reward_karma=30,
        client_id=client2.id,
        status=TaskStatus.OPEN,
        match_score=85
    )
    await task3.insert()
    tasks.append(task3)
    
    task4 = Task(
        id=f"task-{uuid.uuid4()}",
        title="Data Pipeline for Analytics Dashboard",
        description="Build ETL pipeline to process user analytics data. Extract from multiple sources, transform, and load into data warehouse. Create visualization dashboard.",
        stack=["Python", "Pandas", "Apache Airflow", "PostgreSQL", "Plotly"],
        difficulty=Difficulty.HARD,
        time_estimate_min=720,
        min_karma=75,
        reward_amount=800.0,
        reward_karma=60,
        client_id=client2.id,
        status=TaskStatus.OPEN,
        match_score=90
    )
    await task4.insert()
    tasks.append(task4)
    
    task5 = Task(
        id=f"task-{uuid.uuid4()}",
        title="Chrome Extension for Productivity",
        description="Develop a Chrome extension that helps users track time spent on websites and provides productivity insights.",
        stack=["JavaScript", "Chrome Extension API", "React", "Chart.js"],
        difficulty=Difficulty.EASY,
        time_estimate_min=240,
        min_karma=20,
        reward_amount=200.0,
        reward_karma=20,
        client_id=client1.id,
        status=TaskStatus.OPEN,
        match_score=87
    )
    await task5.insert()
    tasks.append(task5)
    
    # Create a claimed task
    task6 = Task(
        id=f"task-{uuid.uuid4()}",
        title="Portfolio Website Redesign",
        description="Redesign and rebuild portfolio website with modern animations and dark mode support.",
        stack=["Next.js", "Tailwind CSS", "Framer Motion"],
        difficulty=Difficulty.EASY,
        time_estimate_min=300,
        min_karma=0,
        reward_amount=180.0,
        reward_karma=18,
        client_id=client2.id,
        status=TaskStatus.CLAIMED,
        claimed_by=student1.id,
        match_score=95
    )
    await task6.insert()
    tasks.append(task6)
    
    # Create karma events for students
    print("Creating karma events...")
    
    karma_events = [
        KarmaEvent(
            id=f"ke-{uuid.uuid4()}",
            user_id=student1.id,
            event_type="task_approved",
            karma_delta=15,
            task_id=f"task-old-{uuid.uuid4()}",
            task_title="E-commerce Homepage",
            description="Task approved by TechStart Inc. Earned 15 karma + $150"
        ),
        KarmaEvent(
            id=f"ke-{uuid.uuid4()}",
            user_id=student1.id,
            event_type="sprint_complete",
            karma_delta=20,
            description="Completed squad sprint: Weekend Hackathon"
        ),
        KarmaEvent(
            id=f"ke-{uuid.uuid4()}",
            user_id=student2.id,
            event_type="task_approved",
            karma_delta=25,
            task_id=f"task-old-{uuid.uuid4()}",
            task_title="API Integration",
            description="Task approved by Digital Agency Co. Earned 25 karma + $250"
        ),
        KarmaEvent(
            id=f"ke-{uuid.uuid4()}",
            user_id=student3.id,
            event_type="task_approved",
            karma_delta=40,
            task_id=f"task-old-{uuid.uuid4()}",
            task_title="Full-Stack Dashboard",
            description="Task approved by TechStart Inc. Earned 40 karma + $500"
        ),
    ]
    
    for event in karma_events:
        await event.insert()
    
    print("\n✅ Database seeded successfully!")
    print("\n📊 Summary:")
    print(f"   - {len(students)} students created")
    print(f"   - {len(clients)} clients created")
    print(f"   - {len(tasks)} tasks created")
    print(f"   - {len(karma_events)} karma events created")
    
    print("\n🔐 Test Users Created:")
    print("   Students:")
    print("   - alice@example.com (75 karma, Frontend)")
    print("   - bob@example.com (45 karma, Backend)")
    print("   - carol@example.com (120 karma, Full-stack)")
    print("   - david@example.com (30 karma, Data)")
    print("\n   Clients:")
    print("   - startup@example.com (TechStart Inc)")
    print("   - agency@example.com (Digital Agency Co)")
    print("\n💡 Note: Use Google OAuth for login. Email/password login requires bcrypt fix.")
    
    # Close connection
    await close_mongodb_connection()

if __name__ == "__main__":
    asyncio.run(seed_database())
