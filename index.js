const consoleTable = require("console.table");
const inquirer = require("inquirer");
const mysql = require("mysql2");
const util = require("util");
const cliArt = require("figlet");
const clear = require("clear");
const chalk = require("chalk");

const menu = [
  "View All Employees",
  "Search Employee By Role",
  "Search Employee By Department",
  "Search Employee By Manager",
  "Add Employee",
  "Delete Employee",
  "Update Employee Role",
  "Update Employee Manager",
  "",
  "View All Roles",
  "Add Role",
  "Delete Role",
  "",
  "View All Departments",
  "Add Department",
  "Delete Department",
  "",
  "View Department Budget",
  "",
  "Quit",
];

const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "employee_trackerDB",
});

connection.connect(function (error) {
  if (error) throw error;
  clear();
  console.log(
    chalk.red(
      cliArt.textSync("Employee Manager", { horizontalLayout: "fitted" })
    )
  );
  console.log("\n");
  initiate();
});

connection.query = util.promisify(connection.query);

function initiate() {
  inquirer
    .prompt([
      {
        name: "userSelect",
        type: "list",
        pageSize: 21,
        message: "What would you like to do?",
        choices: menu,
      },
    ])
    .then((answer) => {
      if (answer.userSelect === "View All Employees") {
        viewAll("employee");
      }
      if (answer.userSelect === "Add Employee") {
        addEmployee("table");
      }
      if (answer.userSelect === "Delete Employee") {
        deleteEmployee();
      }
      if (answer.userSelect === "Update Employee Role") {
        updateEmployeeRole();
      }
      if (answer.userSelect === "Update Employee Manager") {
        updateEmployeeManager();
      }
      if (answer.userSelect === "Search Employee By Role") {
        searchEmployeeRole();
      }
      if (answer.userSelect === "Search Employee By Department") {
        searchEmployeeDepartment();
      }
      if (answer.userSelect === "Search Employee By Manager") {
        searchEmployeeManager();
      }
      if (answer.userSelect === "View All Roles") {
        viewAll("role");
      }
      if (answer.userSelect === "Add Role") {
        addRole("role");
      }
      if (answer.userSelect === "Delete Role") {
        deleteRole();
      }
      if (answer.userSelect === "View All Departments") {
        viewAll("department");
      }
      if (answer.userSelect === "Add Department") {
        addDepartment("department");
      }
      if (answer.userSelect === "Delete Department") {
        deleteDepartment();
      }
      if (answer.userSelect === "View Department Budget") {
        viewDepartmentBudget();
      }
      if (answer.userSelect === "") {
        initiate();
      }
      if (answer.userSelect === "Quit") {
        quit();
      }
    });
}

function viewAll(table) {
  connection.query("SELECT * from " + table + ";", async function (err, res) {
    try {
      if (err) throw err;
      console.log("\n");
      console.table(table, res);
      console.log("\n");
      await initiate();
    } catch (err) {
      console.log(err);
    }
  });
}

function addDepartment() {
  inquirer
    .prompt([
      {
        name: "userDepartment",
        type: "input",
        message: "What department would you like to add?",
      },
    ])
    .then((answer) => {
      connection.query(
        "INSERT INTO department SET ?",
        {
          name: answer.userDepartment,
        },
        (err) => {
          if (err) throw err;
          console.log("\n");
          console.log("Successfully added a department.");
          console.log("\n");
          initiate();
        }
      );
    });
}

async function addEmployee() {
  try {
    const roles = await readRoles();
    const managers = await readEmployee();
    const userRole = roles.map(({ id: value, title: name }) => ({
      value,
      name,
    }));
    const userManager = managers.map(({ id: value, first_name: name }) => ({
      value,
      name,
    }));
    let rSize = roles.length;
    let mSize = managers.length;
    inquirer
      .prompt([
        {
          name: "firstName",
          type: "input",
          message: "Please enter the employee's first name:",
        },
        {
          name: "lastName",
          type: "input",
          message: "Please enter the employee's last name:",
        },
        {
          name: "employeeRole",
          type: "list",
          pageSize: rSize,
          message: "Please select the employee's job role:",
          choices: userRole,
        },
        {
          name: "employeesManager",
          type: "list",
          pageSize: mSize,
          message: "Please select the name of this employee's manager",
          choices: userManager,
        },
      ])
      .then((answer) => {
        connection.query(
          "INSERT INTO employee SET ?",
          {
            first_name: answer.firstName,
            last_name: answer.lastName,
            role_id: answer.employeeRole,
            manager_id: answer.employeesManager,
          },
          (err) => {
            if (err) throw err;
            console.log("\n");
            console.log("Employee added succesfully!");
            console.log("\n");
            initiate();
          }
        );
      });
  } catch (err) {
    console.log(err);
  }
}

function addRole() {
  readDept().then((department) => {
    const userDept = department.map(({ id: value, name: name }) => ({
      value,
      name,
    }));
    let dSize = department.length;
    inquirer
      .prompt([
        {
          name: "userRoleAdd",
          type: "input",
          message: "What is the name of the role you'd like to add?:",
        },
        {
          name: "userSalaryAdd",
          type: "input",
          message: "What is the salary for this role? Numbers only :",
        },
        {
          name: "userRoleDeptAdd",
          type: "list",
          pageSize: dSize,
          message: "What department will this role be for?:",
          choices: userDept,
        },
      ])
      .then((answer) => {
        connection.query(
          "INSERT INTO role SET ?",
          {
            title: answer.userRoleAdd,
            salary: answer.userSalaryAdd,
            department_id: answer.userRoleDeptAdd,
          },
          (err) => {
            if (err) throw err;
            console.log("\n");
            console.log("New role successfully added!");
            console.log("\n");
            initiate();
          }
        );
      });
  });
}

function searchEmployeeDepartment() {
  readDept().then((department) => {
    const employeeDept = department.map(({ name: name, id: value }) => ({
      name,
      value,
    }));
    let dSize = department.length;
    inquirer
      .prompt([
        {
          name: "employeeDepartment",
          type: "list",
          pageSize: dSize,
          message:
            "Please select the department that you'd like to view the employees for:",
          choices: employeeDept,
        },
      ])
      .then((answer) => {
        connection.query(
          "SELECT * FROM employee LEFT JOIN role ON employee.role_id = role.id WHERE role.department_id = ?",
          [answer.employeeDepartment],
          async function (err, res) {
            if (err) throw err;

            try {
              console.log("\n");
              console.table("Roles", res);
              console.log("\n");
              await initiate();
            } catch (err) {
              console.log(err);
            }
          }
        );
      })
      .catch((err) => {
        console.log(err);
      });
  });
}

function searchEmployeeManager() {
  readEmployee().then((employee) => {
    const managers = employee.map(({ first_name: name, id: value }) => ({
      name,
      value,
    }));
    let eSize = employee.length;
    inquirer
      .prompt([
        {
          name: "employeeManager",
          type: "list",
          pageSize: eSize,
          message:
            "Please select the Manager that you'd like to view the employees for:",
          choices: managers,
        },
      ])
      .then((answer) => {
        connection.query(
          "SELECT * FROM employee WHERE manager_id = ?",
          [answer.employeeManager],
          async function (err, res) {
            if (err) throw err;

            try {
              console.log("\n");
              console.table("manager's employees", res);
              console.log("\n");
              await initiate();
            } catch (err) {
              console.log(err);
            }
          }
        );
      })
      .catch((err) => {
        console.log(err);
      });
  });
}

function searchEmployeeRole() {
  readRoles().then((roles) => {
    const employeeRole = roles.map(({ title: name, id: value }) => ({
      name,
      value,
    }));
    let rSize = roles.length;
    inquirer
      .prompt({
        name: "userEmployeeRole",
        type: "list",
        pageSize: rSize,
        message: "Select the role that you'd like to see the employee's for:",
        choices: employeeRole,
      })
      .then((answer) => {
        connection.query(
          "Select * FROM employee WHERE role_id = ?",
          [answer.userEmployeeRole],
          async function (err, res) {
            if (err) throw err;

            try {
              console.log("\n");
              console.table("Employee", res);
              console.log("\n");
              await initiate();
            } catch (err) {
              console.log(err);
            }
          }
        );
      })
      .catch((err) => {
        console.log(err);
      });
  });
}

function deleteDepartment() {
  readDept().then((department) => {
    const delDept = department.map(({ name: name, id: value }) => ({
      name,
      value,
    }));
    let dSize = department.length;
    inquirer
      .prompt([
        {
          name: "deleteDept",
          type: "list",
          pageSize: dSize,
          message: "Please choose the department you'd like to delete:",
          choices: delDept,
        },
      ])
      .then((answer) => {
        connection.query(
          "DELETE FROM department WHERE id = ?",
          [answer.deleteDept],
          async function (err, res) {
            if (err) throw err;
            try {
              console.log("\n");
              console.log("Department successfully removed!");
              console.log("\n");
              await initiate();
            } catch (err) {
              console.log(err);
            }
          }
        );
      });
  });
}

function deleteEmployee() {
  readEmployee().then((employee) => {
    const delEmployee = employee.map(({ first_name: name, id: value }) => ({
      name,
      value,
    }));
    let eSize = employee.length;
    inquirer
      .prompt([
        {
          name: "deleteEmp",
          type: "list",
          pageSize: eSize,
          message: "Please select the employee that you would like to remove:",
          choices: delEmployee,
        },
      ])
      .then((answer) => {
        connection.query(
          "DELETE FROM employee WHERE id = ?",
          [answer.deleteEmp],
          async function (err, res) {
            if (err) throw err;
            try {
              console.log("\n");
              console.log("Employee successfully removed!");
              console.log("\n");
              await initiate();
            } catch (err) {
              console.log(err);
            }
          }
        );
      });
  });
}

function deleteRole() {
  readRoles().then((roles) => {
    const delRoles = roles.map(({ title: name, id: value }) => ({
      name,
      value,
    }));
    let rSize = roles.length;
    inquirer
      .prompt([
        {
          name: "deleteRole",
          type: "list",
          pageSize: rSize,
          message: "Please select the role you would like to remove:",
          choices: delRoles,
        },
      ])
      .then((answer) => {
        connection.query(
          "DELETE FROM role WHERE id = ?",
          [answer.deleteRole],
          async function (err, res) {
            if (err) throw err;
            try {
              console.log("\n");
              console.log("Job role successfully removed!");
              console.log("\n");
              await initiate();
            } catch (err) {
              console.log(err);
            }
          }
        );
      });
  });
}

async function updateEmployeeRole() {
  try {
    const roles = await readRoles();
    const employee = await readEmployee();

    const allRole = roles.map(({ title: name, id: value }) => ({
      name,
      value,
    }));
    const allEmp = employee.map(({ first_name: name, id: value }) => ({
      name,
      value,
    }));
    let rSize = roles.length;
    let eSize = employee.length;
    inquirer
      .prompt([
        {
          name: "userEmployee",
          type: "list",
          pageSize: eSize,
          message:
            "Please choose the employee that you'd like to change roles:",
          choices: allEmp,
        },
        {
          name: "userRole",
          type: "list",
          pageSize: rSize,
          message: "Please select the new role that this employee will have:",
          choices: allRole,
        },
      ])
      .then((answer) => {
        connection.query(
          "UPDATE employee SET role_id = ? WHERE id = ?;",
          [answer.userRole, answer.userEmployee],
          async function (err, res) {
            if (err) throw err;
            try {
              console.log("\n");
              console.log("Employee successfully reassigned new role!");
              console.log("\n");
              await initiate();
            } catch (err) {
              console.log(err);
            }
          }
        );
      });
  } catch (err) {
    console.log(err);
  }
}

async function updateEmployeeManager() {
  try {
    const employee = await readEmployee();
    const allEmp = employee.map(({ first_name: name, id: value }) => ({
      name,
      value,
    }));
    let eSize = employee.length;
    inquirer
      .prompt([
        {
          name: "userEmployee",
          type: "list",
          pageSize: eSize,
          message:
            "Please choose the employee that you'd like to change manager:",
          choices: allEmp,
        },
        {
          name: "userManager",
          type: "list",
          pageSize: eSize,
          message: "Please select the new manager for this employee:",
          choices: allEmp,
        },
      ])
      .then((answer) => {
        connection.query(
          "UPDATE employee SET manager_id = ? WHERE id = ?;",
          [answer.userEmployee, answer.userManager],
          async function (err, res) {
            if (err) throw err;
            try {
              console.log("\n");
              console.log("Employee successfully reassigned a new manager!");
              console.log("\n");
              await initiate();
            } catch (err) {
              console.log(err);
            }
          }
        );
      });
  } catch (err) {
    console.log(err);
  }
}

function viewDepartmentBudget() {
  readDept().then((department) => {
    const deptBudget = department.map(({ name: name, id: value }) => ({
      name,
      value,
    }));
    let dSize = department.length;
    inquirer
      .prompt([
        {
          name: "departmentBudget",
          type: "list",
          pageSize: dSize,
          message:
            "Please select the department that you'd like to view the budget for:",
          choices: deptBudget,
        },
      ])
      .then((answer) => {
        connection.query(
          "SELECT name AS Department, SUM(salary) AS Budget FROM employee LEFT JOIN role ON employee.role_id = role.id LEFT JOIN department ON role.department_id=department.id WHERE role.department_id = ?",
          [answer.departmentBudget],
          async function (err, res) {
            if (err) throw err;

            try {
              console.log("\n");
              console.table("department budget", res);
              console.log("\n");
              await initiate();
            } catch (err) {
              console.log(err);
            }
          }
        );
      })
      .catch((err) => {
        console.log(err);
      });
  });
}

function readRoles() {
  return new Promise((resolve, reject) => {
    connection.query("SELECT * FROM role;", function (err, res) {
      if (err) reject(err);
      resolve(res);
    });
  });
}

function readDept() {
  return new Promise((resolve, reject) => {
    connection.query("SELECT * FROM department;", function (err, res) {
      if (err) reject(err);
      resolve(res);
    });
  });
}

function readEmployee() {
  return new Promise((resolve, reject) => {
    connection.query("SELECT * FROM employee", function (err, res) {
      if (err) reject(err);
      resolve(res);
    });
  });
}

function readManagers() {
  return new Promise((resolve, reject) => {
    connection.query("SELECT * FROM employee", function (err, res) {
      if (err) reject(err);
      resolve(res);
    });
  });
}

function quit() {
  clear();
  console.log("Thanks for using Employee Manager, bye!!!");
  process.exit(1);
}
