//const parser = require('@solidity-parser/parser');
const fs = require('fs');
const readline = require('readline');

// map user-defined variables to symbolic names(var)
let var_list = ['balances[msg.sender]', 'participated[msg.sender]', 'playerPendingWithdrawals[msg.sender]',
            'nonces[msgSender]', 'balances[beneficiary]', 'transactions[transactionId]', 'tokens[token][msg.sender]',
            'totalDeposited[token]', 'tokens[0][msg.sender]', 'accountBalances[msg.sender]', 'accountBalances[_to]',
            'creditedPoints[msg.sender]', 'balances[from]', 'withdrawalCount[from]', 'balances[recipient]',
            'investors[_to]', 'Bal[msg.sender]', 'Accounts[msg.sender]', 'Holders[_addr]', 'balances[_pd]',
            'ExtractDepositTime[msg.sender]', 'Bids[msg.sender]', 'participated[msg.sender]', 'deposited[_participant]',
            'Transactions[TransHash]', 'm_txs[_h]', 'balances[investor]', 'this.balance', 'proposals[_proposalID]',
            'accountBalances[accountAddress]', 'Chargers[id]', 'latestSeriesForUser[msg.sender]',
            'balanceOf[_addressToRefund]', 'tokenManage[token_]', 'milestones[_idMilestone]', 'payments[msg.sender]',
            'rewardsForA[recipient]', 'userBalance[msg.sender]', 'credit[msg.sender]', 'credit[to]', 'round_[_rd]',
            'userPendingWithdrawals[msg.sender]', '[msg.sender]', '[from]', '[to]', '[_to]', "msg.sender"];

// function limit type
let function_limit = ['private', 'onlyOwner', 'internal', 'onlyGovernor', 'onlyCommittee', 'onlyAdmin', 'onlyPlayers',
                  'onlyManager', 'onlyHuman', 'only_owner', 'onlyCongressMembers', 'preventReentry', 'onlyMembers',
                  'onlyProxyOwner', 'ownerExists', 'noReentrancy', 'notExecuted', 'noReentrancy', 'noEther',
                  'notConfirmed'];

// Boolean condition expression:
let var_op_bool = ['!', '~', '**', '*', '!=', '<', '>', '<=', '>=', '==', '<<', '>>', '||', '&&'];

// Assignment expressions
let var_op_assign = ['|=', '=', '^=', '&=', '<<=', '>>=', '+=', '-=', '*=', '/=', '%=', '++', '--'];

// split all functions of contracts
async function split_function(filepath) {
    const function_list = [];

    let flag = -1;
    let flag1 = 0;

    const fileStream = fs.createReadStream(filepath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (let line of rl) {
        let text = line.trim();

        if ((text.length > 0) && (text !== "\n")) {
            if ((text.split(" ")[0] === "function") && (function_list.length > 0)) {
                flag1 = 0;
            }
        }
        if (flag1 === 0) {
            if ((text.length > 0) && (text !== "\n")) {
                if ((text.split(" ")[0] === "function") || (text.split(" ")[0] === "function()")) {
                    function_list.push([text]);
                    flag += 1;
                } else if ((function_list.length > 0) && (function_list[flag][0].includes("function"))) {
                    if ((text.split(" ")[0] !== "modifier") && (text.split(" ")[0] !== "event")) {
                        function_list[flag].push(text);
                    } else {
                        flag1 += 1;
                        continue;
                    }
                }
            }
        } else {
            continue;
        }
    }

    return function_list;
}

// Position the call.value to generate the graph
async function generate_graph(filepath) {
    let allFunctionList = await split_function(filepath); // Store all functions
    let callValueList = []; // Store all W functions that call call.value
    let cFunctionList = []; // Store a single C function that calls a W function
    let CFunctionLists = []; // Store all C functions that call W function
    let withdrawNameList = []; // Store the W function name that calls call.value
    let otherFunctionList = []; // Store functions other than W functions
    let node_list = []; // Store all the points
    let edge_list = []; // Store edge and edge nips_features
    let node_feature_list = []; // Store nodes feature
    let params = []; // Store the parameters of the W functions
    let param = [];
    let key_count = 0; // Number of core nodes S and W
    let c_count = 0; // Number of core nodes C

    // Handle nodes

    // Store functions other than W functions
    for (let func of allFunctionList) {
        let flag = 0;
        for (let text of func) {
            if (text.includes('.call.value')) {
                node_list.push("S");
                node_list.push("W" + String(key_count));

                callValueList.push([func, "S", "W" + String(key_count)]);

                // get the function name and params
                let result = func[0].match(/[(](.*?)[)]/g);
                let result_params = result[0].split(",");

                for (let result_param of result_params) {
                    result_param = result_param.trim().split(" ");
                    param.push(result_param[result_param.length - 1]);
                }

                params.push([param, "S", "W" + String(key_count)]);

                // Handling W function access restrictions, which can be used for access restriction properties
                // default that there are C nodes

                let limit_count = 0;

                for (let k = 0; k < function_limit.length; k++) {
                    if (callValueList[key_count][0][0].includes(function_limit[k])) {
                        limit_count += 1;
                        if (text.includes("address")) {
                            node_feature_list.push(
                                ["S", "S", "LimitedAC", ["W" + String(key_count)],
                                 2, "INNADD"]);
                            node_feature_list.push(
                                ["W" + String(key_count), "W" + String(key_count), "LimitedAC", [],
                                1, "NULL"]);
                            break;
                        } else if (text.includes("msg.sender")) {
                            node_feature_list.push(
                                ["S", "S", "LimitedAC", ["W" + String(key_count)],
                                 2, "MSG"]);
                            node_feature_list.push(
                                ["W" + String(key_count), "W" + String(key_count), "LimitedAC", [],
                                 1, "NULL"]);
                            break;
                        } else {
                            let param_count = 0;
                            for (let pa of param) {
                                if (text.includes(pa) && (pa !== "")) {
                                    param_count += 1;
                                    node_feature_list.push(
                                        ["S", "S", "LimitedAC",
                                         ["W" + String(key_count)],
                                         2, "MSG"]);
                                    node_feature_list.push(
                                        ["W" + String(key_count), "W" + String(key_count), "LimitedAC", [],
                                         1, "NULL"]);
                                    break;
                                }
                            }
                            if (param_count === 0) {
                                node_feature_list.push(
                                    ["S", "S", "LimitedAC", ["W" + String(key_count)],
                                     2, "INNADD"]);
                                node_feature_list.push(
                                    ["W" + String(key_count), "W" + String(key_count), "LimitedAC", [],
                                     1, "NULL"]);
                            }
                            break;
                        }
                    }
                }

                if (limit_count === 0) {
                    if (text.includes("address")) {
                        node_feature_list.push(
                            ["S", "S", "NoLimit", ["W" + String(key_count)],
                             2, "INNADD"]);
                        node_feature_list.push(
                            ["W" + String(key_count), "W" + String(key_count), "NoLimit", [],
                             1, "NULL"]);
                    } else if ("msg.sender") {
                        node_feature_list.push(
                            ["S", "S", "NoLimit", ["W" + String(key_count)],
                             2, "MSG"]);
                        node_feature_list.push(
                            ["W" + String(key_count), "W" + String(key_count), "NoLimit", [],
                             1, "NULL"]);
                    } else {
                        param_count = 0;
                        for (let pa of param) {
                            if (text.includes(pa) && (pa !== "")) {
                                param_count += 1;
                                node_feature_list.push(
                                    ["S", "S", "NoLimit", ["W" + String(key_count)],
                                     2, "MSG"]);
                                node_feature_list.push(
                                    ["W" + String(key_count), "W" + String(key_count), "NoLimit", [],
                                     1, "NULL"]);
                                break;
                            }
                        }
                        if (param_count === 0) {
                            node_feature_list.push(
                                ["S", "S", "NoLimit", ["W" + String(key_count)],
                                 2, "INNADD"]);
                            node_feature_list.push(
                                ["W" + String(key_count), "W" + String(key_count), "NoLimit", [],
                                 1, "NULL"]);
                        }
                    }
                }

                // For example: function transfer(address _to, uint _value, bytes _data, string _custom_fallback)
                // get function name (transfer)

                let result_withdraw = func[0].match(/\b([_A-Za-z]\w*)\b(?:(?=\s*\w+\()|(?!\s*\w+))/g);
                let withdrawNameTmp = result_withdraw[1];

                if (withdrawNameTmp == "payable") {
                    withdrawName = withdrawNameTmp;
                } else {
                    withdrawName = withdrawNameTmp + "(";
                }
                withdrawNameList.push(["W" + String(key_count), withdrawName]);

                key_count++;
            }
        }
    }

    if (key_count === 0) {
        console.log("Currently, there is no key word call.value");
        node_feature_list.push(["S", "S", "NoLimit", ["NULL"], 0, "NULL"]);
        node_feature_list.push(["W0", "W0", "NoLimit", ["NULL"], 0, "NULL"]);
        node_feature_list.push(["C0", "C0", "NoLimit", ["NULL"], 0, "NULL"]);
    } else {
        // Traverse all functions and find the C function nodes that calls the W function
        // (determine the function call by matching the number of arguments)
        for (let k = 0; k < withdrawNameList.length; k++) {
            let w_key = withdrawNameList[k][0];
            let w_name = withdrawNameList[k][1];

            for (let otherFunction of otherFunctionList) {
                if (otherFunction.length > 2) {
                    for (let j = 1; j < otherFunction.length; j++) {
                        let text = otherFunction[j];
                        if (text.includes(w_name)) {
                            let result = text.match(/[(](.*?)[)]/g);
                            let result_params = result[0].split(",");

                            if ((result_params[0] !== "") && (result_params.length === params[k][0].length)) {
                                cFunctionList = [...cFunctionList, ...otherFunction];
                                CFunctionLists.push(
                                    [w_key, w_name, "C" + String(c_count), otherFunctionList[i]]);
                                node_list.push("C" + String(c_count));

                                for (let node_feature of node_feature_list) {
                                    if (node_feature[0].includes(w_key)) {
                                        node_feature[3].push("C" + String(c_count));
                                    }
                                }

                                // Handling C function access restrictions
                                let limit_count = 0;
                                for (let m = 0; m < function_limit.length; m++) {
                                    if (cFunctionList[0].includes(function_limit[m])) {
                                        limit_count++;
                                        node_feature_list.push(
                                            ["C" + String(c_count), "C" + String(c_count), "LimitedAC", ["NULL"], 0, "NULL"]);
                                        break;
                                    }
                                }
                                if (limit_count === 0) {
                                    node_feature_list.push(
                                        ["C" + String(c_count), "C" + String(c_count), "NoLimit", ["NULL"], 0, "NULL"]);
                                    c_count++;
                                    break;
                                }
                                    
                            }
                        }
                    }
                }
            }
        }
        if (c_count === 0) {
            console.log("There is no C node");
            node_list.push("C0");

            node_feature_list.push(["C0", "C0", "NoLimit", ["NULL"], 0, "NULL"]);
            for (let node_feature of node_feature_list) {
                if (node_feature[0].includes("W")) {
                    node_feature[3] = ["NULL"];
                }
            }
        }

        //Handle edge

        // (1) W->S (include: W->VAR, VAR->S, S->VAR)
        for (let callValue of callValueList) {
            flag = 0; // flag: flag = 0, before call.value; flag > 0, after call.value
            let before_var_count = 0;
            let after_var_count = 0;
            let var_tmp = [];
            let var_name = [];
            let var_w_name = [];

            callValue[0].forEach((text, j) => {
                if (!text.includes('.call.value')) {
                    if (flag === 0) {
                        // print("before call.value")
                        // handle W -> VAR
                        var_list.forEach((v, k) => {
                            if (text.includes(v)) {
                                node_list.push("VAR" + String(before_var_count));
                                var_tmp.push("VAR" + String(before_var_count));

                                if (var_w_name.length === 0) {
                                    if (text.includes("assert")) {
                                        edge_list.push(
                                            [callValue[2], "VAR" + String(before_var_count), callValue[2], 1,
                                             'AH']);
                                    } else if (text.includes("require")) {
                                        edge_list.push(
                                            [callValue[2], "VAR" + String(before_var_count), callValue[2], 1,
                                             'RG']);
                                    } else if (j >= 1) {
                                        if (callValue[0][j - 1].includes("if")) {
                                            edge_list.push(
                                                [callValue[2], "VAR" + String(before_var_count),
                                                 callValue[2], 1,
                                                 'GN']);
                                        } else if (callValue[0][j - 1].includes("for")) {
                                            edge_list.push(
                                                [callValue[2], "VAR" + String(before_var_count),
                                                 callValue[2], 1,
                                                 'FOR']);
                                        } else if (callValue[0][j - 1].includes("else")) {
                                            edge_list.push(
                                                [callValue[2], "VAR" + String(before_var_count),
                                                 callValue[2], 1,
                                                 'GB']);
                                        } else if (j + 1 < callValue[0].length) {
                                            if ((callValue[0][j].includes("if") && callValue[0][j].includes("throw")) ||
                                            (callValue[0][j].includes("if") && callValue[0][j + 1].includes("revert"))) {
                                                edge_list.push(
                                                    [callValue[2], "VAR" + String(before_var_count),
                                                     callValue[2], 1, 'RH']);
                                            } else if (text.includes("if")) {
                                                edge_list.push(
                                                    [callValue[2], "VAR" + String(before_var_count),
                                                     callValue[2], 1, 'IF']);
                                            } else {
                                                edge_list.push(
                                                    [callValue[2], "VAR" + String(before_var_count),
                                                     callValue[2], 1, 'FW']);
                                            }
                                        } else {
                                            edge_list.push(
                                                [callValue[2], "VAR" + String(before_var_count),
                                                 callValue[2], 1,
                                                 'FW']);
                                        }
                                    } else {
                                        edge_list.push(
                                            [callValue[2], "VAR" + String(before_var_count), callValue[2], 1,
                                             'FW']);
                                    }

                                    let var_node = 0;
                                    let var_bool_node = 0;

                                    for (let var_op of var_op_bool) {
                                        if (text.includes(var_op)) {
                                            node_feature_list.push(
                                                ["VAR" + String(before_var_count), "VAR" + String(before_var_count),
                                                 callValue[2], 1, 'BOOL']);
                                            var_node++;
                                            var_bool_node++;
                                            break;
                                        }
                                    }

                                    if (var_bool_node === 0) {
                                        for (let var_op of var_op_assign) {
                                            if (text.includes(var_op)) {
                                                node_feature_list.push(
                                                    ["VAR" + String(before_var_count), "VAR" + String(before_var_count),
                                                     callValue[2], 1, 'ASSIGN']);
                                                var_node++;
                                                break;
                                            }
                                        }
                                    }

                                    if (var_node === 0) {
                                        node_feature_list.push(
                                            ["VAR" + String(before_var_count), "VAR" + String(before_var_count),
                                             callValue[2], 1, 'NULL']);
                                    }

                                    var_w_name.push(var_list[k]);
                                    var_name.push(var_list[k]);
                                    before_var_count++;
                                    
                                } else {
                                    let var_w_count = 0;
                                    for (let n = 0; n > var_w_name.length; n++) {
                                        if (var_list[k] === var_w_name[n]) {
                                            var_w_count++;
                                            var_tmp.push(var_tmp[var_tmp.length - 1]);

                                            let var_node = 0;
                                            let var_bool_node = 0;

                                            for (let var_op of var_op_bool) {
                                                if (text.includes(var_op)) {
                                                    node_feature_list.push(
                                                        [var_tmp[var_tmp.length - 1], var_tmp[var_tmp.length - 1],
                                                         callValue[2], 1, 'BOOL']);
                                                    var_bool_node++;
                                                    var_node++;
                                                    break;
                                                }
                                            }

                                            if (var_bool_node === 0) {
                                                for (let var_op of var_op_assign) {
                                                    if (text.includes(var_op)) {
                                                        node_feature_list.push(
                                                            [var_tmp[var_tmp.length - 1], var_tmp[var_tmp.length - 1],
                                                             callValue[2], 1, 'ASSIGN']);
                                                        var_node++;
                                                        break;
                                                    }
                                                }
                                            }

                                            if (var_node === 0) {
                                                node_feature_list.push(
                                                    [var_tmp[var_tmp.length - 1], var_tmp[var_tmp.length - 1],
                                                     callValue[2], 1, 'NULL']);
                                            }
                                        }
                                    }

                                    if (var_w_count === 0) {
                                        let var_node = 0;
                                        let var_bool_node = 0;
                                        var_tmp.push("VAR" + String(before_var_count));

                                        for (let var_op of var_op_bool) {
                                            if (text.includes(var_op)) {
                                                node_feature_list.push(
                                                    ["VAR" + String(before_var_count), "VAR" + String(before_var_count),
                                                     callValue[2], 1, 'BOOL']);
                                                var_node++;
                                                var_bool_node++;
                                                break;
                                            }
                                        }

                                        if (var_bool_node === 0) {
                                            for (let var_op of var_op_assign) {
                                                if (text.includes(var_op)) {
                                                    node_feature_list.push(
                                                        ["VAR" + String(before_var_count), "VAR" + String(before_var_count),
                                                         callValue[2], 1, 'ASSIGN'])
                                                    var_node++;
                                                    break;
                                                }
                                            }
                                        }

                                        if (var_node === 0) {
                                            node_feature_list.push(
                                                ["VAR" + String(before_var_count), "VAR" + String(before_var_count),
                                                 callValue[2], 1, 'NULL']);
                                        }
                                    }
                                }
                            }
                        });
                    } else if (flag !== 0) {
                        // print("after call.value")
                        // handle S->VAR

                        let var_count = 0;

                        for (let v of var_list) {
                            if (text.includes(v)) {
                                if (before_var_count === 0) {
                                    node_list.push("VAR" + String(after_var_count));
                                    var_tmp.push("VAR" + String(after_var_count));

                                    if (text.includes("assert")) {
                                        edge_list.push(
                                            [callValue[1], "VAR" + String(after_var_count), callValue[1], 3,
                                             'AH']);
                                    } else if (text.includes("require")) {
                                        edge_list.push(
                                            [callValue[1], "VAR" + String(after_var_count), callValue[1], 3,
                                             'RG']);
                                    } else if (text.includes("return")) {
                                        edge_list.push(
                                            [callValue[1], "VAR" + String(after_var_count), callValue[1], 3,
                                             'RE']);
                                    } else if (text.includes("if") && text.includes("throw")) {
                                        edge_list.push(
                                            [callValue[1], "VAR" + String(after_var_count), callValue[1], 3,
                                             'IT']);
                                    } else if (text.includes("if") && text.includes("revert")) {
                                        edge_list.push(
                                            [callValue[1], "VAR" + String(after_var_count), callValue[1], 3,
                                             'RH']);
                                    } else if (text.includes("if")) {
                                        edge_list.push(
                                            [callValue[1], "VAR" + String(after_var_count), callValue[1], 3,
                                             'IF']);
                                    } else {
                                        edge_list.push(
                                            [callValue[1], "VAR" + String(after_var_count), callValue[1], 3,
                                             'FW']);
                                    }

                                    let var_node = 0;
                                    let var_bool_node = 0;

                                    for (let var_op of var_op_bool) {
                                        if (text.includes(var_op)) {
                                            node_feature_list.push(
                                                ["VAR" + String(after_var_count), "VAR" + String(after_var_count),
                                                 callValue[1], 3, 'BOOL']);
                                            var_node++;
                                            var_bool_node++;
                                            break;
                                        }
                                    }

                                    if (var_bool_node === 0) {
                                        for (let var_op of var_op_assign) {
                                            if (text.includes(var_op)) {
                                                node_feature_list.push(
                                                    ["VAR" + String(after_var_count), "VAR" + String(after_var_count),
                                                     callValue[1], 3, 'ASSIGN']);
                                                var_node++;
                                                break;
                                            }
                                        }
                                    }

                                    if (var_node === 0) {
                                        node_feature_list.push(
                                            ["VAR" + String(after_var_count), "VAR" + String(after_var_count),
                                             callValue[1], 3, 'NULL']);
                                    }
                                } else if (before_var_count > 0) {
                                    for (let k of var_name) {
                                        if (v == k) {
                                            var_count++;

                                            if (text.includes("assert")) {
                                                edge_list.push(
                                                    [callValue[1], var_tmp[var_tmp.length - 1],
                                                     callValue[1], 3,
                                                     'AH']);
                                            } else if (text.includes("require")) {
                                                edge_list.push(
                                                    [callValue[1], var_tmp[var_tmp.length - 1],
                                                     callValue[1], 3,
                                                     'RG']);
                                            } else if (text.includes("return")) {
                                                edge_list.push(
                                                    [callValue[1], var_tmp[var_tmp.length - 1],
                                                     callValue[1], 3,
                                                     'RE']);
                                            } else if (text.includes("if") && text.includes("throw")) {
                                                edge_list.push(
                                                    [callValue[1], var_tmp[var_tmp.length - 1],
                                                     callValue[1], 3,
                                                     'IT']);
                                            } else if (text.includes("if") && text.includes("revert")) {
                                                edge_list.push(
                                                    [callValue[1], var_tmp[var_tmp.length - 1],
                                                     callValue[1], 3,
                                                     'RH']);
                                            } else if (text.includes("if")) {
                                                edge_list.push(
                                                    [callValue[1], var_tmp[var_tmp.length - 1],
                                                     callValue[1], 3,
                                                     'IF']);
                                            } else {
                                                edge_list.push(
                                                    [callValue[1], var_tmp[var_tmp.length - 1],
                                                     callValue[1], 3,
                                                     'FW']);
                                            }

                                            after_var_count++;
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else if (text.includes('.call.value')) {
                    flag++;

                    if (var_tmp.length > 0) {
                        if (text.includes("assert")) {
                            edge_list.push(
                                [var_tmp[var_tmp.length - 1], callValue[1], callValue[2], 2, 'AH']);
                        } else if (text.includes("require")) {
                            edge_list.push(
                                [var_tmp[var_tmp.length - 1], callValue[1], callValue[2], 2, 'RG']);
                        } else if (text.includes("return")) {
                            edge_list.push(
                                [var_tmp[var_tmp.length - 1], callValue[1], callValue[2], 2, 'RE']);
                        } else if (j > 1) {
                            if (callValue[0][j - 1].includes("if")) {
                                edge_list.push(
                                    [var_tmp[var_tmp.length - 1], callValue[1], callValue[2], 2, 'GN']);
                            } else if (callValue[0][j - 1].includes("for")) {
                                edge_list.push(
                                    [var_tmp[var_tmp.length - 1], callValue[1], callValue[2], 2, 'FOR']);
                            } else if (callValue[0][j - 1].includes("for")) {
                                edge_list.push(
                                    [var_tmp[var_tmp.length - 1], callValue[1], callValue[2], 2, 'FOR']);
                            } else if (j + 1 < callValue[0].length) {
                                if ((callValue[0][j].includes("if") && callValue[0][j].includes("throw")) || 
                                (callValue[0][j].includes("if") && callValue[0][j + 1].includes("throw"))) {
                                    edge_list.push(
                                        [var_tmp[var_tmp.length - 1], callValue[1], callValue[2], 2, 'IT']);
                                } else if ((callValue[0][j].includes("if") && callValue[0][j].includes("revert")) || 
                                (callValue[0][j].includes("if") && callValue[0][j + 1].includes("revert"))) {
                                    edge_list.push(
                                        [var_tmp[var_tmp.length - 1], callValue[1], callValue[2], 2, 'RH']);
                                } else if (text.includes("if")) {
                                    edge_list.push(
                                        [var_tmp[var_tmp.length - 1], callValue[1], callValue[2], 2, 'IF']);
                                } else {
                                    edge_list.push(
                                        [var_tmp[var_tmp.length - 1], callValue[1], callValue[2], 2, 'FW']);
                                }
                            } else {
                                edge_list.push(
                                    [var_tmp[var_tmp.length - 1], callValue[1], callValue[2], 2, 'FW']);
                            }
                        } else {
                            edge_list.push(
                                [var_tmp[var_tmp.length - 1], callValue[1], callValue[2], 2, 'FW']);
                        }
                    } else if (var_tmp.length === 0) {
                        if (text.includes("assert")) {
                            edge_list.push(
                                [callValue[2], callValue[1], callValue[2], 1, 'AH']);
                        } else if (text.includes("require")) {
                            edge_list.push(
                                [callValue[2], callValue[1], callValue[2], 1, 'RG']);
                        } else if (text.includes("return")) {
                            edge_list.push(
                                [callValue[2], callValue[1], callValue[2], 1, 'RE']);
                        } else if (j > 1) {
                            if (callValue[0][j - 1].includes("if")) {
                                edge_list.push(
                                    [callValue[2], callValue[1], callValue[2], 1, 'GN']);
                            } else if (callValue[0][j - 1].includes("for")) {
                                edge_list.push(
                                    [callValue[2], callValue[1], callValue[2], 1, 'FOR']);
                            } else if (callValue[0][j - 1].includes("else")) {
                                edge_list.push(
                                    [callValue[2], callValue[1], callValue[2], 1, 'GB']);
                            } else if (j + 1 < callValue[0].length) {
                                if ((callValue[0][j].includes("if") && callValue[0][j].includes("throw")) || 
                                (callValue[0][j].includes("if") && callValue[0][j + 1].includes("throw"))) {
                                    edge_list.push(
                                        [callValue[2], callValue[1], callValue[2], 1, 'IT']);
                                } else if ((callValue[0][j].includes("if") && callValue[0][j].includes("revert")) || 
                                (callValue[0][j].includes("if") && callValue[0][j + 1].includes("revert"))) {
                                    edge_list.push(
                                        [callValue[2], callValue[1], callValue[2], 1, 'RH']);
                                } else if (text.includes("if")) {
                                    edge_list.push(
                                        [callValue[2], callValue[1], callValue[2], 1, 'IF']);
                                } else {
                                    edge_list.push(
                                        [callValue[2], callValue[1], callValue[2], 1, 'FW']);
                                }
                            } else {
                                edge_list.push(
                                    [callValue[2], callValue[1], callValue[2], 1, 'FW']);
                            }
                        } else {
                            edge_list.push(
                                [callValue[2], callValue[1], callValue[2], 1, 'FW']);
                        }
                    }
                }
            });
        }

        // (2) handle C->W (include C->VAR, VAR->W)
        for (let CFunction of CFunctionLists) {
            for (let text of CFunction[3]) {
                let var_flag = 0;
                for (let v of var_list) {
                    if (text.includes(v)) {
                        var_flag++;

                        let var_node = 0;
                        let var_bool_node = 0;

                        for (var_op of var_op_bool) {
                            if (text.includes(var_op)) {
                                node_feature_list.push(
                                    ["VAR" + String(var_tmp.length), "VAR" + String(var_tmp.length),
                                     CFunction[2], 1, 'BOOL']);
                                var_node++;
                                var_bool_node++;
                                break;
                            }
                        }

                        if (var_bool_node === 0) {
                            for (let var_op of var_op_assign) {
                                if (text.includes(var_op)) {
                                    node_feature_list.push(
                                        ["VAR" + String(var_tmp.length), "VAR" + String(var_tmp.length),
                                         CFunction[2], 1, 'ASSIGN']);
                                    var_node++;
                                    break;
                                }
                            }
                        }

                        if (var_node === 0) {
                            node_feature_list.push(
                                ["VAR" + String(var_tmp.length), "VAR" + String(var_tmp.length),
                                 CFunction[2], 1, 'NULL']);
                        }

                        if (text.includes("assert")) {
                            edge_list.push(
                                [CFunction[2], "VAR" + String(var_tmp.length), CFunction[2], 1, 'AH']);
                            edge_list.push(
                                ["VAR" + String(var_tmp.length), CFunction[0], CFunction[2], 2, 'FW']);
                        } else if (text.includes("require")) {
                            edge_list.push(
                                [CFunction[2], "VAR" + String(var_tmp.length), CFunction[2], 1, 'RG']);
                            edge_list.push(
                                ["VAR" + String(var_tmp.length), CFunction[0], CFunction[2], 2, 'FW']);
                        } else if (text.includes("if") && text.includes("throw")) {
                            edge_list.push(
                                [CFunction[2], "VAR" + String(var_tmp.length), CFunction[2], 1, 'IT']);
                            edge_list.push(
                                ["VAR" + String(var_tmp.length), CFunction[0], CFunction[2], 2, 'FW']);
                        } else if (text.includes("if") && text.includes("revert")) {
                            edge_list.push(
                                [CFunction[2], "VAR" + String(var_tmp.length), CFunction[2], 1, 'RH']);
                            edge_list.push(
                                ["VAR" + String(var_tmp.length), CFunction[0], CFunction[2], 2, 'FW']);
                        } else if (text.includes("if")) {
                            edge_list.push(
                                [CFunction[2], "VAR" + String(var_tmp.length), CFunction[2], 1, 'IF']);
                            edge_list.push(
                                ["VAR" + String(var_tmp.length), CFunction[0], CFunction[2], 2, 'FW']);
                        } else {
                            edge_list.push(
                                [CFunction[2], "VAR" + String(var_tmp.length), CFunction[2], 1, 'FW']);
                            edge_list.push(
                                ["VAR" + String(var_tmp.length), CFunction[0], CFunction[2], 2, 'FW']);
                        }
                        break;
                    }
                }

                if (var_flag == 0) {
                    if (text.includes("assert")) {
                        edge_list.push(
                            [CFunction[2], CFunction[0], CFunction[2], 1, 'AH']);
                    } else if (text.includes("require")) {
                        edge_list.push(
                            [CFunction[2], CFunction[0], CFunction[2], 1, 'RG']);
                    } else if (text.includes("if") && text.includes("throw")) {
                        edge_list.push(
                            [CFunction[2], CFunction[0], CFunction[2], 1, 'IT']);
                    } else if (text.includes("if") && text.includes("revert")) {
                        edge_list.push(
                            [CFunction[2], CFunction[0], CFunction[2], 1, 'RH']);
                    } else if (text.includes("if")) {
                        edge_list.push(
                            [CFunction[2], CFunction[0], CFunction[2], 1, 'IF']);
                    } else {
                        edge_list.push(
                            [CFunction[2], CFunction[0], CFunction[2], 1, 'FW']);
                    }
                    break;
                } else {
                    console.log("The C function does not call the corresponding W function");
                }
            }
        }
    }

    // Handling some duplicate elements, the filter leaves a unique

    let node_feature_list_new = [];
    for (let i of node_feature_list) {
        if (!node_feature_list_new.includes(i)) {
            node_feature_list_new.push(i);
        }
    }

    return [node_feature_list_new, edge_list];
}

function printResult(file, node_feature, edge_feature) {
    let main_point = ['S', 'W0', 'W1', 'W2', 'W3', 'W4', 'C0', 'C1', 'C2', 'C3', 'C4'];
    let tmp;

    for (let n of node_feature) {
        if (main_point.includes(n[0])) {
            for (let j = 0; j <= n[3].length; j = j + 2) {
                if (j + 1 < n[3].length) {
                    tmp = n[3][j] + "," + n[3][j + 1];
                } else if (n[3].length == 1) {
                    tmp = n[3][j];
                }
            }

            n[3] = tmp;
        }
    }

    let nodeOutPath = "./modules/graph_data/node/" + file;
    let edgeOutPath = "./modules/graph_data/edge/" + file;

    let f_node = fs.createWriteStream(nodeOutPath);

    for (let n of node_feature) {
        let result = n.join(" ");
        f_node.write(result + '\n');
    }

    f_node.end();

    let f_edge = fs.createWriteStream(edgeOutPath);

    for (let e of edge_feature) {
        let result = e.join(" ");
        f_edge.write(result + '\n');
    }

    f_edge.end();

    return [node_feature, edge_feature];
}

async function main() {
    let test_contract = "./modules/source_code/1.sol";
    let [node_feature, edge_feature] = await generate_graph(test_contract);

    console.log("node_feature", node_feature);
    console.log("edge_feature", edge_feature);

    printResult(test_contract.split("/")[3], node_feature, edge_feature);
}

main();