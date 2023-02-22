const keywords = ['bool', 'break', 'case', 'catch', 'const', 'continue', 'default', 'do', 'double', 'struct',
    'else', 'enum', 'payable', 'function', 'modifier', 'emit', 'export', 'extern', 'false', 'constructor',
    'float', 'if', 'contract', 'int', 'long', 'string', 'super', 'or', 'private', 'protected', 'noReentrancy',
    'public', 'return', 'returns', 'assert', 'event', 'indexed', 'using', 'require', 'uint', 'onlyDaoChallenge',
    'transfer', 'Transfer', 'Transaction', 'switch', 'pure', 'view', 'this', 'throw', 'true', 'try', 'revert',
    'bytes', 'bytes4', 'bytes32', 'internal', 'external', 'union', 'constant', 'while', 'for', 'notExecuted',
    'NULL', 'uint256', 'uint128', 'uint8', 'uint16', 'address', 'call', 'msg', 'value', 'sender', 'notConfirmed',
    'private', 'onlyOwner', 'internal', 'onlyGovernor', 'onlyCommittee', 'onlyAdmin', 'onlyPlayers', 'ownerExists',
    'onlyManager', 'onlyHuman', 'only_owner', 'onlyCongressMembers', 'preventReentry', 'noEther', 'onlyMembers',
    'onlyProxyOwner', 'confirmed', 'mapping'];

const main_set = ['function', 'constructor', 'modifier', 'contract'];

function clean_fragment(fragment) {
    let cleaned_fragment = [];
    // map function name to symbol name
    let func_symbols = {};
    // map variable name to symbol name
    let var_symbols = {};

    let func_count = 1;
    let var_count = 1;

    const comment_reg = /\/\/[^\n\r]+?(?:\*\)|[\n\r])/g; // regular expression to search single line comments
    const func_reg = /\b([_A-Za-z]\w*)\b(?=\s*\()/g; // regular expression to search functions
    const var_reg = /\b([_A-Za-z]\w*)\b(?:(?=\s*\w+\()|(?!\s*\w+))(?!\s*\()/g; // regular expression to search variables

    for (let line of fragment) {
        line.replace(comment_reg, ''); // remove single line comments

        let nostr_line = line.replace(/".*?"/g, '""').replace(/'.*?'/g, "''"); // remove string literals
        let ascii_line = nostr_line.replace(/[^\x00-\x7f]/g, ''); // removed all non-ASCII symbols

        const funcs = ascii_line.match(func_reg) || []; // find all functions
        const vars = ascii_line.match(var_reg) || []; // find all variables

        for (let func of funcs) {
            if (!keywords.includes(func) && !main_set.includes(func)) {
                if (!Object.keys(func_symbols).includes(func)) {
                    func_symbols[func] = 'FUN' + func_count;
                    func_count++;
                }

                ascii_line = ascii_line.replace(new RegExp(`\\b(${func})\\b(?=\\s*\\()`, "g"), func_symbols[func]);
            }
        }

        for (let variable of vars) {
            if (!keywords.includes(variable) && !main_set.includes(variable)) {
                if (!Object.keys(var_symbols).includes(variable)) {
                    var_symbols[variable] = 'VAR' + var_count;
                    var_count++;
                }

                ascii_line = ascii_line.replace(new RegExp(`\\b(${variable})\\b(?:(?=\\s*\\w+\\()|(?!\\s*\\w+))(?!\\s*\\()`, "g"), var_symbols[variable]);
            }
        }

        cleaned_fragment.push(ascii_line);
    }

    return cleaned_fragment;
}


function test_clean_fragment() {
    let fragment = `
        library SafeMath {
            function mul(uint256 a, uint256 b) internal pure returns (uint256) {
                if (a == 0) {
                    return 0;
                }
                uint256 c = a * b;
                assert(c / a == b);
                return c;
            } 
            function div(uint256 a, uint256 b) internal pure returns (uint256) {
                uint256 c = a / b;
                return c;
            }
            // The comment around this code has been commented out.
            function sub(uint256 a, uint256 b) internal pure returns (uint256) {
                assert(b <= a);
                return a - b;
            }
            function add(uint256 a, uint256 b) internal pure returns (uint256) {
                uint256 c = a + b;
                assert(c >= a);
                return c;
            }
        }
        
        contract Ownable {
            address public owner = 'sss';
        
            event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
            
            function Ownable() public {
                owner = msg.sender;
            }
            modifier onlyOwner() {
                require(msg.sender == owner);
                _;
            }
            function transferOwnership(address newOwner) public onlyOwner {
                require(newOwner != address(0));
                OwnershipTransferred(owner, newOwner);
                owner = newOwner;
            }
        
        }
        
        contract Pausable is Ownable {
            event Pause();
            event Unpause();
        
            bool public paused = false;
        
            modifier whenNotPaused() {
                require(!paused);
                _;
            }
        
            modifier whenPaused() {
                require(paused);
                _;
            }
        
            function pause() onlyOwner whenNotPaused public {
                paused = true;
                Pause();
            }
        
            function unpause() onlyOwner whenPaused public {
                paused = false;
                Unpause();
            }
        }
    `;

    console.log(clean_fragment(fragment.split('\n')));
}

test_clean_fragment();