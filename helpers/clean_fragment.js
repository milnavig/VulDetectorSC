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

    const single_comment_reg = /\/\/[^\n\r]+?(?:\*\)|[\n\r])/g; // regular expression to search single line comments
    const multiline_comment_reg = /\/\*[^]*?\*\//g; // regular expression to search multiline comments
    fragment = fragment.replace(single_comment_reg, '\n'); // remove single line comments
    fragment = fragment.replace(multiline_comment_reg, '\n'); // remove multiline comments

    fragment = fragment.split('\n');
    const func_reg = /\b([_A-Za-z]\w*)\b(?=\s*\()/g; // regular expression to search functions
    const var_reg = /\b([_A-Za-z]\w*)\b(?:(?=\s*\w+\()|(?!\s*\w+))(?!\s*\()/g; // regular expression to search variables

    for (let line of fragment) {

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

        cleaned_fragment.push(ascii_line.trim()); // remove spaces from line and push it to array of lines
    }

    return cleaned_fragment.filter(line => line !== '').join('\n'); // remove empty lines and return array of lines
}

module.exports = clean_fragment;