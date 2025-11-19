
import { useQueryClient } from '@tanstack/react-query';
import { createCollection, eq, useLiveQuery } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { createFileRoute } from '@tanstack/react-router';
import { Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { api } from '@/integrations/trpc/client';


export const Route = createFileRoute('/dashboard/test')({
  component: RouteComponent,
  // loader: async () => {
  //   await Promise.all([
  //     api.todo.getAll.query(),
  //   ])
  // }
});

// Todo type based on Drizzle schema
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

function RouteComponent() {
  return (
    <div className="flex w-full flex-col items-center justify-center">
      <TanStackDBTodosRoute />
    </div>
  );
}

function TanStackDBTodosRoute() {
  const [newTodoText, setNewTodoText] = useState('');
  const queryClient = useQueryClient();

  const todoCollection = createCollection(
    queryCollectionOptions({
      id: "todos",
      queryKey: ["todos"],
      refetchInterval: 1000,
      queryFn: async () => {
        const todos = await api.todo.getAll.query();
        return todos ?? [];
      },
      queryClient,
      getKey: (item) => item.id,
      onInsert: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await api.todo.create.mutate(modified);
        // Refetch after insert to get server-generated ID
        return { refetch: true }
      },
      onUpdate: async ({ transaction }) => {
        await Promise.all(
          transaction.mutations.map(async ({ original, changes }) => {
            const todo = original as Todo;
            return await api.todo.toggle.mutate({
              id: todo.id,
              completed: changes.completed ?? todo.completed,
            });
          })
        );
        // Refetch to ensure UI is in sync with server
        return { refetch: true }
      },
      onDelete: async ({ transaction }) => {
        await Promise.all(
          transaction.mutations.map(async ({ original }) => {
            console.log('Deleting todo:', original);
            const todo = original as Todo;
            return await api.todo.delete.mutate({ id: todo.id });
          })
        );
        // Refetch after delete to ensure UI is in sync
        return { refetch: true }
      },
    }));

  // Live query for all todos
  const { data: allTodos, isLoading, isError } = useLiveQuery((q) => q.from({ todo: todoCollection }));

  // Live query for completed todos only
  const { data: completedTodos } = useLiveQuery((q) =>
    q
      .from({ todo: todoCollection })
      .where(({ todo }) => eq(todo.completed, true))
      .select(({ todo }) => ({
        id: todo.id,
        text: todo.text,
        completed: todo.completed,
      }))
  );

  // Live query for pending todos only
  const { data: pendingTodos } = useLiveQuery((q) =>
    q
      .from({ todo: todoCollection })
      .where(({ todo }) => eq(todo.completed, false))
      .select(({ todo }) => ({
        id: todo.id,
        text: todo.text,
        completed: todo.completed,
      }))
  );

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault()
    const todo = newTodoText.trim()
    if (todo) {
      todoCollection.insert({
        id: Date.now(), // Temporary ID; real ID assigned by server
        text: todo,
        completed: false
      });
    }
  };

  const handleToggleTodo = (id: number, completed: boolean) => {
    try {
      todoCollection.update(id, (draft: Todo) => {
        draft.completed = !completed;
      });
    } catch (error) {
      console.warn(`Failed to update todo with id ${id}:`, error);
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    }
  };

  const handleDeleteTodo = (id: number) => {
    console.log('Attempting to delete todo with id:', id);

    try {
      todoCollection.delete(id);
    } catch (error) {
      // Item may have already been deleted or doesn't exist in collection
      console.warn(`Failed to delete todo with id ${id}:`, error);
      // Force a refetch to sync with server state
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    }
  }; if (isError) {
    return (
      <Card className="mx-auto w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-red-600">Error</CardTitle>
          <CardDescription>Failed to load todos</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-10">
      <div className="text-center">
        <h1 className="font-bold text-3xl">TanStack DB Example</h1>
        <p className="mt-2 text-muted-foreground">Reactive todos with live queries and TanStack Query integration</p>
      </div>

      {/* Add Todo Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Todo</CardTitle>
          <CardDescription>Create a new task and see live query updates</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex items-center space-x-2" onSubmit={handleAddTodo}>
            <Input
              className="flex-1"
              onChange={(e) => setNewTodoText(e.target.value)}
              placeholder="Add a new task..."
              value={newTodoText}
            />
            <Button disabled={!newTodoText.trim()} type="submit">
              Add Todo
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* All Todos */}
        <Card>
          <CardHeader>
            <CardTitle>All Todos ({allTodos?.length || 0})</CardTitle>
            <CardDescription>Complete list with live updates</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : allTodos?.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">No todos yet</p>
            ) : (
              <ul className="space-y-2">
                {allTodos?.map((todo) => (
                  <li className="flex items-center justify-between rounded-md border p-2" key={todo.id}>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={todo.completed}
                        id={`todo-all-${todo.id}`}
                        onCheckedChange={() => handleToggleTodo(todo.id, todo.completed)}
                      />
                      <label
                        className={`text-sm ${todo.completed ? 'text-muted-foreground line-through' : ''}`}
                        htmlFor={`todo-all-${todo.id}`}
                      >
                        {todo.text}
                      </label>
                    </div>
                    <Button
                      aria-label="Delete todo"
                      onClick={() => handleDeleteTodo(todo.id)}
                      size="icon"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Pending Todos */}
        <Card>
          <CardHeader>
            <CardTitle>Pending ({pendingTodos?.length || 0})</CardTitle>
            <CardDescription>Live filtered view of incomplete tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingTodos?.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">No pending todos</p>
            ) : (
              <ul className="space-y-2">
                {pendingTodos?.map((todo) => (
                  <li className="flex items-center justify-between rounded-md border p-2" key={todo.id}>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={todo.completed}
                        id={`todo-pending-${todo.id}`}
                        onCheckedChange={() => handleToggleTodo(todo.id, todo.completed)}
                      />
                      <label className="text-sm" htmlFor={`todo-pending-${todo.id}`}>
                        {todo.text}
                      </label>
                    </div>
                    <Button
                      aria-label="Delete todo"
                      onClick={() => handleDeleteTodo(todo.id)}
                      size="icon"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Completed Todos */}
        <Card>
          <CardHeader>
            <CardTitle>Completed ({completedTodos?.length || 0})</CardTitle>
            <CardDescription>Live filtered view of finished tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {completedTodos?.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">No completed todos</p>
            ) : (
              <ul className="space-y-2">
                {completedTodos?.map((todo) => (
                  <li className="flex items-center justify-between rounded-md border p-2" key={todo.id}>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={todo.completed}
                        id={`todo-completed-${todo.id}`}
                        onCheckedChange={() => handleToggleTodo(todo.id, todo.completed)}
                      />
                      <label
                        className="text-muted-foreground text-sm line-through"
                        htmlFor={`todo-completed-${todo.id}`}
                      >
                        {todo.text}
                      </label>
                    </div>
                    <Button
                      aria-label="Delete todo"
                      onClick={() => handleDeleteTodo(todo.id)}
                      size="icon"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Features Showcase */}
      <Card>
        <CardHeader>
          <CardTitle>TanStack DB Features</CardTitle>
          <CardDescription>Key benefits of this implementation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">✅ Live Queries</h4>
              <p className="text-muted-foreground">
                Automatic reactive updates when data changes - no manual refetch needed
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">✅ Reactive Updates</h4>
              <p className="text-muted-foreground">
                Automatic UI updates when data changes via TanStack Query integration
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">✅ Filtered Views</h4>
              <p className="text-muted-foreground">Multiple live-filtered views from the same data source</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">✅ Type Safety</h4>
              <p className="text-muted-foreground">Full TypeScript support with schema validation</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
