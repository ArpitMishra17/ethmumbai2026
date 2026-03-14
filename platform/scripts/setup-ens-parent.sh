#!/bin/bash
# Register agentcover.eth on Sepolia via ETHRegistrarController
# Prerequisites: cast (from Foundry), DEPLOYER_PRIVATE_KEY env var, Sepolia ETH
#
# Alternatively, register manually at https://sepolia.app.ens.domains
#
# Contract: ETHRegistrarController 0xfb3cE5D01e0f33f41DbB39035dB9745962F1f968

set -euo pipefail

: "${DEPLOYER_PRIVATE_KEY:?Set DEPLOYER_PRIVATE_KEY}"
: "${SEPOLIA_RPC_URL:=https://rpc.sepolia.org}"

CONTROLLER="0xfb3cE5D01e0f33f41DbB39035dB9745962F1f968"
RESOLVER="0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5"
LABEL="agentcover"
DURATION=$((365 * 24 * 60 * 60)) # 1 year
OWNER=$(cast wallet address --private-key "$DEPLOYER_PRIVATE_KEY")

echo "Owner address: $OWNER"
echo "Registering $LABEL.eth on Sepolia..."

# Step 1: Make commitment
SECRET=$(cast keccak "$(date +%s)")
COMMITMENT=$(cast call "$CONTROLLER" \
  "makeCommitment(string,address,uint256,bytes32,address,bytes[],bool,uint16)(bytes32)" \
  "$LABEL" "$OWNER" "$DURATION" "$SECRET" "$RESOLVER" "[]" true 0 \
  --rpc-url "$SEPOLIA_RPC_URL")

echo "Commitment: $COMMITMENT"

# Step 2: Submit commitment
cast send "$CONTROLLER" \
  "commit(bytes32)" "$COMMITMENT" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --rpc-url "$SEPOLIA_RPC_URL"

echo "Commitment submitted. Waiting 60s for minCommitmentAge..."
sleep 65

# Step 3: Get price
PRICE=$(cast call "$CONTROLLER" \
  "rentPrice(string,uint256)(uint256)" \
  "$LABEL" "$DURATION" \
  --rpc-url "$SEPOLIA_RPC_URL")

echo "Registration price: $PRICE wei"

# Step 4: Register
cast send "$CONTROLLER" \
  "register(string,address,uint256,bytes32,address,bytes[],bool,uint16)" \
  "$LABEL" "$OWNER" "$DURATION" "$SECRET" "$RESOLVER" "[]" true 0 \
  --value "$PRICE" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --rpc-url "$SEPOLIA_RPC_URL"

echo "Done! $LABEL.eth registered on Sepolia."
echo "Owner: $OWNER"
