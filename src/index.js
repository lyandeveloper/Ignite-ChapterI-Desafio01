const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const userAlreadyExists = users.find((user) => username === user.username);

  if (!userAlreadyExists) {
    return response.status(404).json({ error: "User not found" });
  }

  request.user = userAlreadyExists;

  return next();
}

const checkTodoExists = (request, response, next) => {
  const { user } = request;
  const { id } = request.params;

  const todo = user.todos.find((todo) => todo.id === id);

  if (!todo) {
    return response.status(404).json({ error: "Todo doesn't exists" });
  }

  request.todo = todo;

  return next();
};

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const userExists = users.find((user) => {
    return user.username === username;
  });

  if (userExists) {
    return response.status(400).json({ error: "Username already exists " });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(user);

  return response.status(201).json(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put(
  "/todos/:id",
  checksExistsUserAccount,
  checkTodoExists,
  (request, response) => {
    const { id } = request.params;
    const { user } = request;
    const { title, deadline } = request.body;

    const userTodo = user.todos.find((todo) => todo.id === id);

    userTodo.title = title;
    userTodo.deadline = deadline;

    return response.json(userTodo);
  }
);

app.patch(
  "/todos/:id/done",
  checksExistsUserAccount,
  checkTodoExists,
  (request, response) => {
    const { id } = request.params;
    const { user } = request;

    const userTodo = user.todos.find((todo) => todo.id === id);

    userTodo.done = true;

    return response.json(userTodo);
  }
);

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { user } = request;

  const userTodo = user.todos.findIndex((todo) => todo.id === id);

  if (userTodo === -1) {
    return response.status(404).json({ error: "Todo not found " });
  }

  user.todos.splice(userTodo, 1);

  return response.status(204).json();
});

module.exports = app;
