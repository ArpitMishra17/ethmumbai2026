// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AgentRegistry {
    struct Agent {
        address owner;
        string name;
        string ensName;
        string metadataURI;
        bool isActive;
    }

    uint256 private _nextAgentId = 1;
    mapping(uint256 => Agent) public agents;
    mapping(address => uint256[]) public ownerAgents;

    event AgentRegistered(uint256 indexed agentId, address indexed owner, string name, string ensName);
    event AgentDeactivated(uint256 indexed agentId);
    event MetadataURISet(uint256 indexed agentId, string metadataURI);

    modifier onlyAgentOwner(uint256 agentId) {
        require(agents[agentId].owner == msg.sender, "Not agent owner");
        _;
    }

    function registerAgent(string calldata name, string calldata ensName) external returns (uint256) {
        uint256 agentId = _nextAgentId++;

        agents[agentId] = Agent({
            owner: msg.sender,
            name: name,
            ensName: ensName,
            metadataURI: "",
            isActive: true
        });

        ownerAgents[msg.sender].push(agentId);

        emit AgentRegistered(agentId, msg.sender, name, ensName);
        return agentId;
    }

    function setMetadataURI(uint256 agentId, string calldata uri) external onlyAgentOwner(agentId) {
        agents[agentId].metadataURI = uri;
        emit MetadataURISet(agentId, uri);
    }

    function deactivateAgent(uint256 agentId) external onlyAgentOwner(agentId) {
        agents[agentId].isActive = false;
        emit AgentDeactivated(agentId);
    }

    function getAgent(uint256 agentId) external view returns (Agent memory) {
        require(agents[agentId].owner != address(0), "Agent does not exist");
        return agents[agentId];
    }

    function getOwnerAgentIds(address owner) external view returns (uint256[] memory) {
        return ownerAgents[owner];
    }

    function nextAgentId() external view returns (uint256) {
        return _nextAgentId;
    }
}
