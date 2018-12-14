/* ---- Nested Todo App V21 ---- 

Requirements:

> Remove collapsedUls array, and use document.querySelectorAll("ul [hidden]") instead
> If down array is hit in a todo field, it should focus on the todo input.
*/

// Keyboard Shortcut Values
//  > TAB --> For adding sub-lists to any todo.
//  > ENTER --> For adding a todo, or confirming an change.
//  > ESCAPE --> For canceling a change, or deleting an empty pre-existing todo.
//  > DOWN ARROW --> For moving to the main input field from a todo.

var TAB_KEY = 9;
var ENTER_KEY = 13;
var ESCAPE_KEY = 27;
var DOWN_ARROW_KEY = 40;

// Todo Constructor

function Todo(todoText) {
  this.id = util.uuid();
  this.todoText = todoText;
  this.completed = false;
  this.todos = [];
}

// Util Object
//  > uuid --> Function that returns unique identifier for every todo.
//  > store --> Function used to set and get App.todos from local Storage.
//  > findTodoById --> Function that returns a reference object for a todo with a given ID.

var util = {
  uuid: function() {
    var i, random;
    var uuid = "";

    for (i = 0; i < 32; i++) {
      random = (Math.random() * 16) | 0;
      if (i === 8 || i === 12 || i === 16 || i === 20) {
        uuid += "-";
      }
      uuid += (i === 12 ? 4 : i === 16 ? (random & 3) | 8 : random).toString(
        16
      );
    }

    return uuid;
  },
  store: function(namespace, data) {
    if (arguments.length > 1) {
      return localStorage.setItem(namespace, JSON.stringify(data));
    } else {
      var storedArray = localStorage.getItem(namespace);
      return (storedArray && JSON.parse(storedArray)) || [];
    }
  },
  findTodoById: function(list, id) {
    if (list.length) {
      for (var i = 0; i < list.length; i++) {
        var todoFound = util.findTodoById(list[i].todos, id);

        if (list[i].id === id) {
          return {
            todo: list[i],
            position: i,
            list: list
          };
        }

        if (todoFound) {
          return todoFound;
        }
      }
    }
  }
};

// App Object
//  > init --> Retrieves stored data, runs bindEvents, and renders the UI.
//  > bindEvents --> Binds all necessary event listeners to UI elements.
//  > addTodo --> Function that pushes a todo to a given list.
//  > changeTodo --> Function that modifies the text of a todo at a given position on a given list.
//  > deleteTodo --> Function that deletes a todo at a given list and position.
//  > deleteCompletedTodos --> Runs App.deleteTodos on any completed todos.
//  > toggleCompleted --> Toggles .completed property on a todo at a given list and position.

var App = {
  init: function() {
    this.todos = util.store("todoList");
    this.bindEvents();
    view.displayTodos();
    document.getElementById("todoInput").focus();
  },
  bindEvents: function() {
    document
      .getElementById("deleteCompletedTodosButton")
      .addEventListener("click", function() {
        App.deleteCompletedTodos();
      });
    document
      .getElementById("todoListUl")
      .addEventListener("click", function(event) {
        if (event.target.className === "deleteButton") {
          handlers.deleteTodo(event);
        } else if (event.target.className === "edit") {
          view.moveInput(event);
        } else if (event.target.className === "collapseListButton") {
          view.collapseList(event);
        }
      });
    document
      .getElementById("todoListUl")
      .addEventListener("change", function(event) {
        if (event.target.className === "toggleCheckbox") {
          handlers.toggleCompleted(event);
          view.moveInput(event);
        }
      });
    document
      .getElementById("todoListUl")
      .addEventListener("keydown", function(event) {
        if (event.which === ENTER_KEY && event.target.id === "todoInput") {
          handlers.addTodo(event);
        } else if (
          event.which === ENTER_KEY &&
          event.target.className === "edit"
        ) {
          handlers.changeTodo(event);
        } else if (event.which === ESCAPE_KEY) {
          handlers.updateTodo(event);
        } else if (event.which === TAB_KEY && event.target.id === "todoInput") {
          view.addSubTodoField(event);
        } else if (event.which === TAB_KEY && event.target.id !== "todoInput") {
          if (view.collapsedUlIds.includes(event.target.closest("li").id)) {
            view.collapseList(event);
          } else {
            view.addSubTodoField(event);
          }
        } else if (
          event.which === DOWN_ARROW_KEY &&
          event.target.className === "edit"
        ) {
          document.getElementById("todoInput").focus();
        }
      });
  },
  addTodo: function(list, todoText) {
    list.push(new Todo(todoText));
  },
  changeTodo: function(list, position, todoText) {
    list[position].todoText = todoText;
  },
  deleteTodo: function(list, position) {
    list.splice(position, 1);
  },
  deleteCompletedTodos: function() {
    var todoRef;
    var completedTodos = Array.prototype.slice.call(
      document.querySelectorAll("input:checked")
    );
    var completedTodoLis = completedTodos.map(function(todo) {
      return todo.parentElement;
    });

    for (var i = 0; i < completedTodoLis.length; i++) {
      if (document.getElementById(completedTodoLis[i].id)) {
        todoRef = util.findTodoById(App.todos, completedTodoLis[i].id);
        completedTodoLis[i].parentNode.removeChild(completedTodoLis[i]);
        App.deleteTodo(todoRef.list, todoRef.position);
      }
    }
    view.displayTodos();
  },
  toggleCompleted: function(list, position) {
    list[position].completed = !list[position].completed;
  }
};

// Handlers Object
//  > addTodo --> Runs App.addTodo with arguments passed from DOM.
//  > changeTodo --> Runs App.changeTodo with arguments passed from DOM.
//  > deleteTodo --> Runs App.deleteTodo with arguments passed from DOM.
//  > toggleCompleted --> Runs App.toggleCompleted with arguments passed from DOM.
//  > updateTodo --> Cancels edits on todo inputs with values, or deletes todos that have had their inputs cleared completely.
//  > getIndexFromEl --> Runs util.findTodobyId with arguments passed from DOM.

var handlers = {
  addTodo: function(event) {
    var todoText = event.target.value.trim();

    if (todoText && event.target.closest("ul").id === "todoListUl") {
      App.addTodo(App.todos, todoText);
    } else if (todoText) {
      var todoRef = this.getIndexFromEl(event);
      App.addTodo(todoRef.todo.todos, todoText);
    } else if (!todoText) {
      return;
    }

    view.displayTodos();
  },
  changeTodo: function(event) {
    var todoRef = this.getIndexFromEl(event);
    var todoText = event.target.value.trim();

    App.changeTodo(todoRef.list, todoRef.position, todoText);
    view.displayTodos();
  },
  deleteTodo: function(event) {
    var todoRef = this.getIndexFromEl(event);

    App.deleteTodo(todoRef.list, todoRef.position);
    view.displayTodos();
  },
  toggleCompleted: function(event) {
    var todoRef = this.getIndexFromEl(event);

    App.toggleCompleted(todoRef.list, todoRef.position);
    view.displayTodos();
  },
  updateTodo: function(event) {
    if (event.target.value) {
      event.target.blur();
      view.displayTodos();
    } else {
      this.deleteTodo(event);
    }
  },
  getIndexFromEl: function(event) {
    if (document.getElementsByClassName("todo")[0]) {
      var id = event.target.closest(".todo").id;
    }
    var todoRef = util.findTodoById(App.todos, id);

    if (todoRef) {
      return todoRef;
    }
  }
};

// View Object
//  > collapseList --> Hides/Shows any list when a Collapse/Expand button is clicked in the DOM.
//  > displayTodos --> Renders the nested todo list in the DOM, and runs methods that create interactive UI elements.
//  > createToggleCheckbox --> Creates the checkbox that allows users to toggle the completed property of a todo.
//  > createCheckboxLabel --> Creates the label on the checkbox that reflects the name of a todo and its completion status.
//  > createDeleteButton --> Creates button on a todo that will delete that todo, if clicked.
//  > createCollapseListButton --> Creates button on a todo that will hide/show that todo's sub-lists(s), if any.
//  > createInputField --> Creates an input field for adding todos on a given list.
//  > addSubTodoField --> Creates an input field on a new unordered list, for adding sub-lists to existing elements.
// > moveInput --> Moves the main input field to the bottom of any clicked list.

var view = {
  collapseList: function(event) {
    event.preventDefault();
    var childUl = event.target.closest("li").querySelector("ul");
    var collapseListButton = event.target.closest(".collapseListButton");

    if (childUl && childUl.hidden && collapseListButton) {
      childUl.hidden = false;
      event.target
        .closest("li")
        .querySelector(".collapseListButton").textContent = "Collapse";
    } else if (childUl && collapseListButton) {
      childUl.hidden = true;
      event.target
        .closest("li")
        .querySelector(".collapseListButton").textContent = "Expand";
    }
  },
  displayTodos: function() {
    util.store("todoList", App.todos);
    var todosUl = document.querySelector("ul");
    debugger;
    this.collapsedUls = Array.prototype.slice.call(
      document.querySelectorAll("ul [hidden]")
    );
    this.collapsedUlIds = this.collapsedUls.map(function(element) {
      return element.className;
    });

    if (document.activeElement.type === "text") {
      var activeElement = document.activeElement;
      var closestUlClass = activeElement.closest("ul").className;
      var closestUl;
    }
    todosUl.innerHTML = "";

    for (var i = 0; i < App.todos.length; i++) {
      todosUl.appendChild(listBuilder(App.todos[i], i));
    }

    if (document.querySelectorAll("input:checked").length) {
      document.getElementById("deleteCompletedTodosButton").hidden = false;
    } else {
      document.getElementById("deleteCompletedTodosButton").hidden = true;
    }

    if (activeElement && closestUlClass) {
      closestUl = document.getElementsByClassName(closestUlClass)[0];
      closestUl.appendChild(this.createInputField());
    } else {
      document
        .getElementById("todoListUl")
        .appendChild(this.createInputField());
    }

    document.getElementById("todoInput").focus();

    function listBuilder(todo) {
      var todoLi = document.createElement("li");
      todoLi.className = "todo";
      todoLi.id = todo.id;

      todoLi.appendChild(
        view.createToggleCheckbox(todo.todoText, todo.completed, todoLi.id)
      );
      todoLi.appendChild(
        view.createCheckboxLabel(todo.todoText, todo.completed)
      );
      if (todo.todos.length) {
        todoLi.appendChild(view.createCollapseListButton(todoLi.id));
      }

      todoLi.appendChild(view.createDeleteButton());

      if (todo.todos.length === 0) {
        return todoLi;
      } else {
        var subUl = document.createElement("ul");
        subUl.className = todoLi.id;

        if (view.collapsedUlIds.includes(subUl.className)) {
          subUl.hidden = true;
        }

        for (var i = 0; i < todo.todos.length; i++) {
          subUl.appendChild(listBuilder(todo.todos[i]));
        }
        todoLi.appendChild(subUl);

        return todoLi;
      }
    }
  },
  createToggleCheckbox: function(value, completed, id) {
    var toggleCheckbox = document.createElement("input");
    toggleCheckbox.type = "checkbox";
    toggleCheckbox.value = value;
    toggleCheckbox.className = "toggleCheckbox";

    if (completed) {
      toggleCheckbox.checked = true;
    }

    return toggleCheckbox;
  },
  createCheckboxLabel: function(value, completed) {
    var checkboxLabel = document.createElement("label");
    var labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.value = value;
    labelInput.className = "edit";
    labelInput.contentEditable = true;

    if (completed) {
      labelInput.style.textDecoration = "line-through";
      labelInput.style.color = "#808080";
    }

    checkboxLabel.appendChild(labelInput);

    return checkboxLabel;
  },
  createDeleteButton: function() {
    var deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "deleteButton";
    return deleteButton;
  },
  createCollapseListButton: function(id) {
    var collapseListButton = document.createElement("button");

    if (this.collapsedUlIds.includes(id)) {
      collapseListButton.textContent = "Expand";
    } else {
      collapseListButton.textContent = "Collapse";
    }

    collapseListButton.className = "collapseListButton";
    return collapseListButton;
  },
  createInputField: function(inputClass) {
    var inputElement = document.createElement("input");
    var inputLi = document.createElement("li");

    if (inputClass) {
      inputElement.className = inputClass;
    }

    inputLi.id = "inputFieldLi";
    inputElement.type = "text";
    inputElement.placeholder = "Write Your Todo Here";
    inputElement.id = "todoInput";
    inputLi.appendChild(inputElement);
    return inputLi;
  },
  addSubTodoField: function(event) {
    var textContent = event.target.value.trim();
    var todoInputLi = document.getElementById("inputFieldLi");
    var newListUl = document.createElement("ul");
    var subInputField = view.createInputField("subTodoInput");
    var previousSibling = event.target.closest("li").previousSibling;

    if (event.target.value && event.target.className === "edit") {
      newListUl.className = event.target.closest(".todo").id;
      subInputField.className = "subTodoInput";

      event.preventDefault();
      todoInputLi.remove();

      newListUl.appendChild(subInputField);
      event.target.closest("li").appendChild(newListUl);
    } else if (
      previousSibling &&
      previousSibling.querySelector("ul") === null
    ) {
      newListUl.className = event.target.closest("li").previousSibling.id;

      event.preventDefault();
      todoInputLi.remove();

      newListUl.appendChild(subInputField);
      previousSibling.appendChild(newListUl);
    } else if (previousSibling) {
      event.preventDefault();
      todoInputLi.remove();

      previousSibling.querySelector("ul").appendChild(subInputField);
    }

    if (event.target.className !== "edit") {
      document.getElementById("todoInput").value = textContent;
    }

    document.getElementById("todoInput").focus();
  },
  moveInput: function(event) {
    var eventId = event.target.closest(".todo").id;
    var closestLi = document.getElementById(eventId);
    var inputFieldLi = document.getElementById("inputFieldLi");

    if (closestLi.parentElement.lastChild !== inputFieldLi) {
      inputFieldLi.remove();
      closestLi.parentElement.appendChild(
        view.createInputField("subTodoInput")
      );
    }
    if (document.activeElement.className !== "edit") {
      document.getElementById("todoInput").focus();
    }
  }
};

App.init();
