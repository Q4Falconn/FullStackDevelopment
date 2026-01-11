import { gql } from "@apollo/client/core";

export const GAME_QUERY = gql`
  query Game($gameId: String!) {
    game(gameId: $gameId) {
      id
      status
      state
      players {
        id
        username
      }
      createdBy {
        id
        username
      }
      amountOfPlayers
      targetScore
      cardsPerPlayer
    }
  }
`;

export const GAME_UPDATED_SUB = gql`
  subscription GameUpdated($gameId: String!) {
    gameUpdated(gameId: $gameId) {
      id
      status
      state
      players {
        id
        username
      }
      createdBy {
        id
        username
      }
      amountOfPlayers
      targetScore
      cardsPerPlayer
    }
  }
`;

export const START_GAME = gql`
  mutation StartGame($gameId: String!) {
    startGame(gameId: $gameId) {
      id
      status
      state
    }
  }
`;

export const DRAW_CARD = gql`
  mutation DrawCard($gameId: String!) {
    drawCard(gameId: $gameId) {
      id
      status
      state
    }
  }
`;

export const PLAY_CARD = gql`
  mutation PlayCard($gameId: String!, $cardIndex: Int!, $nextColor: Color) {
    playCard(gameId: $gameId, cardIndex: $cardIndex, nextColor: $nextColor) {
      id
      status
      state
    }
  }
`;
