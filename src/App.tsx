/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState, useRef } from 'react';
import { UserWarning } from './UserWarning';
import { getTodos, createTodo, deleteTodo, USER_ID } from './api/todos';
import { Todo } from './types/Todo';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [loadingTodoIds, setLoadingTodoIds] = useState<number[]>([]);

  const newTodoFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setErrorMessage('');
    getTodos()
      .then(setTodos)
      .catch(() => setErrorMessage('Unable to load todos'));
  }, []);

  useEffect(() => {
    if (!errorMessage) return;
    const timer = setTimeout(() => setErrorMessage(''), 3000);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  if (!USER_ID) {
    return <UserWarning />;
  }

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = newTodoTitle.trim();

    if (!trimmedTitle) {
      setErrorMessage('Title should not be empty');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    setTempTodo({
      id: 0,
      userId: USER_ID,
      title: trimmedTitle,
      completed: false,
    });

    createTodo({ title: trimmedTitle, userId: USER_ID, completed: false })
      .then(newTodo => {
        setTodos(prev => [...prev, newTodo]);
        setNewTodoTitle('');
      })
      .catch(() => setErrorMessage('Unable to add a todo'))
      .finally(() => {
        setTempTodo(null);
        setIsSubmitting(false);
        setTimeout(() => {
          if (newTodoFieldRef.current) {
            newTodoFieldRef.current.focus();
          }
        }, 0);
      });
  };

  const handleDelete = (todoId: number) => {
    setErrorMessage('');
    setLoadingTodoIds(prev => [...prev, todoId]);

    deleteTodo(todoId)
      .then(() => {
        setTodos(prev => prev.filter(t => t.id !== todoId));
      })
      .catch(() => setErrorMessage('Unable to delete a todo'))
      .finally(() => {
        setLoadingTodoIds(prev => prev.filter(id => id !== todoId));
        setTimeout(() => {
          if (newTodoFieldRef.current) {
            newTodoFieldRef.current.focus();
          }
        }, 0);
      });
  };

  const handleClearCompleted = () => {
    const completedTodos = todos.filter(t => t.completed);
    completedTodos.forEach(todo => {
      handleDelete(todo.id);
    });
  };

  const visibleTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const activeTodosCount = todos.filter(t => !t.completed).length;
  const hasCompletedTodos = todos.some(t => t.completed);
  const isAllCompleted = todos.length > 0 && activeTodosCount === 0;

  const toggleAllClass = `todoapp__toggle-all ${
    isAllCompleted ? 'active' : ''
  }`;
  const getFilterClass = (curr: string) => {
    return `filter__link ${filter === curr ? 'selected' : ''}`;
  };
  const notificationClass = [
    'notification',
    'is-danger',
    'is-light',
    'has-text-weight-normal',
    !errorMessage ? 'hidden' : '',
  ].join(' ');

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          <button
            type="button"
            className={toggleAllClass}
            data-cy="ToggleAllButton"
          />

          <form onSubmit={handleAddTodo}>
            <input
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              value={newTodoTitle}
              onChange={e => setNewTodoTitle(e.target.value)}
              disabled={isSubmitting}
              ref={newTodoFieldRef}
              autoFocus
            />
          </form>
        </header>

        {(todos.length > 0 || tempTodo) && (
          <>
            <section className="todoapp__main" data-cy="TodoList">
              {visibleTodos.map(todo => (
                <div
                  key={todo.id}
                  data-cy="Todo"
                  className={`todo ${todo.completed ? 'completed' : ''}`}
                >
                  <label className="todo__status-label">
                    <input
                      data-cy="TodoStatus"
                      type="checkbox"
                      className="todo__status"
                      checked={todo.completed}
                      readOnly
                    />
                  </label>

                  <span data-cy="TodoTitle" className="todo__title">
                    {todo.title}
                  </span>

                  <button
                    type="button"
                    className="todo__remove"
                    data-cy="TodoDelete"
                    onClick={() => handleDelete(todo.id)}
                  >
                    ×
                  </button>

                  <div
                    data-cy="TodoLoader"
                    className={`modal overlay ${
                      loadingTodoIds.includes(todo.id) ? 'is-active' : ''
                    }`}
                  >
                    {/* eslint-disable-next-line max-len */}
                    <div className="modal-background has-background-white-ter" />
                    <div className="loader" />
                  </div>
                </div>
              ))}

              {tempTodo && (
                <div data-cy="Todo" className="todo">
                  <label className="todo__status-label">
                    <input
                      data-cy="TodoStatus"
                      type="checkbox"
                      className="todo__status"
                      checked={tempTodo.completed}
                      readOnly
                    />
                  </label>

                  <span data-cy="TodoTitle" className="todo__title">
                    {tempTodo.title}
                  </span>

                  <button
                    type="button"
                    className="todo__remove"
                    data-cy="TodoDelete"
                  >
                    ×
                  </button>

                  <div
                    data-cy="TodoLoader"
                    className="modal overlay is-active"
                  >
                    {/* eslint-disable-next-line max-len */}
                    <div className="modal-background has-background-white-ter" />
                    <div className="loader" />
                  </div>
                </div>
              )}
            </section>

            <footer className="todoapp__footer" data-cy="Footer">
              <span className="todo-count" data-cy="TodosCounter">
                {activeTodosCount} items left
              </span>

              <nav className="filter" data-cy="Filter">
                <a
                  href="#/"
                  className={getFilterClass('all')}
                  data-cy="FilterLinkAll"
                  onClick={() => setFilter('all')}
                >
                  All
                </a>

                <a
                  href="#/active"
                  className={getFilterClass('active')}
                  data-cy="FilterLinkActive"
                  onClick={() => setFilter('active')}
                >
                  Active
                </a>

                <a
                  href="#/completed"
                  className={getFilterClass('completed')}
                  data-cy="FilterLinkCompleted"
                  onClick={() => setFilter('completed')}
                >
                  Completed
                </a>
              </nav>

              <button
                type="button"
                className="todoapp__clear-completed"
                data-cy="ClearCompletedButton"
                disabled={!hasCompletedTodos}
                onClick={handleClearCompleted}
              >
                Clear completed
              </button>
            </footer>
          </>
        )}
      </div>

      <div data-cy="ErrorNotification" className={notificationClass}>
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => setErrorMessage('')}
        />
        {errorMessage}
      </div>
    </div>
  );
};