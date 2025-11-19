import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import { useAppForm } from '@/hooks/personally.form';
import { insertCategorySchema } from '@/lib/db/schema/category';
import { useTRPC } from '@/integrations/trpc/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

export const Route = createFileRoute('/dashboard/category')({
    component: CategoryPage,
    loader: async ({ context }) => {
        await context.queryClient.prefetchQuery(context.trpc.category.getAll.queryOptions());

        const session = await context.queryClient.fetchQuery(context.trpc.user.getSession.queryOptions());

        return {
            userId: session?.user.id,
        }
    },
});

// Extract the schema for the form (without userId since it's added server-side)
const categoryFormSchema = insertCategorySchema.omit({ userId: true }).required({
    type: true,
    color: true,
    icon: true
});

function CategoryPage() {
    const trpc = useTRPC()
    const queryClient = useQueryClient();
    const { userId } = Route.useLoaderData();

    const form = useAppForm({
        defaultValues: {
            name: '',
            type: 'expense' as 'income' | 'expense',
            color: '#3b82f6',
            icon: '',
        },
        validators: {
            onBlur: (values) => {
                const result = categoryFormSchema.safeParse(values);
                return result.success ? undefined : result.error.issues.reduce((acc, issue) => {
                    const path = issue.path.join('.');
                    if (!acc[path]) acc[path] = [];
                    acc[path].push(issue.message);
                    return acc;
                }, {} as Record<string, string[]>);
            },
        },
        onSubmit: ({ value }) => {
            //createMutation.mutate(value);
        },
    });

    const { data: categories } = useQuery(trpc.category.getAll.queryOptions());

    const createMutation = useMutation(
        trpc.category.create.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries(trpc.category.getAll.queryOptions());
                form.reset();
            },
        })
    );

    const deleteMutation = useMutation(
        trpc.category.delete.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries(trpc.category.getAll.queryOptions());
            },
        })
    );


    const handleDelete = (categoryId: string, categoryName: string) => {
        if (confirm(`Are you sure you want to delete "${categoryName}"?`)) {
            deleteMutation.mutate({ id: categoryId });
        }
    };

    const canDelete = (category: any) => {
        return category.userId && category.userId === userId;
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Create Category Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Create New Category
                    </CardTitle>
                    <CardDescription>
                        Add a custom category for your transactions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            form.handleSubmit();
                        }}
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <form.AppField name="name">
                                {(field) => (
                                    <field.PersonallyTextField
                                        label="Category Name"
                                        placeholder="e.g., Groceries, Salary"
                                    />
                                )}
                            </form.AppField>

                            <form.AppField name="type">
                                {(field) => (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Type</label>
                                        <select
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value as 'income' | 'expense')}
                                            onBlur={field.handleBlur}
                                            className="w-full px-3 py-2 border rounded-md bg-background"
                                        >
                                            <option value="expense">Expense</option>
                                            <option value="income">Income</option>
                                        </select>
                                        {field.state.meta.errors && (
                                            <p className="text-sm text-red-500">
                                                {field.state.meta.errors.join(', ')}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </form.AppField>

                            <form.AppField name="color">
                                {(field) => (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Color</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={field.state.value}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                onBlur={field.handleBlur}
                                                className="h-10 w-20 cursor-pointer rounded border"
                                            />
                                            <input
                                                type="text"
                                                value={field.state.value}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                onBlur={field.handleBlur}
                                                placeholder="#3b82f6"
                                                className="flex-1 px-3 py-2 border rounded-md bg-background"
                                            />
                                        </div>
                                        {field.state.meta.errors && (
                                            <p className="text-sm text-red-500">
                                                {field.state.meta.errors.join(', ')}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </form.AppField>

                            <form.AppField name="icon">
                                {(field) => (
                                    <field.PersonallyTextField
                                        label="Icon (optional)"
                                        placeholder="e.g., 🛒"
                                    />
                                )}
                            </form.AppField>
                        </div>

                        <div className="flex justify-end">
                            <form.AppForm>
                                <form.SubmitButton
                                    label={createMutation.isPending ? 'Creating...' : 'Create Category'}
                                />
                            </form.AppForm>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Categories List */}
            <Card>
                <CardHeader>
                    <CardTitle>All Categories</CardTitle>
                    <CardDescription>
                        Manage your transaction categories
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {categories?.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            No categories yet. Create your first category above!
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categories?.map((cat) => (
                                <Card key={cat.id} className="relative">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"

                                                >
                                                    {cat.icon || cat.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold truncate">{cat.name}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge
                                                            variant={cat.type === 'income' ? 'default' : 'secondary'}
                                                            className="text-xs"
                                                        >
                                                            {cat.type}
                                                        </Badge>
                                                        {!cat.userId && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Default
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {canDelete(cat) && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDelete(cat.id, cat.name)}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}