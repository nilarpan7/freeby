"""
Create sample tasks for testing
"""
from database.database import SessionLocal
from database.models import Task, User, TaskStatus, Difficulty, UserRole
import uuid

def create_sample_client():
    """Create a sample client user"""
    db = SessionLocal()
    
    # Check if client already exists
    client = db.query(User).filter(User.email == "client@demo.com").first()
    if client:
        print("Sample client already exists")
        db.close()
        return client.id
    
    client = User(
        id=f"client-{uuid.uuid4()}",
        email="client@demo.com",
        name="Demo Client",
        role=UserRole.CLIENT,
        profile_completed=True,
        karma_score=0,
        company="TechCorp Inc",
        domain="Backend",
        skills=["Project Management", "Requirements"],
        bio="Looking for talented developers to build amazing projects"
    )
    
    db.add(client)
    db.commit()
    db.refresh(client)
    db.close()
    
    print(f"Created sample client: {client.id}")
    return client.id

def create_sample_tasks():
    """Create sample tasks with different karma requirements"""
    
    client_id = create_sample_client()
    db = SessionLocal()
    
    sample_tasks = [
        {
            "title": "Build a Simple Todo App",
            "description": "Create a basic todo application with add, edit, delete functionality.\n\nRequirements:\n- Clean, responsive UI\n- Local storage for persistence\n- Mark tasks as complete\n- Filter by status (all, active, completed)\n\nDeliverables:\n- Working web application\n- Source code on GitHub\n- Basic documentation",
            "stack": ["React", "JavaScript", "CSS"],
            "difficulty": Difficulty.EASY,
            "time_estimate_min": 180,
            "min_karma": 0,
            "reward_amount": 2500.0,
            "reward_karma": 15,
            "figma_url": None
        },
        {
            "title": "E-commerce Product API",
            "description": "Develop a REST API for an e-commerce product catalog.\n\nFeatures needed:\n- CRUD operations for products\n- Category management\n- Search and filtering\n- Pagination\n- Input validation\n- Error handling\n\nTech requirements:\n- Node.js/Express or Python/FastAPI\n- Database (PostgreSQL/MongoDB)\n- API documentation\n- Unit tests",
            "stack": ["Node.js", "Express", "PostgreSQL", "API"],
            "difficulty": Difficulty.MEDIUM,
            "time_estimate_min": 360,
            "min_karma": 25,
            "reward_amount": 8000.0,
            "reward_karma": 25,
            "figma_url": None
        },
        {
            "title": "Real-time Chat Application",
            "description": "Build a real-time chat application with multiple rooms and user authentication.\n\nCore features:\n- User registration/login\n- Multiple chat rooms\n- Real-time messaging\n- Online user status\n- Message history\n- File sharing\n- Responsive design\n\nTechnical requirements:\n- WebSocket implementation\n- User authentication (JWT)\n- Database for message persistence\n- Modern frontend framework\n- Deployment ready",
            "stack": ["React", "Node.js", "Socket.io", "MongoDB", "JWT"],
            "difficulty": Difficulty.HARD,
            "time_estimate_min": 720,
            "min_karma": 50,
            "reward_amount": 15000.0,
            "reward_karma": 40,
            "figma_url": "https://www.figma.com/file/sample-chat-design"
        },
        {
            "title": "Data Analysis Dashboard",
            "description": "Create an interactive dashboard for sales data analysis.\n\nFeatures:\n- Upload CSV data files\n- Interactive charts and graphs\n- Filter by date range, category\n- Export reports to PDF\n- Responsive design\n\nData visualizations needed:\n- Sales trends over time\n- Top products by revenue\n- Geographic sales distribution\n- Customer segmentation\n\nTech stack:\n- Python (Pandas, Plotly/Dash) or JavaScript (D3.js, Chart.js)\n- File upload handling\n- PDF generation",
            "stack": ["Python", "Pandas", "Plotly", "Dash"],
            "difficulty": Difficulty.MEDIUM,
            "time_estimate_min": 480,
            "min_karma": 30,
            "reward_amount": 12000.0,
            "reward_karma": 30,
            "figma_url": None
        },
        {
            "title": "Mobile App Landing Page",
            "description": "Design and develop a modern landing page for a mobile app.\n\nSections needed:\n- Hero section with app preview\n- Features showcase\n- Screenshots gallery\n- Pricing plans\n- Download buttons (App Store/Play Store)\n- Contact form\n- Footer with links\n\nRequirements:\n- Fully responsive design\n- Smooth animations\n- Fast loading times\n- SEO optimized\n- Cross-browser compatible\n\nBonus:\n- Dark/light mode toggle\n- Multi-language support",
            "stack": ["HTML", "CSS", "JavaScript", "GSAP"],
            "difficulty": Difficulty.EASY,
            "time_estimate_min": 240,
            "min_karma": 10,
            "reward_amount": 5000.0,
            "reward_karma": 20,
            "figma_url": "https://www.figma.com/file/sample-landing-design"
        },
        {
            "title": "Blockchain Voting System",
            "description": "Develop a decentralized voting system using blockchain technology.\n\nCore functionality:\n- Smart contract for vote storage\n- Web3 integration\n- Voter registration\n- Secure vote casting\n- Real-time results\n- Vote verification\n\nTechnical requirements:\n- Solidity smart contracts\n- Web3.js/Ethers.js integration\n- MetaMask connectivity\n- IPFS for metadata storage\n- Gas optimization\n- Security auditing\n\nDeliverables:\n- Smart contract code\n- Frontend application\n- Deployment scripts\n- Security documentation",
            "stack": ["Solidity", "Web3.js", "React", "IPFS", "Ethereum"],
            "difficulty": Difficulty.HARD,
            "time_estimate_min": 960,
            "min_karma": 75,
            "reward_amount": 25000.0,
            "reward_karma": 50,
            "figma_url": None
        }
    ]
    
    created_count = 0
    for task_data in sample_tasks:
        # Check if task already exists
        existing = db.query(Task).filter(Task.title == task_data["title"]).first()
        if existing:
            print(f"Task already exists: {task_data['title']}")
            continue
        
        task = Task(
            id=f"task-{uuid.uuid4()}",
            client_id=client_id,
            status=TaskStatus.OPEN,
            match_score=85,
            **task_data
        )
        
        db.add(task)
        created_count += 1
        print(f"Created task: {task_data['title']}")
    
    db.commit()
    db.close()
    
    print(f"\n✅ Created {created_count} sample tasks!")
    print("You can now browse them at: http://localhost:3000/tasks")

if __name__ == "__main__":
    create_sample_tasks()