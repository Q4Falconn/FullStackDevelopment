export const LOGIN_MUTATION = `
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      user { id username }
    }
  }
`

export const REGISTER_MUTATION = `
  mutation CreateUser($username: String!, $password: String!) {
    createUser(username: $username, password: $password) { id username }
  }
`

export const ME_QUERY = `
  query Me { me { id username } }
`

export const GAMES_QUERY = `
  query Games {
    games {
      id
      status
      amountOfPlayers
      targetScore
      cardsPerPlayer
      createdAt
      createdBy { id username }
      players { id username }
    }
  }
`

export const CREATE_GAME_MUTATION = `
  mutation CreateGame($amountOfPlayers: Int!, $targetScore: Int!, $cardsPerPlayer: Int!) {
    createGame(amountOfPlayers: $amountOfPlayers, targetScore: $targetScore, cardsPerPlayer: $cardsPerPlayer) {
      id
      status
      amountOfPlayers
      targetScore
      cardsPerPlayer
      createdAt
    }
  }
`

export const JOIN_GAME_MUTATION = `
  mutation JoinGame($gameId: String!) { joinGame(gameId: $gameId) }
`

export const START_GAME_MUTATION = `
  mutation StartGame($gameId: String!) { startGame(gameId: $gameId) { id status state } }
`

export const GAME_QUERY = `
  query Game($gameId: String!) {
    game(gameId: $gameId) {
      id status state
      players { id username }
      createdBy { id username }
      amountOfPlayers targetScore cardsPerPlayer
    }
  }
`

export const GAME_UPDATED_SUB = `
  subscription GameUpdated($gameId: String!) {
    gameUpdated(gameId: $gameId) {
      id status state
      players { id username }
      createdBy { id username }
      amountOfPlayers targetScore cardsPerPlayer
    }
  }
`

export const DRAW_CARD_MUTATION = `
  mutation DrawCard($gameId: String!) { drawCard(gameId: $gameId) { id status state } }
`

export const PLAY_CARD_MUTATION = `
  mutation PlayCard($gameId: String!, $cardIndex: Int!, $nextColor: Color) {
    playCard(gameId: $gameId, cardIndex: $cardIndex, nextColor: $nextColor) { id status state }
  }
`
