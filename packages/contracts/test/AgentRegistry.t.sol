// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/AgentRegistry.sol";

contract AgentRegistryTest is Test {
    AgentRegistry public registry;
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    function setUp() public {
        registry = new AgentRegistry();
    }

    function test_registerAgent() public {
        vm.prank(alice);
        uint256 agentId = registry.registerAgent("TestAgent", "testagent.agentcover.eth");

        assertEq(agentId, 1);

        AgentRegistry.Agent memory agent = registry.getAgent(agentId);
        assertEq(agent.owner, alice);
        assertEq(agent.name, "TestAgent");
        assertEq(agent.ensName, "testagent.agentcover.eth");
        assertTrue(agent.isActive);
        assertEq(agent.metadataURI, "");
    }

    function test_registerMultipleAgents() public {
        vm.startPrank(alice);
        uint256 id1 = registry.registerAgent("Agent1", "agent1.agentcover.eth");
        uint256 id2 = registry.registerAgent("Agent2", "agent2.agentcover.eth");
        vm.stopPrank();

        assertEq(id1, 1);
        assertEq(id2, 2);

        uint256[] memory ids = registry.getOwnerAgentIds(alice);
        assertEq(ids.length, 2);
        assertEq(ids[0], 1);
        assertEq(ids[1], 2);
    }

    function test_setMetadataURI() public {
        vm.prank(alice);
        uint256 agentId = registry.registerAgent("TestAgent", "test.agentcover.eth");

        vm.prank(alice);
        registry.setMetadataURI(agentId, "https://example.com/api/agents/1/metadata");

        AgentRegistry.Agent memory agent = registry.getAgent(agentId);
        assertEq(agent.metadataURI, "https://example.com/api/agents/1/metadata");
    }

    function test_setMetadataURI_revert_notOwner() public {
        vm.prank(alice);
        uint256 agentId = registry.registerAgent("TestAgent", "test.agentcover.eth");

        vm.prank(bob);
        vm.expectRevert("Not agent owner");
        registry.setMetadataURI(agentId, "https://example.com/metadata");
    }

    function test_deactivateAgent() public {
        vm.prank(alice);
        uint256 agentId = registry.registerAgent("TestAgent", "test.agentcover.eth");

        vm.prank(alice);
        registry.deactivateAgent(agentId);

        AgentRegistry.Agent memory agent = registry.getAgent(agentId);
        assertFalse(agent.isActive);
    }

    function test_deactivateAgent_revert_notOwner() public {
        vm.prank(alice);
        uint256 agentId = registry.registerAgent("TestAgent", "test.agentcover.eth");

        vm.prank(bob);
        vm.expectRevert("Not agent owner");
        registry.deactivateAgent(agentId);
    }

    function test_getAgent_revert_nonexistent() public {
        vm.expectRevert("Agent does not exist");
        registry.getAgent(999);
    }

    function test_emits_AgentRegistered() public {
        vm.prank(alice);
        vm.expectEmit(true, true, false, true);
        emit AgentRegistry.AgentRegistered(1, alice, "TestAgent", "test.agentcover.eth");
        registry.registerAgent("TestAgent", "test.agentcover.eth");
    }

    function test_emits_MetadataURISet() public {
        vm.prank(alice);
        uint256 agentId = registry.registerAgent("TestAgent", "test.agentcover.eth");

        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit AgentRegistry.MetadataURISet(agentId, "https://example.com/meta");
        registry.setMetadataURI(agentId, "https://example.com/meta");
    }
}
