const Employee = require("../../models/EmployeeModel");
const Deposit = require("../../models/DepositModel");
const Withdraw = require("../../models/WithdrawModel");
const Customer = require("../../models/CustomerModel");
const Merchant = require("../../models/MerchantModel");
const Manager = require("../../models/ManagerModel");
const asyncHandler = require("express-async-handler");
const { generateAdminToken } = require("../../helpers/generateAdminToken");
const validator = require("validator");
const {all} = require("express/lib/application");

/**
 * @desc Get employee
 * @route POST /profile
 * @access private(EMPLOYEE)
 */
const getProfile = asyncHandler(async (req,res)=>{
    const employee = req.employee;

    try{
        const manager = await Manager.findById(employee.supervisor);
        return res.json({
            _uid: employee._id,
            user_name: employee.user_name,
            email: employee.email,
            address: employee.address,
            phone_number: employee.phone_number,
            dob: employee.dob,
            supervisor: manager.user_name,
        });
    }catch(error){
        return res.status(500).send("Ooops!! Something Went Wrong, Try again...");
    }
});

/**
 * @desc Update employee
 * @route PUT /profile
 * @access private(EMPLOYEE)
 */
const updateProfile = asyncHandler(async (req,res)=>{
    const employee = req.employee;

    try{
        if('address' in req.body){
            employee.address = req.body.address;
        }
        if('phone_number' in req.body){
            employee.phone_number = req.body.phone_number;
        }
        if('dob' in req.body){
            employee.dob = req.body.dob;
        }
        await employee.save();

        const manager = await Manager.findById(employee.supervisor);

        return res.json({
            _uid: employee._id,
            user_name: employee.user_name,
            email: employee.email,
            address: employee.address,
            phone_number: employee.phone_number,
            dob: employee.dob,
            supervisor: manager.user_name,
        });
    }catch(error){
        if (error.message.match(/(email|password|name|phone|addresee|dob|date)/gi))
            return res.status(400).send(error.message);
        return res.status(500).send("Ooops!! Something Went Wrong, Try again...");
    }
});

/**
 * @desc Get all the deposits
 * @route GET /deposit
 * @access private(EMPLOYEE)
 */
const getDeposits = asyncHandler(async(req,res)=>{
    const employee = req.employee;

    try{
        const allDeposits = [];
        for(let i=0;i<employee.users.length;i++){
            const user = employee.users[i];
            if(user.role==="customer"){
                const customer = await Customer.findById(user._id);
                const customerDeposits= await Deposit.find({
                    toCustomer: customer._id,
                });

                for(const deposit of customerDeposits){
                    if(deposit.status!=="waiting"){
                        continue;
                    }
                    allDeposits.push({
                        "_id":deposit._id,
                        "client_id":deposit.toCustomer,
                        "user_name":customer.user_name,
                        "status":deposit.status,
                        "amount":deposit.amount,
                        "date_created":deposit.createdAt,
                        "role":"customer"
                    });
                }
            }else if(user.role==="merchant"){
                const merchant = await Merchant.findById(user._id);
                const merchantDeposits= await Deposit.find({
                    toMerchant: merchant._id,
                });

                for(const deposit of merchantDeposits){
                    if(deposit.status!=="waiting"){
                        continue;
                    }
                    allDeposits.push({
                        "_id":deposit._id,
                        "client_id":deposit.toMerchant,
                        "user_name":merchant.user_name,
                        "status":deposit.status,
                        "amount":deposit.amount,
                        "date_created":deposit.createdAt,
                        "role":"merchant"
                    });
                }
            }
        }
        res.status(200).json(allDeposits);
    }catch(error){
        return res.status(500).send("Ooops!! Something Went Wrong, Try again...");
    }
});


/**
 * @desc Accept or decline deposit request
 * @route POST /deposit/:id
 * @access private(EMPLOYEE)
 */
const authorizeDeposit = asyncHandler(async(req,res)=>{
    const employee = req.employee;
    const depositId = req.params.id;
    const {accept} = req.body;

    if(!('accept' in req.body)){
        return res.status(400).send("Please send the status");
    }

    try{
        const deposit = await Deposit.findById(depositId);
        if(!deposit){
            return res.status(400).send("Not found!");
        }
        if(deposit.status!="waiting"){
            return res.status(400).send("Transaction already authorized");
        }

        if(deposit.toCustomer){
            const customer = await Customer.findById(deposit.toCustomer);
            if(customer.supervisor.toString()!==employee._id.toString()){
                return res.status(401).send("You are not authorized");
            }
            if(accept){
                customer.balance += deposit.amount;
                await customer.save();
            }
        }
        if(deposit.toMerchant){
            const merchant = await Merchant.findById(deposit.toMerchant);
            if(merchant.supervisor.toString()!==employee._id.toString()){
                return res.status(401).send("You are not authorized");
            }
            if(accept){
                merchant.balance += deposit.amount;
                await merchant.save();
            }
        }
        if(accept){
            deposit.status = "accept";
        }else{
            deposit.status = "decline";
        }
        await deposit.save();

        return res.status(200).json({
            success:true
        });
    }catch(error){
        return res.status(500).send("Ooops!! Something Went Wrong, Try again...");
    }
});


/**
 * @desc Get all the withdrawals
 * @route GET /withdraw
 * @access private(EMPLOYEE)
 */
const getWithdraws = asyncHandler(async(req,res)=>{
    const employee = req.employee;

    try{
        const allWithdraws = [];
        for(let i=0;i<employee.users.length;i++){
            const user = employee.users[i];
            if(user.role==="customer"){
                const customer = await Customer.findById(user._id);
                const customerWithdraws= await Withdraw.find({
                    fromCustomer: customer._id,
                });

                for(const withdraw of customerWithdraws){
                    if(withdraw.status!=="waiting"){
                        continue;
                    }
                    allWithdraws.push({
                        "_id":withdraw._id,
                        "client_id":withdraw.fromCustomer,
                        "user_name":customer.user_name,
                        "status":withdraw.status,
                        "amount":withdraw.amount,
                        "date_created":withdraw.createdAt,
                        "role":"customer"
                    });
                }
            }else if(user.role==="merchant"){
                const merchant = await Merchant.findById(user._id);
                const merchantWithdraws= await Withdraw.find({
                    fromMerchant: merchant._id,
                });

                for(const withdraw of merchantWithdraws){
                    if(withdraw.status!=="waiting"){
                        continue;
                    }
                    allWithdraws.push({
                        "_id":withdraw._id,
                        "client_id":withdraw.fromMerchant,
                        "user_name":merchant.user_name,
                        "status":withdraw.status,
                        "amount":withdraw.amount,
                        "date_created":withdraw.createdAt,
                        "role":"merchant"
                    });
                }
            }
        }
        res.status(200).json(allWithdraws);
    }catch(error){
        return res.status(500).send("Ooops!! Something Went Wrong, Try again...");
    }
});


/**
 * @desc Accept or decline withdraw request
 * @route POST /withdraw/:id
 * @access private(EMPLOYEE)
 */
const authorizeWithdraw = asyncHandler(async(req,res)=>{
    const employee = req.employee;
    const withdrawId = req.params.id;
    const {accept} = req.body;

    if(!('accept' in req.body)){
        return res.status(400).send("Please send the status");
    }

    try{
        const withdraw = await Withdraw.findById(withdrawId);
        if(!withdraw){
            return res.status(400).send("Not found!");
        }
        if(withdraw.status!=="waiting"){
            return res.status(400).send("Transaction already authorized");
        }

        if(withdraw.fromCustomer){
            const customer = await Customer.findById(withdraw.fromCustomer);
            if(customer.supervisor.toString()!==employee._id.toString()){
                return res.status(401).send("You are not authorized");
            }
            if(accept){
                if(customer.balance<withdraw.amount){
                    return res.status(400).send("The customer does not have enough balance for this withdrawal");
                }
                customer.balance -= withdraw.amount;
                await customer.save();
            }
        }
        if(withdraw.fromMerchant){
            const merchant = await Merchant.findById(withdraw.fromMerchant);
            if(merchant.supervisor.toString()!==employee._id.toString()){
                return res.status(401).send("You are not authorized");
            }
            if(accept){
                if(merchant.balance<withdraw.amount){
                    return res.status(400).send("The merchant does not have enough balance for this withdrawal");
                }
                merchant.balance -= withdraw.amount;
                await merchant.save();
            }
        }
        if(accept){
            withdraw.status = "accept";
        }else{
            withdraw.status = "decline";
        }
        await withdraw.save();

        return res.status(200).json({
            success:true
        });
    }catch(error){
        return res.status(500).send("Ooops!! Something Went Wrong, Try again...");
    }
});


/**
 * @desc Get user deposit by user id
 * @route GET /user/:id/deposit
 * @access private(EMPLOYEE)
 */
const getUserDepositLogs = asyncHandler(async(req,res)=>{
    if(!('role' in req.query)){
        return res.status(400).send("Please send the role");
    }
    if(req.query.role!=="customer" && req.query.role!=="merchant"){
        return res.status(400).send("Please send the current role");
    }
    const employee = req.employee;
    try{
        if(req.query.role=="customer"){
            const customer = await Customer.findById(req.params.id);
            if(customer.supervisor.toString()!==employee._id.toString()){
                return res.status(401).send("You are not authorized");
            }
            const allDeposits = await Deposit.find({
                toCustomer: customer._id,
            });
            const logs = [];
            for(let i=0;i<allDeposits.length;i++){
                const deposit = allDeposits[i];
                logs.push({
                    "_id":deposit._id,
                    "status":deposit.status,
                    "amount":deposit.amount,
                    "date_created":deposit.createdAt,
                });
            }
            return res.status(200).send(logs);
        }else{
            const merchant = await Merchant.findById(req.params.id);
            if(merchant.supervisor.toString()!==employee._id.toString()){
                return res.status(401).send("You are not authorized");
            }
            const allDeposits = await Deposit.find({
                toMerchant: merchant._id,
            });
            const logs = [];
            for(let i=0;i<allDeposits.length;i++){
                const deposit = allDeposits[i];
                logs.push({
                    "_id":deposit._id,
                    "status":deposit.status,
                    "amount":deposit.amount,
                    "date_created":deposit.createdAt,
                });
            }
            return res.status(200).send(logs);
        }
    }catch(error){
        return res.status(500).send("Ooops!! Something Went Wrong, Try again...");
    }
});


/**
 * @desc Get user withdraw by user id
 * @route GET /user/:id/withdraw
 * @access private(EMPLOYEE)
 */
const getUserWithdrawLogs = asyncHandler(async(req,res)=>{
    if(!('role' in req.query)){
        return res.status(400).send("Please send the role");
    }
    if(req.query.role!=="customer" && req.query.role!=="merchant"){
        return res.status(400).send("Please send the current role");
    }
    const employee = req.employee;
    try{
        if(req.query.role=="customer"){
            const customer = await Customer.findById(req.params.id);
            if(customer.supervisor.toString()!==employee._id.toString()){
                return res.status(401).send("You are not authorized");
            }
            const allWithdraws = await Withdraw.find({
                fromCustomer: customer._id,
            });
            const logs = [];
            for(let i=0;i<allWithdraws.length;i++){
                const withdraw = allWithdraws[i];
                logs.push({
                    "_id":withdraw._id,
                    "status":withdraw.status,
                    "amount":withdraw.amount,
                    "date_created":withdraw.createdAt,
                });
            }
            return res.status(200).send(logs);
        }else{
            const merchant = await Merchant.findById(req.params.id);
            if(merchant.supervisor.toString()!==employee._id.toString()){
                return res.status(401).send("You are not authorized");
            }
            const allWithdraws = await Withdraw.find({
                fromMerchant: merchant._id,
            });
            const logs = [];
            for(let i=0;i<allWithdraws.length;i++){
                const withdraw = allWithdraws[i];
                logs.push({
                    "_id":withdraw._id,
                    "status":withdraw.status,
                    "amount":withdraw.amount,
                    "date_created":withdraw.createdAt,
                });
            }
            return res.status(200).send(logs);
        }
    }catch(error){
        return res.status(500).send("Ooops!! Something Went Wrong, Try again...");
    }
});

/**
 * @desc Get all user lists
 * @route GET /user
 * @access private(EMPLOYEE)
 */
const getUsers = asyncHandler(async(req,res)=>{
    const employee = req.employee;

    try{
        const output = [];
        for(let i=0;i<employee.users.length;i++){
            const user = employee.users[i];
            if(user.role=="customer"){
                const customer = await Customer.findById(user._id);
                const employee = await Employee.findById(customer.supervisor);

                output.push({
                    "_id":customer._id,
                    "role":"customer",
                    "user_name":customer.user_name,
                    "balance":customer.balance,
                    "email":customer.email,
                    "supervisor":employee.user_name,
                });
            }else{
                const merchant = await Merchant.findById(user._id);
                const employee = await Employee.findById(merchant.supervisor);

                output.push({
                    "_id":merchant._id,
                    "role":"merchant",
                    "user_name":merchant.user_name,
                    "balance":merchant.balance,
                    "email":merchant.email,
                    "supervisor":employee.user_name,
                });
            }
        }
        res.status(200).send(output);
    }catch(error){
        return res.status(500).send("Ooops!! Something Went Wrong, Try again...");
    }
});


/**
 * @desc Get user by id
 * @route GET /user/:id
 * @access private(EMPLOYEE)
 */
const getUserById = asyncHandler(async(req,res)=>{
    if(!("role" in req.query)){
        return res.status(400).send("Please specify role");
    }
    if(req.query.role!=="customer" && req.query.role!=="merchant"){
        return res.status(400).send("Wrong role");
    }

    const employee = req.employee;

    try{
        if(req.query.role==="customer"){
            const customer = await Customer.findById(req.params.id);
            if(customer.supervisor.toString()!==employee._id.toString()){
                return res.status(401).send("You are not authorized");
            }
            return res.json({
                _uid: customer._id,
                user_name: customer.user_name,
                email: customer.email,
                balance: customer.balance,
                date_created: customer.createdAt,
                supervisor: employee.user_name,
                role:"customer",
                phone_number: customer.phone_number,
                dob: customer.dob,
                address:customer.address,
                status: customer.is_active,
            });
        }else{
            const merchant = await Merchant.findById(req.params.id);
            if(merchant.supervisor.toString()!==employee._id.toString()){
                return res.status(401).send("You are not authorized");
            }
            return res.json({
                _uid: merchant._id,
                user_name: merchant.user_name,
                email: merchant.email,
                balance: merchant.balance,
                date_created: merchant.createdAt,
                supervisor: employee.user_name,
                role:"merchant",
                phone_number: merchant.phone_number,
                dob: merchant.dob,
                address:merchant.address,
                status: merchant.is_active,
            });
        }
    }catch(error){
        return res.status(500).send("Ooops!! Something Went Wrong, Try again...");
    }
});


/**
 * @desc   Update user
 * @route  PUT /user/:id
 * @access private(EMPLOYEE)
 */
const updateUserProfile = asyncHandler(async (req,res)=>{
    const employee = req.employee;

    if(!('role' in req.body)){
        return res.status(400).send("Role is required");
    }
    if(req.body.role!=="customer" && req.body.role!=="merchant") {
        return res.status(400).send("Wrong role");
    }

    const id = req.params.id;

    try{
        if(req.body.role==="customer") {
            const customer = await Customer.findById(id);

            if(customer.is_active === false){
                return res.status(401).send("User is not active");
            }

            if (customer.supervisor.toString() !== employee._id.toString()) {
                return res.status(401).send("You are not authorized");
            }

            if ('address' in req.body) {
                customer.address = req.body.address;
            }
            if ('phone_number' in req.body) {
                customer.phone_number = req.body.phone_number;
            }

            await customer.save();

            return res.status(200).json({
                success: true
            });
        }else{
            const merchant = await Merchant.findById(id);

            if(merchant.is_active === false){
                return res.status(401).send("User is not active");
            }

            if (merchant.supervisor.toString() !== employee._id.toString()) {
                return res.status(401).send("You are not authorized");
            }

            if ('address' in req.body) {
                merchant.address = req.body.address;
            }
            if ('phone_number' in req.body) {
                merchant.phone_number = req.body.phone_number;
            }

            await merchant.save();

            return res.status(200).json({
                success: true
            });
        }
    }catch(error){
        if (error.message.match(/(email|password|name|phone|addresee|dob|date)/gi))
            return res.status(400).send(error.message);
        return res.status(500).send("Ooops!! Something Went Wrong, Try again...");
    }
});



/**
 * @desc   Update user
 * @route  PUT /user/:id/status
 * @access private(EMPLOYEE)
 */
const updateUserStatus = asyncHandler(async (req,res)=>{
    const employee = req.employee;

    if(!('role' in req.body)){
        return res.status(400).send("Role is required");
    }
    if(req.body.role!=="customer" && req.body.role!=="merchant") {
        return res.status(400).send("Wrong role");
    }
    if(!("status" in req.body)){
        return res.statsu(400).send("Status is required");
    }

    const id = req.params.id;
    const {status} = req.body;

    try{
        if(req.body.role==="customer") {
            const customer = await Customer.findById(id);

            if (customer.supervisor.toString() !== employee._id.toString()) {
                return res.status(401).send("You are not authorized");
            }

            if(status === true){
                customer.is_active = true;
            }else if(status === false){
                customer.is_active = false;
                const deposits = await Deposit.find({
                    toCustomer: id,
                    status: "waiting",
                });

                for (const deposit of deposits) {
                    deposit.status = "decline";
                    await deposit.save();
                }

                const withdrawals = await Withdraw.find({
                    fromCustomer: id,
                    status: "waiting",
                });

                for (const withdraw of withdrawals) {
                    withdraw.status = "decline";
                    await withdraw.save();
                }
            }

            await customer.save();

            return res.status(200).json({
                success: true
            });
        }else{
            const merchant = await Merchant.findById(id);

            if (merchant.supervisor.toString() !== employee._id.toString()) {
                return res.status(401).send("You are not authorized");
            }

            if(status === true){
                merchant.is_active = true;
            }else if(status === false){
                merchant.is_active = false;
                const deposits = await Deposit.find({
                    toMerchant: id,
                    status: "waiting",
                });

                for (const deposit of deposits) {
                    deposit.status = "decline";
                    await deposit.save();
                }

                const withdrawals = await Withdraw.find({
                    fromMerchant: id,
                    status: "waiting",
                });

                for (const withdraw of withdrawals) {
                    withdraw.status = "decline";
                    await withdraw.save();
                }
            }

            await merchant.save();

            return res.status(200).json({
                success: true
            });
        }
    }catch(error){
        if (error.message.match(/(email|password|name|phone|addresee|dob|date)/gi))
            return res.status(400).send(error.message);
        return res.status(500).send("Ooops!! Something Went Wrong, Try again...");
    }
});


module.exports = {
    getProfile,
    updateProfile,
    getDeposits,
    authorizeDeposit,
    getWithdraws,
    authorizeWithdraw,
    getUserDepositLogs,
    getUserWithdrawLogs,
    getUsers,
    getUserById,
    updateUserProfile,
    updateUserStatus
};