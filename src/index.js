const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function userAlreadyExists(request, username) {
  const userExists = users.find((user) => user.username === username);

  if (!userExists) {
    return false;
  }
  request.user = userExists;
  return true;
}

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  if (userAlreadyExists(request, username)) {
    return next();
  }

  return response.status(404).json({
    error: `username não adicionando no header`,
  });
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  if (userAlreadyExists(request, username)) {
    return response.status(400).json({
      error: `${username} já existe!`,
    });
  }
  const userData = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };
  users.push(userData);

  return response.status(201).json(userData);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;

  const newDataTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  user.todos.push(newDataTodo);

  return response.status(201).json(newDataTodo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  const { id } = request.params;
  const { title, deadline } = request.body;

  let todoFinded = null;

  users.map((user) => {
    if (user.username === username) {
      user.todos.map((todo) => {
        if (todo.id === id) {
          todo.title = title;
          todo.deadline = new Date(deadline);
          todoFinded = todo;
        }
        return todo;
      });
    }

    return user;
  });

  if (todoFinded === null) {
    return response.status(404).json({
      error: `ID: ${id} todo não existe!`,
    });
  }

  return response.json(todoFinded);
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  const { id } = request.params;

  let todoUpdated = null;

  users.map((user) => {
    if (user.username === username) {
      user.todos.map((todo) => {
        if (todo.id === id) {
          todo.done = true;
          todoUpdated = todo;
        }
        return todo;
      });
    }

    return user;
  });

  if (todoUpdated === null) {
    return response.status(404).json({
      error: `ID: ${id} todo não existe!`,
    });
  }

  return response.json(todoUpdated);
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  const { id } = request.params;

  let isTodoDeleted = false;

  users.map((user) => {
    if (user.username === username) {
      for (const [index, todo] of user.todos.entries()) {
        if (todo.id === id) {
          isTodoDeleted = true;
          user.todos.splice(index, 1);
        }
      }
    }
    return user;
  });

  if (isTodoDeleted === false) {
    return response.status(404).json({
      error: `ID: ${id} não existe!`,
    });
  }

  return response.status(204).send();
});

module.exports = app;
