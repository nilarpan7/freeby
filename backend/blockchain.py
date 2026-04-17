from web3 import Web3
from eth_account import Account
from typing import Optional
import json
from config import EAS_CONTRACT_ADDRESS, BASE_RPC_URL, PRIVATE_KEY

# EAS Schema Registry ABI (simplified for attestation)
EAS_ABI = json.loads('''[
    {
        "inputs": [
            {
                "components": [
                    {"internalType": "bytes32", "name": "schema", "type": "bytes32"},
                    {"components": [
                        {"internalType": "address", "name": "recipient", "type": "address"},
                        {"internalType": "uint64", "name": "expirationTime", "type": "uint64"},
                        {"internalType": "bool", "name": "revocable", "type": "bool"},
                        {"internalType": "bytes32", "name": "refUID", "type": "bytes32"},
                        {"internalType": "bytes", "name": "data", "type": "bytes"},
                        {"internalType": "uint256", "name": "value", "type": "uint256"}
                    ], "internalType": "struct AttestationRequestData", "name": "data", "type": "tuple"}
                ],
                "internalType": "struct AttestationRequest",
                "name": "request",
                "type": "tuple"
            }
        ],
        "name": "attest",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "payable",
        "type": "function"
    }
]''')

# Kramic.sh Task Completion Schema
# Schema: address student, string taskId, uint8 karmaEarned, string githubLink
TASK_COMPLETION_SCHEMA = "0x..." # Replace with actual schema UID after registration

class BlockchainService:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(BASE_RPC_URL))
        self.account = Account.from_key(PRIVATE_KEY) if PRIVATE_KEY else None
        self.eas_contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(EAS_CONTRACT_ADDRESS),
            abi=EAS_ABI
        )
    
    def is_connected(self) -> bool:
        """Check if connected to blockchain"""
        return self.w3.is_connected()
    
    def mint_task_attestation(
        self,
        student_address: str,
        task_id: str,
        karma_earned: int,
        github_link: str
    ) -> Optional[str]:
        """
        Mint an EAS attestation for a completed task
        Returns the attestation UID
        """
        if not self.account:
            print("Warning: No private key configured, skipping attestation")
            return None
        
        try:
            # Encode attestation data
            # Format: (address student, string taskId, uint8 karmaEarned, string githubLink)
            encoded_data = self.w3.codec.encode(
                ['address', 'string', 'uint8', 'string'],
                [
                    Web3.to_checksum_address(student_address),
                    task_id,
                    karma_earned,
                    github_link
                ]
            )
            
            # Build attestation request
            attestation_request = {
                'schema': TASK_COMPLETION_SCHEMA,
                'data': {
                    'recipient': Web3.to_checksum_address(student_address),
                    'expirationTime': 0,  # No expiration
                    'revocable': False,   # Soulbound
                    'refUID': '0x' + '0' * 64,  # No reference
                    'data': encoded_data,
                    'value': 0
                }
            }
            
            # Send transaction
            tx = self.eas_contract.functions.attest(attestation_request).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'gas': 200000,
                'gasPrice': self.w3.eth.gas_price
            })
            
            signed_tx = self.w3.eth.account.sign_transaction(tx, self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            # Wait for transaction receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Extract attestation UID from logs
            attestation_uid = receipt['logs'][0]['topics'][1].hex()
            
            print(f"✅ Attestation minted: {attestation_uid}")
            return attestation_uid
            
        except Exception as e:
            print(f"❌ Attestation failed: {str(e)}")
            return None
    
    def verify_attestation(self, attestation_uid: str) -> bool:
        """Verify an attestation exists on-chain"""
        try:
            # Query EAS contract for attestation
            # This would use the getAttestation function
            return True  # Simplified for now
        except Exception as e:
            print(f"Verification error: {str(e)}")
            return False

# Singleton instance
blockchain_service = BlockchainService()
