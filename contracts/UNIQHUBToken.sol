// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UNIQHUB Token for uniquehub ecosystem 
 * @dev ERC-20 token for the UniqueHub platform on Base
 * @notice Token Name: UNIQHUB Token
 * @notice Token Symbol: UNIQ
 * @notice Max Supply: 100,000,000 UNIQ
 */
contract UNIQHUBToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18; // 100 million tokens with 18 decimals
    
    /**
     * @dev Constructor that mints the entire max supply to the deployer
     * @param initialOwner Address that will receive the tokens and ownership
     */
    constructor(address initialOwner) ERC20("UNIQHUB Token", "UNIQ") Ownable(initialOwner) {
        // Mint the entire max supply to the initial owner
        _mint(initialOwner, MAX_SUPPLY);
    }
    
    /**
     * @dev Returns the number of decimals used for token amounts
     * @return uint8 Number of decimals (18)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}



