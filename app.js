const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const resultInCamelCase = (each) => {
  return {
    id: each.id,
    todo: each.todo,
    priority: each.priority,
    status: each.status,
    category: each.category,
    dueDate: each.due_date,
  };
};

const priorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const priorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const statusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const categoryAndStatus = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  );
};

const categoryAndPriority = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};
const categoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const searchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosList = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case priorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosList = `
                SELECT
                *
                FROM
                todo 
                WHERE
                status = '${status}'
                AND priority = '${priority}';`;
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case priorityProperty(request.query):
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        getTodosList = `
        SELECT
            *
        FROM
            todo 
        WHERE
            priority = '${priority}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    case statusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosList = `
            SELECT
                *
            FROM
                todo 
            WHERE
               status = '${status}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;
    case categoryAndStatus(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        if (
          category === "WORK" ||
          category === "HOME" ||
          category === "LEARNING"
        ) {
          getTodosList = `
                SELECT
                *
                FROM
                todo 
                WHERE
                status = '${status}'
                AND category = '${category}';`;
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case categoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosList = `
                SELECT
                *
                FROM
                todo 
                WHERE
                category = '${category}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case categoryAndPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "LOW" ||
          priority === "MEDIUM"
        ) {
          getTodosList = `
        SELECT
            *
        FROM
            todo 
        WHERE
            priority = '${priority}' 
            AND  category = '${category}';`;
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getTodosList = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  getdetailsOfQuery = await db.all(getTodosList);
  response.send(
    getdetailsOfQuery.map((each) => {
      return resultInCamelCase(each);
      //   resultInCamelCase(each);
    })
  );
});

// API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoList = `
    SELECT
        *
    FROM 
        todo
    WHERE
     id = ${todoId};

    `;
  const todossList = await db.get(todoList);
  response.send(resultInCamelCase(todossList));
});

// API 3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  //console.log(isMatch(date, "yyyy-MM-dd"));
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    console.log(newDate);
    const getTodoList = `
            SELECT *
            FROM todo
            WHERE 
            due_date = '${newDate}' ;
        `;
    const getDetails = await db.all(getTodoList);
    response.send(getDetails.map((each) => resultInCamelCase(each)));
    //console.log(getDetails);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// API 4

app.post("/todos/", async (request, response) => {
  const { id, todo, category, priority, status, dueDate } = request.body;
  if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");
          const addTodoQuery = `
        INSERT INTO 
            todo(id, todo, priority, status, category, due_date)
        VALUES
            (
                ${id},
               "${todo}",
               "${priority}",
               "${status}",
               "${category}",
               "${newDate}"
            )
        ;`;
          await db.run(addTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

// API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  const {
    priority = "",
    todo = "",
    status = "",
    category = "",
    dueDate = "",
  } = request.body;
  let updateTodoQuery = null;

  console.log(priority, todo, status, dueDate, category);
  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
            UPDATE
                todo
            SET 
                status = '${status}'
            WHERE 
                id = ${todoId}     
        ;`;
        await db.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        updateTodoQuery = `
            UPDATE
                todo
            SET 
                priority = '${priority}'
            WHERE 
                id = ${todoId}     
        ;`;
        await db.run(updateTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case requestBody.todo !== undefined:
      updateTodoQuery = `
            UPDATE
                todo
            SET 
                todo = '${todo}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        const updateCategoryQuery = `
            UPDATE
                todo
            SET 
                category = '${category}'
            WHERE 
                id = ${todoId}     
        ;`;
        await db.run(updateCategoryQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;
    case requestBody.dueDate !== undefined:
      if (isMatch(requestBody.dueDate, "yyyy-MM-dd")) {
        const updateDateQuery = `
            UPDATE
                todo
            SET 
                due_date = '${dueDate}'
            WHERE 
                id = ${todoId}     
        ;`;
        await db.run(updateDateQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }

      break;
  }
});

//Delete Todo API-6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
            DELETE FROM 
                todo
            WHERE 
               id=${todoId}
     ;`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
