import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

const typeDefs = `#graphql

    type User {
        id: Int
        username: String
    }

    type Query {
        users: [User]
    }

`;

const users = [
  {
    id: 1,
    username: "Admin",
  },
  {
    id: 2,
    username: "Test",
  },
];

const resolvers = {
  Query: {
    users: () => users,
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);
