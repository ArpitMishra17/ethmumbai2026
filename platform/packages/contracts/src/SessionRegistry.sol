// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SessionRegistry {
    mapping(bytes32 => bytes32) private sessionHashes;

    event SessionAnchored(
        bytes32 indexed sessionHash,
        string sessionId,
        string agentEns,
        address indexed userId,
        uint256 timestamp
    );

    function computeLookupKey(
        string calldata sessionId,
        string calldata agentEns,
        address userId
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(sessionId, agentEns, userId));
    }

    function anchor(
        bytes32 sessionHash,
        string calldata sessionId,
        string calldata agentEns,
        address userId
    ) external {
        bytes32 lookupKey = keccak256(abi.encode(sessionId, agentEns, userId));
        sessionHashes[lookupKey] = sessionHash;

        emit SessionAnchored(sessionHash, sessionId, agentEns, userId, block.timestamp);
    }

    function getSessionHash(
        string calldata sessionId,
        string calldata agentEns,
        address userId
    ) external view returns (bytes32) {
        return sessionHashes[keccak256(abi.encode(sessionId, agentEns, userId))];
    }
}
