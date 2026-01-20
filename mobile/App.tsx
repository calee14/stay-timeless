// mobile/App.tsx
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient } from './app/utils/trpc';

const queryClient = new QueryClient();

function MainApp() {
  const { data, isLoading, refetch } = trpc.hello.useQuery({ name: 'React Native' });
  const todos = trpc.getTodos.useQuery();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>tRPC + React Native</Text>

      {isLoading ? (
        <Text>Loading...</Text>
      ) : (
        <Text>{data?.message}</Text>
      )}

      <View style={styles.todos}>
        <Text style={styles.subtitle}>Todos:</Text>
        {todos.data?.map(todo => (
          <Text key={todo.id}>• {todo.title}</Text>
        ))}
      </View>

      <Button title="Refetch" onPress={() => refetch()} />
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <MainApp />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  todos: {
    marginTop: 20,
  },
});
