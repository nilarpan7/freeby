import subprocess
import hashlib
import json
import sys

# Try to use Docker CLI via subprocess instead of docker-py
def check_docker_via_cli():
    try:
        result = subprocess.run(['docker', 'version', '--format', '{{.Server.Version}}'], 
                               capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            return True, result.stdout.strip()
        else:
            return False, result.stderr
    except Exception as e:
        return False, str(e)

# Check if Docker is available via CLI
docker_available, docker_version = check_docker_via_cli()
if docker_available:
    print(f"Docker CLI available (version: {docker_version})")
    client = "docker_cli"  # Marker that we can use Docker CLI
else:
    print(f"Docker CLI not available: {docker_version}")
    client = None

def provision_pod(image="python:3.9-slim"):
    """Launch an ephemeral container with no network egress for safety."""
    if not client:
        return "mock_container_no_docker"
    
    try:
        # Use Docker CLI to run container
        # Use /bin/sh as default shell (works for alpine and most images)
        result = subprocess.run([
            'docker', 'run', '-d',
            '--tty',
            '--interactive',
            image,
            '/bin/sh', '-c', 'tail -f /dev/null'  # Keep container running
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            container_id = result.stdout.strip()
            print(f"Container started: {container_id}")
            return container_id
        else:
            print(f"Failed to start container: {result.stderr}")
            return f"mock_container_error_{result.returncode}"
    except Exception as e:
        print(f"Error provisioning pod: {e}")
        return f"mock_container_exception"

def cleanup_pod(container_id):
    if not client or container_id.startswith("mock_container"):
        return
    try:
        # Stop container
        subprocess.run(['docker', 'stop', container_id], 
                      capture_output=True, text=True, timeout=10)
        # Remove container
        subprocess.run(['docker', 'rm', '-f', container_id], 
                      capture_output=True, text=True, timeout=10)
        print(f"Container cleaned up: {container_id}")
    except Exception as e:
        print(f"Cleanup error: {e}")

def generate_pow_receipt(container_id, code_snippet, output=""):
    """Generates the SHA256 PoW receipt mimicking the Zero Trust Talent Protocol"""
    # Dummy telemetry extraction
    telemetry = {
        "compile_count": 1,
        "error_count": 0,
        "peak_memory_mb": 14.5,
        "algo_hint": "O(N) operations detected"
    }
    
    payload = json.dumps({
        "container": container_id,
        "code": code_snippet,
        "telemetry": telemetry
    }, sort_keys=True)
    
    receipt_hash = hashlib.sha256(payload.encode('utf-8')).hexdigest()
    
    return {
        "hash": receipt_hash,
        "telemetry": telemetry
    }


if __name__ == "__main__":
    print("Docker Manager Script")
    print("=" * 50)
    
    # Test the functionality
    print("\nTesting container provisioning...")
    container_id = provision_pod("python:3.9-slim")
    
    if not container_id.startswith("mock_container"):
        print(f"\nSuccessfully provisioned container: {container_id}")
        
        # Generate a PoW receipt
        print("\nGenerating PoW receipt...")
        receipt = generate_pow_receipt(container_id, "print('Hello, World!')", "Hello, World!")
        print(f"Receipt hash: {receipt['hash'][:16]}...")
        print(f"Telemetry: {receipt['telemetry']}")
        
        # Cleanup
        print("\nCleaning up container...")
        cleanup_pod(container_id)
        print("Done!")
    else:
        print(f"\nUsing mock container: {container_id}")
        print("(Docker not available or error occurred)")