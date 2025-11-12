// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CertificateNFT
 * @dev NFT contract for course completion certificates on UniqueHub
 * Each certificate is a unique NFT proving course completion
 */
contract CertificateNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 private _tokenIdCounter;
    uint256 public constant MINT_FEE = 0.0000001 ether; // 0.0000001 ETH
    
    // Mapping from token ID to certificate data
    mapping(uint256 => CertificateData) public certificates;
    
    // Mapping from user + course to token ID (prevent duplicates)
    mapping(address => mapping(string => uint256)) public userCourseCertificates;
    
    struct CertificateData {
        address recipient;
        string courseId;
        string courseName;
        uint256 issuedAt;
        string certificateId;
    }
    
    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        string courseId,
        string courseName,
        string certificateId,
        uint256 issuedAt
    );
    
    event FundsWithdrawn(address indexed owner, uint256 amount);
    
    constructor() ERC721("UniqueHub Certificate", "UHCERT") Ownable(msg.sender) {
        _tokenIdCounter = 1;
    }
    
    /**
     * @dev Mint a certificate NFT for course completion
     * @param recipient Address receiving the certificate
     * @param courseId Unique course identifier
     * @param courseName Name of the completed course
     * @param certificateId Unique certificate identifier from backend
     * @param tokenURI IPFS or storage URL for certificate metadata
     */
    function mintCertificate(
        address recipient,
        string memory courseId,
        string memory courseName,
        string memory certificateId,
        string memory tokenURI
    ) external payable nonReentrant returns (uint256) {
        require(msg.value >= MINT_FEE, "Insufficient mint fee");
        require(recipient != address(0), "Invalid recipient");
        require(bytes(courseId).length > 0, "Invalid course ID");
        require(bytes(certificateId).length > 0, "Invalid certificate ID");
        require(bytes(tokenURI).length > 0, "Invalid token URI");
        
        // Check if user already has certificate for this course
        require(
            userCourseCertificates[recipient][courseId] == 0,
            "Certificate already exists for this course"
        );
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // Mint the NFT
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        // Store certificate data
        certificates[tokenId] = CertificateData({
            recipient: recipient,
            courseId: courseId,
            courseName: courseName,
            issuedAt: block.timestamp,
            certificateId: certificateId
        });
        
        // Track user's certificate for this course
        userCourseCertificates[recipient][courseId] = tokenId;
        
        emit CertificateMinted(
            tokenId,
            recipient,
            courseId,
            courseName,
            certificateId,
            block.timestamp
        );
        
        return tokenId;
    }
    
    /**
     * @dev Get certificate data by token ID
     */
    function getCertificate(uint256 tokenId) external view returns (CertificateData memory) {
        require(ownerOf(tokenId) != address(0), "Certificate does not exist");
        return certificates[tokenId];
    }
    
    /**
     * @dev Check if user has certificate for a course
     */
    function hasCertificate(address user, string memory courseId) external view returns (bool) {
        return userCourseCertificates[user][courseId] != 0;
    }
    
    /**
     * @dev Get user's certificate token ID for a course
     */
    function getUserCertificateId(address user, string memory courseId) external view returns (uint256) {
        return userCourseCertificates[user][courseId];
    }
    
    /**
     * @dev Verify certificate authenticity
     */
    function verifyCertificate(
        uint256 tokenId,
        address expectedOwner,
        string memory expectedCourseId
    ) external view returns (bool) {
        if (ownerOf(tokenId) != expectedOwner) return false;
        CertificateData memory cert = certificates[tokenId];
        return keccak256(bytes(cert.courseId)) == keccak256(bytes(expectedCourseId));
    }
    
    /**
     * @dev Withdraw contract balance (mint fees)
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit FundsWithdrawn(owner(), balance);
    }
    
    /**
     * @dev Get total certificates minted
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
    
    /**
     * @dev Override to prevent transfers (soulbound-like behavior)
     * Remove this function if you want certificates to be transferable
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("Certificates are non-transferable");
        }
        return super._update(to, tokenId, auth);
    }
}
