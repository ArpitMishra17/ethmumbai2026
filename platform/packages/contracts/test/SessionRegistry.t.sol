// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SessionRegistry.sol";

contract SessionRegistryTest is Test {
    SessionRegistry public registry;

    function setUp() public {
        registry = new SessionRegistry();
    }

    function test_anchorEmitsSessionAnchored() public {
        bytes32 sessionHash = keccak256("session");
        string memory sessionId = "session-123";
        string memory agentEns = "codex.agentcover.eth";
        address userId = makeAddr("user");

        vm.warp(1_717_171_717);

        vm.expectEmit(true, false, false, true);
        emit SessionRegistry.SessionAnchored(
            sessionHash,
            sessionId,
            agentEns,
            userId,
            block.timestamp
        );

        registry.anchor(sessionHash, sessionId, agentEns, userId);
    }

    function test_getSessionHashReturnsStoredHash() public {
        bytes32 sessionHash = keccak256("session");
        string memory sessionId = "session-123";
        string memory agentEns = "codex.agentcover.eth";
        address userId = makeAddr("user");

        registry.anchor(sessionHash, sessionId, agentEns, userId);

        bytes32 storedHash = registry.getSessionHash(sessionId, agentEns, userId);
        assertEq(storedHash, sessionHash);
    }

    function test_computeLookupKeyMatchesStoredLookup() public {
        bytes32 sessionHash = keccak256("session");
        string memory sessionId = "session-123";
        string memory agentEns = "codex.agentcover.eth";
        address userId = makeAddr("user");

        bytes32 lookupKey = registry.computeLookupKey(sessionId, agentEns, userId);
        registry.anchor(sessionHash, sessionId, agentEns, userId);

        bytes32 storedHash = registry.getSessionHash(sessionId, agentEns, userId);

        assertEq(lookupKey, keccak256(abi.encode(sessionId, agentEns, userId)));
        assertEq(storedHash, sessionHash);
    }
}
