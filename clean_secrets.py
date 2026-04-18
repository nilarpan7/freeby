import os

client_id = "YOUR_GOOGLE_CLIENT_ID"
client_secret = "YOUR_GOOGLE_CLIENT_SECRET"

dir_path = "c:\\Users\\NILARPAN JANA\\Downloads\\freeby"

def clean_secrets():
    for root, dirs, files in os.walk(dir_path):
        if ".git" in root or "node_modules" in root or "venv" in root:
            continue
        for file in files:
            if not file.endswith((".md", ".ts", ".tsx", ".py", ".env", ".example")):
                continue
            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                
                if client_id in content or client_secret in content:
                    content = content.replace(client_id, "YOUR_GOOGLE_CLIENT_ID")
                    content = content.replace(client_secret, "YOUR_GOOGLE_CLIENT_SECRET")
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(content)
                    print(f"Cleaned {filepath}")
            except Exception as e:
                pass

if __name__ == "__main__":
    clean_secrets()
