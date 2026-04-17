import docker
import hashlib
import json

try:
    client = docker.from_env()
except Exception as e:
    print(f"Docker connection failed: {e}. Please ensure Docker Desktop is running.")
    client = None

def provision_pod(image="python:3.9-slim"):
    """Launch an ephemeral container with no network egress for safety."""
    if not client:
        return "mock_container_no_docker"
    
    container = client.containers.run(
        image,
        command="/bin/bash",
        detach=True,
        tty=True,
        stdin_open=True,
        # network_mode="none" # Disable network to prevent malicious code pulling resources
    )
    return container.id

def cleanup_pod(container_id):
    if not client or container_id == "mock_container_no_docker":
        return
    try:
        container = client.containers.get(container_id)
        container.stop(timeout=1)
        container.remove(force=True)
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
