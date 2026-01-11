import { gql } from "@apollo/client/core";

export const GAMES_QUERY = gql`
  query Games {
    games {
      id
      status
      amountOfPlayers
      targetScore
      cardsPerPlayer
      createdAt
      createdBy {
        id
        username
      }
      players {
        id
        username
      }
    }
  }
`;

export const CREATE_GAME_MUTATION = gql`
  mutation CreateGame(
    $amountOfPlayers: Int!
    $targetScore: Int!
    $cardsPerPlayer: Int!
  ) {
    createGame(
      amountOfPlayers: $amountOfPlayers
      targetScore: $targetScore
      cardsPerPlayer: $cardsPerPlayer
    ) {
      id
      status
      amountOfPlayers
      targetScore
      cardsPerPlayer
      createdAt
    }
  }
`;

export const JOIN_GAME_MUTATION = gql`
  mutation JoinGame($gameId: String!) {
    joinGame(gameId: $gameId)
  }
`;

export const START_GAME_MUTATION = gql`
  mutation StartGame($gameId: String!) {
    startGame(gameId: $gameId) {
      id
      status
    }
  }
`;
