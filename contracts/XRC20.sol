// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

/**
 * @title XRC20 Token
 * @dev This is the a XinFin Network Compatible XRC20 token.
 */

contract XRC20 {
    string public name;
    string public symbol;
    uint8 public decimals;

    uint256 private _totalSupply;

    mapping(address => uint) private balances;
    mapping(address => mapping(address => uint)) private allowances;

    event Approval(address indexed owner, address indexed spender, uint value);
    event Transfer(address indexed from, address indexed to, uint value);

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _initialSupply
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;

        _totalSupply += _initialSupply * 10 ** decimals;
        balances[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
    }

    /**
     * @dev Return the totalSupply value stored in _totalSupply.
     */
    function totalSupply() public view virtual returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev Return the balance of a given address.
     * @param account The account which the balance is being called.
     */
    function balanceOf(address account) public view virtual returns (uint256) {
        return balances[account];
    }

    /**
     * @dev Return the allowance of a given address for this XRC20 token.
     * @param owner Token owner.
     * @param spender Address allowed to spend tokens on owner's behalf.
     */
    function allowance(
        address owner,
        address spender
    ) public view virtual returns (uint256) {
        return allowances[owner][spender];
    }

    /**
     * @dev Transfer tokens.
     * @param recipient The recipient of the tokens.
     * @param amount The amount to transfer.
     */
    function transfer(address recipient, uint amount) external returns (bool) {
        balances[msg.sender] -= amount;
        balances[recipient] += amount;
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    /**
     * @dev Approve another account to spend tokens.
     * @param spender The account to be allowed the spending of tokens.
     * @param amount The amount of tokens which can be spent.
     */
    function approve(address spender, uint amount) external returns (bool) {
        allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    /**
     * @dev Transfer tokens on behalf of another account.
     * @param sender The account the tokens should be sent from.
     * @param recipient The account to receive the tokens.
     * @param amount The amount of tokens to send.
     */
    function transferFrom(
        address sender,
        address recipient,
        uint amount
    ) external returns (bool) {
        allowances[sender][msg.sender] -= amount;
        balances[sender] -= amount;
        balances[recipient] += amount;
        emit Transfer(sender, recipient, amount);
        return true;
    }

    /** @dev Creates `amount` tokens and assigns them to `account`, increasing
     * the total supply.
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     */
    function _mint(address account, uint256 amount) internal virtual {
        require(account != address(0), "XRC20: mint to the zero address");
        _totalSupply += amount;
        unchecked {
            // Overflow not possible: balance + amount is at most totalSupply + amount, which is checked above.
            balances[account] += amount;
        }
        emit Transfer(address(0), account, amount);
    }
}
